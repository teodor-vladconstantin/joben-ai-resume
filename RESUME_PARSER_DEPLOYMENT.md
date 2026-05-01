# Resume Parser Implementation & Deployment Guide

## What Was Built

### 1. **Backend: LlamaParse FastAPI Microservice** (`resume-parser-service/`)

A production-ready Python microservice that:
- Accepts PDF and DOCX file uploads (5MB max)
- Parses resumes using LlamaParse with cost-optimized tier
- Returns structured JSON with:
  - Personal info (name, email, phone, location)
  - Professional summary
  - Work experience (company, role, dates, description)
  - Education (institution, degree, field)
  - Skills list
  - Languages with proficiency levels
  - Certifications
- Implements CORS for frontend communication
- Includes health check endpoint
- Fully containerized with Docker

**Key Files:**
- `main.py` - FastAPI application with all endpoints
- `requirements.txt` - Minimal dependencies (FastAPI, uvicorn, llama-parse)
- `Dockerfile` - Container image (Python 3.11-slim, ~150MB)
- `docker-compose.yml` - Local/remote deployment
- `.env.example` - Configuration template
- `README.md` - Complete documentation

**Ports:**
- Local: `http://localhost:8001`
- Production: Configure via environment

### 2. **Frontend: React ResumeUploader Component** (`src/components/builder/ResumeUploader.tsx`)

A fully featured React component that:
- **File Upload**: Drag & drop + click to browse
- **Validation**: File type (.pdf, .docx) and size (5MB)
- **File Limit**: Max 3 files per slot with inline error message
- **Warning Modal**: Shows before upload with:
  - Title: "Before you upload"
  - Message about digitally generated PDFs
  - "Got it, continue" and "Cancel" buttons
- **Loading State**: Animated loader during parsing
- **Display Parsed Data**:
  - Name, email, phone, location
  - Professional summary
  - Skills as color-coded badges
  - Work experience cards with dates
  - Education details
  - Languages with levels
  - Certifications list
- **Dark Theme**: Tailwind CSS styled for job board aesthetic
- **Error Handling**: User-friendly error messages

**Features:**
- TypeScript with full type safety
- Responsive design (mobile-first)
- Clean, minimal UI matching Joben brand
- Configurable max files and microservice URL

### 3. **Frontend Integration**

Updated files to work with the new microservice:
- `src/lib/pdf-import.ts` - Client-side API integration
  - Maps LlamaParse output to ResumeTemplateData format
  - Parses full names into firstName/lastName
  - Formats date ranges
  - Handles errors gracefully
- `src/components/builder/ResumeBuilder.tsx` - Import trigger
- `src/components/builder/ResumeOnboardingModal.tsx` - Alternative trigger

### 4. **Environment Configuration**

Added to `.env.local`:
```
LLAMA_CLOUD_API_KEY=your_llama_cloud_api_key_here
NEXT_PUBLIC_RESUME_PARSER_URL=http://localhost:8001
```

## Cleanup Completed

✓ Deleted `src/lib/gemini-parser.ts` (entire Gemini implementation)
✓ Deleted `src/app/api/parse-resume/` directory (old endpoint)
✓ Removed `GEMINI_API_KEY` from `.env.local`
✓ Removed `GEMINI_API_KEY` from `src/lib/env.ts` (required env validation)
✓ Updated all component imports and function calls
✓ No lingering references to Gemini, OpenAI, or old parsers

**Result:** Clean codebase with only LlamaParse resume parsing implementation.

## Deployment Instructions

### Local Development

1. **Start the microservice:**
   ```bash
   cd resume-parser-service
   cp .env.example .env
   # Add your LLAMA_CLOUD_API_KEY to .env
   
   # Option A: Direct Python
   pip install -r requirements.txt
   python main.py
   
   # Option B: Docker
   docker-compose up -d
   ```

2. **Test the microservice:**
   ```bash
   curl http://localhost:8001/health
   # Should return: {"status": "ok"}
   ```

3. **Start the Next.js app:**
   ```bash
   npm run dev
   # App runs on http://localhost:3000
   ```

4. **Test upload:**
   - Navigate to `/resumes/new` or `/dashboard`
   - Try uploading a PDF or DOCX resume
   - The ResumeUploader component will appear

### Hetzner VPS Deployment

