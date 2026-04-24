from fastapi import FastAPI, UploadFile, File, HTTPException
from app.services.resume_parser import ResumeParser
from app.core.config import get_settings
import logging

settings = get_settings()
logging.basicConfig(level=getattr(logging, settings.log_level.upper()))
logger = logging.getLogger(__name__)

app = FastAPI(title="Resume Parser API")

@app.get("/health")
async def health():
    return {"status": "ok", "port": settings.port, "lang": settings.model_lang}

@app.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files supported")
    try:
        contents = await file.read()
        parser = ResumeParser()
        result = parser.parse(contents)
        return result
    except Exception as e:
        logger.error(f"Parse error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
