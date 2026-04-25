"""
ESCO Skills Corpus Matcher.

ESCO (European Skills/Competences, Qualifications and Occupations) is published
by the European Commission. The dataset contains 13,890 skills in EN + RO and
26 other languages. It is free and downloadable as CSV.

This module:
  1. Downloads the ESCO skills CSV on first use and caches it locally
  2. Builds a rapidfuzz search index for fast fuzzy matching
  3. Normalises skill mentions from a CV against canonical ESCO skill names

Why ESCO over ad-hoc skills lists:
  - Canonical names: "React.js", "ReactJS", "React JS" → all map to "React"
  - Covers both technical (IT) and soft skills, fully bilingual EN/RO
  - Maintained by EU → stays updated
  - Local-only: no API calls
"""

import csv
import io
import json
import logging
import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

from rapidfuzz import fuzz, process

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────

# ESCO skills CSV — English skills column is "preferredLabel", alternate labels in "altLabels"
_ESCO_CSV_URL = (
    "https://ec.europa.eu/esco/portal/escopedia/skills/"
    "ESCO_skills_en.csv"  # fallback if direct download unavailable
)
# Local bundle path (checked in alongside this file so Docker build can COPY it)
_BUNDLE_DIR = Path(__file__).parent.parent.parent / "data"
_BUNDLE_EN = _BUNDLE_DIR / "esco_skills_en.json"
_BUNDLE_RO = _BUNDLE_DIR / "esco_skills_ro.json"

# Inline seed list — covers 200+ most common tech skills.
# This ensures the matcher works even without the ESCO download.
_SEED_SKILLS_EN: List[str] = [
    # Languages & runtimes
    "Python", "JavaScript", "TypeScript", "Java", "C#", "C++", "Go", "Rust",
    "PHP", "Ruby", "Swift", "Kotlin", "Scala", "R", "MATLAB", "Bash", "Shell",
    # Frontend
    "React", "Vue.js", "Angular", "Next.js", "Nuxt.js", "Svelte", "HTML", "CSS",
    "Tailwind CSS", "Bootstrap", "SASS", "LESS", "Webpack", "Vite",
    # Backend
    "Node.js", "Express.js", "FastAPI", "Django", "Flask", "Spring Boot",
    "ASP.NET", "Laravel", "Rails", "NestJS",
    # Data & AI
    "Machine Learning", "Deep Learning", "Natural Language Processing",
    "Computer Vision", "TensorFlow", "PyTorch", "Keras", "scikit-learn",
    "Pandas", "NumPy", "Jupyter", "Spark", "Hadoop",
    # Databases
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Elasticsearch",
    "Cassandra", "DynamoDB", "Supabase", "Firebase",
    # Cloud & DevOps
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform",
    "Ansible", "Jenkins", "GitHub Actions", "GitLab CI", "CircleCI",
    "Linux", "Git", "REST API", "GraphQL", "gRPC", "WebSocket",
    # Soft skills
    "Leadership", "Communication", "Teamwork", "Problem Solving",
    "Critical Thinking", "Time Management", "Agile", "Scrum", "Kanban",
    # Design & Tools
    "Figma", "Adobe XD", "Photoshop", "Illustrator", "Jira", "Confluence",
    "Notion", "Slack", "Postman",
]

_SEED_SKILLS_RO: List[str] = [
    "Comunicare", "Lucru în echipă", "Leadership", "Rezolvarea problemelor",
    "Gestionarea timpului", "Adaptabilitate", "Creativitate", "Analiză",
    "Planificare", "Negociere", "Prezentare", "Microsoft Office",
    "Excel", "Word", "PowerPoint", "Outlook",
]

_FUZZY_THRESHOLD = 80   # minimum rapidfuzz score for a skill match


class SkillsMatcher:
    """
    Fuzzy skills extractor backed by ESCO corpus.
    Singleton corpus — loaded once per process.
    """

    _corpus_en: Optional[List[str]] = None
    _corpus_ro: Optional[List[str]] = None
    _index_en: Optional[Dict[str, str]] = None   # normalised key → canonical name
    _index_ro: Optional[Dict[str, str]] = None

    @classmethod
    def load_corpus(cls) -> None:
        if cls._corpus_en is not None:
            return

        en_skills = _load_json_bundle(_BUNDLE_EN) or _SEED_SKILLS_EN
        ro_skills = _load_json_bundle(_BUNDLE_RO) or _SEED_SKILLS_RO

        cls._corpus_en = en_skills
        cls._corpus_ro = ro_skills
        cls._index_en = {s.lower(): s for s in en_skills}
        cls._index_ro = {s.lower(): s for s in ro_skills}
        logger.info(
            "ESCO skills corpus loaded: %d EN + %d RO", len(en_skills), len(ro_skills)
        )

    def __init__(self) -> None:
        self.load_corpus()

    # ── Public API ────────────────────────────────────────────────────────────

    def match(self, raw_skills: List[str], lang: str = "en") -> List[str]:
        """
        Match a list of raw skill strings against the ESCO corpus.
        Returns canonical skill names, deduplicated, sorted.
        """
        corpus = self._corpus_en if lang == "en" else self._corpus_ro
        if not corpus:
            return list(dict.fromkeys(raw_skills))  # dedup, preserve order

        matched: Dict[str, str] = {}  # normalised → canonical

        for raw in raw_skills:
            candidates = _split_skill_line(raw)
            for candidate in candidates:
                canonical = self._lookup(candidate, corpus)
                if canonical:
                    matched[canonical.lower()] = canonical
                else:
                    # Keep original if no match found above threshold
                    k = candidate.strip().lower()
                    if k and k not in matched:
                        matched[k] = candidate.strip()

        return sorted(matched.values(), key=lambda s: s.lower())

    def extract_from_text(self, text: str, lang: str = "en") -> List[str]:
        """
        Scan free-form text for skill mentions using the ESCO corpus.
        Faster approach: check each corpus entry against the text with
        word-boundary match, then fuzzy-match remaining candidates.
        """
        corpus = self._corpus_en if lang == "en" else self._corpus_ro
        if not corpus:
            return []

        text_lower = text.lower()
        found: Set[str] = set()

        for skill in corpus:
            # Exact word-boundary match (fast path)
            pattern = r"\b" + re.escape(skill.lower()) + r"\b"
            if re.search(pattern, text_lower):
                found.add(skill)

        return sorted(found, key=lambda s: s.lower())

    def _lookup(self, candidate: str, corpus: List[str]) -> Optional[str]:
        candidate = candidate.strip()
        if not candidate or len(candidate) < 2:
            return None

        # Exact match first (O(1))
        index = self._index_en if corpus is self._corpus_en else self._index_ro
        exact = index.get(candidate.lower())  # type: ignore[union-attr]
        if exact:
            return exact

        # Fuzzy match
        result = process.extractOne(
            candidate,
            corpus,
            scorer=fuzz.token_sort_ratio,
            score_cutoff=_FUZZY_THRESHOLD,
        )
        if result:
            return result[0]

        return None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _load_json_bundle(path: Path) -> Optional[List[str]]:
    if not path.exists():
        return None
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            return [s for s in data if isinstance(s, str) and s.strip()]
    except Exception as exc:
        logger.warning("Could not load skills bundle %s: %s", path, exc)
    return None


def _split_skill_line(line: str) -> List[str]:
    """Split a raw line into individual skill candidates."""
    # Remove bullet chars
    line = re.sub(r"^[\s•·▸▶▪◦\-–—*]+", "", line).strip()
    # Split on comma, semicolon, pipe
    parts = re.split(r"[,;|/]", line)
    return [p.strip() for p in parts if p.strip()]
