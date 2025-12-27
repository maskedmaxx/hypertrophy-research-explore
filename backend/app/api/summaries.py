from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Study as StudyModel, Summary as SummaryModel
from app.schemas import Summary, SummaryCreate
from app.services.ai_service import generate_summary

router = APIRouter()

@router.post("/", response_model=Summary, status_code=201)
async def create_summary(summary_req: SummaryCreate, db: Session = Depends(get_db)):
    """Generate an AI summary for a study"""
    
    study = db.query(StudyModel).filter(StudyModel.id == summary_req.study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    existing_summary = db.query(SummaryModel).filter(
        SummaryModel.study_id == summary_req.study_id
    ).first()
    
    if existing_summary:
        return existing_summary
    
    try:
        summary_text, model_used = await generate_summary(
            title=study.title,
            abstract=study.abstract or "",
            authors=study.authors or ""
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")
    
    db_summary = SummaryModel(
        study_id=summary_req.study_id,
        summary_text=summary_text,
        model_used=model_used
    )
    db.add(db_summary)
    db.commit()
    db.refresh(db_summary)
    
    return db_summary

@router.get("/{study_id}", response_model=Summary)
def get_summary(study_id: int, db: Session = Depends(get_db)):
    """Get the AI summary for a study"""
    summary = db.query(SummaryModel).filter(SummaryModel.study_id == study_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    return summary