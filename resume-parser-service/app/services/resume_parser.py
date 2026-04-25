"""
Resume parser — pdfplumber + spaCy NER + rapidfuzz + regex.

Parsing pipeline:
  1. PDFExtractor   → lines with font metadata (bold, relative size)
  2. _split_sections → font-aware header detection + rapidfuzz fuzzy matching
  3. Per-section parsers:
       personal    → regex contact info + spaCy PERSON/GPE NER
       experience  → Europass labeled fields + date-range state machine + spaCy ORG NER
       education   → structured institution/qualification/field/period blocks
       skills      → flat list with deduplication
       languages   → level pattern extraction
       *rest       → generic bullet/paragraph formatter
"""

import re
import uuid
import logging
from typing import Any, Dict, List, Optional, Tuple

import spacy
from spacy.language import Language
from rapidfuzz import fuzz, process

from .pdf_extractor import PDFExtractor
from ..models.resume import ExperienceEntry, ParseResponse, PersonalInfo
from ..utils.patterns import (
    BULLET_RE,
    COMPANY_SUFFIX_RE,
    DATE_RANGE_RE,
    DATE_RE,
    EDU_FIELD_RE,
    EDU_INSTITUTION_RE,
    EDU_PERIOD_RE,
    EDU_QUAL_RE,
    EMAIL_RE,
    EUROPASS_COMPANY_RE,
    EUROPASS_PERIOD_RE,
    EUROPASS_RESP_RE,
    EUROPASS_ROLE_RE,
    GITHUB_RE,
    JOB_TITLE_KEYWORDS,
    LANG_LEVEL_RE,
    LINKEDIN_RE,
    LOOSE_DATE_RANGE_RE,
    PHONE_RE,
    SECTION_NAMES,
    URL_RE,
    normalize_for_match,
)

logger = logging.getLogger(__name__)

# ── Fuzzy matching threshold constants ───────────────────────────────────────
_FUZZY_RATIO_CUTOFF = 78       # minimum score for rapidfuzz ratio
_FUZZY_PARTIAL_CUTOFF = 88     # minimum score for rapidfuzz partial_ratio

# Pre-build the list of known section keys once at import time
_SECTION_KEYS: List[str] = list(SECTION_NAMES.keys())


# ─────────────────────────────────────────────────────────────────────────────

