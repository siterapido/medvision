"""OpenAI Vision API tool for dental image analysis"""

import os
from openai import OpenAI
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def analyze_dental_image(
    image_url: str,
    question: str = "Analyze this dental image comprehensively",
    focus_area: Optional[str] = None,
    previous_context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyze a dental image using OpenAI GPT-4o Vision API.

    Args:
        image_url: Public URL of the dental image
        question: Specific question or analysis request
        focus_area: Optional specific area to focus on
        previous_context: Optional context from previous analysis

    Returns:
        Dict with:
            - analysis: Text analysis
            - findings: List of key findings
            - confidence: Confidence score (if available)
            - recommendations: List of recommendations
            - disclaimer: Required medical disclaimer
    """
    try:
        # Build prompt
        prompt_parts = [question]

        if focus_area:
            prompt_parts.append(f"\nFocus your analysis on: {focus_area}")

        if previous_context:
            prompt_parts.append(f"\nPrevious context: {previous_context}")

        system_prompt = """You are an expert dental radiologist and clinician with 20 years of experience.
Analyze dental images with precision and provide clinical insights.

Focus on:
- Anatomical structures (teeth, bone, sinuses, soft tissue)
- Pathologies (caries, abscesses, lesions, periodontal disease)
- Treatment progress (fillings, implants, orthodontics, restorations)
- Anomalies or unusual findings
- Treatment recommendations

IMPORTANT:
- Always include appropriate disclaimers about clinical examination necessity
- Use professional dental terminology
- Be clear and actionable
- Note any limitations in image quality
- Recommend professional clinical examination when appropriate"""

        # Prepare messages
        messages = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "\n".join(prompt_parts)
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url
                        }
                    }
                ]
            }
        ]

        # Call OpenAI Vision API
        response = client.chat.completions.create(
            model="gpt-4o",  # GPT-4o with vision capabilities
            messages=messages,
            max_tokens=1500,
            temperature=0.7
        )

        analysis_text = response.choices[0].message.content

        # Extract findings and recommendations
        findings = extract_findings(analysis_text)
        recommendations = extract_recommendations(analysis_text)

        return {
            "analysis": analysis_text,
            "findings": findings,
            "recommendations": recommendations,
            "confidence": None,  # OpenAI doesn't provide confidence scores
            "disclaimer": "This analysis is for educational purposes only. "
                         "Clinical examination, professional judgment, and "
                         "additional diagnostic information may be required.",
            "model": "gpt-4o-vision",
            "tokens_used": response.usage.total_tokens if response.usage else None
        }

    except Exception as e:
        raise Exception(f"Vision analysis failed: {str(e)}")


def extract_findings(analysis: str) -> List[str]:
    """
    Extract key findings from analysis text.

    Args:
        analysis: Analysis text from GPT-4o

    Returns:
        List of findings
    """
    # Simple heuristic extraction - can be improved with structured prompts
    findings = []

    lines = analysis.split("\n")
    current_findings = False

    for line in lines:
        line_lower = line.lower().strip()

        if "finding" in line_lower or "observation" in line_lower:
            current_findings = True
            continue

        if current_findings and line.startswith("-"):
            findings.append(line.strip()[1:].strip())
        elif current_findings and not line.startswith("-"):
            if line and not line[0].isdigit():
                current_findings = False

    return findings


def extract_recommendations(analysis: str) -> List[str]:
    """
    Extract recommendations from analysis text.

    Args:
        analysis: Analysis text from GPT-4o

    Returns:
        List of recommendations
    """
    recommendations = []

    lines = analysis.split("\n")
    current_recommendations = False

    for line in lines:
        line_lower = line.lower().strip()

        if "recommend" in line_lower or "suggest" in line_lower or "next step" in line_lower:
            current_recommendations = True
            continue

        if current_recommendations and line.startswith("-"):
            recommendations.append(line.strip()[1:].strip())
        elif current_recommendations and not line.startswith("-"):
            if line and not line[0].isdigit():
                current_recommendations = False

    return recommendations


def compare_images(
    before_url: str,
    after_url: str,
    treatment_type: Optional[str] = None
) -> Dict[str, Any]:
    """
    Compare two dental images (before/after treatment).

    Args:
        before_url: URL of before treatment image
        after_url: URL of after treatment image
        treatment_type: Optional type of treatment performed

    Returns:
        Comparison analysis
    """
    try:
        system_prompt = """You are an expert dental clinician comparing treatment outcomes.
Analyze the before/after images and assess:
- Treatment success and completeness
- Healing progress
- Any complications or issues
- Additional work needed"""

        messages = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"Compare these before/after images{f' for {treatment_type}' if treatment_type else ''}. "
                               "Assess treatment outcomes and provide clinical insights."
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": before_url}
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": after_url}
                    }
                ]
            }
        ]

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=1500,
            temperature=0.7
        )

        return {
            "comparison": response.choices[0].message.content,
            "disclaimer": "This comparison is for educational purposes. "
                         "Clinical assessment is required."
        }

    except Exception as e:
        raise Exception(f"Image comparison failed: {str(e)}")
