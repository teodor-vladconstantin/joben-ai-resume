"""
Resume parser — 5-layer pipeline for maximum accuracy.

Layer 1  pdfplumber/PyMuPDF  structural extraction + font metadata
Layer 2  Font analysis        bold/large → section header detection
Layer 3  rapidfuzz            fuzzy section name classification
Layer 4  spaCy NER            PERSON / GPE / ORG (EN lg + RO lg)
Layer 5  BERT NER             company, designation, skill, degree (EN, F1 90.87%)
         ESCO skills          canonical skill names via EU corpus
         Europass XML         direct extraction when embedded XML is present

Confidence scoring per field:
  regex    → 1.0   (deterministic)
  BERT     → 0.9
  spaCy    → 0.75
  font/heuristic → 0.5
"""

import logging
import re
import uuid
from typing import Any, Dict, List, Optional

import spacy
from spacy.language import Language
from rapidfuzz import fuzz, process

from .bert_ner import BertNER
from .pdf_extractor import PDFExtractor
from .skills_matcher import SkillsMatcher
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

_FUZZY_RATIO_CUTOFF   = 78
_FUZZY_PARTIAL_CUTOFF = 88
_SECTION_KEYS: List[str] = list(SECTION_NAMES.keys())


# ─────────────────────────────────────────────────────────────────────────────

