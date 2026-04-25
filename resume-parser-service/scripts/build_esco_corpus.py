"""
Script run at Docker build time (or manually) to download and pre-process the
ESCO skills corpus into the data/ JSON bundles used by SkillsMatcher.

Usage:
    python scripts/build_esco_corpus.py

Output:
    data/esco_skills_en.json   — list of EN canonical + alt skill names
    data/esco_skills_ro.json   — list of RO canonical + alt skill names

The ESCO dataset is published by the European Commission under CC BY 4.0.
Download page: https://esco.ec.europa.eu/en/use-esco/download
"""

import csv
import io
import json
import sys
import urllib.request
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# ESCO bulk download — skills only, multiple languages
# Format: CSV with columns: conceptUri, skillType, reuseLevel, preferredLabel, altLabels, ...
ESCO_URL_EN = "https://ec.europa.eu/esco/portal/escopedia/skills/ESCO_skills_en.csv"
ESCO_URL_RO = "https://ec.europa.eu/esco/portal/escopedia/skills/ESCO_skills_ro.csv"


def download_and_parse(url: str, lang: str) -> list[str]:
    print(f"  Downloading ESCO {lang.upper()} skills from {url} …")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"  Download failed: {e}")
        return []

    skills: list[str] = []
    seen: set[str] = set()

    reader = csv.DictReader(io.StringIO(raw))
    for row in reader:
        # Add preferred label
        preferred = (row.get("preferredLabel") or "").strip()
        if preferred and preferred.lower() not in seen:
            seen.add(preferred.lower())
            skills.append(preferred)

        # Add alternative labels (pipe or newline separated)
        alt_raw = row.get("altLabels") or ""
        for alt in alt_raw.replace("\n", "|").split("|"):
            alt = alt.strip()
            if alt and alt.lower() not in seen:
                seen.add(alt.lower())
                skills.append(alt)

    print(f"  → {len(skills)} {lang.upper()} skills collected.")
    return skills


def main():
    for lang, url, out_file in [
        ("en", ESCO_URL_EN, DATA_DIR / "esco_skills_en.json"),
        ("ro", ESCO_URL_RO, DATA_DIR / "esco_skills_ro.json"),
    ]:
        skills = download_and_parse(url, lang)
        if skills:
            with out_file.open("w", encoding="utf-8") as f:
                json.dump(skills, f, ensure_ascii=False, indent=2)
            print(f"  Written {len(skills)} skills to {out_file}")
        else:
            print(f"  Warning: no {lang.upper()} skills downloaded; seed list will be used as fallback.")

    print("Done.")


if __name__ == "__main__":
    main()
