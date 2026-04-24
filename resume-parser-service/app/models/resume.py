from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class PersonalInfo(BaseModel):
    firstName: str = ""
    lastName: str = ""
    title: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    summary: str = ""

class ExperienceEntry(BaseModel):
    id: str
    title: str = ""
    company: str = ""
    period: str = ""
    description: str = ""
    bullets: List[str] = Field(default_factory=list)

class DynamicSection(BaseModel):
    id: str
    type: str  # "education", "skills", "projects", etc.
    title: str = ""
    content: str = ""

class ResumeData(BaseModel):
    personal: PersonalInfo
    experience: List[ExperienceEntry] = Field(default_factory=list)
    dynamicSections: List[DynamicSection] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = None

class ParseResponse(BaseModel):
    personal: Dict[str, Any]
    experience: List[Dict[str, Any]]
    dynamicSections: List[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]] = None
