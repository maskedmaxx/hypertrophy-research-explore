from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class StudyBase(BaseModel):
    title: str
    authors: Optional[str] = None
    abstract: Optional[str] = None
    publication_year: Optional[int] = None
    journal: Optional[str] = None
    doi: Optional[str] = None
    pdf_url: Optional[str] = None
    keywords: Optional[str] = None

class StudyCreate(StudyBase):
    pass

class StudyUpdate(BaseModel):
    title: Optional[str] = None
    authors: Optional[str] = None
    abstract: Optional[str] = None
    publication_year: Optional[int] = None
    journal: Optional[str] = None
    pdf_url: Optional[str] = None
    keywords: Optional[str] = None

class Study(StudyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class BookmarkBase(BaseModel):
    study_id: int
    notes: Optional[str] = None
    user_id: Optional[str] = None

class BookmarkCreate(BookmarkBase):
    pass

class Bookmark(BookmarkBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class SummaryCreate(BaseModel):
    study_id: int

class Summary(BaseModel):
    id: int
    study_id: int
    summary_text: str
    model_used: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class StudyListResponse(BaseModel):
    total: int
    studies: List[Study]
    page: int
    page_size: int