class ResumeParser:
    """
    Stateless — one instance per request. Heavy resources (spaCy, BERT, ESCO)
    are cached at class level and loaded once per process.
    """

    _nlp_en: Optional[Language] = None
    _nlp_ro: Optional[Language] = None

    # ── Model loading ─────────────────────────────────────────────────────────

    @classmethod
    def load_models(cls) -> None:
        """Called once at startup by FastAPI lifespan hook."""
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

        BertNER._get_pipeline = staticmethod(BertNER._get_pipeline)  # type: ignore
        SkillsMatcher.load_corpus()

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
        bert = BertNER()
        skills_matcher = SkillsMatcher()

        extractor = PDFExtractor()
        extracted = extractor.extract(pdf_bytes)
        lines: List[Dict[str, Any]] = extracted["lines"]
        median_size: float = extracted["median_size"]
        europass_xml: Optional[str] = extracted.get("europass_xml")

        # ── Fast path: Europass embedded XML ──────────────────────────────
        if europass_xml:
            result = self._parse_europass_xml(europass_xml)
            if result:
                return result

        if not lines:
            return self._empty_response()

        sections = self._split_sections(lines, median_size)

        # ── Personal info ──────────────────────────────────────────────────
        header_texts = [l["text"] for l in sections.get("header", {}).get("lines", [])]
        personal = self._extract_personal(header_texts, bert)

        summary_texts = [l["text"] for l in sections.get("summary", {}).get("lines", [])]
        if summary_texts:
            personal.summary = " ".join(summary_texts).strip()

        # ── Experience ────────────────────────────────────────────────────
        exp_lines = [l["text"] for l in sections.get("experience", {}).get("lines", [])]
        experience = self._parse_experience(exp_lines, bert)

        # ── Skills — augment with BERT + ESCO ─────────────────────────────
        skills_lines = [l["text"] for l in sections.get("skills", {}).get("lines", [])]
        raw_skills = self._collect_raw_skills(skills_lines)

        # Also collect skills mentioned inline in experience bullets via BERT
        if bert.available and exp_lines:
            exp_text = " ".join(exp_lines)
            bert_skills = bert.get_skills(exp_text)
            raw_skills.extend(bert_skills)

        canonical_skills = skills_matcher.match(raw_skills, lang="en")

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
            if sec_type == "skills":
                # Use ESCO-matched skills if we have them
                content = "\n".join(f"• {s}" for s in canonical_skills) if canonical_skills \
                          else self._parse_skills_section(skills_lines)
            else:
                lines_text = [l["text"] for l in sec_data["lines"]]
                content = self._format_section(sec_type, lines_text) if lines_text else ""
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
            metadata={
                "source": "python-nlp",
                "layers": {
                    "pdf": extracted["metadata"].get("extractor", "unknown"),
                    "bert": bert.available,
                    "esco_skills": len(canonical_skills),
                    "europass_xml": europass_xml is not None,
                    "columns": extracted["metadata"].get("n_columns", 1),
                },
            },
        )

    # ── Europass XML fast path ────────────────────────────────────────────────

    def _parse_europass_xml(self, xml: str) -> Optional[ParseResponse]:
        """
        Extract data from Europass-embedded XML.
        Returns ParseResponse if extraction is confident, None otherwise.
        The Europass XML schema (HR-XML) is well-documented and predictable.
        """
        try:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(xml)
            ns = {"cv": "http://www.cedefop.europa.eu/Europass"}

            def find_text(path: str) -> str:
                el = root.find(path, ns)
                return el.text.strip() if el is not None and el.text else ""

            first = find_text(".//cv:FirstName") or find_text(".//FirstName")
            last = find_text(".//cv:Surname") or find_text(".//Surname")
            email = find_text(".//cv:ContactInfo//cv:Email") or find_text(".//Email")
            phone = find_text(".//cv:ContactInfo//cv:Telephone") or find_text(".//Telephone")

            if not first and not last and not email:
                return None  # Not a parseable Europass XML

            personal = PersonalInfo(
                firstName=first,
                lastName=last,
                email=email,
                phone=phone,
            )

            return ParseResponse(
                personal=personal.dict(),
                experience=[],
                dynamicSections=[],
                metadata={"source": "europass-xml", "confidence": 1.0},
            )
        except Exception as exc:
            logger.debug("Europass XML parse failed: %s", exc)
            return None

    # ── Section splitting ─────────────────────────────────────────────────────

    def _split_sections(
        self, lines: List[Dict[str, Any]], median_size: float
    ) -> Dict[str, Any]:
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
        cleaned = text.rstrip(":–—-").strip()
        normalized = normalize_for_match(cleaned)

        # Fast path: exact keyword match
        if normalized in SECTION_NAMES:
            return SECTION_NAMES[normalized]

        # Visual header detection (bold or oversized + short)
        is_bold = line.get("is_bold", False)
        is_large = line.get("is_large", False)
        word_count = len(cleaned.split())
        is_allcaps = cleaned == cleaned.upper() and bool(re.search(r"[A-ZÀ-ɏ]", cleaned))
        is_visual_header = (is_bold or is_large or is_allcaps) and 1 <= word_count <= 6

        if not is_visual_header:
            return None

        result = process.extractOne(
            normalized, _SECTION_KEYS, scorer=fuzz.ratio, score_cutoff=_FUZZY_RATIO_CUTOFF
        )
        if result:
            return SECTION_NAMES[result[0]]

        result = process.extractOne(
            normalized, _SECTION_KEYS, scorer=fuzz.partial_ratio, score_cutoff=_FUZZY_PARTIAL_CUTOFF
        )
        if result:
            return SECTION_NAMES[result[0]]

        if len(cleaned) >= 3 and not EMAIL_RE.search(cleaned) and not PHONE_RE.search(cleaned):
            return f"custom:{cleaned}"

        return None

    # ── Personal info ─────────────────────────────────────────────────────────

    def _extract_personal(self, header_lines: List[str], bert: BertNER) -> PersonalInfo:
        personal = PersonalInfo()
        all_text = " ".join(header_lines)

        # Layer 1: Regex (confidence 1.0)
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

        for url in URL_RE.findall(all_text):
            if not LINKEDIN_RE.search(url) and not GITHUB_RE.search(url):
                personal.website = url
                break

        # Layer 2: BERT NER — name with confidence 0.9
        if bert.available:
            bert_name = bert.get_name(" ".join(header_lines[:6]))
            if bert_name:
                parts = bert_name.strip().split()
                if len(parts) >= 2:
                    personal.firstName = parts[0]
                    personal.lastName = " ".join(parts[1:])

        # Layer 3: spaCy NER — name fallback + location
        if not personal.firstName:
            name_text = " | ".join(header_lines[:5])
            for doc in (self.nlp_en(name_text), self.nlp_ro(name_text)):
                for ent in doc.ents:
                    if ent.label_ == "PERSON" and not personal.firstName:
                        parts = ent.text.strip().split()
                        if len(parts) >= 2:
                            personal.firstName = parts[0]
                            personal.lastName = " ".join(parts[1:])
                    if ent.label_ == "GPE" and not personal.location:
                        personal.location = ent.text.strip()

        # Layer 4: heuristic name fallback (confidence 0.5)
        if not personal.firstName:
            for line in header_lines:
                if (
                    not EMAIL_RE.search(line) and not PHONE_RE.search(line)
                    and not URL_RE.search(line) and not re.search(r"\d{4}", line)
                    and 2 <= len(line.split()) <= 5 and 4 <= len(line) <= 60
                ):
                    parts = line.split()
                    personal.firstName = parts[0]
                    personal.lastName = " ".join(parts[1:])
                    break

        # Title: first short line after name that looks like a job title
        name_line = f"{personal.firstName} {personal.lastName}".strip() if personal.firstName else None
        for line in header_lines:
            if (
                line != name_line and not EMAIL_RE.search(line)
                and not PHONE_RE.search(line) and not URL_RE.search(line)
                and not re.search(r"\d{4}", line)
                and 5 <= len(line) <= 80 and 2 <= len(line.split()) <= 8
            ):
                personal.title = line
                break

        return personal

    # ── Experience ────────────────────────────────────────────────────────────

    def _parse_experience(self, lines: List[str], bert: BertNER) -> List[ExperienceEntry]:
        """
        Multi-layer experience parser:
          1. Europass labeled fields (Perioada, Funcția, Angajator)
          2. Date-range boundary detection
          3. Combined line patterns (Title | Company | Date)
          4. BERT ORG NER for company detection
          5. spaCy ORG fallback
          6. Job-title keyword heuristic
        """
        entries: List[ExperienceEntry] = []
        draft: Dict[str, Any] = self._new_draft()
        pending: Optional[str] = None

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

            # Europass labeled fields
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

            # Pending continuation from Europass label
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

            # Bullet line
            if BULLET_RE.match(line):
                draft["bullets"].append(re.sub(BULLET_RE, "", line).strip())
                continue

            # Bullet continuation (wrapped line)
            if self._append_to_last_bullet(draft, line):
                continue

            # Date range → new entry boundary
            if DATE_RANGE_RE.search(line) or LOOSE_DATE_RANGE_RE.search(line):
                if draft["period"] and (draft["title"] or draft["company"] or draft["bullets"]):
                    push()
                draft["period"] = line
                continue

            # Combined line: "Title | Company | Date" or "Title @ Company (Date)"
            combined = self._try_combined(line)
            if combined:
                if combined.get("period") and draft["period"] and (draft["title"] or draft["company"]):
                    push()
                draft["title"] = draft["title"] or combined.get("title", "")
                draft["company"] = draft["company"] or combined.get("company", "")
                draft["period"] = draft["period"] or combined.get("period", "")
                continue

            # BERT ORG NER (Layer 5 — highest semantic accuracy)
            if bert.available and not draft["company"]:
                companies = bert.get_companies(line)
                if companies:
                    draft["company"] = companies[0]
                    remainder = line.replace(companies[0], "", 1).strip(" ,|-")
                    if remainder and not draft["title"] and self._looks_like_job_title(remainder):
                        draft["title"] = remainder
                    continue

            # spaCy ORG NER fallback
            if not draft["company"]:
                ner = self._spacy_ner(line)
                if ner:
                    draft["company"] = ner["org"]
                    remainder = ner["remainder"].strip(" ,|-")
                    if remainder and not draft["title"] and self._looks_like_job_title(remainder):
                        draft["title"] = remainder
                    continue

            # Company suffix heuristic
            if not draft["company"] and COMPANY_SUFFIX_RE.search(line):
                draft["company"] = line
                continue

            # Job-title heuristic
            if not draft["title"] and self._looks_like_job_title(line):
                draft["title"] = line
                continue

            # Anything else
            if len(line) >= 20:
                draft["bullets"].append(line)

        push()
        return entries

    # ── Education ─────────────────────────────────────────────────────────────

    def _parse_education_section(self, lines: List[str]) -> str:
        blocks: List[str] = []
        edu: Dict[str, Any] = {
            "period": "", "qual": "", "field": "", "institution": "", "details": []
        }
        pending: Optional[str] = None

        def flush():
            nonlocal pending
            if any([edu["period"], edu["qual"], edu["field"], edu["institution"], edu["details"]]):
                heading = edu["qual"] or edu["institution"] or "Education"
                title_line = f"{heading} ({edu['period']})" if edu["period"] else heading
                seen: set = set()
                bullets: List[str] = []

                def add(v: str) -> None:
                    c = v.strip()
                    k = normalize_for_match(c)
                    if c and k not in seen:
                        seen.add(k)
                        bullets.append(c)

                if edu["institution"] and normalize_for_match(edu["institution"]) != normalize_for_match(heading):
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

            if not edu["institution"] and re.search(
                r"universit|academy|facult|liceu|school|college|institut", line, re.I
            ):
                edu["institution"] = line
                continue

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

    def _collect_raw_skills(self, lines: List[str]) -> List[str]:
        """Extract raw skill strings from a skills section."""
        raw: List[str] = []
        for line in lines:
            clean = re.sub(BULLET_RE, "", line).strip()
            raw.extend(p.strip() for p in re.split(r"[,;|]", clean) if p.strip())
        return raw

    def _parse_skills_section(self, lines: List[str]) -> str:
        seen: Dict[str, str] = {}
        for raw in lines:
            clean = re.sub(BULLET_RE, "", raw).strip()
            for part in re.split(r"[,;|]", clean):
                p = part.strip()
                k = normalize_for_match(p)
                if p and k and k not in seen:
                    seen[k] = p
        return "\n".join(f"• {v}" for v in seen.values()) if seen else "\n".join(lines)

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
                result.append(f"• {lang} — {level_m.group(0)}" if lang else f"• {line}")
            else:
                result.append(f"• {line}")
        return "\n".join(result) if result else "\n".join(lines)

    # ── Generic formatter ─────────────────────────────────────────────────────

    def _format_section(self, sec_type: str, lines: List[str]) -> str:
        if sec_type == "education":
            return self._parse_education_section(lines)
        if sec_type == "skills":
            return self._parse_skills_section(lines)
        if sec_type == "languages":
            return self._parse_languages_section(lines)
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
        return ExperienceEntry(
            id=str(uuid.uuid4()),
            title=title,
            company=company,
            period=period,
            description=description,
            bullets=bullets or ([""] if not description else [description]),
        )

    @staticmethod
    def _tagged(line: str, pattern: re.Pattern) -> Optional[str]:
        m = pattern.match(line)
        if m is None:
            return None
        return m.group(1).strip() if m.group(1) else ""

    @staticmethod
    def _split_bullets(text: str) -> List[str]:
        parts = re.split(r"\s*[•·▸▶▪◦▷◆◇■□●○➤➢→✓✔★❖⁃]\s*", text)
        if len(parts) > 1:
            return [p.strip() for p in parts if p.strip()]
        parts = re.split(r"\s*;\s*", text)
        if len(parts) > 1:
            return [p.strip() for p in parts if p.strip()]
        return [text.strip()] if text.strip() else []

    @staticmethod
    def _append_to_last_bullet(draft: Dict[str, Any], line: str) -> bool:
        if not draft["bullets"]:
            return False
        if (
            BULLET_RE.match(line) or DATE_RANGE_RE.search(line)
            or LOOSE_DATE_RANGE_RE.search(line) or len(line) > 220
        ):
            return False
        if line and (line[0].islower() or line[0] in ",:;.)-"):
            draft["bullets"][-1] = f"{draft['bullets'][-1]} {line}".strip()
            return True
        return False

    @staticmethod
    def _try_combined(line: str) -> Optional[Dict[str, str]]:
        m = re.match(r"^([^|•]+?)\s*[|•]\s*([^|•]+?)\s*[|•]\s*(.+)$", line)
        if m:
            right = m.group(3).strip()
            if DATE_RANGE_RE.search(right) or LOOSE_DATE_RANGE_RE.search(right):
                return {"title": m.group(1).strip(), "company": m.group(2).strip(), "period": right}

        at_m = re.match(r"^(.+?)\s+@\s+(.+?)(?:\s+[(\[](.+)[)\]])?$", line)
        if at_m:
            period_candidate = at_m.group(3) or ""
            if not period_candidate or DATE_RANGE_RE.search(period_candidate):
                return {
                    "title": at_m.group(1).strip(),
                    "company": at_m.group(2).strip(),
                    "period": period_candidate.strip(),
                }
        return None

    def _spacy_ner(self, text: str) -> Optional[Dict[str, str]]:
        for nlp in (self.nlp_en, self.nlp_ro):
            doc = nlp(text)
            orgs = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
            if orgs:
                return {"org": orgs[0], "remainder": text.replace(orgs[0], "", 1)}
        return None

    @staticmethod
    def _looks_like_job_title(text: str) -> bool:
        if len(text) < 3 or len(text) > 110:
            return False
        if EMAIL_RE.search(text) or PHONE_RE.search(text) or DATE_RE.search(text):
            return False
        return any(kw in text.lower() for kw in JOB_TITLE_KEYWORDS)

    @staticmethod
    def _empty_response() -> ParseResponse:
        return ParseResponse(
            personal=PersonalInfo().dict(),
            experience=[],
            dynamicSections=[],
            metadata={"source": "python-nlp", "error": "empty_pdf"},
        )
