import io
import re
import spacy
import pdfplumber
from typing import Dict, Any, List, Tuple

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

EMAIL_REGEX = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
PHONE_REGEX = r'(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}'
URL_REGEX = r'(https?://[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s]*)?)'
DATE_REGEX = r'(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{1,2})\s*(?:/|-|,| )?\s*(?:\d{4}|\d{2})'
DATE_RANGE_REGEX = rf'({DATE_REGEX})\s*(?:-|to|–|—|until|present|current)\s*({DATE_REGEX}|present|current)?'

SECTION_KEYWORDS = {
    "experience": ["experience", "work experience", "employment history", "professional experience"],
    "education": ["education", "academic background", "academic history"],
    "skills": ["skills", "technical skills", "core competencies"],
    "languages": ["languages", "language proficiency"],
    "certifications": ["certifications", "licenses", "courses"],
    "projects": ["projects", "personal projects", "academic projects"],
    "volunteer": ["volunteer", "volunteering", "community service"],
    "awards": ["awards", "honors", "achievements"],
    "summary": ["summary", "profile", "about me", "professional summary", "objective"]
}

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text(layout=True)
            if page_text:
                text += page_text + "\n\n"
    return text

def parse_personal_info(text: str, doc) -> Dict[str, str]:
    personal = {
        "name": "", "email": "", "phone": "", "location": "",
        "linkedin": "", "github": "", "website": "", "summary": ""
    }

    for ent in doc.ents:
        if ent.label_ == "PERSON" and not personal["name"]:
            personal["name"] = ent.text.strip()
            break

    emails = re.findall(EMAIL_REGEX, text)
    if emails: personal["email"] = emails[0]

    phones = re.findall(PHONE_REGEX, text)
    if phones:
        valid_phones = [p for p in phones if len(re.sub(r'\D', '', p)) >= 10]
        if valid_phones: personal["phone"] = valid_phones[0].strip()

    for ent in doc.ents:
        if ent.label_ == "GPE" and not personal["location"]:
            personal["location"] = ent.text.strip()
            break

    urls = re.findall(URL_REGEX, text)
    for url in urls:
        url_lower = url.lower()
        if "linkedin.com" in url_lower:
            personal["linkedin"] = url
        elif "github.com" in url_lower:
            personal["github"] = url
        elif not personal["website"] and "linkedin.com" not in url_lower and "github.com" not in url_lower:
             if "@" not in url: personal["website"] = url

    return personal

def segment_sections(text: str) -> Dict[str, str]:
    sections = {k: "" for k in SECTION_KEYWORDS.keys()}
    lines = text.split('\n')
    current_section = None
    
    for line in lines:
        line_stripped = line.strip()
        if not line_stripped:
            if current_section: sections[current_section] += "\n"
            continue
            
        line_lower = line_stripped.lower()
        is_header = False
        
        if len(line_stripped) < 50:
            for section, keywords in SECTION_KEYWORDS.items():
                if any(kw == line_lower or line_lower.startswith(kw + ":") for kw in keywords):
                    current_section = section
                    is_header = True
                    break
        
        if not is_header and current_section:
            sections[current_section] += line + "\n"
            
    return sections

def parse_experience(text: str) -> List[Dict[str, Any]]:
    if not text.strip(): return []
    experiences = []
    lines = text.split('\n')
    
    current_exp = None
    for line in lines:
        stripped = line.strip()
        if not stripped: continue
        
        is_bullet = stripped.startswith('-') or stripped.startswith('•') or stripped.startswith('*')
        
        if is_bullet:
            if current_exp:
                current_exp["bullets"].append(stripped.lstrip('-•* \t'))
        else:
            doc = nlp(line)
            orgs = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
            dates = re.findall(DATE_RANGE_REGEX, line, re.IGNORECASE)
            
            if orgs or dates or len(stripped) < 60: 
                # Potential new role/company header
                if current_exp and (current_exp["company"] or current_exp["role"]):
                    experiences.append(current_exp)
                
                current_exp = {
                    "company": orgs[0] if orgs else "",
                    "role": stripped if not orgs else stripped.replace(orgs[0], "").strip(" ,|-"),
                    "start_date": dates[0][0] if dates else "",
                    "end_date": dates[0][1] if dates else "",
                    "location": "",
                    "bullets": []
                }
            elif current_exp:
                # If not bullet and not header, might be a multi-line header or description
                if len(stripped) > 80:
                    current_exp["bullets"].append(stripped)
                else:
                    if not current_exp["role"]: current_exp["role"] = stripped
                    elif not current_exp["company"]: current_exp["company"] = stripped
    
    if current_exp and (current_exp["company"] or current_exp["role"] or current_exp["bullets"]):
        experiences.append(current_exp)
        
    return experiences