class ResumeParser:
    """
    Stateless parser — instantiate per request, but spaCy models are cached
    at the class level so they are loaded only once per process.
    """

    _nlp_en: Optional[Language] = None
    _nlp_ro: Optional[Language] = None

    # ── Model loading ─────────────────────────────────────────────────────────

    @classmethod
    def load_models(cls) -> None:
        """Load (or lazy-load) spaCy large models. Called once at startup."""
        if cls._nlp_en is None:
            try:
                cls._nlp_en = spacy.load("en_core_web_lg")
                logger.info("Loaded en_core_web_lg")
            except OSError:
                import spacy.cli
                spacy.cli.download("en_core_web_lg")
                cls._nlp_en = spacy.load("en_core_web_lg")

        if cls._nlp_ro is None:
            try:
                cls._nlp_ro = spacy.load("ro_core_news_lg")
                logger.info("Loaded ro_core_news_lg")
            except OSError:
                import spacy.cli
                spacy.cli.download("ro_core_news_lg")
                cls._nlp_ro = spacy.load("ro_core_news_lg")

    @property
    def nlp_en(self) -> Language:
        if self.__class__._nlp_en is None:
            self.__class__.load_models()
        return self.__class__._nlp_en  # type: ignore[return-value]

    @property
    def nlp_ro(self) -> Language:
        if self.__class__._nlp_ro is None:
            self.__class__.load_models()
        return self.__class__._nlp_ro  # type: ignore[return-value]

    # ── Public API ────────────────────────────────────────────────────────────

    def parse(self, pdf_bytes: bytes) -> ParseResponse:
        extractor = PDFExtractor()
        extracted = extractor.extract(pdf_bytes)
        lines: List[Dict[str, Any]] = extracted["lines"]
        median_size: float = extracted["median_size"]

        if not lines:
            return self._empty_response()

        sections = self._split_sections(lines, median_size)

        # ── Personal info ──────────────────────────────────────────────────
        header_texts = [l["text"] for l in sections.get("header", {}).get("lines", [])]
        personal = self._extract_personal(header_texts)

        summary_texts = [l["text"] for l in sections.get("summary", {}).get("lines", [])]
        if summary_texts:
            personal.summary = " ".join(summary_texts).strip()

        # ── Experience ────────────────────────────────────────────────────
        exp_lines = [l["text"] for l in sections.get("experience", {}).get("lines", [])]
        experience = self._parse_experience(exp_lines)

        # ── Dynamic sections ──────────────────────────────────────────────
        ordered_types = [
            "education", "skills", "projects", "certifications", "awards",
            "publications", "research", "languages", "volunteer",
            "interests", "references", "associations",
        ]
        dynamic_sections: List[Dict[str, Any]] = []

        for sec_type in ordered_types:
            sec_data = sections.get(sec_type)
            if not sec_data:
                continue
            lines_text = [l["text"] for l in sec_data["lines"]]
            if not lines_text:
                continue
            content = self._format_section(sec_type, lines_text)
            if content:
                dynamic_sections.append({
                    "id": str(uuid.uuid4()),
                    "type": sec_type,
                    "title": sec_data.get("title", sec_type.capitalize()),
                    "content": content,
                })

        # Custom (unknown) sections
        for sec_type, sec_data in sections.items():
            if not sec_type.startswith("custom:"):
                continue
            lines_text = [l["text"] for l in sec_data["lines"]]
            content = "\n".join(lines_text).strip()
            if content:
                dynamic_sections.append({
                    "id": str(uuid.uuid4()),
                    "type": "leadership",
                    "title": sec_type[len("custom:"):],
                    "content": content,
                })

        return ParseResponse(
            personal=personal.dict(),
            experience=[e.dict() for e in experience],
            dynamicSections=dynamic_sections,
            metadata={"source": "python-nlp", "models": "en_core_web_lg+ro_core_news_lg"},
        )

    # ── Section splitting ─────────────────────────────────────────────────────

    def _split_sections(
        self, lines: List[Dict[str, Any]], median_size: float
    ) -> Dict[str, Any]:
        """
        Iterate over lines; classify each as a section header or content.
        Header detection uses three passes in priority order:
          1. Font signal (bold or large) + keyword/fuzzy match
          2. ALL-CAPS short line + keyword/fuzzy match
          3. Exact keyword match regardless of font
        """
        sections: Dict[str, Any] = {}
        current_type = "header"
        current_title = "Header"
        current_lines: List[Dict[str, Any]] = []

        def flush():
            nonlocal current_lines
            if current_lines:
                if current_type not in sections:
                    sections[current_type] = {"title": current_title, "lines": []}
                sections[current_type]["lines"].extend(current_lines)
            current_lines = []

        for line in lines:
            raw = line["text"].strip()
            if not raw:
                continue

            sec_type = self._classify_header(raw, line, median_size)
            if sec_type is not None:
                flush()
                current_type = sec_type
                current_title = raw.rstrip(":–—-").strip()
                current_lines = []
            else:
                current_lines.append(line)

        flush()
        return sections

    def _classify_header(
        self, text: str, line: Dict[str, Any], median_size: float
    ) -> Optional[str]:
        """
        Returns canonical section type string, a 'custom:…' string for
        unknown bold headers, or None if the line is regular content.
        """
        cleaned = text.rstrip(":–—-").strip()
        normalized = normalize_for_match(cleaned)

        # Fast path: exact match in lookup table (regardless of font)
        if normalized in SECTION_NAMES:
            return SECTION_NAMES[normalized]

        # Determine whether the line looks like a header visually
        is_bold = line.get("is_bold", False)
        is_large = line.get("is_large", False)
        word_count = len(cleaned.split())
        is_allcaps = cleaned == cleaned.upper() and bool(re.search(r"[A-ZÀ-ɏ]", cleaned))
        is_short = 1 <= word_count <= 6
        is_visual_header = (is_bold or is_large or is_allcaps) and is_short

        if not is_visual_header:
            return None

        # Fuzzy match against known section names
        result = process.extractOne(
            normalized, _SECTION_KEYS, scorer=fuzz.ratio, score_cutoff=_FUZZY_RATIO_CUTOFF
        )
        if result:
            return SECTION_NAMES[result[0]]

        result = process.extractOne(
            normalized,
            _SECTION_KEYS,
            scorer=fuzz.partial_ratio,
            score_cutoff=_FUZZY_PARTIAL_CUTOFF,
        )
        if result:
            return SECTION_NAMES[result[0]]

        # Unknown bold header — preserve as custom section
        if len(cleaned) >= 3 and not EMAIL_RE.search(cleaned) and not PHONE_RE.search(cleaned):
            return f"custom:{cleaned}"

        return None

    # ── Personal info ─────────────────────────────────────────────────────────

    def _extract_personal(self, header_lines: List[str]) -> PersonalInfo:
        personal = PersonalInfo()
        all_text = " ".join(header_lines)

        # Regex contact extraction
        email_m = EMAIL_RE.search(all_text)
        personal.email = email_m.group(0) if email_m else ""

        phone_m = PHONE_RE.search(all_text)
        personal.phone = phone_m.group(0).strip() if phone_m else ""

        li_m = LINKEDIN_RE.search(all_text)
        if li_m:
            personal.linkedin = f"https://www.linkedin.com/in/{li_m.group(1).rstrip('/')}"

        gh_m = GITHUB_RE.search(all_text)
        if gh_m:
            personal.github = f"https://github.com/{gh_m.group(1)}"

        urls = URL_RE.findall(all_text)
        for url in urls:
            if not LINKEDIN_RE.search(url) and not GITHUB_RE.search(url):
                personal.website = url
                break

        # Name via spaCy PERSON NER on the first 5 header lines
        name_text = " | ".join(header_lines[:5])
        doc_en = self.nlp_en(name_text)
        for ent in doc_en.ents:
            if ent.label_ == "PERSON":
                parts = ent.text.strip().split()
                if len(parts) >= 2:
                    personal.firstName = parts[0]
                    personal.lastName = " ".join(parts[1:])
                    break

        # Fallback name heuristic: first line with 2–5 words, no digits, no contact info
        if not personal.firstName:
            for line in header_lines:
                if (
                    not EMAIL_RE.search(line)
                    and not PHONE_RE.search(line)
                    and not URL_RE.search(line)
                    and not re.search(r"\d{4}", line)
                    and 2 <= len(line.split()) <= 5
                    and 4 <= len(line) <= 60
                ):
                    parts = line.split()
                    personal.firstName = parts[0]
                    personal.lastName = " ".join(parts[1:])
                    break

        # Location via spaCy GPE NER
        doc_ro = self.nlp_ro(name_text)
        for doc in (doc_en, doc_ro):
            for ent in doc.ents:
                if ent.label_ == "GPE" and not personal.location:
                    personal.location = ent.text.strip()
                    break

        # Title: first short non-contact line after name
        name_line = (
            f"{personal.firstName} {personal.lastName}".strip() if personal.firstName else None
        )
        for line in header_lines:
            if (
                line != name_line
                and not EMAIL_RE.search(line)
                and not PHONE_RE.search(line)
                and not URL_RE.search(line)
                and not re.search(r"\d{4}", line)
                and 5 <= len(line) <= 80
                and 2 <= len(line.split()) <= 8
            ):
                personal.title = line
                break

        return personal

    # ── Experience ────────────────────────────────────────────────────────────

    def _parse_experience(self, lines: List[str]) -> List[ExperienceEntry]:
        """
        State machine that handles both Europass labeled-field CVs and
        modern implicit-layout CVs.

        Entry boundary signals (in priority order):
          1. Europass PERIOD label → always starts a new entry
          2. A date range line when we already have period + content
          3. A new ROLE label when the current entry is already populated
        """
        entries: List[ExperienceEntry] = []
        # Mutable draft
        draft: Dict[str, Any] = self._new_draft()
        pending: Optional[str] = None  # 'period' | 'title' | 'company' | 'resp'

        def push():
            nonlocal pending
            entry = self._build_entry(draft)
            if entry:
                entries.append(entry)
            draft.update(self._new_draft())
            pending = None

        for raw in lines:
            line = raw.strip()
            if not line:
                continue

            # ── Europass labeled fields ────────────────────────────────────
            period_val = self._tagged(line, EUROPASS_PERIOD_RE)
            if period_val is not None:
                if draft["period"] and (draft["title"] or draft["company"] or draft["bullets"]):
                    push()
                draft["period"] = period_val
                pending = None if period_val else "period"
                continue

            role_val = self._tagged(line, EUROPASS_ROLE_RE)
            if role_val is not None:
                if draft["title"] and draft["period"]:
                    push()
                draft["title"] = role_val
                pending = None if role_val else "title"
                continue

            company_val = self._tagged(line, EUROPASS_COMPANY_RE)
            if company_val is not None:
                draft["company"] = company_val
                pending = None if company_val else "company"
                continue

            resp_val = self._tagged(line, EUROPASS_RESP_RE)
            if resp_val is not None:
                if resp_val:
                    draft["bullets"].extend(self._split_bullets(resp_val))
                pending = "resp"
                continue

            # ── Pending field from previous Europass label ─────────────────
            if pending:
                if pending == "period":
                    if draft["period"] and (draft["title"] or draft["company"]):
                        push()
                    draft["period"] = line
                elif pending == "title":
                    draft["title"] = line
                elif pending == "company":
                    draft["company"] = line
                elif pending == "resp":
                    draft["bullets"].extend(self._split_bullets(line))
                pending = None
                continue

            # ── Bullet line ────────────────────────────────────────────────
            if BULLET_RE.match(line):
                draft["bullets"].append(re.sub(BULLET_RE, "", line).strip())
                continue

            # ── Append to last bullet (wrapped continuation) ───────────────
            if self._append_to_last_bullet(draft, line):
                continue

            # ── Date range → new entry boundary ───────────────────────────
            is_date_range = bool(DATE_RANGE_RE.search(line) or LOOSE_DATE_RANGE_RE.search(line))
            if is_date_range:
                if draft["period"] and (draft["title"] or draft["company"] or draft["bullets"]):
                    push()
                draft["period"] = line
                continue

            # ── Combined line: Title | Company | Date ─────────────────────
            combined = self._try_combined(line)
            if combined:
                if combined.get("period") and draft["period"] and (
                    draft["title"] or draft["company"]
                ):
                    push()
                draft["title"] = draft["title"] or combined.get("title", "")
                draft["company"] = draft["company"] or combined.get("company", "")
                draft["period"] = draft["period"] or combined.get("period", "")
                continue

            # ── spaCy ORG NER for company detection ────────────────────────
            ner = self._ner_extract(line)
            if ner and not draft["company"]:
                draft["company"] = ner["org"]
                remainder = ner["remainder"].strip(" ,|-")
                if remainder and not draft["title"] and self._looks_like_job_title(remainder):
                    draft["title"] = remainder
                continue

            # ── Job title heuristic ────────────────────────────────────────
            if not draft["title"] and self._looks_like_job_title(line):
                draft["title"] = line
                continue

            # ── Company suffix heuristic ──────────────────────────────────
            if not draft["company"] and COMPANY_SUFFIX_RE.search(line):
                draft["company"] = line
                continue

            # ── Fallback: long lines become bullets ────────────────────────
            if len(line) >= 20:
                draft["bullets"].append(line)

        push()
        return entries

    # ── Education ─────────────────────────────────────────────────────────────

    def _parse_education_section(self, lines: List[str]) -> str:
        """
        Parse education blocks into structured text:
        "Degree (Period)\n• Institution: …\n• Field: …"
        """
        blocks: List[str] = []
        edu: Dict[str, Any] = {"period": "", "qual": "", "field": "", "institution": "", "details": []}
        pending: Optional[str] = None

        def flush():
            nonlocal pending
            if any([edu["period"], edu["qual"], edu["field"], edu["institution"], edu["details"]]):
                heading = edu["qual"] or edu["institution"] or "Education"
                title_line = f"{heading} ({edu['period']})" if edu["period"] else heading
                bullets: List[str] = []
                seen: set = set()

                def add(val: str):
                    c = val.strip()
                    k = normalize_for_match(c)
                    if c and k not in seen:
                        seen.add(k)
                        bullets.append(c)

                norm_heading = normalize_for_match(heading)
                if edu["institution"] and normalize_for_match(edu["institution"]) != norm_heading:
                    add(f"Institution: {edu['institution']}")
                if edu["field"]:
                    add(f"Field of study: {edu['field']}")
                for d in edu["details"]:
                    add(d)

                blocks.append("\n".join([title_line] + [f"• {b}" for b in bullets]))
            edu.update({"period": "", "qual": "", "field": "", "institution": "", "details": []})
            pending = None

        for raw in lines:
            line = raw.strip()
            if not line:
                continue

            period_val = self._tagged(line, EDU_PERIOD_RE)
            if period_val is not None:
                if edu["period"] or edu["qual"] or edu["institution"]:
                    flush()
                edu["period"] = period_val
                pending = None if period_val else "period"
                continue

            qual_val = self._tagged(line, EDU_QUAL_RE)
            if qual_val is not None:
                edu["qual"] = qual_val
                pending = None if qual_val else "qual"
                continue

            field_val = self._tagged(line, EDU_FIELD_RE)
            if field_val is not None:
                edu["field"] = field_val
                pending = None if field_val else "field"
                continue

            inst_val = self._tagged(line, EDU_INSTITUTION_RE)
            if inst_val is not None:
                edu["institution"] = inst_val
                pending = None if inst_val else "institution"
                continue

            if pending:
                edu[pending] = line  # type: ignore[index]
                pending = None
                continue

            if BULLET_RE.match(line):
                edu["details"].append(re.sub(BULLET_RE, "", line).strip())
                continue

            if DATE_RANGE_RE.search(line) or LOOSE_DATE_RANGE_RE.search(line):
                if edu["period"] and (edu["qual"] or edu["institution"]):
                    flush()
                edu["period"] = line
                continue

            # University/college keyword → institution
            if not edu["institution"] and re.search(
                r"universit|academy|facult|liceu|school|college|institut", line, re.I
            ):
                edu["institution"] = line
                continue

            # Degree keywords → qualification
            if not edu["qual"] and re.search(
                r"bachelor|master|phd|doctorat|licenta|inginer|diploma|degree|B\.?Sc|M\.?Sc",
                line, re.I,
            ):
                edu["qual"] = line
                continue

            edu["details"].append(line)

        flush()
        return "\n\n".join(blocks) if blocks else "\n".join(lines)

    # ── Skills ────────────────────────────────────────────────────────────────

    def _parse_skills_section(self, lines: List[str]) -> str:
        seen: Dict[str, str] = {}
        for raw in lines:
            line = raw.strip()
            if not line:
                continue
            # Strip leading bullet
            clean = re.sub(BULLET_RE, "", line).strip()
            # Try to split by comma, semicolon, pipe
            parts = re.split(r"\s*[,;|]\s*", clean)
            for part in parts:
                p = part.strip()
                k = normalize_for_match(p)
                if p and k and k not in seen:
                    seen[k] = p
        if not seen:
            return "\n".join(lines)
        return "\n".join(f"• {v}" for v in seen.values())

    # ── Languages ─────────────────────────────────────────────────────────────

    def _parse_languages_section(self, lines: List[str]) -> str:
        result: List[str] = []
        for raw in lines:
            line = re.sub(BULLET_RE, "", raw).strip()
            if not line:
                continue
            level_m = LANG_LEVEL_RE.search(line)
            if level_m:
                lang = line[: level_m.start()].strip(" :-–—,")
                level = level_m.group(0)
                if lang:
                    result.append(f"• {lang} — {level}")
                else:
                    result.append(f"• {line}")
            else:
                result.append(f"• {line}")
        return "\n".join(result) if result else "\n".join(lines)

    # ── Generic section formatter ─────────────────────────────────────────────

    def _format_section(self, sec_type: str, lines: List[str]) -> str:
        if sec_type == "education":
            return self._parse_education_section(lines)
        if sec_type in ("skills", "languages", "interests"):
            if sec_type == "skills":
                return self._parse_skills_section(lines)
            if sec_type == "languages":
                return self._parse_languages_section(lines)
        # Generic: preserve bullets, group paragraphs
        parts: List[str] = []
        for raw in lines:
            line = raw.strip()
            if not line:
                continue
            if BULLET_RE.match(line):
                parts.append(f"• {re.sub(BULLET_RE, '', line).strip()}")
            else:
                parts.append(line)
        return "\n".join(parts)

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _new_draft() -> Dict[str, Any]:
        return {"title": "", "company": "", "period": "", "bullets": [], "description": ""}

    @staticmethod
    def _build_entry(draft: Dict[str, Any]) -> Optional[ExperienceEntry]:
        title = draft["title"].strip()
        company = draft["company"].strip()
        period = draft["period"].strip()
        bullets = [b.strip() for b in draft["bullets"] if b.strip()]
        description = draft["description"].strip()

        if not title and not company and not period and not bullets:
            return None

        if not bullets and description:
            bullets = [description]

        return ExperienceEntry(
            id=str(uuid.uuid4()),
            title=title,
            company=company,
            period=period,
            description=description,
            bullets=bullets or [""],
        )

    @staticmethod
    def _tagged(line: str, pattern: re.Pattern) -> Optional[str]:
        """Return the captured group value if pattern matches, else None."""
        m = pattern.match(line)
        if m is None:
            return None
        return m.group(1).strip() if m.group(1) else ""

    @staticmethod
    def _split_bullets(text: str) -> List[str]:
        """Split text on bullet symbols or semicolons into individual items."""
        # Split on common bullet chars (excluding dash to avoid splitting date ranges)
        parts = re.split(r"\s*[•·▸▶▪◦▷◆◇■□●○➤➢→✓✔★❖⁃]\s*", text)
        if len(parts) > 1:
            return [p.strip() for p in parts if p.strip()]
        parts = re.split(r"\s*;\s*", text)
        if len(parts) > 1:
            return [p.strip() for p in parts if p.strip()]
        return [text.strip()] if text.strip() else []

    @staticmethod
    def _append_to_last_bullet(draft: Dict[str, Any], line: str) -> bool:
        """Append a continuation line to the last bullet (handles PDF line wraps)."""
        if not draft["bullets"]:
            return False
        # Don't append if the line looks like a new structural element
        if (
            BULLET_RE.match(line)
            or DATE_RANGE_RE.search(line)
            or LOOSE_DATE_RANGE_RE.search(line)
            or len(line) > 220
        ):
            return False
        # Only append short-ish continuation lines that start lowercase or with punctuation
        if line and (line[0].islower() or line[0] in ",:;.)-"):
            draft["bullets"][-1] = f"{draft['bullets'][-1]} {line}".strip()
            return True
        return False

    @staticmethod
    def _try_combined(line: str) -> Optional[Dict[str, str]]:
        """
        Parse combined lines like:
          "Software Engineer | Acme Corp | Jan 2020 - Present"
          "Lead Developer @ StartupX (2019 - 2022)"
          "Title - Company - 2018 - 2021"
        """
        # Three-part pipe/bullet separated
        m = re.match(r"^([^|•]+?)\s*[|•]\s*([^|•]+?)\s*[|•]\s*(.+)$", line)
        if m:
            left = m.group(1).strip()
            mid = m.group(2).strip()
            right = m.group(3).strip()
            if DATE_RANGE_RE.search(right) or LOOSE_DATE_RANGE_RE.search(right):
                return {"title": left, "company": mid, "period": right}

        # Title @ Company (optional date)
        at_m = re.match(r"^(.+?)\s+@\s+(.+?)(?:\s+[(\[](.+)[)\]])?$", line)
        if at_m:
            period_candidate = at_m.group(3) or ""
            if not period_candidate or DATE_RANGE_RE.search(period_candidate) or LOOSE_DATE_RANGE_RE.search(period_candidate):
                return {
                    "title": at_m.group(1).strip(),
                    "company": at_m.group(2).strip(),
                    "period": period_candidate.strip(),
                }

        return None

    def _ner_extract(self, text: str) -> Optional[Dict[str, str]]:
        """
        Run spaCy ORG NER on text.
        Returns {"org": <name>, "remainder": <rest of line>} or None.
        Uses the English model first; falls back to Romanian.
        """
        for nlp in (self.nlp_en, self.nlp_ro):
            doc = nlp(text)
            orgs = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
            if orgs:
                org = orgs[0]
                remainder = text.replace(org, "", 1)
                return {"org": org, "remainder": remainder}
        return None

    @staticmethod
    def _looks_like_job_title(text: str) -> bool:
        if len(text) < 3 or len(text) > 110:
            return False
        if EMAIL_RE.search(text) or PHONE_RE.search(text) or DATE_RE.search(text):
            return False
        lower = text.lower()
        return any(kw in lower for kw in JOB_TITLE_KEYWORDS)

    # ── Empty response ────────────────────────────────────────────────────────

    @staticmethod
    def _empty_response() -> ParseResponse:
        return ParseResponse(
            personal=PersonalInfo().dict(),
            experience=[],
            dynamicSections=[],
            metadata={"source": "python-nlp", "error": "empty_pdf"},
        )