1. **Build Docker image:**
   ```bash
   cd resume-parser-service
   docker build -t joben/resume-parser:1.0.0 .
   docker push joben/resume-parser:1.0.0  # Push to registry
   ```

2. **Configure on VPS:**
   - Update `docker-compose.prod.yml` to include the microservice
   - Set `LLAMA_CLOUD_API_KEY` in VPS environment
   - Set `NEXT_PUBLIC_RESUME_PARSER_URL` to the microservice domain

3. **Run with Traefik:**
   ```yaml
   resume-parser:
     image: joben/resume-parser:1.0.0
     environment:
       - LLAMA_CLOUD_API_KEY=${LLAMA_CLOUD_API_KEY}
     labels:
       - "traefik.enable=true"
       - "traefik.http.routers.resume-parser.rule=Host(`parser.joben.eu`) && PathPrefix(`/parse`)"
       - "traefik.http.services.resume-parser.loadbalancer.server.port=8001"
   ```

4. **Update Next.js:**
   ```
   NEXT_PUBLIC_RESUME_PARSER_URL=https://parser.joben.eu
   ```

## API Specification

### POST /parse
- **Accepts**: multipart/form-data with `file` field
- **File Types**: PDF, DOCX
- **Max Size**: 5MB
- **Returns**: JSON with parsed resume data

**Success (200):**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-0123",
  "location": "San Francisco, CA",
  "summary": "Experienced software engineer with 10+ years...",
  "work_experience": [...],
  "education": [...],
  "skills": ["Python", "React", "AWS"],
  "languages": [{"language": "English", "level": "Native"}],
  "certifications": ["AWS Solutions Architect"]
}
```

**Errors:**
- `400`: Invalid file type
- `413`: File too large
- `500`: Parsing failed

## Configuration Options

### Microservice (.env)
```
LLAMA_CLOUD_API_KEY=<your_api_key>  # Required
```

### Next.js (.env.local)
```
LLAMA_CLOUD_API_KEY=<your_api_key>
NEXT_PUBLIC_RESUME_PARSER_URL=http://localhost:8001
```

### Component Usage
```tsx
import { ResumeUploader } from '@/components/builder/ResumeUploader'

<ResumeUploader 
  onParsed={(resume) => {
    console.log('Parsed:', resume)
    // Update your form/state
  }}
  maxFiles={3}  // Default: 3
/>
```

## Monitoring & Logs

**Microservice logs:**
```bash
docker logs resume-parser
# Shows: parsing requests, success/error status
```

**Next.js logs:**
```bash
npm run dev
# Browser console: upload progress, errors
```

## Performance Considerations

- **LlamaParse**: ~2-5 seconds per file (depends on complexity)
- **Network**: Consider CDN for microservice if on separate server
- **File Upload**: Browser has 300s timeout (configurable)
- **Concurrency**: FastAPI handles multiple concurrent requests

## Security Notes

⚠️ **Before Production:**
- [ ] Change CORS origins to only production domains
- [ ] Add API rate limiting to microservice
- [ ] Use HTTPS for all communication
- [ ] Store API keys in secure secret manager (not `.env`)
- [ ] Add authentication between frontend and microservice if needed
- [ ] Configure file upload limits at reverse proxy level

## Troubleshooting

### "Cannot find module '...'"
```bash
npm install
npm run build  # Rebuilds Next.js
```

### "Connection refused" to microservice
```bash
# Verify service is running
curl http://localhost:8001/health

# Check Docker
docker ps | grep resume-parser
docker logs resume-parser
```

### "Invalid API key"
```bash
# Verify LLAMA_CLOUD_API_KEY is set
echo $LLAMA_CLOUD_API_KEY

# Get key from https://cloud.llamaindex.ai/
```

### Parse failures on certain files
- Verify file is not corrupted
- Try on different file (some PDFs may be image-only)
- Check file size < 5MB
- Review LlamaParse logs for details

## Next Steps

1. Get LlamaParse API key from https://cloud.llamaindex.ai/
2. Set `LLAMA_CLOUD_API_KEY` in environments
3. Test locally with sample resume
4. Deploy microservice to Hetzner VPS
5. Update frontend CORS if needed
6. Test end-to-end upload flow

## Support

For issues or questions:
- Check `resume-parser-service/README.md` for microservice docs
- Review LlamaParse documentation: https://docs.llamaindex.ai
- Check component source: `src/components/builder/ResumeUploader.tsx`
