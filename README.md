# Hypertrophy Research Explorer

A comprehensive platform for discovering and analyzing scientific research on muscle hypertrophy, resistance training, and exercise science. Built to bridge the gap between academic research and practical application for athletes, coaches, and fitness enthusiasts.

## Overview

The fitness industry is flooded with conflicting advice, often lacking scientific backing. This project addresses that problem by providing direct access to peer-reviewed research, complete with AI-powered summaries that translate complex scientific findings into actionable insights.

### Key Features

- **Comprehensive Database**: Access to 200+ peer-reviewed studies from PubMed on hypertrophy, resistance training, and exercise physiology
- **Intelligent Search**: Full-text search across titles, abstracts, authors, and keywords
- **AI-Powered Summaries**: Claude-generated summaries highlighting key findings, practical applications, and study limitations
- **Direct Access**: Links to original publications and PubMed entries for deeper investigation
- **RESTful API**: Programmatic access for researchers and developers building related tools

## Technology Stack

### Backend
- **FastAPI**: High-performance Python web framework for the API layer
- **PostgreSQL**: Robust relational database for study metadata and relationships
- **SQLAlchemy**: ORM for elegant database interactions
- **Anthropic Claude**: State-of-the-art language model for generating research summaries
- **Alembic**: Database migration management

### Frontend
- **Next.js 14**: React framework with server-side rendering and optimized routing
- **TypeScript**: Type-safe development for reduced bugs and better IDE support
- **Tailwind CSS**: Utility-first styling for rapid UI development
- **React Query**: Efficient data fetching with automatic caching

### Infrastructure
- **Docker & Docker Compose**: Containerized development and deployment
- **PubMed E-utilities API**: Automated research discovery and ingestion

## Getting Started

### Prerequisites

- Docker Desktop
- Node.js 18+ (for local frontend development)
- Anthropic API key ([get one here](https://console.anthropic.com))

### Installation

1. Clone the repository
```bash
git clone https://github.com/maskedmaxx/hypertrophy-research-explore.git
cd hypertrophy-research-explore
```

2. Configure environment variables
```bash
cp .env.example .env
# Edit .env and add your Anthropic API key
```

3. Start the application
```bash
docker-compose up --build
```

The backend API will be available at `http://localhost:8000` and you can view the API documentation at `http://localhost:8000/docs`.

4. Install and run the frontend (in a separate terminal)
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Populating the Database

The project includes a PubMed scraper to automatically import relevant studies:
```bash
docker-compose exec backend python scrape_pubmed.py
```

This will fetch and parse studies related to muscle hypertrophy, resistance training, and related topics. The scraper can be customized by editing the search queries in `scrape_pubmed.py`.

## Usage

### Web Interface

Navigate to `http://localhost:3000` to:
- Browse all available studies
- Search by keywords, authors, or topics
- View detailed study information including abstracts and publication details
- Generate AI summaries for practical insights

### API Access

The REST API provides programmatic access to all functionality:

**List studies with pagination and search:**
```bash
GET /api/studies/?skip=0&limit=20&search=volume
```

**Get study details:**
```bash
GET /api/studies/1
```

**Generate AI summary:**
```bash
POST /api/summaries/
{
  "study_id": 1
}
```

Full API documentation is available at `http://localhost:8000/docs`.

## Project Structure
```
.
├── backend/
│   ├── app/
│   │   ├── api/              # API route handlers
│   │   ├── services/         # Business logic (AI summaries, etc.)
│   │   ├── models.py         # Database models
│   │   ├── schemas.py        # Request/response schemas
│   │   └── main.py           # Application entry point
│   ├── scrape_pubmed.py      # Research ingestion script
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/              # Next.js pages and layouts
│       └── lib/              # API client and utilities
└── docker-compose.yml
```

## Development

### Adding New Studies

Studies can be added through the API or by running the scraper with custom queries. To add specific topics:

1. Edit `backend/scrape_pubmed.py`
2. Add your search terms to the `queries` list
3. Run the scraper

### Database Migrations

When modifying database models:
```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

### Running Tests
```bash
cd backend
pytest
```

## Acknowledgments

- Research data sourced from PubMed via the NCBI E-utilities API
- AI summaries powered by Anthropic's Claude
- Inspired by the need for evidence-based fitness information

