import re
import unicodedata


# ── Normalisation ─────────────────────────────────────────────────────────────

def normalize_for_match(value: str) -> str:
    """Lower-case, strip diacritics, collapse whitespace."""
    if not value:
        return ""
    nfkd = unicodedata.normalize("NFKD", value)
    ascii_str = nfkd.encode("ASCII", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", ascii_str).strip().lower()


# ── Contact info ──────────────────────────────────────────────────────────────

EMAIL_RE = re.compile(r"[\w.+\-]+@[\w\-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"(\+?\d[\d\s\-().]{5,}\d)")
LINKEDIN_RE = re.compile(
    r"(?:(?:https?://)?(?:www\.)?linkedin\.com/(?:in|pub|profile)/)([\w%.\-]+(?:/[\w%.\-]*)*)"
)
GITHUB_RE = re.compile(r"(?:(?:https?://)?(?:www\.)?github\.com/)([\w\-]+)")
URL_RE = re.compile(
    r"https?://(?:www\.)?[\w\-]+(\.[\w\-]+)+(?:/[\w\-._~:/?#\[\]@!$&'()*+,;=%]*)?"
)

# ── Company suffixes (EN + RO + EU) ──────────────────────────────────────────

COMPANY_SUFFIX_RE = re.compile(
    r"\b(?:S\.?R\.?L\.?|S\.?A\.?|R\.?A\.?|S\.?N\.?C\.?|F\.?L\.?|P\.?F\.?A\.?|I\.?I\.?|I\.?F\.?"
    r"|LLC|L\.?L\.?C\.?|Inc\.?|Ltd\.?|GmbH|B\.?V\.?|N\.?V\.?|AG|PLC|Corp\.?|SAS|SARL|SpA"
    r"|OOO|Kft|s\.r\.o\.?|GesmbH|AB|AS|Oy|A\/S|d\.o\.o\.?)\b",
    re.IGNORECASE,
)

# ── Date regexes ──────────────────────────────────────────────────────────────

_MONTHS_EN = "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec"
_MONTHS_EN_FULL = (
    "January|February|March|April|May|June|July|August"
    "|September|October|November|December"
)
_MONTHS_RO = "Ian|Febr?|Mart?|Apr|Mai|Iun|Iul|Aug|Sept?|Oct|Noi|Nov|Dec"
_MONTHS_RO_FULL = (
    "Ianuarie|Februarie|Martie|Aprilie|Mai|Iunie|Iulie|August"
    "|Septembrie|Octombrie|Noiembrie|Decembrie"
)
MONTH_RE_PART = f"{_MONTHS_EN}|{_MONTHS_EN_FULL}|{_MONTHS_RO}|{_MONTHS_RO_FULL}"

_PERIOD_END = (
    "Present|Current|Now|Ongoing|Till\\s+date|To\\s+date|Till\\s+now"
    "|Prezent|Actual|Curent|În\\s+prezent|In\\s+prezent|Pana\\s+in\\s+prezent"
)

DATE_RE = re.compile(
    fr"(?:{MONTH_RE_PART})[a-zA-Zăâîșşțţ]*\.?\s+\d{{4}}|\b(?:0?[1-9]|1[0-2])[/. ]\d{{4}}\b|\b\d{{4}}\b",
    re.IGNORECASE,
)

DATE_RANGE_RE = re.compile(
    fr"(?:(?:{MONTH_RE_PART})[a-zA-Zăâîșşțţ]*\.?\s+)?\b\d{{4}}\b"
    fr"\s*[–\-—]\s*"
    fr"(?:(?:(?:{MONTH_RE_PART})[a-zA-Zăâîșşțţ]*\.?\s+)?\b\d{{4}}\b|{_PERIOD_END})"
    fr"|\b(?:0?[1-9]|1[0-2])[/. ]\d{{4}}\b\s*[–\-—]\s*(?:\b(?:0?[1-9]|1[0-2])[/. ]\d{{4}}\b|{_PERIOD_END})",
    re.IGNORECASE,
)

# Looser: year alone with dash and end marker (e.g. "2020 - Present")
LOOSE_DATE_RANGE_RE = re.compile(
    fr"(?:\b(19|20)\d{{2}}\b|\b(?:0?[1-9]|1[0-2])[/.](?:19|20)\d{{2}}\b)"
    fr"[^\n]{{0,30}}[–\-—][^\n]{{0,30}}"
    fr"(?:\b(19|20)\d{{2}}\b|\b(?:0?[1-9]|1[0-2])[/.](?:19|20)\d{{2}}\b|{_PERIOD_END})",
    re.IGNORECASE,
)

# ── Bullet characters ─────────────────────────────────────────────────────────

BULLET_RE = re.compile(
    r"^\s*(?:[•·▸▶▪◦▷◆◇■□●○➤➢→✓✔✗✘★❖⁃‒\-–—*]|(?:\d+|[a-zA-Z])[.)])\s+"
)

# ── Europass labeled-field patterns ──────────────────────────────────────────
# Romanian CVs built with the Europass template label every field explicitly.

EUROPASS_PERIOD_RE = re.compile(
    r"^(?:perioada|period(?:ul)?|period|employment\s+dates?|date(?:\s+range)?)\s*[:\-–—]?\s*(.*)$",
    re.IGNORECASE,
)
EUROPASS_ROLE_RE = re.compile(
    r"^(?:func(?:t|ț|ţ)ia\/?postul\s+ocupat|func(?:t|ț|ţ)ie|functie"
    r"|position|job\s+title|title|role|rol)\s*[:\-–—]?\s*(.*)$",
    re.IGNORECASE,
)
EUROPASS_COMPANY_RE = re.compile(
    r"^(?:num(?:ele?)?\s+s(?:i|î)\s+adresa\s+angajator(?:ului)?"
    r"|num(?:ele?)?\s+si\s+adresa\s+angajator(?:ului)?"
    r"|company|employer|organization|angajator)\s*[:\-–—]?\s*(.*)$",
    re.IGNORECASE,
)
EUROPASS_RESP_RE = re.compile(
    r"^(?:activitate(?:a)?\s+principal[aă]|tipul\s+de\s+activitate"
    r"|atribu(?:t|ț|ţ)ii|responsabilit(?:ati|ăți)"
    r"|responsibilities?|key\s+achievements?|main\s+activities?)\s*[:\-–—]?\s*(.*)$",
    re.IGNORECASE,
)

# ── Education labeled-field patterns ─────────────────────────────────────────

EDU_PERIOD_RE = re.compile(
    r"^(?:perioada|period(?:ul)?|period|dates?)\s*[:\-–—]?\s*(.*)$",
    re.IGNORECASE,
)
EDU_QUAL_RE = re.compile(
    r"^(?:calific(?:area)?\/?diploma\s+ob(?:t|ț|ţ)inut[ăa]?|calific(?:are|area)"
    r"|diploma|degree|qualification)\s*[:\-–—]?\s*(.*)$",
    re.IGNORECASE,
)
EDU_FIELD_RE = re.compile(
    r"^(?:disciplinele\s+studiate|specializare(?:a)?|field\s+of\s+study|major)\s*[:\-–—]?\s*(.*)$",
    re.IGNORECASE,
)
EDU_INSTITUTION_RE = re.compile(
    r"^(?:num(?:ele?)?\s+institu(?:t|ț|ţ)iei\s+de\s+inv[aă]t[aă]m[aâ]nt"
    r"|institu(?:t|ț|ţ)ia\s+de\s+inv[aă]t[aă]m[aâ]nt"
    r"|institution|university|school|college)\s*[:\-–—]?\s*(.*)$",
    re.IGNORECASE,
)

# ── Language proficiency level patterns ──────────────────────────────────────

LANG_LEVEL_RE = re.compile(
    r"\b(native|nativ[ă]?|mother\s+tongue|bilingua[l]?"
    r"|[ABC][12]|basic|elementary|intermediate|upper.intermediate"
    r"|advanced|proficient|fluent|working\s+proficiency"
    r"|beginner|conversational|professional)\b",
    re.IGNORECASE,
)

# ── Job title keywords ────────────────────────────────────────────────────────

JOB_TITLE_KEYWORDS = {
    "engineer", "developer", "manager", "director", "analyst", "designer",
    "consultant", "specialist", "lead", "architect", "coordinator", "assistant",
    "intern", "trainee", "officer", "head", "chief", "president", "vp",
    "cto", "cio", "cfo", "ceo", "coo", "devops", "scrum", "agile",
    "fullstack", "frontend", "backend", "mobile", "data", "scientist",
    "researcher", "professor", "lecturer", "teacher", "accountant", "auditor",
    "lawyer", "attorney", "doctor", "nurse", "therapist", "pharmacist",
    "inginer", "programator", "dezvoltator", "analist", "coordonator",
}

# ── Section names (EN + RO) ───────────────────────────────────────────────────
# Normalised keys → canonical section type.
# Ported and extended from the TypeScript parser for parity.

SECTION_NAMES: dict[str, str] = {
    # ── Experience ────────────────────────────────────────────────────────────
    "experience": "experience",
    "work experience": "experience",
    "professional experience": "experience",
    "relevant experience": "experience",
    "employment": "experience",
    "employment history": "experience",
    "work history": "experience",
    "career history": "experience",
    "job experience": "experience",
    "internship": "experience",
    "internships": "experience",
    "internship experience": "experience",
    "work placements": "experience",
    "practica profesionala": "experience",
    "practica": "experience",
    "experienta": "experience",
    "experienta profesionala": "experience",
    "experienta de munca": "experience",
    "experienta relevanta": "experience",
    "experienta in domeniu": "experience",
    "istoric profesional": "experience",
    "activitate profesionala": "experience",
    "stagii de practica": "experience",
    "stagii": "experience",
    # ── Education ─────────────────────────────────────────────────────────────
    "education": "education",
    "academic background": "education",
    "academic history": "education",
    "academic qualifications": "education",
    "education and training": "education",
    "training and education": "education",
    "formal education": "education",
    "continuing education": "education",
    "professional development": "education",
    "postgraduate": "education",
    "qualifications": "education",
    "training": "education",
    "courses": "education",
    "coursework": "education",
    "educatie": "education",
    "educatie si formare": "education",
    "educatie & formare": "education",
    "studii": "education",
    "studii si formare": "education",
    "studii superioare": "education",
    "studii universitare": "education",
    "formare academica": "education",
    "formare profesionala": "education",
    "bacalaureat": "education",
    "licenta": "education",
    "master": "education",
    "doctorat": "education",
    "cursuri urmate": "education",
    "cursuri": "education",
    # ── Skills ────────────────────────────────────────────────────────────────
    "skills": "skills",
    "technical skills": "skills",
    "it skills": "skills",
    "digital skills": "skills",
    "soft skills": "skills",
    "hard skills": "skills",
    "software skills": "skills",
    "programming skills": "skills",
    "programming languages": "skills",
    "core competencies": "skills",
    "competencies": "skills",
    "technologies": "skills",
    "tools & technologies": "skills",
    "tools and technologies": "skills",
    "key skills": "skills",
    "professional skills": "skills",
    "stack tehnic": "skills",
    "abilitati": "skills",
    "abilitati tehnice": "skills",
    "abilitati profesionale": "skills",
    "competente": "skills",
    "competente cheie": "skills",
    "competente tehnice": "skills",
    "cunostinte it": "skills",
    "cunostinte informatice": "skills",
    "cunostinte tehnice": "skills",
    "tehnologii utilizate": "skills",
    "instrumente si tehnologii": "skills",
    # ── Projects ──────────────────────────────────────────────────────────────
    "projects": "projects",
    "personal projects": "projects",
    "side projects": "projects",
    "key projects": "projects",
    "notable projects": "projects",
    "selected projects": "projects",
    "academic projects": "projects",
    "open source projects": "projects",
    "proiecte": "projects",
    "proiecte personale": "projects",
    "proiecte relevante": "projects",
    "proiecte academice": "projects",
    "portofoliu": "projects",
    "portofoliu proiecte": "projects",
    # ── Certifications ────────────────────────────────────────────────────────
    "certifications": "certifications",
    "professional certifications": "certifications",
    "it certifications": "certifications",
    "licenses": "certifications",
    "licenses & certifications": "certifications",
    "licenses and certifications": "certifications",
    "certificate": "certifications",
    "certificates": "certifications",
    "diplome": "certifications",
    "calificari": "certifications",
    "certificari": "certifications",
    "cursuri si certificari": "certifications",
    "atestate": "certifications",
    # ── Awards ────────────────────────────────────────────────────────────────
    "awards": "awards",
    "honors": "awards",
    "honors & awards": "awards",
    "achievements": "awards",
    "key achievements": "awards",
    "accomplishments": "awards",
    "distinctions": "awards",
    "premii": "awards",
    "premii si distinctii": "awards",
    "distinctii": "awards",
    "realizari": "awards",
    "realizari cheie": "awards",
    # ── Publications ──────────────────────────────────────────────────────────
    "publications": "publications",
    "academic publications": "publications",
    "research publications": "publications",
    "papers": "publications",
    "publicatii": "publications",
    "articole publicate": "publications",
    # ── Research ──────────────────────────────────────────────────────────────
    "research": "research",
    "research experience": "research",
    "cercetare": "research",
    "activitate de cercetare": "research",
    # ── Summary / Profile ─────────────────────────────────────────────────────
    "summary": "summary",
    "professional summary": "summary",
    "executive summary": "summary",
    "career summary": "summary",
    "career objective": "summary",
    "career profile": "summary",
    "personal statement": "summary",
    "professional profile": "summary",
    "profile": "summary",
    "about me": "summary",
    "objective": "summary",
    "overview": "summary",
    "bio": "summary",
    "introduction": "summary",
    "profil": "summary",
    "profil profesional": "summary",
    "sumar": "summary",
    "rezumat profesional": "summary",
    "rezumat": "summary",
    "obiectiv": "summary",
    "obiectiv profesional": "summary",
    "despre mine": "summary",
    # ── Languages ─────────────────────────────────────────────────────────────
    "languages": "languages",
    "language skills": "languages",
    "language proficiency": "languages",
    "foreign languages": "languages",
    "limbi": "languages",
    "limbi straine": "languages",
    "limbi vorbite": "languages",
    "cunostinte limbi straine": "languages",
    "limbi moderne": "languages",
    # ── Volunteer ─────────────────────────────────────────────────────────────
    "volunteer experience": "volunteer",
    "volunteer work": "volunteer",
    "volunteering": "volunteer",
    "community involvement": "volunteer",
    "community service": "volunteer",
    "voluntariat": "volunteer",
    "activitate voluntara": "volunteer",
    "activitati voluntare": "volunteer",
    # ── Interests / Hobbies ───────────────────────────────────────────────────
    "interests": "interests",
    "hobbies": "interests",
    "hobbies and interests": "interests",
    "interests and hobbies": "interests",
    "activities": "interests",
    "extracurricular activities": "interests",
    "personal interests": "interests",
    "interese": "interests",
    "pasiuni": "interests",
    "activitati extracurriculare": "interests",
    # ── References ────────────────────────────────────────────────────────────
    "references": "references",
    "professional references": "references",
    "referinte": "references",
    "persoane de contact": "references",
    # ── Associations / Memberships ────────────────────────────────────────────
    "associations": "associations",
    "memberships": "associations",
    "affiliations": "associations",
    "professional associations": "associations",
    "professional memberships": "associations",
    "asociatii profesionale": "associations",
    "organizatii profesionale": "associations",
}
