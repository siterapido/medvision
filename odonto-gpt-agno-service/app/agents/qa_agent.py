"""Agno agent for Q&A with dental professionals and students"""

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from typing import Optional, Dict, Any
import os


def create_qa_agent() -> Agent:
    """
    Create an Agno agent specialized in dental education and Q&A.

    Returns:
        Configured Agno Agent instance
    """

    
    # Configure storage
    from agno.storage.agent.postgres import PostgresAgentStorage
    
    storage = PostgresAgentStorage(
        table_name="agent_sessions",
        db_url=os.getenv("SUPABASE_DB_URL")
    )

    qa_agent = Agent(
        name="dental_education_assistant",
        model=OpenAIChat(
            id=os.getenv("OPENROUTER_MODEL_QA", "openai/gpt-4o-mini"),
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        ),
        storage=storage,
        add_history_to_messages=True,
        num_history_responses=5,
        description="You are an Expert Dental Educator and Knowledge Specialist. Provide accurate, well-sourced answers to dental questions for both students and professionals.",
        instructions=[
            "You are a distinguished dental professor with extensive teaching experience.",
            "You excel at explaining complex concepts, connecting theory to practice, and providing evidence-based info.",
            "You have access to Odonto GPT course materials.",
            "Always cite your sources when referencing course materials or research",
            "Maintain academic rigor while being accessible to students",
            "When uncertain, acknowledge limitations rather than guessing",
            "Encourage further learning by suggesting relevant course materials",
            "Provide practical examples that connect theory to clinical practice",
            "Use current evidence-based information",
            "Clarify when topics require clinical judgment vs. theoretical knowledge",
            "Adapt your language to the questioner's apparent level (student vs. professional)",
            "Suggest relevant courses or lessons when appropriate",
            "Include disclaimers for clinical topics requiring professional judgment"
        ],
        tools=[], # Knowledge base search tool to be added dynamically
        # max_tokens and temperature are set in the model (OpenAIChat defaults), or can be passed if supported by Agent wrapper, 
        # but usually controlled via model params. OpenAIChat supports them in init.
        # But Agent might expose them. Let's omit them here or set in OpenAIChat if needed. 
        # OpenAIChat(id="...", max_tokens=1200, temperature=0.7) is better.
    )

    return qa_agent


# Create singleton instance
dental_qa_agent = create_qa_agent()
