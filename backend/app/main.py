# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import studies, summaries
from app.database import engine
from app.models import Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Hypertrophy Research Explorer API",
    description="API for searching and analyzing exercise science research",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(studies.router, prefix="/api/studies", tags=["studies"])
app.include_router(summaries.router, prefix="/api/summaries", tags=["summaries"])

from app.api import claims
app.include_router(claims.router, prefix="/api/claims", tags=["claims"])

@app.get("/")
def read_root():
    return {"message": "Hypertrophy Research Explorer API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}