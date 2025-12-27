from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Study as StudyModel, Bookmark as BookmarkModel
from app.schemas import Study, StudyCreate, StudyUpdate, StudyListResponse, Bookmark, BookmarkCreate

router = APIRouter()

@router.get("/", response_model=StudyListResponse)
def list_studies(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all studies with optional search and pagination"""
    query = db.query(StudyModel)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (StudyModel.title.ilike(search_term)) |
            (StudyModel.abstract.ilike(search_term)) |
            (StudyModel.keywords.ilike(search_term)) |
            (StudyModel.authors.ilike(search_term))
        )
    
    total = query.count()
    studies = query.offset(skip).limit(limit).all()
    
    return StudyListResponse(
        total=total,
        studies=studies,
        page=skip // limit + 1,
        page_size=limit
    )

@router.get("/{study_id}", response_model=Study)
def get_study(study_id: int, db: Session = Depends(get_db)):
    """Get a specific study by ID"""
    study = db.query(StudyModel).filter(StudyModel.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    return study

@router.post("/", response_model=Study, status_code=201)
def create_study(study: StudyCreate, db: Session = Depends(get_db)):
    """Create a new study"""
    if study.doi:
        existing = db.query(StudyModel).filter(StudyModel.doi == study.doi).first()
        if existing:
            raise HTTPException(status_code=400, detail="Study with this DOI already exists")
    
    db_study = StudyModel(**study.dict())
    db.add(db_study)
    db.commit()
    db.refresh(db_study)
    return db_study

@router.patch("/{study_id}", response_model=Study)
def update_study(study_id: int, study: StudyUpdate, db: Session = Depends(get_db)):
    """Update a study"""
    db_study = db.query(StudyModel).filter(StudyModel.id == study_id).first()
    if not db_study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    update_data = study.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_study, key, value)
    
    db.commit()
    db.refresh(db_study)
    return db_study

@router.delete("/{study_id}", status_code=204)
def delete_study(study_id: int, db: Session = Depends(get_db)):
    """Delete a study"""
    study = db.query(StudyModel).filter(StudyModel.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    db.delete(study)
    db.commit()
    return None

@router.post("/{study_id}/bookmarks", response_model=Bookmark, status_code=201)
def create_bookmark(study_id: int, bookmark: BookmarkCreate, db: Session = Depends(get_db)):
    """Bookmark a study"""
    study = db.query(StudyModel).filter(StudyModel.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    db_bookmark = BookmarkModel(**bookmark.dict())
    db.add(db_bookmark)
    db.commit()
    db.refresh(db_bookmark)
    return db_bookmark

@router.get("/bookmarks/all", response_model=List[Bookmark])
def list_bookmarks(
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all bookmarks, optionally filtered by user"""
    query = db.query(BookmarkModel)
    if user_id:
        query = query.filter(BookmarkModel.user_id == user_id)
    return query.all()