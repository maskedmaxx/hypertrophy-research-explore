import os
import httpx
from typing import List
from app.models import Study as StudyModel

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

async def validate_claim_against_studies(claim: str, studies: List[StudyModel]):
    """
    Use Claude to validate a fitness claim against relevant studies
    """
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY not set")
    
    # Format studies for the prompt
    studies_text = ""
    for i, study in enumerate(studies, 1):
        studies_text += f"\n\nStudy {i}:\n"
        studies_text += f"Title: {study.title}\n"
        studies_text += f"Authors: {study.authors or 'N/A'}\n"
        studies_text += f"Year: {study.publication_year or 'N/A'}\n"
        studies_text += f"Abstract: {study.abstract or 'No abstract available'}\n"
    
    prompt = f"""You are an expert exercise scientist analyzing a fitness claim against scientific research.

CLAIM TO VALIDATE:
"{claim}"

RELEVANT RESEARCH STUDIES:
{studies_text}

Based on these studies, provide a structured analysis in the following JSON format:

{{
  "verdict": "SUPPORTED" | "PARTIALLY_SUPPORTED" | "NOT_SUPPORTED" | "INSUFFICIENT_EVIDENCE",
  "confidence": "high" | "moderate" | "low",
  "summary": "2-3 sentence summary of what the research shows",
  "evidence": {{
    "supporting": <number of studies that support the claim>,
    "mixed": <number of studies with mixed/nuanced findings>,
    "refuting": <number of studies that contradict the claim>
  }},
  "key_studies": [
    {{
      "id": <study number from 1-{len(studies)}>,
      "title": "study title",
      "finding": "1 sentence on what this study found regarding the claim"
    }}
  ],
  "bottom_line": "2-3 sentences with the practical takeaway"
}}

Guidelines:
- SUPPORTED: Strong evidence supporting the claim
- PARTIALLY_SUPPORTED: Some evidence supports it but with important caveats/context
- NOT_SUPPORTED: Evidence contradicts the claim
- INSUFFICIENT_EVIDENCE: Studies don't directly address this claim

- Confidence HIGH: Multiple high-quality studies with consistent findings
- Confidence MODERATE: Some studies but mixed results or methodological limitations
- Confidence LOW: Very limited or indirect evidence

Be specific with numbers and cite which studies support/refute the claim. Include the 3-5 most relevant studies in key_studies.

Respond ONLY with valid JSON, no additional text."""

    model = "claude-sonnet-4-20250514"
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            ANTHROPIC_API_URL,
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": model,
                "max_tokens": 2048,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
        )
        
        response.raise_for_status()
        data = response.json()
        
        response_text = data["content"][0]["text"]
        
        # Parse JSON response
        import json
        
        # Clean up response if it has markdown code blocks
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        
        result = json.loads(response_text.strip())
        
        # Map study IDs to actual database IDs
        key_studies_with_ids = []
        for key_study in result.get("key_studies", []):
            study_idx = key_study.get("id", 1) - 1  # Convert to 0-based index
            if 0 <= study_idx < len(studies):
                key_studies_with_ids.append({
                    "id": studies[study_idx].id,  # Use actual database ID
                    "title": key_study.get("title", studies[study_idx].title),
                    "finding": key_study.get("finding", "")
                })
        
        result["key_studies"] = key_studies_with_ids
        
        return result