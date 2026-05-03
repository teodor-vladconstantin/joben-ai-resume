import os
import io
import json
import re
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llama_parse import LlamaParse
import logging

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


class WorkExperience(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None


class Education(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    field: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class Language(BaseModel):
    language: str
    level: str


class Project(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    technologies: list[str] = []
    url: Optional[str] = None


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

LINKEDIN_PATTERN = re.compile(r"https?://(?:www\.)?linkedin\.com/[\w\-/]+", re.IGNORECASE)
GITHUB_PATTERN = re.compile(r"https?://(?:www\.)?github\.com/[\w\-/]+", re.IGNORECASE)


def looks_like_project_entry(entry: dict) -> bool:
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

    # If header explicitly mentions projects, it's a project
    if header_text and PROJECT_SECTION_PATTERN.search(header_text):
        return True

    # If this entry looks like a full work experience (company + role) and has dates,
    # prefer keeping it as work_experience to avoid false positives.
    has_company = bool(entry.get("company") and isinstance(entry.get("company"), str) and entry.get("company").strip())
    has_role = bool(entry.get("role") and isinstance(entry.get("role"), str) and entry.get("role").strip())
    has_dates = bool(entry.get("start_date") or entry.get("end_date"))
    if has_company and has_role and has_dates:
        return False

    # Candidate text for signals
    candidate_text = " ".join(filter(None, [header_text, description_text]))
    if not candidate_text.strip():
        return False

    # If description explicitly mentions projects keywords and we also detect technologies or a URL,
    # treat as a project entry.
    if PROJECT_SECTION_PATTERN.search(description_text):
        return bool(extract_url(candidate_text) or extract_technologies(candidate_text) or has_project_verbs(candidate_text))

    # If description contains strong project verbs (built, developed, prototype) and we detect
    # technologies or a URL, consider it a project.
    if has_project_verbs(candidate_text) and (extract_url(candidate_text) or extract_technologies(candidate_text)):
        return True

    return False


def has_project_verbs(text: Optional[str]) -> bool:
    if not isinstance(text, str) or not text.strip():
        return False
    verbs = [r"\\bbuilt\\b", r"\\bdeveloped\\b", r"\\bimplemented\\b", r"\\bprototype\\b", r"\\bbuilt a\\b", r"\\bcreated\\b", r"\\bdesigned\\b", r"\\bdeployed\\b", r"\\bsubmitted\\b", r"\\bportfolio\\b"]
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
    description = next(
        (
            str(value).strip()
            for value in (entry.get("description"), entry.get("summary"))
            if isinstance(value, str) and value.strip()
        ),
        None,
    )
    name = next(
        (
            str(value).strip()
            for value in (entry.get("name"), entry.get("title"), entry.get("role"), entry.get("company"))
            if isinstance(value, str) and value.strip()
        ),
        None,
    )
    project_text = " ".join(
        value
        for value in [
            name or "",
            description or "",
            str(entry.get("company")).strip() if isinstance(entry.get("company"), str) else "",
            str(entry.get("role")).strip() if isinstance(entry.get("role"), str) else "",
        ]
        if value
    )

    url = entry.get("url") if isinstance(entry.get("url"), str) else None
    if not url:
        url = extract_url(project_text)

    return Project(
        name=name or "Project",
        description=description,
        technologies=extract_technologies(project_text),
        url=url,
    )


def extract_linkedin(text: Optional[str]) -> Optional[str]:
    if not isinstance(text, str) or not text.strip():
        return None
    m = LINKEDIN_PATTERN.search(text)
    return m.group(0).rstrip('.,;:') if m else None


def extract_github(text: Optional[str]) -> Optional[str]:
    if not isinstance(text, str) or not text.strip():
        return None
    m = GITHUB_PATTERN.search(text)
    return m.group(0).rstrip('.,;:') if m else None


def normalize_date(date_str: Optional[str]) -> Optional[str]:
    """Normalize date strings to YYYY-MM format when possible."""
    if not isinstance(date_str, str) or not date_str.strip():
        return None
    date_str = date_str.strip()
    # Already in good format
    if re.match(r'^\d{4}-\d{2}$', date_str):
        return date_str
    # Try to extract year-month
    m = re.search(r'(\d{4})[/-](\d{1,2})', date_str)
    if m:
        year, month = m.groups()
        return f"{year}-{month.zfill(2)}"
    # Try to extract just year
    m = re.search(r'(\d{4})', date_str)
    if m:
        return m.group(1)
    return date_str


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
        "- summary (string)\n"
        "- projects (array of: name, description, technologies, url)\n"
        "- work_experience (array of: company, role, start_date, end_date, description)\n"
        "- education (array of: institution, degree, field, start_date, end_date)\n"
        "- skills (array of strings)\n"
        "- languages (array of: language, level)\n"
        "- certifications (array of strings)\n"
        "CRITICAL: Any project sections such as Projects, Personal Projects, Side Projects, Academic Projects, or similar variations must be placed in the projects array, not work_experience.\n"
        "For each project, extract a concise name, the full description, a technologies array based on the description, and any URL present in the project text.\n"
        "If a field is not found, return null for strings and empty array for arrays.\n"
        "Return only valid JSON, no markdown, no extra text.\n"
        "CRITICAL: Do NOT summarize, truncate, or abbreviate any text. Extract the FULL EXACT TEXT for descriptions, summaries, and roles."
    ),
    cost_optimizer="true",
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
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

        parsed_text = documents[0].text if documents else ""

        m = re.search(r"```json\s*(.*?)\s*```", parsed_text, re.DOTALL)
        if m:
            parsed_text = m.group(1)
        else:
            m = re.search(r"```\s*(.*?)\s*```", parsed_text, re.DOTALL)
            if m:
                parsed_text = m.group(1)

        resume_data = json.loads(parsed_text.strip())

        # try to extract LinkedIn/GitHub from explicit fields or from the parsed output text
        linkedin_val = resume_data.get("linkedin") if isinstance(resume_data.get("linkedin"), str) else None
        github_val = resume_data.get("github") if isinstance(resume_data.get("github"), str) else None
        if not linkedin_val:
            linkedin_val = extract_linkedin(parsed_text)
        if not github_val:
            github_val = extract_github(parsed_text)

        result = ResumeData(
            full_name=resume_data.get("full_name"),
            email=resume_data.get("email"),
            phone=resume_data.get("phone"),
            location=resume_data.get("location"),
            summary=resume_data.get("summary"),
            linkedin=linkedin_val,
            github=github_val,
            projects=[
                normalize_project_entry(project)
                for project in (resume_data.get("projects") or [])
                if isinstance(project, dict)
            ]
            + [
                normalize_project_entry(exp)
                for exp in (resume_data.get("work_experience") or [])
                if isinstance(exp, dict) and looks_like_project_entry(exp)
            ],
            work_experience=[
                WorkExperience(
                    company=normalize_company_name(exp.get("company")),
                    role=exp.get("role"),
                    start_date=normalize_date(exp.get("start_date")),
                    end_date=normalize_date(exp.get("end_date")),
                    description=exp.get("description"),
                )
                for exp in (resume_data.get("work_experience") or [])
                if isinstance(exp, dict) and not looks_like_project_entry(exp)
            ],
            education=[
                Education(
                    institution=exp.get("institution"),
                    degree=exp.get("degree"),
                    field=exp.get("field"),
                    start_date=normalize_date(exp.get("start_date")),
                    end_date=normalize_date(exp.get("end_date")),
                )
                for exp in (resume_data.get("education") or [])
            ],
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
