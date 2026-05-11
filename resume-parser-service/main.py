import hmac
import io
import json
import logging
import os
import re
from typing import Optional

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llama_parse import LlamaParse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Resume Parser", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://joben.eu", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# SECURITY: CLAUDE.md Critical #3 — the parser is exposed on a public IP so
# we MUST reject calls that bypass the Next.js layer. The Next.js
# `/api/parse` route forwards `Authorization: Bearer ${RESUME_PARSER_SHARED_SECRET}`
# and so must any other caller.
_SHARED_SECRET = (os.getenv("RESUME_PARSER_SHARED_SECRET") or "").strip()


def require_parser_secret(authorization: Optional[str] = Header(default=None)) -> None:
    if not _SHARED_SECRET:
        # Operators must explicitly set the secret in production. We refuse
        # to start serving traffic without one to fail loud rather than
        # silently expose the parser.
        logger.error("RESUME_PARSER_SHARED_SECRET is not configured")
        raise HTTPException(status_code=503, detail="Parser is not configured.")

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")

    presented = authorization.split(" ", 1)[1].strip()
    if not hmac.compare_digest(presented, _SHARED_SECRET):
        raise HTTPException(status_code=401, detail="Unauthorized")


class WorkExperience(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    start_month: Optional[int] = None
    start_year: Optional[int] = None
    end_month: Optional[int] = None
    end_year: Optional[int] = None
    is_current: bool = False
    description: Optional[str] = None
    bullets: list[str] = []


class Education(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    field: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    start_month: Optional[int] = None
    start_year: Optional[int] = None
    end_month: Optional[int] = None
    end_year: Optional[int] = None


class Language(BaseModel):
    language: str
    level: str


class Project(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    description: Optional[str] = None
    bullets: list[str] = []
    technologies: list[str] = []
    url: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    start_month: Optional[int] = None
    start_year: Optional[int] = None
    end_month: Optional[int] = None
    end_year: Optional[int] = None


class ResumeData(BaseModel):
    projects: list[Project] = []
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    work_experience: list[WorkExperience] = []
    education: list[Education] = []
    skills: list[str] = []
    languages: list[Language] = []
    certifications: list[str] = []


PROJECT_SECTION_PATTERN = re.compile(
    r"\b(?:projects?|personal projects?|side projects?|academic projects?|selected projects?|featured projects?|project work|project experience)\b",
    re.IGNORECASE,
)

EXPERIENCE_SECTION_PATTERN = re.compile(
    r"\b(?:experience|work experience|employment|professional experience|experien[țt]a|experienta|istoric profesional)\b",
    re.IGNORECASE,
)

SECTION_HEADING_PATTERN = re.compile(
    r"^(?:#{1,6}\s*)?(?:summary|professional summary|profile|experience|work experience|employment|education|skills|projects?|personal projects?|side projects?|academic projects?|featured projects?|project work|project experience|certifications?|languages?|awards?|volunteer|interests?|publications?|references?|sections?)[:\s-]*$",
    re.IGNORECASE,
)

TECHNOLOGY_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("React", re.compile(r"\bReact(?:\.js)?\b", re.IGNORECASE)),
    ("Next.js", re.compile(r"\bNext(?:\.js)?\b", re.IGNORECASE)),
    ("Node.js", re.compile(r"\bNode(?:\.js)?\b", re.IGNORECASE)),
    ("TypeScript", re.compile(r"\bTypeScript\b", re.IGNORECASE)),
    ("JavaScript", re.compile(r"\bJavaScript\b", re.IGNORECASE)),
    ("Python", re.compile(r"\bPython\b", re.IGNORECASE)),
    ("Django", re.compile(r"\bDjango\b", re.IGNORECASE)),
    ("Flask", re.compile(r"\bFlask\b", re.IGNORECASE)),
    ("FastAPI", re.compile(r"\bFastAPI\b", re.IGNORECASE)),
    ("Vue", re.compile(r"\bVue(?:\.js)?\b", re.IGNORECASE)),
    ("Angular", re.compile(r"\bAngular\b", re.IGNORECASE)),
    ("Java", re.compile(r"\bJava\b", re.IGNORECASE)),
    ("C#", re.compile(r"\bC#\b|\bCSharp\b", re.IGNORECASE)),
    ("Go", re.compile(r"\bGo\b|\bGolang\b", re.IGNORECASE)),
    ("Rust", re.compile(r"\bRust\b", re.IGNORECASE)),
    ("PHP", re.compile(r"\bPHP\b", re.IGNORECASE)),
    ("Ruby", re.compile(r"\bRuby\b", re.IGNORECASE)),
    ("SQL", re.compile(r"\bSQL\b", re.IGNORECASE)),
    ("Tailwind CSS", re.compile(r"\bTailwind(?: CSS)?\b", re.IGNORECASE)),
    ("GraphQL", re.compile(r"\bGraphQL\b", re.IGNORECASE)),
    ("MongoDB", re.compile(r"\bMongoDB\b", re.IGNORECASE)),
    ("PostgreSQL", re.compile(r"\bPostgreSQL\b|\bPostgres\b", re.IGNORECASE)),
    ("Redis", re.compile(r"\bRedis\b", re.IGNORECASE)),
    ("Supabase", re.compile(r"\bSupabase\b", re.IGNORECASE)),
    ("Prisma", re.compile(r"\bPrisma\b", re.IGNORECASE)),
    ("Express", re.compile(r"\bExpress(?:\.js)?\b", re.IGNORECASE)),
    ("Laravel", re.compile(r"\bLaravel\b", re.IGNORECASE)),
    (".NET", re.compile(r"\b\.NET\b|\bASP\.NET\b", re.IGNORECASE)),
    ("Flutter", re.compile(r"\bFlutter\b", re.IGNORECASE)),
    ("React Native", re.compile(r"\bReact Native\b", re.IGNORECASE)),
    ("Docker", re.compile(r"\bDocker\b", re.IGNORECASE)),
    ("Kubernetes", re.compile(r"\bKubernetes\b", re.IGNORECASE)),
    ("AWS", re.compile(r"\bAWS\b|\bAmazon Web Services\b", re.IGNORECASE)),
    ("GCP", re.compile(r"\bGCP\b|\bGoogle Cloud\b", re.IGNORECASE)),
    ("Azure", re.compile(r"\bAzure\b", re.IGNORECASE)),
    ("Svelte", re.compile(r"\bSvelte\b", re.IGNORECASE)),
    ("Remix", re.compile(r"\bRemix\b", re.IGNORECASE)),
    ("Astro", re.compile(r"\bAstro\b", re.IGNORECASE)),
    ("Nuxt", re.compile(r"\bNuxt\b", re.IGNORECASE)),
    ("Gatsby", re.compile(r"\bGatsby\b", re.IGNORECASE)),
    ("WebAssembly", re.compile(r"\bWebAssembly\b|\bWasm\b", re.IGNORECASE)),
    ("Kotlin", re.compile(r"\bKotlin\b", re.IGNORECASE)),
    ("Swift", re.compile(r"\bSwift\b", re.IGNORECASE)),
    ("MySQL", re.compile(r"\bMySQL\b", re.IGNORECASE)),
    ("Firebase", re.compile(r"\bFirebase\b", re.IGNORECASE)),
    ("SQLite", re.compile(r"\bSQLite\b", re.IGNORECASE)),
    ("Cassandra", re.compile(r"\bCassandra\b", re.IGNORECASE)),
    ("Elasticsearch", re.compile(r"\bElasticsearch\b", re.IGNORECASE)),
    ("Kafka", re.compile(r"\bKafka\b", re.IGNORECASE)),
    ("RabbitMQ", re.compile(r"\bRabbitMQ\b", re.IGNORECASE)),
    ("CI/CD", re.compile(r"\bCI/CD\b", re.IGNORECASE)),
    ("Git", re.compile(r"\bGit\b", re.IGNORECASE)),
    ("GitHub", re.compile(r"\bGitHub\b", re.IGNORECASE)),
    ("GitLab", re.compile(r"\bGitLab\b", re.IGNORECASE)),
]

URL_PATTERN = re.compile(r"https?://[^\s)\]}>,]+", re.IGNORECASE)

LINKEDIN_PATTERN = re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/[\w\-/]+", re.IGNORECASE)
GITHUB_PATTERN = re.compile(r"(?:https?://)?(?:www\.)?github\.com/[\w\-/]+", re.IGNORECASE)

MONTH_NAME_TO_NUMBER = {
    "jan": "01", "january": "01",
    "feb": "02", "february": "02",
    "mar": "03", "march": "03",
    "apr": "04", "april": "04",
    "may": "05",
    "jun": "06", "june": "06",
    "jul": "07", "july": "07",
    "aug": "08", "august": "08",
    "sep": "09", "sept": "09", "september": "09",
    "oct": "10", "october": "10",
    "nov": "11", "november": "11",
    "dec": "12", "december": "12",
    "ian": "01", "ianuarie": "01",
    "februarie": "02",
    "martie": "03",
    "aprilie": "04",
    "mai": "05",
    "iun": "06", "iunie": "06",
    "iul": "07", "iulie": "07",
    "august": "08",
    "septembrie": "09",
    "octombrie": "10",
    "noiembrie": "11",
    "decembrie": "12",
}

MONTH_TOKEN_PATTERN = (
    r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|"
    r"sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|"
    r"ian(?:uarie)?|februarie|martie|aprilie|mai|iun(?:ie)?|iul(?:ie)?|"
    r"august|septembrie|octombrie|noiembrie|decembrie)"
)

DATE_POINT_PATTERN = re.compile(
    rf"(?:(?:{MONTH_TOKEN_PATTERN})\s+)?\b\d{{4}}\b|\b(?:0?[1-9]|1[0-2])[/-]\d{{4}}\b|\b\d{{4}}[/-](?:0?[1-9]|1[0-2])\b",
    re.IGNORECASE,
)

DATE_RANGE_PATTERN = re.compile(
    rf"((?:(?:{MONTH_TOKEN_PATTERN})\s+)?\b\d{{4}}\b|\b(?:0?[1-9]|1[0-2])[/-]\d{{4}}\b|\b\d{{4}}[/-](?:0?[1-9]|1[0-2])\b)"
    r"\s*(?:-|–|—|to|until|till)\s*"
    rf"((?:(?:{MONTH_TOKEN_PATTERN})\s+)?\b\d{{4}}\b|\b(?:0?[1-9]|1[0-2])[/-]\d{{4}}\b|\b\d{{4}}[/-](?:0?[1-9]|1[0-2])\b|present|current|ongoing|now|prezent|acum)",
    re.IGNORECASE,
)


_MONTH_TOKEN_CLEAN = (
    r"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?"
    r"|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?"
    r"|Ian(?:uarie)?|Februarie|Martie|Aprilie|Iun(?:ie)?|Iul(?:ie)?"
    r"|August|Septembrie|Octombrie|Noiembrie|Decembrie)"
)
_DATE_RANGE_LEAD_RE = re.compile(
    rf"^\s*(?:(?:{_MONTH_TOKEN_CLEAN})\s+)?\d{{4}}\s*[-–—]\s*"
    rf"(?:(?:(?:{_MONTH_TOKEN_CLEAN})\s+)?\d{{4}}|Present|Current|Ongoing|Now|Prezent|Acum)\s*",
    re.IGNORECASE,
)


def strip_leading_date_range(text: Optional[str]) -> Optional[str]:
    """Remove a date range that LlamaParse sometimes prepends to description text."""
    if not isinstance(text, str) or not text.strip():
        return text
    cleaned = _DATE_RANGE_LEAD_RE.sub("", text).strip()
    return cleaned if cleaned else text


# Common role/title prefixes that LlamaParse sometimes leaves at the start of a project description.
# Examples: "Solo Founder Jan 2024 - Present Built ..." or "Lead Developer | 2022 - 2024 | Designed ..."
# Both `{1,80}?` and `{1,40}?` are LAZY so the lookahead anchors on the date prefix instead of
# greedily consuming month tokens like "Aug" into the role text.
_ROLE_PREFIX_RE = re.compile(
    r"^\s*([A-Z][\w &/+\-]{1,80}?(?:\s+(?:&|and)\s+[A-Z][\w &/+\-]{1,40}?)?)\s*"
    r"(?:[|\-\u2013\u2014:•·]\s*)?"
    r"(?=(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?"
    r"|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?"
    r"|Ian(?:uarie)?|Februarie|Martie|Aprilie|Iun(?:ie)?|Iul(?:ie)?|August|Septembrie|Octombrie|Noiembrie|Decembrie)"
    r"\s+\d{4}|\b\d{4}\b|\b\d{1,2}[/-]\d{4}\b))",
    re.IGNORECASE,
)

_LEADING_DATE_ANY_RE = re.compile(
    r"^\s*"
    r"(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?"
    r"|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?"
    r"|Ian(?:uarie)?|Februarie|Martie|Aprilie|Iun(?:ie)?|Iul(?:ie)?|August|Septembrie|Octombrie|Noiembrie|Decembrie)"
    r"\s+\d{4}|\b\d{4}\b|\b\d{1,2}[/-]\d{4}\b)"
    r"(?:\s*[\-\u2013\u2014]\s*"
    r"(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?"
    r"|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?"
    r"|Ian(?:uarie)?|Februarie|Martie|Aprilie|Iun(?:ie)?|Iul(?:ie)?|August|Septembrie|Octombrie|Noiembrie|Decembrie)"
    r"\s+\d{4}|\b\d{4}\b|\b\d{1,2}[/-]\d{4}\b|Present|Current|Ongoing|Now|Prezent|Acum))?",
    re.IGNORECASE,
)

# Words/tokens that strongly suggest the leading prefix is NOT a role title (e.g. it's
# the start of a regular sentence describing the project).
_NON_ROLE_LEADING_WORDS = {
    "the", "a", "an", "this", "we", "i", "developed", "built", "created", "designed",
    "engineered", "implemented", "launched", "deployed", "prototyped", "managed", "led",
    "coordinated", "founded", "co-founded", "shipped", "delivered", "responsible",
}


def extract_role_and_period_from_description(
    description: Optional[str],
) -> tuple[Optional[str], Optional[str], Optional[str], str]:
    """Pull a role/title and date range from the start of a project description.

    Returns (role, start_date_raw, end_date_raw, cleaned_description).

    LlamaParse occasionally produces descriptions like:
        "Solo Founder Jan 2024 - Present Designed and developed..."
        "Lead Developer | 2022 - 2024 | Built ..."
        "Coordinator & Co-Founder Aug 2025 - Present Founded ..."
    We isolate the role and dates so they can populate dedicated fields and the
    description renders cleanly.
    """
    if not isinstance(description, str) or not description.strip():
        return None, None, None, description or ""

    text = re.sub(r"\s+", " ", description.replace("\u2013", "-").replace("\u2014", "-")).strip()

    # Try to find a role + date range at the start of the description.
    role: Optional[str] = None
    remainder = text

    role_match = _ROLE_PREFIX_RE.match(text)
    if role_match:
        candidate = role_match.group(1).strip(" |-:")
        # Reject candidates that obviously start a sentence or are too short/long
        first_word = candidate.split()[0].lower() if candidate else ""
        if (
            candidate
            and 2 <= len(candidate) <= 80
            and first_word not in _NON_ROLE_LEADING_WORDS
            # Avoid grabbing a leading date as "role"
            and not re.match(r"^\d{4}", candidate)
        ):
            role = candidate
            remainder = text[role_match.end():].lstrip(" |-:\u2013\u2014")

    # Now look for a leading date range in whatever comes next.
    start_raw: Optional[str] = None
    end_raw: Optional[str] = None
    range_match = DATE_RANGE_PATTERN.match(remainder)
    point_match = None if range_match else _LEADING_DATE_ANY_RE.match(remainder)

    if range_match:
        start_raw = range_match.group(1)
        end_raw = range_match.group(2)
        remainder = remainder[range_match.end():]
    elif point_match and point_match.group(0).strip():
        # A single leading date with no range partner (e.g. "Jan 2024 Built ...").
        start_raw = point_match.group(0).strip()
        remainder = remainder[point_match.end():]

    cleaned = remainder.lstrip(" |-:\u2013\u2014.,;").strip()
    if not cleaned:
        cleaned = text  # fall back to original if stripping consumed everything

    return role, start_raw, end_raw, cleaned


def looks_like_project_entry(entry: dict, verbose: bool = False) -> bool:
    header_text = " ".join(
        str(value)
        for value in (
            entry.get("name"),
            entry.get("title"),
            entry.get("company"),
            entry.get("role"),
        )
        if isinstance(value, str) and value.strip()
    )
    description_text = entry.get("description") if isinstance(entry.get("description"), str) else ""
    
    entry_name = entry.get("name") or entry.get("title") or entry.get("company") or "unknown"

    # If header explicitly mentions projects, it's a project
    if header_text and PROJECT_SECTION_PATTERN.search(header_text):
        if verbose:
            logger.info(f"    -> YES (header mentions project): '{entry_name}'")
        return True

    # If this entry looks like a full work experience (company + role) and has dates,
    # prefer keeping it as work_experience to avoid false positives.
    has_company = bool(entry.get("company") and isinstance(entry.get("company"), str) and entry.get("company").strip())
    has_role = bool(entry.get("role") and isinstance(entry.get("role"), str) and entry.get("role").strip())
    has_dates = bool(entry.get("start_date") or entry.get("end_date"))
    if has_company and has_role and has_dates:
        if verbose:
            logger.info(f"    -> NO (full work exp): '{entry_name}' (company={has_company}, role={has_role}, dates={has_dates})")
        return False

    # Candidate text for signals
    candidate_text = " ".join(filter(None, [header_text, description_text]))
    if not candidate_text.strip():
        if verbose:
            logger.info(f"    -> NO (no text): '{entry_name}'")
        return False

    # If description explicitly mentions projects keywords and we also detect technologies or a URL,
    # treat as a project entry.
    if PROJECT_SECTION_PATTERN.search(description_text):
        has_url = bool(extract_url(candidate_text))
        has_tech = bool(extract_technologies(candidate_text))
        has_verbs = has_project_verbs(candidate_text)
        result = has_url or has_tech or has_verbs
        if verbose:
            logger.info(f"    -> {'YES' if result else 'NO'} (desc mentions projects, url={has_url}, tech={has_tech}, verbs={has_verbs}): '{entry_name}'")
        return result

    # If description contains strong project verbs (built, developed, prototype) and we detect
    # technologies or a URL, consider it a project.
    has_verbs = has_project_verbs(candidate_text)
    has_url = bool(extract_url(candidate_text))
    has_tech = bool(extract_technologies(candidate_text))
    if has_verbs and (has_url or has_tech):
        if verbose:
            logger.info(f"    -> YES (verbs + tech/url): '{entry_name}' (verbs={has_verbs}, url={has_url}, tech={has_tech})")
        return True

    if verbose:
        logger.info(f"    -> NO (no signals): '{entry_name}'")
    return False


def has_project_verbs(text: Optional[str]) -> bool:
    if not isinstance(text, str) or not text.strip():
        return False
    verbs = [
        r"\bbuilt\b",
        r"\bdeveloped\b", 
        r"\bimplemented\b",
        r"\bprototyped\b",
        r"\bprototype\b",
        r"\bcreated\b",
        r"\bdesigned\b",
        r"\bdeployed\b",
        r"\bsubmitted\b",
        r"\bportfolio\b",
        r"\bconstructed\b",
        r"\bengineered\b",
        r"\barchitected\b",
        r"\bfabricated\b",
        r"\bforged\b",
        r"\blaunch\b",
        r"\blaunched\b",
        r"\breleased\b",
        r"\bbuild\b",
    ]
    combined = re.compile("|".join(verbs), re.IGNORECASE)
    return bool(combined.search(text))


def extract_technologies(text: Optional[str]) -> list[str]:
    if not isinstance(text, str) or not text.strip():
        return []

    technologies: list[str] = []
    for label, pattern in TECHNOLOGY_PATTERNS:
        if pattern.search(text):
            technologies.append(label)
    return technologies


def extract_url(text: Optional[str]) -> Optional[str]:
    if not isinstance(text, str) or not text.strip():
        return None

    match = URL_PATTERN.search(text)
    if not match:
        return None

    return match.group(0).rstrip(".,;:")


def normalize_project_entry(entry: dict) -> Project:
    raw_description = next(
        (
            str(value).strip()
            for value in (entry.get("description"), entry.get("summary"))
            if isinstance(value, str) and value.strip()
        ),
        None,
    )
    description = strip_leading_date_range(raw_description)
    name = next(
        (
            str(value).strip()
            for value in (entry.get("name"), entry.get("title"), entry.get("role"), entry.get("company"))
            if isinstance(value, str) and value.strip()
        ),
        None,
    )

    explicit_role = entry.get("role") if isinstance(entry.get("role"), str) else None
    if explicit_role and explicit_role.strip().lower() == (name or "").strip().lower():
        # If LlamaParse stuffed the project name into role too, drop the role.
        explicit_role = None

    # Pull a role/title and a date range out of the leading section of the description.
    inline_role, inline_start_raw, inline_end_raw, cleaned_description = (
        extract_role_and_period_from_description(description)
    )

    # Prefer the inline role only when no explicit role is set or it duplicates the name.
    role = (explicit_role or "").strip() or (inline_role or None)
    description = cleaned_description or description

    project_text = " ".join(
        value
        for value in [
            name or "",
            description or "",
            str(entry.get("company")).strip() if isinstance(entry.get("company"), str) else "",
            role or "",
        ]
        if value
    )

    url = entry.get("url") if isinstance(entry.get("url"), str) else None
    if not url:
        url = extract_url(project_text)

    def to_mmm_yyyy(value: Optional[str]) -> Optional[str]:
        normalized = normalize_date(value)
        if not normalized:
            return None
        if normalized == "Present":
            return "Present"
        m = re.match(r"^(\d{4})-(\d{2})$", normalized)
        if not m:
            return None
        year, month = m.groups()
        month_idx = int(month) - 1
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        if month_idx < 0 or month_idx >= len(month_names):
            return None
        return f"{month_names[month_idx]} {year}"

    explicit_start = entry.get("start_date") if isinstance(entry.get("start_date"), str) else None
    if not explicit_start:
        explicit_start = date_from_month_year_fields(entry.get("start_month"), entry.get("start_year"))

    explicit_end = entry.get("end_date") if isinstance(entry.get("end_date"), str) else None
    if not explicit_end:
        if normalize_truthy_flag(entry.get("is_current")):
            explicit_end = "Present"
        else:
            explicit_end = date_from_month_year_fields(entry.get("end_month"), entry.get("end_year"))
    inferred_start, inferred_end = extract_date_range(project_text)

    # Date precedence: inline dates extracted from the description prefix (literal source text)
    # take priority over LlamaParse's explicit fields, which are sometimes hallucinated (e.g. a
    # bogus year like 1950). Fall back to explicit, then to a wider full-text inference.
    chosen_start = inline_start_raw or explicit_start or inferred_start
    chosen_end = inline_end_raw or explicit_end or inferred_end
    raw_start = normalize_date(chosen_start)
    raw_end = normalize_date(chosen_end)
    project_start_date = to_mmm_yyyy(chosen_start)
    project_end_date = to_mmm_yyyy(chosen_end)
    s_year, s_month = date_to_parts(raw_start)
    e_year, e_month = date_to_parts(raw_end)

    bullets = normalize_bullets(entry.get("bullets") if isinstance(entry.get("bullets"), list) else None, description)

    return Project(
        name=name or "Project",
        role=role or None,
        description=description,
        bullets=bullets,
        technologies=extract_technologies(project_text),
        url=url,
        start_date=project_start_date,
        end_date=project_end_date,
        start_year=s_year,
        start_month=s_month,
        end_year=e_year,
        end_month=e_month,
    )


def strip_markdown_formatting(text: str) -> str:
    cleaned = text.strip()
    cleaned = re.sub(r"^#{1,6}\s*", "", cleaned)
    cleaned = re.sub(r"^[-*•]\s*", "", cleaned)
    cleaned = re.sub(r"^\*\*(.+?)\*\*$", r"\1", cleaned)
    cleaned = re.sub(r"^__(.+?)__$", r"\1", cleaned)
    return cleaned.strip().rstrip(":")


def is_section_heading(line: str) -> bool:
    cleaned = strip_markdown_formatting(line)
    if not cleaned:
        return False
    if len(cleaned) > 80:
        return False
    if SECTION_HEADING_PATTERN.match(line.strip()):
        return True
    if cleaned.isupper() and len(cleaned.split()) <= 4:
        return True
    return False


def is_project_title_line(line: str) -> bool:
    cleaned = strip_markdown_formatting(line)
    if not cleaned:
        return False
    if extract_url(cleaned) or re.search(r"\d{4}", cleaned):
        return False
    if cleaned.endswith(":") or cleaned.endswith("."):
        return False
    if len(cleaned) > 120:
        return False
    words = cleaned.split()
    return 1 <= len(words) <= 10 and bool(re.match(r"^[A-Z0-9].*", cleaned))


def split_project_blocks(section_text: str) -> list[str]:
    blocks = [block.strip() for block in re.split(r"\n\s*\n", section_text) if block.strip()]
    if blocks:
        return blocks

    return [section_text.strip()] if section_text.strip() else []


def parse_project_block(block: str) -> Optional[dict]:
    lines = [line.strip() for line in block.splitlines() if line.strip()]
    if not lines:
        return None

    title_index = 0
    for index, line in enumerate(lines):
        if is_project_title_line(line):
            title_index = index
            break

    title = strip_markdown_formatting(lines[title_index])
    description_lines = [strip_markdown_formatting(line) for i, line in enumerate(lines) if i != title_index]
    description = "\n".join(line for line in description_lines if line and not is_section_heading(line)).strip()

    if not title:
        title = "Project"

    role, start_raw, end_raw, cleaned_description = extract_role_and_period_from_description(description)
    if cleaned_description:
        description = cleaned_description

    project_text = f"{title} {description} {block}"
    technologies = extract_technologies(project_text)
    url = extract_url(project_text)

    return {
        "name": title,
        "role": role,
        "description": description or None,
        "technologies": technologies,
        "url": url,
        "start_date": start_raw,
        "end_date": end_raw,
    }


def extract_projects_from_text(text: str) -> list[dict]:
    if not isinstance(text, str) or not text.strip():
        return []

    lines = text.splitlines()
    projects: list[dict] = []
    current_section_lines: list[str] = []
    in_project_section = False

    for raw_line in lines:
        line = raw_line.rstrip()
        if is_section_heading(line):
            heading = strip_markdown_formatting(line)
            if PROJECT_SECTION_PATTERN.search(heading):
                in_project_section = True
                current_section_lines = []
                continue

            if in_project_section:
                break

        if in_project_section:
            current_section_lines.append(line)

    section_text = "\n".join(current_section_lines).strip()
    if not section_text:
        return []

    for block in split_project_blocks(section_text):
        project = parse_project_block(block)
        if project:
            projects.append(project)

    return projects


def dedupe_project_entries(project_entries: list[dict]) -> list[dict]:
    unique_projects: list[dict] = []
    seen_signatures: set[tuple[str, str, str]] = set()
    seen_name_description_pairs: set[tuple[str, str]] = set()

    for entry in project_entries:
        raw_name = str(entry.get("name") or "").strip()
        # Fallback text parsing can add right-aligned location/mode fragments after long spaces.
        cleaned_name = re.sub(r"\s{2,}.*$", "", raw_name).strip()
        name = re.sub(r"\s+", " ", cleaned_name).strip().lower()

        raw_description = str(entry.get("description") or "").strip().lower()
        description = re.sub(r"\s+", " ", raw_description).strip()
        description_key = description[:200]

        url = str(entry.get("url") or "").strip().lower()
        signature = (name, description_key, url)
        name_description_signature = (name, description_key)

        if signature in seen_signatures or name_description_signature in seen_name_description_pairs:
            continue

        # Fallback + explicit extraction can produce duplicate projects with the same name.
        # Merge these when URL does not clearly differentiate them, preferring longer description.
        merged_existing = False
        if name:
            for existing in unique_projects:
                existing_name_raw = str(existing.get("name") or "").strip()
                existing_name = re.sub(r"\s{2,}.*$", "", existing_name_raw).strip().lower()
                if existing_name != name:
                    continue

                existing_url = str(existing.get("url") or "").strip().lower()
                if existing_url and url and existing_url != url:
                    continue

                existing_description = re.sub(
                    r"\s+",
                    " ",
                    str(existing.get("description") or "").strip()
                ).strip()
                candidate_description = re.sub(
                    r"\s+",
                    " ",
                    str(entry.get("description") or "").strip()
                ).strip()

                if len(candidate_description) > len(existing_description):
                    existing["description"] = entry.get("description")
                if not existing.get("url") and entry.get("url"):
                    existing["url"] = entry.get("url")

                existing_tech = existing.get("technologies") if isinstance(existing.get("technologies"), list) else []
                candidate_tech = entry.get("technologies") if isinstance(entry.get("technologies"), list) else []
                existing["technologies"] = sorted(
                    {
                        str(t).strip()
                        for t in [*existing_tech, *candidate_tech]
                        if isinstance(t, str) and str(t).strip()
                    }
                )
                merged_existing = True
                break

        if merged_existing:
            continue

        seen_signatures.add(signature)
        seen_name_description_pairs.add(name_description_signature)
        if cleaned_name:
            entry["name"] = cleaned_name
        unique_projects.append(entry)

    return unique_projects


def normalize_signature_value(value: Optional[str]) -> str:
    if not isinstance(value, str):
        return ""
    normalized = strip_markdown_formatting(value)
    normalized = re.sub(r"\s+", " ", normalized).strip().lower()
    return normalized


def should_promote_work_entry_to_project(entry: dict, fallback_project_names: set[str]) -> bool:
    if not isinstance(entry, dict) or not fallback_project_names:
        return False

    company_name = normalize_signature_value(entry.get("company"))
    if not company_name or company_name not in fallback_project_names:
        return False

    candidate_text = " ".join(
        str(value).strip()
        for value in (
            entry.get("company"),
            entry.get("role"),
            entry.get("description"),
        )
        if isinstance(value, str) and value.strip()
    )
    if not candidate_text:
        return False

    return (
        has_project_verbs(candidate_text)
        or bool(extract_technologies(candidate_text))
        or bool(extract_url(candidate_text))
    )


def extract_linkedin(text: Optional[str]) -> Optional[str]:
    if not isinstance(text, str) or not text.strip():
        return None
    m = LINKEDIN_PATTERN.search(text)
    if not m:
        return None
    value = m.group(0).rstrip('.,;:')
    if not value.lower().startswith("http"):
        value = f"https://{value}"
    return value


def extract_github(text: Optional[str]) -> Optional[str]:
    if not isinstance(text, str) or not text.strip():
        return None
    m = GITHUB_PATTERN.search(text)
    if not m:
        return None
    value = m.group(0).rstrip('.,;:')
    if not value.lower().startswith("http"):
        value = f"https://{value}"
    return value


def normalize_date(date_str: Optional[str]) -> Optional[str]:
    """Normalize date strings to YYYY-MM format when possible."""
    if not isinstance(date_str, str) or not date_str.strip():
        return None
    date_str = date_str.strip()
    normalized_input = re.sub(r"\s+", " ", date_str.replace("–", "-").replace("—", "-")).strip()

    # Keep "present/current" semantics in a consistent label for UI mapping.
    if re.search(r"\b(present|current|ongoing|now|acum|prezent)\b", normalized_input, re.IGNORECASE):
        return "Present"

    # Already in good format
    if re.match(r'^\d{4}-\d{2}$', normalized_input):
        return normalized_input

    # Handle compact MM/YYYY or M/YYYY
    m = re.search(r"\b(\d{1,2})[/-](\d{4})\b", normalized_input)
    if m:
        month, year = m.groups()
        return f"{year}-{month.zfill(2)}"

    # Try to extract year-month
    m = re.search(r'(\d{4})[/-](\d{1,2})', normalized_input)
    if m:
        year, month = m.groups()
        return f"{year}-{month.zfill(2)}"

    # Handle textual month formats: "Jan 2024", "Ianuarie 2024"
    m = re.search(r"\b([A-Za-zăâîșț\.]+)\s+(\d{4})\b", normalized_input, re.IGNORECASE)
    if m:
        month_token = m.group(1).lower().rstrip(".")
        year = m.group(2)
        month = MONTH_NAME_TO_NUMBER.get(month_token)
        if month:
            return f"{year}-{month}"

    # Handle reversed textual format: "2024 Jan"
    m = re.search(r"\b(\d{4})\s+([A-Za-zăâîșț\.]+)\b", normalized_input, re.IGNORECASE)
    if m:
        year = m.group(1)
        month_token = m.group(2).lower().rstrip(".")
        month = MONTH_NAME_TO_NUMBER.get(month_token)
        if month:
            return f"{year}-{month}"

    # Try to extract just year
    m = re.search(r'(\d{4})', normalized_input)
    if m:
        return m.group(1)
    return normalized_input


def date_to_parts(normalized: Optional[str]) -> tuple[Optional[int], Optional[int]]:
    """Convert normalized date string to (year, month) integers.

    Returns (year, month) for 'YYYY-MM', (year, None) for year-only, (None, None) for None/Present.
    """
    if not normalized or normalized == "Present":
        return None, None
    m = re.match(r'^(\d{4})-(\d{2})$', normalized)
    if m:
        return int(m.group(1)), int(m.group(2))
    m = re.match(r'^(\d{4})$', normalized)
    if m:
        return int(m.group(1)), None
    return None, None


def normalize_truthy_flag(value: object) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "y"}
    if isinstance(value, (int, float)):
        return value == 1
    return False


def coerce_int(value: object) -> Optional[int]:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float) and value.is_integer():
        return int(value)
    if isinstance(value, str):
        cleaned = value.strip()
        if cleaned.isdigit():
            return int(cleaned)
    return None


