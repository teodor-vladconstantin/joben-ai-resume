import re
from typing import List, Dict, Any, Optional
from .pdf_extractor import PDFExtractor
from ..models.resume import PersonalInfo, ExperienceEntry, DynamicSection, ResumeData, ParseResponse
from ..utils.patterns import (
    normalize_for_match, EMAIL_RE, PHONE_RE, LINKEDIN_RE, GITHUB_RE, URL_RE,
    COMPANY_SUFFIX_RE, DATE_RE, BULLET_RE, SECTION_NAMES, DATE_RANGE_RE, PERIOD_END_RE
)

class ResumeParser:
    """Parse a PDF resume into structured data using pdfplumber and heuristics."""

    def parse(self, pdf_bytes: bytes) -> ParseResponse:
        extractor = PDFExtractor()
        extracted = extractor.extract(pdf_bytes)
        lines = extracted['lines']

        personal = self._extract_personal(lines)
        sections = self._split_sections(lines)
        experience = self._parse_experience(sections.get('experience', []))
        education = self._parse_education(sections.get('education', []))
        skills = self._parse_skills(sections.get('skills', []))
        projects = self._parse_projects(sections.get('projects', []))
        certifications = self._parse_certifications(sections.get('certifications', []))
        awards = self._parse_awards(sections.get('awards', []))
        publications = self._parse_publications(sections.get('publications', []))
        research = self._parse_research(sections.get('research', []))
        languages = self._parse_languages(sections.get('languages', []))
        volunteer = self._parse_volunteer(sections.get('volunteer', []))
        interests = self._parse_interests(sections.get('interests', []))
        references = self._parse_references(sections.get('references', []))
        associations = self._parse_associations(sections.get('associations', []))

        dynamic_sections = []
        for section_type, content_list in [
            ('education', education),
            ('skills', skills),
            ('projects', projects),
            ('certifications', certifications),
            ('awards', awards),
            ('publications', publications),
            ('research', research),
            ('languages', languages),
            ('volunteer', volunteer),
            ('interests', interests),
            ('references', references),
            ('associations', associations),
        ]:
            if content_list:
                text = self._format_generic(content_list) if section_type not in ['education'] else self._format_education(content_list)
                dynamic_sections.append({
                    'id': self._generate_id(),
                    'type': section_type,
                    'title': section_type.capitalize(),
                    'content': text
                })

        return ParseResponse(
            personal=personal.dict(),
            experience=[exp.dict() for exp in experience],
            dynamicSections=dynamic_sections,
            metadata={'source': 'python', 'lang': 'both'}
        )

    def _extract_personal(self, lines: List[Dict[str, Any]]) -> PersonalInfo:
        personal = PersonalInfo()
        email_match = phone_match = linkedin_match = github_match = website_match = None
        name_line_idx = -1

        # First pass: find contact info
        for idx, line in enumerate(lines):
            text = line['text']
            if not email_match:
                email_match = EMAIL_RE.search(text)
            if not phone_match:
                phone_match = PHONE_RE.search(text)
            if not linkedin_match:
                linkedin_match = LINKEDIN_RE.search(text)
            if not github_match:
                github_match = GITHUB_RE.search(text)
            if not website_match:
                website_match = URL_RE.search(text)
            if name_line_idx == -1:
                words = text.split()
                if 2 <= len(words) <= 5 and not any(char.isdigit() for char in text) and not EMAIL_RE.search(text) and not PHONE_RE.search(text):
                    name_line_idx = idx

        personal.email = email_match.group(0) if email_match else ""
        personal.phone = phone_match.group(0) if phone_match else ""
        personal.linkedin = f"https://linkedin.com/in/{linkedin_match.group(1)}" if linkedin_match else None
        personal.github = f"https://github.com/{github_match.group(1)}" if github_match else None
        personal.website = website_match.group(0) if website_match else None

        if name_line_idx != -1:
            name_line = lines[name_line_idx]['text']
            parts = name_line.strip().split()
            if len(parts) >= 2:
                personal.firstName = parts[0]
                personal.lastName = ' '.join(parts[1:])
            else:
                personal.firstName = name_line
            # Title: look at next non-empty line after name
            for j in range(name_line_idx + 1, min(name_line_idx + 3, len(lines))):
                next_text = lines[j]['text'].strip()
                if next_text and len(next_text.split()) <= 10 and not EMAIL_RE.search(next_text) and not PHONE_RE.search(next_text):
                    personal.title = next_text
                    break
            # Location: search lines near top for comma-separated location
            for line in lines[:10]:
                txt = line['text']
                if ',' in txt and sum(1 for c in txt if c.isupper()) >= 2:
                    personal.location = txt
                    break

        personal.summary = ""  # Could extract from a summary section if present
        return personal

    def _split_sections(self, lines: List[Dict[str, Any]]) -> Dict[str, List[List[Dict[str, Any]]]]:
        """Split lines into sections based on section headers."""
        sections: Dict[str, List[List[Dict[str, Any]]]] = {}
        current_section = 'other'
        current_content: List[Dict[str, Any]] = []
        for line in lines:
            text = line['text'].strip()
            normalized = normalize_for_match(text)
            # Heuristic: all caps could be a header
            is_header = False
            if normalized in SECTION_NAMES:
                current_section = SECTION_NAMES[normalized]
                is_header = True
            elif text.isupper() and len(text) < 30 and len(text.split()) <= 4:
                # All caps short text is likely a section header; try to guess
                for key, val in SECTION_NAMES.items():
                    if normalized in key or key.startswith(normalized):
                        current_section = val
                        is_header = True
                        break
            if is_header:
                if current_content:
                    sections.setdefault(current_section, []).append(current_content)
                current_content = []
            else:
                current_content.append(line)
        if current_content:
            sections.setdefault(current_section, []).append(current_content)
        return sections

    def _parse_experience(self, sections: List[List[Dict[str, Any]]]) -> List[ExperienceEntry]:
        entries: List[ExperienceEntry] = []
        for block in sections:
            entry = self._parse_experience_block(block)
            if entry:
                entries.append(entry)
        return entries

    def _parse_experience_block(self, lines: List[Dict[str, Any]]) -> Optional[ExperienceEntry]:
        """Parse a block of lines into a single ExperienceEntry."""
        if not lines:
            return None
        entry = ExperienceEntry(id=self._generate_id(), bullets=[], description="")
        state = {
            'title': '',
            'company': '',
            'period': '',
            'in_job': False,
            'bullet_mode': False
        }

        for line_obj in lines:
            line = line_obj['text'].strip()
            if not line:
                continue
            # Detect period line
            if DATE_RANGE_RE.search(line) or re.search(r'\d{4}\s*[-–]\s*(?:\d{4}|Present|Current)', line, re.IGNORECASE):
                state['period'] = line
                state['in_job'] = True
                continue
            # Detect bullet
            if BULLET_RE.match(line):
                entry.bullets.append(line)
                state['bullet_mode'] = True
                continue
            # Combined line: Title | Company | Dates or Title - Company - Dates or Title @ Company
            if ('|' in line or '-' in line or '@' in line) and state['in_job'] and not state['bullet_mode']:
                parts = re.split(r'\s*[|@-]\s*', line)
                parts = [p.strip() for p in parts if p.strip()]
                if len(parts) >= 2:
                    if not state['title']:
                        state['title'] = parts[0]
                    if not state['company']:
                        # Find company part: contains suffix or looks like company
                        for p in parts[1:]:
                            if COMPANY_SUFFIX_RE.search(p) or self._looks_like_company(p):
                                state['company'] = p
                                break
                    # Period might be last part
                    if not state['period'] and DATE_RE.search(parts[-1]):
                        state['period'] = parts[-1]
            # Standalone title/company detection
            elif state['in_job'] and not state['bullet_mode']:
                if not state['title'] and self._looks_like_job_title(line):
                    state['title'] = line
                elif not state['company'] and self._looks_like_company(line):
                    state['company'] = line
                else:
                    # Long line becomes bullet if >20 chars and not already captured; else note
                    if len(line) > 20 and not entry.description:
                        entry.bullets.append(line)
                    else:
                        entry.description += line + " "
            else:
                # Not yet in job? maybe first line is title/company
                if not state['title'] and self._looks_like_job_title(line):
                    state['title'] = line
                elif not state['company'] and self._looks_like_company(line):
                    state['company'] = line

        # Finalize entry
        entry.title = state['title']
        entry.company = state['company']
        entry.period = state['period']
        entry.description = entry.description.strip()
        # If no bullets but description has sentences, split into bullets
        if not entry.bullets and entry.description:
            # Split by period or newline? here use simple period split
            parts = [p.strip() for p in entry.description.split('.') if p.strip()]
            entry.bullets = [p + '.' for p in parts[:5]]
            entry.description = ""
        return entry if entry.title or entry.company else None

    def _looks_like_job_title(self, text: str) -> bool:
        lower = text.lower()
        title_keywords = ['engineer', 'developer', 'manager', 'director', 'analyst', 'designer', 'consultant', 'specialist', 'lead', 'architect', 'coordinator', 'assistant', 'intern', 'trainee', 'officer', 'head', 'chief', 'president', 'vp', 'cto', 'cio', 'cfo', 'ceo']
        for kw in title_keywords:
            if kw in lower:
                return True
        return False

    def _looks_like_company(self, text: str) -> bool:
        # Shorter than title, often contains suffixes like Inc, LLC, SRL, SA
        if COMPANY_SUFFIX_RE.search(text):
            return True
        # All caps and short?
        words = text.split()
        if len(words) <= 4 and sum(1 for w in words if w.isupper()) >= len(words) * 0.5:
            return True
        return False

    def _parse_education(self, sections: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        items = []
        for block in sections:
            text = "\n".join(line['text'] for line in block if line['text'].strip())
            if text:
                items.append({'text': text})
        return items

    def _parse_skills(self, sections: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        items = []
        for block in sections:
            text = "\n".join(line['text'] for line in block if line['text'].strip())
            if text:
                items.append({'text': text})
        return items

    def _parse_projects(self, sections: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        items = []
        for block in sections:
            text = "\n".join(line['text'] for line in block if line['text'].strip())
            if text:
                items.append({'text': text})
        return items

    def _parse_certifications(self, sections: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        items = []
        for block in sections:
            text = "\n".join(line['text'] for line in block if line['text'].strip())
            if text:
                items.append({'text': text})
        return items

    def _parse_awards(self, sections: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        items = []
        for block in sections:
            text = "\n".join(line['text'] for line in block if line['text'].strip())
            if text:
                items.append({'text': text})
        return items

    def _parse_publications(self, sections: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        items = []
        for block in sections:
            text = "\n".join(line['text'] for line in block if line['text'].strip())
            if text:
                items.append({'text': text})
        return items

    def _parse_research(self, sections: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        items = []
        for block in sections:
            text = "\n".join(line['text'] for line in block if line['text'].strip())
            if text:
                items.append({'text': text})
        return items

    def _parse_languages(self, sections: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        items = []
        for block in sections:
            text = "\n".join(line['text'] for line in block if line['text'].strip())
            if text:
                items.append({'text': text})
        return items

    def _parse_volunteer(self, sections: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        items = []
        for block in sections:
            text = "\n".join(line['text'] for line in block if line['text'].strip())
            if text:
                items.append({'text': text})
        return items

    def _parse_interests(self, sections: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        items = []
        for block in sections:
            text = "\n".join(line['text'] for line in block if line['text'].strip())
            if text:
                items.append({'text': text})
        return items

    def _parse_references(self, sections: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        items = []
        for block in sections:
            text = "\n".join(line['text'] for line in block if line['text'].strip())
            if text:
                items.append({'text': text})
        return items

    def _parse_associations(self, sections: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        items = []
        for block in sections:
            text = "\n".join(line['text'] for line in block if line['text'].strip())
            if text:
                items.append({'text': text})
        return items

    def _format_education(self, items: List[Dict[str, Any]]) -> str:
        return "\n".join(item['text'] for item in items)

    def _format_generic(self, items: List[Dict[str, Any]]) -> str:
        return "\n".join(item['text'] for item in items)

    def _generate_id(self) -> str:
        import uuid
        return str(uuid.uuid4())
