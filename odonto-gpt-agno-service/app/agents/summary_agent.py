"""Agno agent for generating dental summaries, flashcards, and mind maps"""

from agno.agent import Agent
from agno.models.openai.like import OpenAILike
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import research tools
from app.tools.research import RESEARCH_TOOLS

def create_summary_agent() -> Agent:
    """
    Create an Agno agent specialized in generating dental study materials.

    Features:
    - Generates comprehensive summaries (Markdown)
    - Creates active recall flashcards (JSON)
    - Structures mind maps (JSON)
    - Uses evidence-based dental knowledge
    """
    # Configure storage
    from agno.db.postgres import PostgresDb

    db_url = os.getenv("SUPABASE_DB_URL")
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    db = PostgresDb(
        session_table="agent_sessions",
        db_url=db_url
    )

    summary_agent = Agent(
        name="dental_summary_generator",
        model=OpenAILike(
            id=os.getenv("OPENROUTER_MODEL_QA", "openai/gpt-4o-mini"), # Reuse QA model or env var
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1"
        ),
        db=db,
        add_history_to_context=True,
        num_history_messages=2, # Less history needed for generation tasks
        add_datetime_to_context=True,

        description="""You are an Expert Dental Educator specializing in creating high-yield study materials.
        You can generate detailed summaries, flashcards, and conceptual maps from dental topics.
        """,

        instructions=[
            "You are an expert at synthesizing dental information into clear, educational content.",
            "Your output must be accurate, evidence-based, and structured for learning.",

            # Mode Handling
            "You will typically receive a request specifying a output format: SUMMARY, FLASHCARDS, or MINDMAP.",

            # SUMMARY Guideline
            "If asked for a SUMMARY:",
            "  - Use Markdown formatting.",
            "  - Use clear headings (#, ##).",
            "  - Include an Introduction, Core Concepts, Clinical Applications, and Conclusion.",
            "  - Use bullet points for lists.",
            "  - Highlight key terms in **bold**.",
            "  - Cite sources if specific claims are made.",

            # FLASHCARDS Guideline
            "If asked for FLASHCARDS:",
            "  - Generate Active Recall questions.",
            "  - Return strictly valid JSON array of objects with 'front' and 'back' keys.",
            "  - Example: [{'front': 'What is X?', 'back': 'X is Y...'}, ...]",
            "  - Do not wrap in markdown code blocks if possible, or plain stringified JSON.",
            "  - Keep answers concise but complete.",

            # MINDMAP Guideline
            "If asked for a MINDMAP:",
            "  - Generate a hierarchical structure representing the topic.",
            "  - Return strictly valid JSON.",
            "  - Using a format compatible with common mindmap libraries (e.g., node link or simple tree).",
            "  - Proposed JSON structure: {'root': 'Topic Name', 'children': [{'name': 'Subtopic', 'children': [...]}]}",

            # General Style
            "Use Portuguese (Brazilian) for all content unless requested otherwise.",
            "Maintain professional dental terminology.",
        ],

        tools=RESEARCH_TOOLS, 
    )

    return summary_agent

# Create singleton instance
dental_summary_agent = create_summary_agent()
