# LlamaParse Resume Parser Microservice

A lightweight FastAPI microservice for parsing resumes and CVs using LlamaParse. Extracts structured resume data from PDF and DOCX files.

## Features

- **FastAPI** for high-performance async API
- **LlamaParse** integration with cost-optimized parsing
- **CORS** support for frontend communication
- **Validation** for file type and size
- **JSON Schema** output for structured resume data
- **Docker** support for easy deployment

## Setup

### Local Development

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables:**
   ```bash
   # Copy .env.example to .env and add your API key
   cp .env.example .env
   # Edit .env with your LLAMA_CLOUD_API_KEY
   ```

3. **Run the server:**
   ```bash
   python main.py
   ```
   Server runs on `http://localhost:8001`

### Docker Deployment

1. **Build the image:**
   ```bash
   docker build -t resume-parser:latest .
   ```

2. **Run with Docker:**
   ```bash
   docker run -e LLAMA_CLOUD_API_KEY=your_key_here -p 8001:8001 resume-parser:latest
   ```

3. **Run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

## API Endpoints

### Health Check
```
GET /health
```
Returns: `{"status": "ok"}`

### Parse Resume
```
POST /parse
Content-Type: multipart/form-data

Parameters:
- file: Binary PDF or DOCX file
```

**Response (Success):**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "location": "San Francisco, CA",
  "summary": "Experienced software engineer...",
  "work_experience": [
    {
      "company": "Tech Corp",
      "role": "Senior Developer",
      "start_date": "2020-01",
      "end_date": null,
      "description": "Led development of..."
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "start_date": "2016-09",
      "end_date": "2020-05"
    }
  ],
  "skills": ["Python", "JavaScript", "React", "FastAPI"],
  "languages": [
    {
      "language": "English",
      "level": "Native"
    }
  ],
  "certifications": ["AWS Solutions Architect"]
}
```

**Error Responses:**
- `400`: Invalid file type (only PDF and DOCX supported)
- `413`: File too large (max 5MB)
- `500`: Parsing error

## Environment Variables

- `LLAMA_CLOUD_API_KEY` (required): Your LlamaParse API key from https://cloud.llamaindex.ai/

## Configuration

### CORS Origins
Currently allows:
- `https://joben.eu` (production)
- `http://localhost:3000` (local development)

Edit in `main.py` to adjust:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://joben.eu", "http://localhost:3000"],
    ...
)
```

### File Size Limit
Default: 5MB
Edit in `main.py`:
```python
max_size = 5 * 1024 * 1024  # bytes
```

### LlamaParse Settings
Default uses `cost_optimizer="true"` for best performance.
See [LlamaParse docs](https://docs.llamaindex.ai/en/stable/module_guides/data_loaders/document_loaders/llamaparse.html) for other options.

## Frontend Integration

The Next.js app calls this microservice via `NEXT_PUBLIC_RESUME_PARSER_URL` environment variable.

```typescript
// In .env.local
LLAMA_CLOUD_API_KEY=your_key_here
NEXT_PUBLIC_RESUME_PARSER_URL=http://localhost:8001
```

Use the `ResumeUploader` component to integrate:
```tsx
import { ResumeUploader } from '@/components/builder/ResumeUploader'

export function MyPage() {
  return (
    <ResumeUploader 
      onParsed={(resume) => console.log(resume)}
      maxFiles={3}
    />
  )
}
```

## Testing

Test the endpoint with curl:
```bash
curl -F "file=@resume.pdf" http://localhost:8001/parse
```

## Monitoring

Logs are output to stdout and include:
- File parsing requests
- Parsed resume summaries
- Error details

## License

Part of Joben AI Resume Builder

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