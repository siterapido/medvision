"""Multi-agent team for coordinated dental AI tasks"""

from agno import Team
from .image_agent import dental_image_agent
from .qa_agent import dental_qa_agent
from typing import List, Dict, Any, Optional


def create_dental_care_team() -> Team:
    """
    Create a multi-agent team for coordinated dental care tasks.

    Returns:
        Configured Agno Team instance
    """

    
    # Configure storage
    from agno.storage.agent.postgres import PostgresAgentStorage
    import os
    
    storage = PostgresAgentStorage(
        table_name="team_sessions",
        db_url=os.getenv("SUPABASE_DB_URL")
    )

    dental_team = Team(
        name="dental_care_team",
        agents=[dental_image_agent, dental_qa_agent],
        storage=storage,
        # add_history_to_messages=True, # Team manages history implicitly usually
        instructions=[
            "Coordinate effectively to provide comprehensive dental insights",
            "Share relevant context between agents when beneficial",
            "Prioritize patient safety and professional standards",
            "Ensure all responses include appropriate disclaimers",
            "When both image analysis and Q&A are needed, work sequentially:",
            "  1. Image analyzer provides clinical findings",
            "  2. Q&A agent supplements with educational context",
            "  3. Synthesize coherent response combining both insights",
            "Avoid redundant information in team responses",
            "Each agent should focus on their specialty"
        ],
        process="sequential",  # Agents work in sequence
        # manager_llm="gpt-4o",  # Manager uses more capable model
        model=OpenAIChat(
            id=os.getenv("OPENROUTER_MODEL_QA", "openai/gpt-4o"),
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        ),
        description="Multi-agent team for dental image analysis and Q&A"
    )

    return dental_team


# Create singleton instance
dental_team = create_dental_care_team()


def route_to_appropriate_agent(
    user_message: str,
    has_image: bool = False
) -> str:
    """
    Route request to appropriate agent based on content.

    Args:
        user_message: User's message
        has_image: Whether an image is attached

    Returns:
        Agent type: 'image', 'qa', or 'team'
    """
    # Image-related keywords
    image_keywords = [
        'analyze', 'diagnos', 'x-ray', 'radiograph', 'photo', 'image',
        'picture', 'show', 'look at', 'examine', 'interpret'
    ]

    # Q&A keywords
    qa_keywords = [
        'what is', 'how to', 'explain', 'why', 'when to', 'definition',
        'difference', 'compare', 'procedure', 'technique', 'protocol'
    ]

    message_lower = user_message.lower()

    has_image_request = any(keyword in message_lower for keyword in image_keywords)
    has_qa_request = any(keyword in message_lower for keyword in qa_keywords)

    if has_image and has_image_request:
        # If image present and analysis requested
        if has_qa_request:
            # Both image analysis and explanation needed
            return 'team'
        return 'image'
    elif has_qa_request:
        return 'qa'
    else:
        # Default: use Q&A agent for general questions
        return 'qa'


async def run_agent(
    agent_type: str,
    message: str,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Run appropriate agent or team based on type.

    Args:
        agent_type: Type of agent ('image', 'qa', 'team')
        message: User message
        context: Additional context (image URL, session ID, etc.)

    Returns:
        Agent response
    """
    try:
        if agent_type == 'image':
            # Image analysis agent
            response = await dental_image_agent.run(
                message,
                context=context or {}
            )
            return {
                'response': response.response,
                'agent': 'image-analysis',
                'tool_calls': response.tool_calls if hasattr(response, 'tool_calls') else []
            }

        elif agent_type == 'qa':
            # Q&A agent
            response = await dental_qa_agent.run(
                message,
                context=context or {}
            )
            return {
                'response': response.response,
                'agent': 'qa',
                'sources': response.sources if hasattr(response, 'sources') else []
            }

        elif agent_type == 'team':
            # Multi-agent team
            response = await dental_team.run(
                message,
                context=context or {}
            )
            return {
                'response': response.response,
                'agent': 'team',
                'participants': response.participants if hasattr(response, 'participants') else []
            }

        else:
            raise ValueError(f"Unknown agent type: {agent_type}")

    except Exception as e:
        raise Exception(f"Agent execution failed: {str(e)}")
