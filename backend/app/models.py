from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Study(Base):
    __tablename__ = "studies"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    authors = Column(String)
    abstract = Column(Text)
    publication_year = Column(Integer)
    journal = Column(String)
    doi = Column(String, unique=True, index=True)
    pdf_url = Column(String)
    keywords = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    bookmarks = relationship("Bookmark", back_populates="study", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="study", cascade="all, delete-orphan")

class Bookmark(Base):
    __tablename__ = "bookmarks"
    
    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False)
    user_id = Column(String, index=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    study = relationship("Study", back_populates="bookmarks")

class Summary(Base):
    __tablename__ = "summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False)
    summary_text = Column(Text, nullable=False)
    model_used = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    study = relationship("Study", back_populates="summaries")