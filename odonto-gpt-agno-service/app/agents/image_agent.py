"""Agno agent for dental image analysis"""

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.openai import OpenAITools
import os


def create_image_analysis_agent() -> Agent:
    """
    Create an Agno agent specialized in dental image analysis.

    Returns:
        Configured Agno Agent instance
    """

    
    # Configure storage
    from agno.storage.agent.postgres import PostgresAgentStorage
    
    storage = PostgresAgentStorage(
        table_name="agent_sessions",
        db_url=os.getenv("SUPABASE_DB_URL")
    )

    image_agent = Agent(
        name="dental_image_analyzer",
        model=OpenAIChat(
            id=os.getenv("OPENROUTER_MODEL_IMAGE", "openai/gpt-4o"),
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        ), # GPT-4o has native vision
        storage=storage,
        add_history_to_messages=True,
        num_history_responses=3,
        description="You are an Expert Dental Radiologist and Clinician. Analyze dental images with clinical precision.",
        instructions=[
            "You are an experienced dental radiologist with 20 years of experience.",
            "You have a keen eye for anatomical structures, pathologies, and treatment assessment.",
            "CRITICAL: Always include disclaimers that your analysis is for educational purposes",
            "Always recommend professional clinical examination for definitive diagnosis",
            "Focus on actual findings in the image, avoid speculation",
            "Use professional dental terminology accurately",
            "Structure your analysis clearly: findings, interpretation, recommendations",
            "Note any limitations in image quality that affect your analysis",
            "When uncertain, state so explicitly rather than guessing",
            "Provide specific, actionable recommendations when appropriate",
            "Consider differential diagnoses when relevant",
            "Highlight urgent findings that require immediate attention"
        ],
        # OpenAIChat supports tools natively if passed in Agent or Model. 
        # But 'tools' arg in Agent should be a list of Toolkit or Tool objects.
        # OpenAITools in original code suggests it was a Toolkit.
        # We'll keep it if it adheres to Toolkit interface, otherwise remove if not needed for Vision (GPT-4o Vision is native).
        # Actually, GPT-4o doesn't need "tools" for vision input, just the image in the message.
        # But if OpenAITools provides other utilities, we keep it. 
        # Assuming OpenAITools (from agno.tools.openai) is a Toolkit.
        tools=[
             OpenAITools(
                model="gpt-4o",
                vision=True,
                description="Analyze dental images with GPT-4o Vision API"
            )
        ],
    )

    return image_agent


# Create singleton instance
dental_image_agent = create_image_analysis_agent()