def normalize_month_year_fields(month_value: object, year_value: object) -> tuple[Optional[int], Optional[int]]:
    year = coerce_int(year_value)
    month = coerce_int(month_value)

    if year is None:
        return None, None
    if month is not None and 1 <= month <= 12:
        return year, month
    return year, None


def date_from_month_year_fields(month_value: object, year_value: object) -> Optional[str]:
    year, month = normalize_month_year_fields(month_value, year_value)
    if year is None:
        return None
    if month is None:
        return str(year)
    return f"{year}-{str(month).zfill(2)}"


_INLINE_BULLET_RE = re.compile(
    r'\s*[•·▸▶▪◦▷◆◇■□●○➤➢→✓✔★❖⁃]\s+'
)
_NUMBERED_ITEM_RE = re.compile(r'(?<!\d)\d{1,2}[.)]\s+')

def split_merged_bullets(text: str) -> list[str]:
    """Split a potentially merged bullet string into individual bullet points."""
    if not text.strip():
        return []

    # Split on inline bullet characters (e.g. "• Built X • Improved Y")
    parts = _INLINE_BULLET_RE.split(text)
    if len(parts) > 1:
        return [p.strip() for p in parts if p.strip()]

    # Split on newlines (LlamaParse sometimes uses \n between bullets in one string)
    parts = [p.strip() for p in text.split('\n') if p.strip()]
    if len(parts) > 1:
        # Strip leading bullet chars from each line
        return [re.sub(r'^[•·▸▶\-\*]\s*', '', p).strip() for p in parts if p.strip()]

    # Split on numbered list embedded in string (e.g. "1. Built X 2. Improved Y")
    parts = _NUMBERED_ITEM_RE.split(text)
    if len(parts) > 1:
        return [p.strip() for p in parts if p.strip()]

    return [text.strip()]


