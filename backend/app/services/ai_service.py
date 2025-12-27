import os
import httpx
from typing import Tuple

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

async def generate_summary(title: str, abstract: str, authors: str) -> Tuple[str, str]:
    """Generate a summary of a research study using Claude API"""
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY not set")
    
    prompt = f"""Please provide a concise summary of this exercise science research study for fitness enthusiasts and researchers. Focus on:

1. Main findings and conclusions
2. Practical applications for training
3. Study limitations
4. Key takeaways for hypertrophy and muscle growth

Study Details:
Title: {title}
Authors: {authors}
Abstract: {abstract}

Provide a clear, structured summary in 3-4 paragraphs."""

    model = "claude-sonnet-4-20250514"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            ANTHROPIC_API_URL,
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": model,
                "max_tokens": 1024,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
        )
        
        response.raise_for_status()
        data = response.json()
        
        summary_text = data["content"][0]["text"]
        
        return summary_text, model