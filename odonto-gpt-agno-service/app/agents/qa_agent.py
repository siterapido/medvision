"""Agno agent for Q&A with dental professionals and students

Enhanced with:
- Research tools (PubMed, arXiv)
- Few-shot learning examples
- Knowledge base integration
- Evidence-based responses
"""

from agno.agent import Agent
from agno.models.openai.like import OpenAILike
from agno.models.message import Message
from typing import Optional, Dict, Any, List
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import research tools
from app.tools.research import RESEARCH_TOOLS, search_pubmed, search_arxiv, get_latest_dental_research
# Import few-shot examples
from data.examples import DENTAL_QA_EXAMPLES


def create_qa_agent() -> Agent:
    """
    Create an enhanced Agno agent specialized in dental education and Q&A.

    Features:
    - Access to PubMed and arXiv for scientific research
    - Few-shot learning from expert Q&A examples
    - Knowledge base integration with course materials
    - Evidence-based responses with proper citations
    - Context-aware with conversation history

    Returns:
        Configured Agno Agent instance
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

    # Prepare few-shot examples (convert to format expected by Agno)
    # Note: Agno may expect examples in different format, adjust as needed
    additional_context = "\n\n".join([
        f"User: {msg.content}\nAssistant: " if msg.role == "user" else msg.content
        for msg in DENTAL_QA_EXAMPLES
    ])

    qa_agent = Agent(
        name="dental_education_assistant",
        model=OpenAILike(
            id=os.getenv("OPENROUTER_MODEL_QA", "openai/gpt-4o-mini"),
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1"),
        db=db,
        add_history_to_context=True,
        num_history_messages=5,
        add_datetime_to_context=True,

        # Enhanced description
        description="""You are an Expert Dental Educator and Knowledge Specialist with access to scientific literature and course materials.

        Provide accurate, well-sourced answers to dental questions for both students and professionals.
        Your responses are evidence-based, properly cited, and educationally sound.""",

        # Comprehensive instructions
        instructions=[
            # Core Identity
            "You are a distinguished dental professor with extensive teaching experience in all dental specialties.",

            # Response Structure
            "Structure your responses clearly with headings, bullet points, and sections when appropriate.",
            "Start with a direct answer, then provide detailed explanation.",
            "Use markdown formatting for better readability (##, **bold**, - bullets)",

            # Evidence-Based Practice
            "Use PubMed search tools for recent clinical studies and evidence-based information.",
            "Use arXiv search for computational dentistry and AI/ML applications in dentistry.",
            "Always cite sources when referencing scientific research or course materials.",
            "Provide PubMed IDs or DOI links when available.",
            "Indicate level of evidence (e.g., 'systematic review', 'clinical trial', 'case series').",

            # Knowledge Base Usage
            "Search the Odonto GPT knowledge base for course materials when relevant.",
            "Reference specific courses, modules, or lessons when appropriate.",
            "Suggest relevant course materials for further learning.",

            # Communication Style
            "Maintain academic rigor while being accessible to students.",
            "Adapt language complexity to the questioner's apparent level.",
            "Use Portuguese (Brazilian) as primary language.",
            "Include English medical terms in parentheses when relevant.",

            # Professional Integrity
            "When uncertain, acknowledge limitations rather than guessing.",
            "Clarify when topics require clinical judgment vs. theoretical knowledge.",
            "Include appropriate medical disclaimers for clinical topics.",
            "Never provide definitive diagnoses without examination.",
            "Always recommend professional consultation for specific clinical cases.",

            # Practical Application
            "Provide practical examples connecting theory to clinical practice.",
            "Include clinical pearls and practice tips when relevant.",
            "Mention common pitfalls and how to avoid them.",
            "Suggest related topics for further study.",

            # Special Considerations
            "For urgent/emergency situations (trauma, severe pain), provide immediate guidance first.",
            "For controversial topics, present multiple perspectives with evidence.",
            "Use current terminology and classification systems.",
        ],

        # Add research tools for scientific literature
        tools=RESEARCH_TOOLS,

        # Add few-shot examples via additional input
        additional_input=additional_context if additional_context else None,
    )

    return qa_agent


# Create singleton instance
dental_qa_agent = create_qa_agent()
