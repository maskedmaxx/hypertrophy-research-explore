import os
import httpx
from typing import Tuple

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

async def generate_summary(title: str, abstract: str, authors: str) -> Tuple[str, str]:
    """Generate a comprehensive summary of a research study using Claude API"""
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY not set")
    
    prompt = f"""You are an expert exercise scientist and research analyst. Provide a comprehensive, in-depth analysis of this research study for fitness professionals, coaches, and serious athletes.

Study Details:
Title: {title}
Authors: {authors}
Abstract: {abstract}

Create a detailed analysis covering:

## Study Overview
- Research question and hypothesis
- Study design and methodology
- Participant characteristics (sample size, demographics, training status)

## Key Findings
- Primary outcomes with specific numbers and effect sizes
- Secondary findings
- Statistical significance and practical significance
- How results compare to previous research

## Practical Applications
- Specific training recommendations with sets, reps, frequency
- Who this applies to (beginners, intermediate, advanced)
- How to implement these findings in real programs
- Potential modifications for different goals

## Mechanisms and Theory
- Biological/physiological mechanisms behind the results
- Why these results occurred
- Theoretical implications for hypertrophy

## Study Limitations
- Sample size and statistical power
- Specific population limitations
- Methodological constraints
- External validity concerns
- What we still don't know

## Critical Analysis
- Strengths of the study design
- Weaknesses or potential confounds
- How confident should we be in these results
- Conflicts with other research (if applicable)

## Bottom Line
- Single most important takeaway
- Confidence level in recommendations (high/moderate/low)
- Who should care about this research

Be specific with numbers, percentages, and measurements. Write in clear, accessible language while maintaining scientific accuracy. Aim for depth over brevity."""

    model = "claude-sonnet-4-20250514"
    
    async with httpx.AsyncClient(timeout=60.0) as client:  # Increased timeout
        response = await client.post(
            ANTHROPIC_API_URL,
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": model,
                "max_tokens": 4096,  # Increased from 1024 for longer responses
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
        )
        
        response.raise_for_status()
        data = response.json()
        
        summary_text = data["content"][0]["text"]
        
        return summary_text, model