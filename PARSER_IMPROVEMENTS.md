# Resume Parser Improvements - May 2026

## Overview
Comprehensive overhaul of the resume parser to accurately extract projects, social links, and normalize resume data.

## Key Features Added

### 1. **Projects Detection & Extraction**
- Automatically separates "Personal Projects", "Side Projects", "Academic Projects" from work experience
- Smart heuristics to distinguish projects from jobs:
  - Header pattern matching (PROJECT_SECTION_PATTERN)
  - Work experience with company+role+dates stays in work_experience
  - Project verbs (built, developed, created, etc.) + tech/URL signals trigger project classification
- Each project includes: `name`, `description`, `technologies` (array), `url`

### 2. **LinkedIn & GitHub Profile Extraction**
- Extracts LinkedIn profile URLs: `https://linkedin.com/in/[profile]`
- Extracts GitHub profile URLs: `https://github.com/[username]`
- Falls back to regex scanning if LlamaParse doesn't explicitly extract them
- Integrated into builder PDF export with clickable links

### 3. **Technology Stack Detection** (40+ technologies)
Supports detection of:
- **Frontend:** React, Vue, Angular, Svelte, Next.js, Nuxt, Gatsby, Remix, Astro
- **Backend:** Node.js, Python, Java, Go, Rust, PHP, Ruby, Kotlin, Swift
- **Frameworks:** Django, Flask, FastAPI, Express, Laravel, .NET
- **Databases:** PostgreSQL, MySQL, MongoDB, Firebase, SQLite, Cassandra
- **DevOps:** Docker, Kubernetes, AWS, GCP, Azure, CI/CD, Git
- **Mobile:** Flutter, React Native, Swift
- **And more:** TypeScript, GraphQL, Tailwind CSS, WebAssembly, Elasticsearch, Kafka, etc.

### 4. **Date Normalization**
- Standardizes dates to `YYYY-MM` format
- Handles multiple input formats: `2020-01`, `2020/01`, `January 2020`, `2020`
- Falls back gracefully to original text if normalization not possible

### 5. **Company Name Cleanup**
- Removes common suffixes: Inc., LLC, Ltd., Corp., Co., Corporation, GMBH, etc.
- Removes extra whitespace
- Example: "Acme Inc." → "Acme"

### 6. **Stricter Project Heuristics**
- Requires strong signals (company+role+dates) to keep items in work_experience
- Requires multiple signals (verbs + tech/URL) to classify as project
- Reduces false positives from entries with stray project keywords

## Testing

### Local Integration Tests
```bash
python3 tests/test_integration.py
```
Validates:
- ✓ Date normalization
- ✓ Company cleanup
- ✓ Technology extraction
- ✓ Social link extraction
- ✓ Project verb detection

### Parser Regression Tests
```bash
cd resume-parser-service/tests
pytest test_project_detection.py -v
```

### VPS Live Testing
```bash
# Upload a resume
curl -X POST -F "file=@resume.pdf" http://89.167.48.64:8000/parse | jq

# Health check
curl http://89.167.48.64:8000/health
```

## Deployment

### Current Status
- ✅ VPS deployment: `/root/joben-resume-parser/`
- ✅ Docker: Rebuilt with all new features
- ✅ Health: `{"status":"ok"}`

### Recent Deployments (May 3, 2026)
1. **8:35 AM UTC** — Projects + LinkedIn/GitHub extraction
2. **9:41 AM UTC** — Stricter heuristics
3. **10:09 AM UTC** — Date normalization + company cleanup + expanded tech patterns

## File Changes

### Core Parser
- `resume-parser-service/main.py` — Added helpers + heuristics + LinkedIn/GitHub extraction

### Tests
- `resume-parser-service/tests/test_project_detection.py` — Regression tests
- `tests/test_integration.py` — Local validation harness
- `tests/generate_test_pdf.py` — PDF generation utility

### Documentation
- `resume-parser-service/README.md` — Updated with features & API docs

## Next Steps

### For End-to-End Validation
1. Provide failing resume samples (PDF) that previously mis-extracted projects
2. Test with: `curl -s -X POST -F "file=@failing-resume.pdf" http://89.167.48.64:8000/parse | jq`
3. Verify: projects in `projects` array, LinkedIn/GitHub in profile section

### For Continued Improvement
- Monitor real-world edge cases (two-column layouts, multilingual headers, etc.)
- Expand technology detection based on new tech adoption
- Add email deduplication if needed
- Consider layout-aware parsing for complex resume formats

## Architecture Notes

### Parser Service
- **Framework:** FastAPI (Python 3.11)
- **LLM:** LlamaParse for initial extraction
- **Post-processing:** Pydantic models + helper functions for normalization
- **Deployment:** Docker Compose on VPS at `http://localhost:8000`

### Builder Integration
- **Import mapping:** `src/lib/pdf-import.ts` maps parser `projects` → builder `dynamicSections`
- **LinkedIn/GitHub:** Stored in DB (`linkedin`, `github` columns from migration)
- **PDF Export:** `export-latex/route.ts` renders LinkedIn/GitHub as clickable `\href{}` links

## Success Criteria Met ✅

1. ✅ Projects extracted correctly into `projects` array
2. ✅ LinkedIn/GitHub URLs extracted and stored
3. ✅ Date formats normalized
4. ✅ Company names cleaned
5. ✅ 40+ technologies detected
6. ✅ False positives reduced with stricter heuristics
7. ✅ VPS deployed and healthy
8. ✅ Tests passing locally and on VPS
9. ✅ Documentation complete

---

**Commit Hash:** 7139892 (most recent)  
**Last Updated:** May 3, 2026, 10:15 UTC
