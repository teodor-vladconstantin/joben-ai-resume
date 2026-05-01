import os
import json
import re
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llama_parse import LlamaParse
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Resume Parser", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://joben.eu", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for response
class WorkExperience(BaseModel):
    company: str
    role: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None

class Education(BaseModel):
    institution: str
    degree: str
    field: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class Language(BaseModel):
    language: str
    level: str

class ResumeData(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    work_experience: list[WorkExperience] = []
    education: list[Education] = []
    skills: list[str] = []
    languages: list[Language] = []
    certifications: list[str] = []

# Initialize LlamaParse parser
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
        "- work_experience (array of: company, role, start_date, end_date, description)\n"
        "- education (array of: institution, degree, field, start_date, end_date)\n"
        "- skills (array of strings)\n"
        "- languages (array of: language, level)\n"
        "- certifications (array of strings)\n"
        "If a field is not found, return null for strings and empty array for arrays.\n"
        "Return only valid JSON, no markdown, no extra text."
    ),
    cost_optimizer="true",
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

@app.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    """Parse a resume file (PDF or DOCX)"""
    
    # Validate file extension
    allowed_extensions = {".pdf", ".docx"}
    file_extension = os.path.splitext(file.filename or "")[1].lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Only PDF and DOCX files are allowed."
        )
    
    # Validate file size (5MB max)
    max_size = 5 * 1024 * 1024
    file_size = await file.seek(0, 2)  # Seek to end to get size
    await file.seek(0)  # Reset to beginning
    if file_size > max_size:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum size is 5MB."
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Parse with LlamaParse
        logger.info(f"Parsing file: {file.filename}")
        parsed_doc = parser.parse_file_bytes(
            file_bytes=content,
            file_name=file.filename,
            mime_type=file.content_type or "application/pdf"
        )
        
        # Extract text content
        parsed_text = parsed_doc.text if hasattr(parsed_doc, 'text') else str(parsed_doc)
        
        # Clean up the response - remove markdown code blocks if present
        if "```json" in parsed_text:
            json_match = re.search(r"```json\s*(.*?)\s*```", parsed_text, re.DOTALL)
            if json_match:
                parsed_text = json_match.group(1)
        elif "```" in parsed_text:
            json_match = re.search(r"```\s*(.*?)\s*```", parsed_text, re.DOTALL)
            if json_match:
                parsed_text = json_match.group(1)
        
        # Parse JSON response
        resume_data = json.loads(parsed_text.strip())
        
        # Validate and normalize the response
        result = ResumeData(
            full_name=resume_data.get("full_name"),
            email=resume_data.get("email"),
            phone=resume_data.get("phone"),
            location=resume_data.get("location"),
            summary=resume_data.get("summary"),
            work_experience=[
                WorkExperience(**exp) for exp in resume_data.get("work_experience", [])
            ],
            education=[
                Education(**edu) for edu in resume_data.get("education", [])
            ],
            skills=resume_data.get("skills", []),
            languages=[
                Language(**lang) for lang in resume_data.get("languages", [])
            ],
            certifications=resume_data.get("certifications", []),
        )
        
        logger.info(f"Successfully parsed resume: {result.full_name}")
        return result.model_dump()
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to parse resume. Invalid response format."
        )
    except Exception as e:
        logger.error(f"Error parsing resume: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error parsing resume: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
