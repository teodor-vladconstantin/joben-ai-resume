import re
import unicodedata

def normalize_for_match(value: str) -> str:
    """Normalize text for case/diacritic-insensitive matching."""
    if not value:
        return ""
    # Strip diacritics, lower, collapse spaces
    nfkd = unicodedata.normalize('NFKD', value)
    ascii = nfkd.encode('ASCII', 'ignore').decode('ascii')
    return re.sub(r'\s+', ' ', ascii).strip().lower()

# --- Contact info regexes ---
EMAIL_RE = re.compile(r'[\w.+\-]+@[\w\-]+\.[a-zA-Z]{2,}')
PHONE_RE = re.compile(r'(\+?\d[\d\s\-().]{5,}\d)')
LINKEDIN_RE = re.compile(
    r'(?:(?:https?://)?(?:www\.)?linkedin\.com/(?:in|pub|profile)/)([\w%.\-]+(?:/[\w%.\-]*)*)'
)
GITHUB_RE = re.compile(r'(?:(?:https?://)?(?:www\.)?github\.com/)([\w\-]+)')
URL_RE = re.compile(
    r'https?://(?:www\.)?[\w\-]+(\.[\w\-]+)+(?:/[\w\-._~:/?#[\]@!$&\'()*+,;=%]*)?'
)

# --- Company suffixes ---
COMPANY_SUFFIX_RE = re.compile(
    r'\b(?:S\.?R\.?L\.?|S\.?A\.?|R\.?A\.?|S\.?C\.?|C\.?S\.?C\.?|L\.?L\.?C\.?|P\.?C\.?|Inc\.?|LLC|L\.?L\.?P\.?|L\.?L\.?O\.?|d\.?o\.?o\.?|f\.?o\.?|gr\.?s\.?|s\.?a\.?s\.?|s\.?n\.?c\.?)\b',
    re.IGNORECASE
)

# --- Date & period regexes ---
MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Sept', 'Oct', 'Nov', 'Dec']
MONTHS_RO = ['Ian', 'Febr', 'Mart', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
MONTH_RE_PART = '|'.join(MONTHS_EN + MONTHS_RO)

DATE_RE = re.compile(
    fr'(?:{MONTH_RE_PART}[a-zA-Zăâîșșțț]*\.?\s+)?\b\d{{4}}\b|\b(?:0?[1-9]|1[0-2])[/. ]\d{{4}}\b',
    re.IGNORECASE
)

PERIOD_END_RE = 'Present|Current|Now|Ongoing|Till\s+date|To\s+date|Prezent|Actual|Curent|În\s+prezent|Actual|Dacat|În\s+dacat'

DATE_RANGE_RE = re.compile(
    fr'((?:{MONTH_RE_PART}[a-zA-Zăâîșșțț]*\.?\s+)?\b\d{{4}}\b|\b(?:0?[1-9]|1[0-2])[/. ]\d{{4}}\b)?\s*[-–—]?\s*(?:{PERIOD_END_RE}|\d{{4}}|\d{{1,2}}[/.]\d{{4}}|\b(?:0?[1-9]|1[0-2])[/. ]\d{{4}}\b)',
    re.IGNORECASE
)

# --- Bullet regex ---
BULLET_RE = re.compile(
    r'^\s*(?:[•·▸▶▪◦▷◆◇■□●○➤➢→✓✔✗✘★❖⁃‒\-–—*]|(?:\d+|[a-zA-Z])[.)])\s+'
)

# --- Section names mapping (normalized keys -> canonical type) ---
SECTION_NAMES = {
    # Experience
    'experience': 'experience',
    'work experience': 'experience',
    'professional experience': 'experience',
    'employment history': 'experience',
    'work history': 'experience',
    'experienta': 'experience',
    'experienta profesionala': 'experience',
    'istoric occupational': 'experience',
    'activitate profesionala': 'experience',
    # Education
    'education': 'education',
    'educational background': 'education',
    'academic background': 'education',
    'studies': 'education',
    'degrees': 'education',
    'certifications': 'education',
    'educatie': 'education',
    'studii': 'education',
    'formare': 'education',
    'academica': 'education',
    'diplome': 'education',
    # Skills
    'skills': 'skills',
    'technical skills': 'skills',
    'core competencies': 'skills',
    'competencies': 'skills',
    'abilities': 'skills',
    'tehnice': 'skills',
    'abilitati': 'skills',
    'competențe': 'skills',
    'competente': 'skills',
    # Projects
    'projects': 'projects',
    'personal projects': 'projects',
    'proiecte': 'projects',
    # Certifications
    'certifications': 'certifications',
    'certificates': 'certifications',
    'certificări': 'certifications',
    # Awards
    'awards': 'awards',
    'honors': 'awards',
    'achievements': 'awards',
    'premii': 'awards',
    'onoruri': 'awards',
    'realizări': 'awards',
    # Publications
    'publications': 'publications',
    'papers': 'publications',
    'articles': 'publications',
    'publicații': 'publications',
    'lucrări': 'publications',
    # Research
    'research': 'research',
    'research experience': 'research',
    'research projects': 'research',
    'cercetare': 'research',
    # Summary
    'summary': 'summary',
    'professional summary': 'summary',
    'about me': 'summary',
    'profile': 'summary',
    'despre mine': 'summary',
    'profil': 'summary',
    # Languages
    'languages': 'languages',
    'language skills': 'languages',
    'limbi străine': 'languages',
    'limbi': 'languages',
    # Volunteer
    'volunteer': 'volunteer',
    'volunteer experience': 'volunteer',
    'voluntariat': 'volunteer',
    # Interests
    'interests': 'interests',
    'hobbies': 'interests',
    'personal interests': 'interests',
    'pasiuni': 'interests',
    # References
    'references': 'references',
    'professional references': 'references',
    'referințe': 'references',
    # Associations
    'associations': 'associations',
    'memberships': 'associations',
    'professional associations': 'associations',
    'asociații': 'associations',
}