def extract_date_range(text: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    if not isinstance(text, str) or not text.strip():
        return None, None

    candidate = re.sub(r"\s+", " ", text.replace("—", "-").replace("–", "-")).strip()
    m = DATE_RANGE_PATTERN.search(candidate)
    if m:
        return normalize_date(m.group(1)), normalize_date(m.group(2))

    date_points = [normalize_date(item) for item in DATE_POINT_PATTERN.findall(candidate)]
    date_points = [item for item in date_points if item]
    if len(date_points) >= 2:
        return date_points[0], date_points[1]
    if len(date_points) == 1:
        return date_points[0], "Present" if re.search(r"\b(present|current|ongoing|now|prezent|acum)\b", candidate, re.IGNORECASE) else None

    return None, None


def enrich_work_experience_dates(work_exp_entries: list[dict], raw_text: str) -> list[dict]:
    if not isinstance(raw_text, str):
        raw_text = ""

    raw_lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    enriched: list[dict] = []

    for entry in work_exp_entries:
        if not isinstance(entry, dict):
            continue

        current = dict(entry)
        start = normalize_date(current.get("start_date"))
        if not start:
            start = date_from_month_year_fields(current.get("start_month"), current.get("start_year"))

        end = normalize_date(current.get("end_date"))
        if not end:
            if normalize_truthy_flag(current.get("is_current")):
                end = "Present"
            else:
                end = date_from_month_year_fields(current.get("end_month"), current.get("end_year"))

        if start and end:
            current["start_date"] = start
            current["end_date"] = end
            enriched.append(current)
            continue

        # First-pass: infer from entry-local text
        local_text = " ".join(
            str(value).strip()
            for value in (
                current.get("role"),
                current.get("company"),
                current.get("description"),
            )
            if isinstance(value, str) and value.strip()
        )
        inferred_start, inferred_end = extract_date_range(local_text)

        # Second-pass: if still missing, scan matching lines from raw parse text
        if not (inferred_start or inferred_end):
            anchors = [
                str(current.get("company") or "").strip().lower(),
                str(current.get("role") or "").strip().lower(),
            ]
            anchors = [item for item in anchors if item]
            if anchors:
                for line in raw_lines:
                    lower_line = line.lower()
                    if any(anchor and anchor in lower_line for anchor in anchors):
                        inferred_start, inferred_end = extract_date_range(line)
                        if inferred_start or inferred_end:
                            break

        current["start_date"] = start or inferred_start
        current["end_date"] = end or inferred_end
        enriched.append(current)

    return enriched


def normalize_company_name(company: Optional[str]) -> Optional[str]:
    """Clean up company name by removing common suffixes and extra whitespace."""
    if not isinstance(company, str) or not company.strip():
        return None
    company = company.strip()
    # Remove common suffixes
    company = re.sub(r'\s+(Inc\.|LLC|Ltd\.|Corp\.|Co\.|Ltd|Inc|Corporation|Company|Inc\.|GMBH|GmbH)\s*$', '', company, flags=re.IGNORECASE)
    # Remove extra whitespace
    company = re.sub(r'\s+', ' ', company).strip()
    return company if company else None


_BULLET_PREFIX_RE = re.compile(r"^[•·▸▶▪◦▷◆◇■□●○➤➢→✓✔★❖⁃\-\*]\s*")
_TRAILING_PUNCT = " .,;:"


def _strip_trailing_punct(value: str) -> str:
    return value.rstrip(_TRAILING_PUNCT).strip()


def _recover_missing_first_bullet(description: str, bullets: list[str]) -> list[str]:
    """LlamaParse + LLM extraction occasionally drops the first source bullet
    into the role's ``description`` field while keeping the rest in
    ``bullets``. We recover that achievement so the builder/PDF render every
    bullet from the source CV.

    Two recovery paths:

    1. Description CONTAINS ``bullets[0]`` as a substring (the LLM concatenated
       every bullet into description). The prefix that comes before the first
       known bullet is the missing achievement.
    2. Description is a short, single-line statement disjoint from every
       existing bullet. The description itself is the missing first bullet.

    A multi-line or long-prose description is treated as a real summary and
    left untouched.
    """

    if not description or not bullets:
        return bullets

    desc = description.strip()
    if not desc:
        return bullets

    first = _strip_trailing_punct(bullets[0])
    if not first:
        return bullets

    existing_norms = {_strip_trailing_punct(b) for b in bullets}

    # Path 1: bullets[0] appears inside the description.
    idx = desc.find(first)
    if idx > 0:
        prefix = _strip_trailing_punct(desc[:idx])
        if prefix and prefix not in existing_norms:
            return [prefix] + list(bullets)

    # Path 2: description is a single-line standalone bullet.
    if "\n" not in desc and len(desc) <= 600:
        desc_norm = _strip_trailing_punct(desc)
        if desc_norm and desc_norm not in existing_norms:
            already_inside = any(
                desc_norm in b or _strip_trailing_punct(b) in desc_norm for b in bullets
            )
            if not already_inside:
                return [desc_norm] + list(bullets)

    return bullets


def normalize_bullets(bullets: Optional[list[str]], description: Optional[str]) -> list[str]:
    normalized: list[str] = []
    if isinstance(bullets, list):
        for item in bullets:
            if isinstance(item, str):
                cleaned = item.strip()
                if not cleaned:
                    continue
                split_items = split_merged_bullets(cleaned)
                for split_item in split_items:
                    bullet = _BULLET_PREFIX_RE.sub("", split_item.strip())
                    if bullet:
                        normalized.append(bullet)

    if normalized:
        # Recover a missing first bullet that the LLM mis-routed into description.
        if isinstance(description, str) and description.strip():
            normalized = _recover_missing_first_bullet(description.strip(), normalized)
        return normalized

    if isinstance(description, str) and description.strip():
        split_items = split_merged_bullets(description.strip())
        cleaned_parts = [
            _BULLET_PREFIX_RE.sub("", part.strip())
            for part in split_items
            if part.strip()
        ]
        cleaned_parts = [part for part in cleaned_parts if part]
        if cleaned_parts:
            return cleaned_parts

    return []


api_key = os.getenv("LLAMA_CLOUD_API_KEY")
if not api_key:
    raise ValueError("LLAMA_CLOUD_API_KEY environment variable not set")

parser = LlamaParse(
    api_key=api_key,
    result_type="markdown",
    parsing_instruction=(
        "You are a resume parser. Extract all information from this CV/resume and return a valid JSON object with these fields:\n"
        "- full_name (string)\n"
        "- email (string)\n"
        "- phone (string)\n"
        "- location (string)\n"
        "- linkedin (string, URL if present)\n"
        "- github (string, URL if present)\n"
        "- summary (string)\n"
        "- projects (array of: name, role, description, bullets, technologies, url, start_date, end_date, start_month, start_year, end_month, end_year)\n"
        "- work_experience (array of: company, role, start_date, end_date, start_month, start_year, end_month, end_year, is_current, description, bullets)\n"
        "- education (array of: institution, degree, field, start_date, end_date, start_month, start_year, end_month, end_year)\n"
        "- skills (array of strings)\n"
        "- languages (array of: language, level)\n"
        "- certifications (array of strings)\n"
        "\n"
        "DISTINCTION:\n"
        "- PROJECTS: Stand-alone work items (personal, academic, side projects). Usually have: name/title, description, technologies list, optional URL/GitHub link. NO company name.\n"
        "- WORK_EXPERIENCE: Employment at a company. Must have: company name, job title/role, dates, description of responsibilities/achievements.\n"
        "\n"
        "CRITICAL EXTRACTION RULES:\n"
        "1. Look for 'Projects', 'Personal Projects', 'Side Projects', 'Academic Projects', 'Featured Projects', 'Project Work', 'Portfolio' sections - place these in projects array.\n"
        "2. Each project MUST have: name (the project title only, e.g. 'Joben'), role (your role/title on the project, e.g. 'Solo Founder', 'Lead Developer' - distinct from name), description (full prose describing what was built/created), bullets (array of separate achievement points), technologies (list of tech stack used), url (if present, e.g., GitHub link), start_date and end_date.\n"
        "3. NEVER concatenate role, dates, and description into a single 'description' string. Always populate role, start_date, end_date as their own fields and keep description focused on the work itself.\n"
        "4. Work experience entries must have a company name. If an entry only has a project title, description, and technologies without a company context, it is a project.\n"
        "5. Extract FULL text - do not summarize, truncate, or abbreviate descriptions, summaries, or role descriptions.\n"
        "6. Extract linkedin and github URLs if found anywhere in the resume.\n"
        "7. For work_experience, education AND projects dates, preserve month+year whenever present (do NOT reduce to year-only). Accept forms like 'Jan 2024', 'January 2024', '01/2024', '2024-01', Romanian month names, and 'Present/Current'. NEVER invent or default to 1950 or any other placeholder year - leave dates null when unknown.\n"
        "8. If a section title is in Romanian (e.g. 'Proiecte', 'Experienta', 'Experiență', 'Educatie', 'Educație'), map it to the correct JSON field.\n"
        "9. Do not place project entries in work_experience when they come from Projects/Portfolio sections, even if they include date ranges.\n"
        "10. For every work_experience item, capture role/company/date range exactly from source lines before writing description.\n"
        "11. For work_experience and projects, output bullets as an array of separate achievement points. Preserve every source bullet verbatim and in original order (do NOT summarize, merge, rewrite, or drop bullets). EVERY achievement bullet from the source MUST appear in the bullets array, including the first one.\n"
        "11a. The 'description' field is for a separate prose summary that introduces the role and is distinct from the bullet achievements. If the source only has achievement bullets and no separate prose intro, set description to null. NEVER copy a bullet (or any prefix of the bullet list) into description while leaving it out of the bullets array.\n"
        "12. Always populate start_month/start_year/end_month/end_year for work_experience, projects, and education when inferable from source text. Use integers; use null when unknown.\n"
        "13. Return only valid JSON, no markdown code blocks, no extra text.\n"
    ),
    cost_optimizer="true",
)

text_parser = LlamaParse(
    api_key=api_key,
    result_type="text",
    parsing_instruction=(
        "Extract the resume text as faithfully as possible. Preserve headings, bullet lists, URLs, project names, and section boundaries. "
        "Do not summarize or rewrite the content."
    ),
    cost_optimizer="true",
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/parse")
async def parse_resume(
    file: UploadFile = File(...),
    _auth: None = Depends(require_parser_secret),
):
    file_extension = os.path.splitext(file.filename or "")[1].lower()
    if file_extension not in {".pdf", ".docx"}:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and DOCX files are allowed.")

    content = await file.read()

    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 5MB.")

    try:
        logger.info(f"Parsing file: {file.filename}")
        documents = await parser.aload_data(
            io.BytesIO(content),
            extra_info={"file_name": file.filename},
        )

        raw_text = documents[0].text if documents else ""
        parsed_text = raw_text

        m = re.search(r"```json\s*(.*?)\s*```", parsed_text, re.DOTALL)
        if m:
            parsed_text = m.group(1)
        else:
            m = re.search(r"```\s*(.*?)\s*```", parsed_text, re.DOTALL)
            if m:
                parsed_text = m.group(1)

        resume_data = json.loads(parsed_text.strip())

        # DEBUG: Log what keys we got from LlamaParse
        logger.info(f"LlamaParse returned keys: {list(resume_data.keys())}")
        logger.info(f"Projects from LlamaParse: {resume_data.get('projects', [])}")
        logger.info(f"Work experience count: {len(resume_data.get('work_experience', []))}")

        # try to extract LinkedIn/GitHub from explicit fields or from parser text outputs
        linkedin_val = resume_data.get("linkedin") if isinstance(resume_data.get("linkedin"), str) else None
        github_val = resume_data.get("github") if isinstance(resume_data.get("github"), str) else None

        normalized_linkedin = extract_linkedin(linkedin_val)
        normalized_github = extract_github(github_val)

        if normalized_linkedin:
            linkedin_val = normalized_linkedin
        else:
            discovered_linkedin = extract_linkedin(parsed_text) or extract_linkedin(raw_text)
            if discovered_linkedin:
                linkedin_val = discovered_linkedin

        if normalized_github:
            github_val = normalized_github
        else:
            discovered_github = extract_github(parsed_text) or extract_github(raw_text)
            if discovered_github:
                github_val = discovered_github

        # DEBUG: Log project classification
        explicit_projects = [p for p in (resume_data.get("projects") or []) if isinstance(p, dict)]

        fallback_project_entries = extract_projects_from_text(raw_text)
        if not fallback_project_entries:
            try:
                fallback_documents = await text_parser.aload_data(
                    io.BytesIO(content),
                    extra_info={"file_name": file.filename, "mode": "text_fallback"},
                )
                fallback_text = fallback_documents[0].text if fallback_documents else ""
                fallback_project_entries = extract_projects_from_text(fallback_text)
            except Exception as fallback_error:
                logger.warning(f"Text fallback parser failed: {fallback_error}")
        
        fallback_project_names = {
            normalize_signature_value(project.get("name"))
            for project in fallback_project_entries
            if isinstance(project, dict) and normalize_signature_value(project.get("name"))
        }

        # Pre-classify work_experience entries with verbose logging
        work_exp_entries = enrich_work_experience_dates(resume_data.get("work_experience") or [], raw_text)
        work_exp_classifications = {}
        for i, exp in enumerate(work_exp_entries):
            if isinstance(exp, dict):
                is_proj = looks_like_project_entry(exp, verbose=True)
                if not is_proj and should_promote_work_entry_to_project(exp, fallback_project_names):
                    logger.info(
                        "    -> YES (fallback project section match): '%s'",
                        exp.get("company") or exp.get("role") or "unknown",
                    )
                    is_proj = True
                work_exp_classifications[i] = is_proj
        
        classified_as_projects = sum(1 for is_proj in work_exp_classifications.values() if is_proj)
        logger.info(f"Explicit projects from LlamaParse: {len(explicit_projects)}")
        logger.info(f"Work exp entries classified as projects: {classified_as_projects}")
        logger.info(f"Fallback projects extracted from raw text: {len(fallback_project_entries)}")

        project_entries = dedupe_project_entries(
            explicit_projects
            + [normalize_project_entry(exp).model_dump() for i, exp in enumerate(work_exp_entries) if isinstance(exp, dict) and work_exp_classifications.get(i, False)]
            + fallback_project_entries
        )

        def _build_work_experience() -> list[WorkExperience]:
            entries = []
            for i, exp in enumerate(work_exp_entries):
                if not isinstance(exp, dict) or work_exp_classifications.get(i, False):
                    continue
                nd_start = normalize_date(exp.get("start_date"))
                if not nd_start:
                    nd_start = date_from_month_year_fields(exp.get("start_month"), exp.get("start_year"))

                nd_end = normalize_date(exp.get("end_date"))
                if not nd_end:
                    if normalize_truthy_flag(exp.get("is_current")):
                        nd_end = "Present"
                    else:
                        nd_end = date_from_month_year_fields(exp.get("end_month"), exp.get("end_year"))

                s_year, s_month = normalize_month_year_fields(exp.get("start_month"), exp.get("start_year"))
                e_year, e_month = normalize_month_year_fields(exp.get("end_month"), exp.get("end_year"))
                if s_year is None and nd_start:
                    s_year, s_month = date_to_parts(nd_start)
                if e_year is None and nd_end:
                    e_year, e_month = date_to_parts(nd_end)
                raw_desc = strip_leading_date_range(exp.get("description"))
                entries.append(WorkExperience(
                    company=normalize_company_name(exp.get("company")),
                    role=exp.get("role"),
                    start_date=nd_start,
                    end_date=nd_end,
                    start_year=s_year,
                    start_month=s_month,
                    end_year=e_year,
                    end_month=e_month,
                    is_current=nd_end == "Present",
                    description=raw_desc,
                    bullets=normalize_bullets(exp.get("bullets"), raw_desc),
                ))
            return entries

        def _build_education() -> list[Education]:
            entries = []
            for exp in (resume_data.get("education") or []):
                if not isinstance(exp, dict):
                    continue

                nd_start = normalize_date(exp.get("start_date"))
                if not nd_start:
                    nd_start = date_from_month_year_fields(exp.get("start_month"), exp.get("start_year"))

                nd_end = normalize_date(exp.get("end_date"))
                if not nd_end:
                    nd_end = date_from_month_year_fields(exp.get("end_month"), exp.get("end_year"))

                s_year, s_month = normalize_month_year_fields(exp.get("start_month"), exp.get("start_year"))
                e_year, e_month = normalize_month_year_fields(exp.get("end_month"), exp.get("end_year"))
                if s_year is None and nd_start:
                    s_year, s_month = date_to_parts(nd_start)
                if e_year is None and nd_end:
                    e_year, e_month = date_to_parts(nd_end)
                entries.append(Education(
                    institution=exp.get("institution"),
                    degree=exp.get("degree"),
                    field=exp.get("field"),
                    start_date=nd_start,
                    end_date=nd_end,
                    start_year=s_year,
                    start_month=s_month,
                    end_year=e_year,
                    end_month=e_month,
                ))
            return entries

        result = ResumeData(
            full_name=resume_data.get("full_name"),
            email=resume_data.get("email"),
            phone=resume_data.get("phone"),
            location=resume_data.get("location"),
            summary=resume_data.get("summary"),
            linkedin=linkedin_val,
            github=github_val,
            projects=[normalize_project_entry(project) for project in project_entries],
            work_experience=_build_work_experience(),
            education=_build_education(),
            skills=resume_data.get("skills") or [],
            languages=[Language(**lang) for lang in (resume_data.get("languages") or [])],
            certifications=resume_data.get("certifications") or [],
        )

        logger.info(f"Successfully parsed resume: {result.full_name}")
        return result.model_dump()

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}\nRaw text: {parsed_text[:500]}")
        raise HTTPException(status_code=500, detail="Failed to parse resume. Invalid response format.")
    except Exception as e:
        logger.error(f"Error parsing resume: {e}")
        raise HTTPException(status_code=500, detail=f"Error parsing resume: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
