# Resume Parser Improvements - Detailed Documentation

## Overview
Comprehensive improvements to the FastAPI resume parser and Next.js builder to properly handle projects as a first-class resume data type (not custom sections).

## Problem Statement
When importing PDFs, projects section was incorrectly placed into custom dynamic sections instead of a dedicated projects array in the builder.

## Architecture Changes

### Frontend (Next.js)

#### 1. Type System (`src/components/templates/types.ts`)
```typescript
export type ResumeProject = {
  id: string
  name: string
  description: string
  technologies: string[]
  url?: string
}

export interface ResumeTemplateData {
  personal: { /* ... */ }
  experience: ResumeExperience[]
  projects: ResumeProject[]  // NEW: First-class field
  education: ResumeEducation[]
  dynamicSections: Section[]
  // ...
}
```

#### 2. Resume Builder (`src/components/builder/ResumeBuilder.tsx`)
- Added `projects: ProjectEntry[]` to ResumeData state
- Updated resume loading to populate projects array from parsed data
- Initial state includes empty projects array
- Type-safe handling ensures projects flow through UI correctly

#### 3. Template Rendering (`src/components/templates/HarvardTemplate.tsx`)
- Renders Projects section after Experience with:
  - Project name (bold)
  - Description (full text)
  - Technologies (comma-separated list)
  - URL (clickable link if present)
- Conditional rendering: only shows if projects exist

#### 4. PDF Import (`src/lib/pdf-import.ts`)
- Maps parsed projects to projects array (not custom sections)
- Structure: `{id, name, description, technologies[], url?}`
- Defensive null-checking: handles missing fields gracefully
- HTML entity decoding for all text fields

#### 5. LaTeX Export (`src/app/api/resumes/export-latex/route.ts`)
- Added LatexProjectEntry type
- Projects section renders before dynamicSections
- Includes technologies and URL in LaTeX output
- Filtered projects from dynamicSections grouping to prevent duplication

### Backend (FastAPI)

#### 1. LlamaParse Prompt Enhancement
Improved parsing instruction with:
- **Clear DISTINCTION section**:
  - PROJECTS: no company name, have name/description/technologies/URL
  - WORK_EXPERIENCE: must have company+role+dates
- **Explicit rules**:
  1. Project section headers ("Projects", "Personal Projects", etc.) go to projects array
  2. Each project must have: name, description, technologies, optional URL
  3. Only entries WITHOUT company context are projects
  4. Extract FULL text, no truncation
  5. Extract LinkedIn/GitHub URLs
- **Return format**: Valid JSON only, no markdown

#### 2. Project Detection Heuristics (`looks_like_project_entry()`)
Three-tier classification with verbose logging:

**Tier 1: Header Pattern**
- Regex: `"projects?", "personal projects?", "side projects?", "academic projects?", "selected projects?", "featured projects?", "project work", "project experience"`
- If matched → classify as project immediately

**Tier 2: Work Experience Protection**
- If entry has `company + role + dates` → keep as work_experience (avoid false positives)
- This prevents job descriptions with project verbs from being misclassified

**Tier 3: Signal Detection**
- Project verbs (20+ types): built, developed, implemented, engineered, architected, launched, released, etc.
- Technology signals: React, Node.js, Python, etc. (40+ tech patterns)
- URL signals: GitHub, Portfolio, etc.
- **Rule**: If has project verbs AND (tech OR URL) → classify as project
- **Rule**: If description mentions projects AND (tech OR URL OR verbs) → classify as project

#### 3. Project Verbs (Expanded)
```python
[
  "built", "developed", "implemented", "engineered", "architected",
  "constructed", "fabricated", "forged", "created", "designed",
  "deployed", "launched", "released", "build", "submitted",
  "prototype", "prototyped", "portfolio"
]
```

#### 4. Technology Pattern Recognition (40+ techs)
Frontend: React, Next.js, Vue, Angular, Svelte, Remix, Astro, Nuxt, Gatsby, Flutter, React Native, Swift, Kotlin
Backend: Node.js, Python, Django, Flask, FastAPI, Java, Go, Rust, PHP, Ruby, Laravel, .NET, C#
Data: SQL, PostgreSQL, MongoDB, Redis, Cassandra, Elasticsearch, Firebase, SQLite, MySQL
DevOps: Docker, Kubernetes, AWS, GCP, Azure, CI/CD, Git, GitHub, GitLab
APIs: GraphQL, REST, WebAssembly
UI: Tailwind CSS, Bootstrap

#### 5. Date Normalization
Converts various date formats to `YYYY-MM` or `YYYY`:
- `2020-01` → `2020-01` ✓
- `2020/01` → `2020-01` ✓
- `January 2020` → `2020` ✓
- `Jan 2020` → `2020` ✓