def parse_education(text: str) -> List[Dict[str, Any]]:
    if not text.strip(): return []
    educations = []
    lines = text.split('\n')
    
    current_edu = None
    for line in lines:
        stripped = line.strip()
        if not stripped: continue
        
        doc = nlp(line)
        orgs = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
        dates = re.findall(DATE_RANGE_REGEX, line, re.IGNORECASE)
        
        if orgs or dates or "university" in stripped.lower() or "college" in stripped.lower() or "degree" in stripped.lower() or "bachelor" in stripped.lower() or "master" in stripped.lower():
            if current_edu and current_edu["institution"]:
                educations.append(current_edu)
            
            current_edu = {
                "institution": orgs[0] if orgs else (stripped if "university" in stripped.lower() or "college" in stripped.lower() else ""),
                "degree": stripped if "degree" in stripped.lower() or "bachelor" in stripped.lower() or "master" in stripped.lower() else "",
                "field": "",
                "start_date": dates[0][0] if dates else "",
                "end_date": dates[0][1] if dates else "",
                "gpa": ""
            }
        elif current_edu:
            if not current_edu["degree"] and len(stripped) < 60:
                current_edu["degree"] = stripped
            elif "gpa" in stripped.lower():
                current_edu["gpa"] = stripped
                
    if current_edu and current_edu["institution"]:
        educations.append(current_edu)
        
    return educations

def parse_skills(text: str) -> List[str]:
    if not text.strip(): return []
    skills = []
    # Try comma split first
    if "," in text:
        skills = [s.strip() for s in text.split(',') if s.strip()]
    else:
        # Otherwise split by bullet or newline
        lines = text.split('\n')
        for line in lines:
            stripped = line.strip().lstrip('-•* \t')
            if stripped: skills.append(stripped)
    return skills

def extract_resume_data(pdf_bytes: bytes) -> Dict[str, Any]:
    text = extract_text_from_pdf(pdf_bytes)
    
    if not text.strip():
        return _empty_schema()
        
    doc = nlp(text[:5000])
    
    personal = parse_personal_info(text[:2000], doc)
    sections = segment_sections(text)
    
    if sections.get("summary"):
        personal["summary"] = sections["summary"].strip()
        
    return {
        "personal": personal,
        "experience": parse_experience(sections.get("experience", "")),
        "education": parse_education(sections.get("education", "")),
        "skills": parse_skills(sections.get("skills", "")),
        "languages": [{"language": l.strip().lstrip('-•* \t'), "level": ""} for l in sections.get("languages", "").split('\n') if l.strip()],
        "certifications": [{"name": c.strip().lstrip('-•* \t'), "issuer": "", "date": ""} for c in sections.get("certifications", "").split('\n') if c.strip()],
        "projects": [{"name": "Extracted Project", "description": sections.get("projects", "").strip(), "technologies": [], "url": ""}] if sections.get("projects") else [],
        "volunteer": [],
        "awards": [a.strip().lstrip('-•* \t') for a in sections.get("awards", "").split('\n') if a.strip()]
    }

def _empty_schema() -> Dict[str, Any]:
    return {
      "personal": {
        "name": "", "email": "", "phone": "", "location": "",
        "linkedin": "", "github": "", "website": "", "summary": ""
      },
      "experience": [],
      "education": [],
      "skills": [],
      "languages": [],
      "certifications": [],
      "projects": [],
      "volunteer": [],
      "awards": []
    }
