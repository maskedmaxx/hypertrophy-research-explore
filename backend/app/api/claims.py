from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Literal
from app.database import get_db
from app.models import Study as StudyModel
from app.services.claim_validator import validate_claim_against_studies

router = APIRouter()

class ClaimRequest(BaseModel):
    claim: str

class KeyStudy(BaseModel):
    id: int
    title: str
    finding: str

class EvidenceBreakdown(BaseModel):
    supporting: int
    mixed: int
    refuting: int

class ValidationResponse(BaseModel):
    verdict: Literal["SUPPORTED", "PARTIALLY_SUPPORTED", "NOT_SUPPORTED", "INSUFFICIENT_EVIDENCE"]
    confidence: Literal["high", "moderate", "low"]
    summary: str
    evidence: EvidenceBreakdown
    key_studies: List[KeyStudy]
    bottom_line: str

@router.post("/validate", response_model=ValidationResponse)
async def validate_fitness_claim(
    request: ClaimRequest,
    db: Session = Depends(get_db)
):
    """
    Validate a fitness claim against scientific research
    """
    if not request.claim or len(request.claim.strip()) < 10:
        raise HTTPException(
            status_code=400, 
            detail="Claim must be at least 10 characters long"
        )
    
    # Extract keywords from claim for searching
    keywords = extract_keywords(request.claim)
    
    # Search for relevant studies
    relevant_studies = search_relevant_studies(db, keywords)
    
    if len(relevant_studies) == 0:
        return ValidationResponse(
            verdict="INSUFFICIENT_EVIDENCE",
            confidence="low",
            summary="We don't have enough relevant studies in our database to validate this claim.",
            evidence=EvidenceBreakdown(supporting=0, mixed=0, refuting=0),
            key_studies=[],
            bottom_line="More research needed. Try rephrasing your claim or check back as we add more studies."
        )
    
    # Use AI to validate claim against studies
    try:
        result = await validate_claim_against_studies(
            claim=request.claim,
            studies=relevant_studies
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to validate claim: {str(e)}"
        )

def extract_keywords(claim: str) -> List[str]:
    """
    Extract relevant keywords from a claim for database search
    Simple implementation - can be enhanced later
    """
    # Remove common words and extract meaningful terms
    stop_words = {
        'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
        'could', 'may', 'might', 'must', 'can', 'to', 'for', 'of', 'in', 'on',
        'at', 'by', 'with', 'from', 'up', 'about', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
        'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
        'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
        'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'you', 'your',
        'need', 'needs'
    }
    
    words = claim.lower().split()
    keywords = [word.strip('.,!?;:') for word in words if word.lower() not in stop_words and len(word) > 3]
    
    # Return unique keywords
    return list(set(keywords))

def search_relevant_studies(db: Session, keywords: List[str], limit: int = 15) -> List[StudyModel]:
    """
    Search database for studies relevant to the keywords
    """
    if not keywords:
        return []
    
    # Build search query
    query = db.query(StudyModel)
    
    # Search across title, abstract, and keywords fields
    search_conditions = []
    for keyword in keywords:
        search_term = f"%{keyword}%"
        search_conditions.append(
            (StudyModel.title.ilike(search_term)) |
            (StudyModel.abstract.ilike(search_term)) |
            (StudyModel.keywords.ilike(search_term))
        )
    
    # Combine with OR logic
    if search_conditions:
        from sqlalchemy import or_
        query = query.filter(or_(*search_conditions))
    
    # Return limited results
    return query.limit(limit).all()