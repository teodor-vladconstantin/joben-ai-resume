# Resume Parser Python Service

World-class resume parser using pdfplumber + spaCy.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 3002
```

## API

### POST /parse
Parse a PDF resume.

**Request:** multipart/form-data with `file` (PDF)

**Response:**
```json
{
  "personal": {
    "firstName": "...",
    "lastName": "...",
    "email": "...",
    "phone": "...",
    "location": "...",
    "linkedin": "...",
    "github": "...",
    "website": "...",
    "title": "...",
    "summary": "..."
  },
  "experience": [...],
  "dynamicSections": [...]
}
```

### GET /health
Health check with model status.

## Environment
- `PORT`: Server port (default: 3002)
- `LOG_LEVEL`: Logging level (default: INFO)
- `MODEL_LANG`: Language mode - "en", "ro", or "both" (default: both)