#### 6. Company Name Cleanup
Removes corporate suffixes:
- Google Inc. → Google
- Microsoft Corporation → Microsoft
- Tesla Ltd. → Tesla
- IBM GMBH → IBM
- Facebook Inc → Facebook
- Acme LLC → Acme

#### 7. Debug Logging
When parsing:
- Shows LlamaParse returned keys
- Shows count of explicit projects vs classified projects
- Per-entry classification reason with full details (header match, work exp signals, verb+tech detection)
- Helps diagnose extraction issues

### Test Coverage

#### Parser Tests (`resume-parser-service/tests/test_project_detection.py`)
16 comprehensive tests:
1. `test_work_experience_not_project` - Ensures work exp stays as work exp
2. `test_personal_project_detected` - Personal projects with GitHub URL
3. `test_description_based_project` - Projects detected from description
4. `test_extract_linkedin_url` - LinkedIn URL extraction
5. `test_extract_github_url` - GitHub URL extraction
6. `test_project_section_headers` - Various project header formats
7. `test_work_exp_with_project_verbs` - Work exp not misclassified as project
8. `test_project_with_technologies` - Tech stack extraction
9. `test_project_with_url` - URL field handling
10. `test_project_name_fallback` - Name field fallback logic
11. `test_company_name_cleanup` - Suffix removal
12. `test_date_normalization` - Date format conversion
13. `test_extract_technologies_comprehensive` - Multiple tech detection
14. `test_project_verb_detection` - Verb pattern matching
15. `test_url_extraction` - URL field extraction
16. Plus integration tests

#### Integration Tests (`tests/test_integration.py`)
- Date normalization ✓
- Company cleanup ✓
- Technology extraction ✓
- Social link extraction (LinkedIn/GitHub) ✓
- Project verb detection ✓
- All tests pass locally

## Git Commits

| Commit | Message |
|--------|---------|
| a3bee2d | fix: proper projects section handling - not custom sections |
| a2d07b8 | debug: add logging to understand projects extraction |
| 8c98daa | improve: better LlamaParse prompt and project detection logging |
| b22d10e | test: expand project verb patterns in integration tests |
| 60bf242 | test: add comprehensive test suite for project detection and utilities |

## Deployment

### VPS Deployment Steps
```bash
# SSH to VPS
ssh root@89.167.48.64

# Update and rebuild parser
cd joben-resume
git pull
cd resume-parser-service

# Build new image with improvements
docker build -t resume-parser:latest .

# Deploy
docker-compose up -d

# Monitor logs
docker logs -f resume-parser
```

### What to Look For in Logs
```
LlamaParse returned keys: [...]
Projects from LlamaParse: [X items]
Explicit projects from LlamaParse: X
Work exp entries classified as projects: Y
  Entry 'Project Name' -> YES (header mentions project)
  Entry 'Company Role' -> NO (full work exp)
```

## Edge Cases Handled

1. ✓ Projects with no company name
2. ✓ Work experience with project verbs (stays as work exp if has company+role+dates)
3. ✓ Multiple project section header formats
4. ✓ Missing fields (name, description, technologies, URL)
5. ✓ HTML entity encoding in text
6. ✓ Trailing punctuation in URLs
7. ✓ Date formats (YYYY-MM, YYYY/MM, spelled-out months, years only)
8. ✓ Company suffix variations (Inc., LLC, Ltd., Corp., Corporation, GMBH, etc.)
9. ✓ LinkedIn/GitHub URLs in various positions
10. ✓ Case-insensitive tech and verb matching

## Known Limitations

1. LlamaParse's extraction quality depends on PDF structure
2. Some resumes may have unconventional project section naming
3. Date extraction only works if dates are present in resume
4. Technology detection requires explicit tech name mentions

## Future Improvements

1. Add machine learning-based project classification
2. Support for more project section formats (tables, cards, etc.)
3. Add project difficulty/impact extraction
4. Support for co-author/team member detection
5. Automatic tech skill extraction and deduplication
6. Project screenshot/image import support

## References

- Frontend type system: [types.ts](src/components/templates/types.ts)
- Builder component: [ResumeBuilder.tsx](src/components/builder/ResumeBuilder.tsx)
- Template rendering: [HarvardTemplate.tsx](src/components/templates/HarvardTemplate.tsx)
- PDF import mapping: [pdf-import.ts](src/lib/pdf-import.ts)
- LaTeX export: [export-latex/route.ts](src/app/api/resumes/export-latex/route.ts)
- Parser backend: [resume-parser-service/main.py](resume-parser-service/main.py)
- Test suite: [test_project_detection.py](resume-parser-service/tests/test_project_detection.py)
