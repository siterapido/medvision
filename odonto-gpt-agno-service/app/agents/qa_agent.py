"""Agente Agno para Q&A com profissionais e estudantes (Odonto QA)

Enhanced with:
- Research tools (PubMed, arXiv)
- Few-shot learning examples
- Knowledge base integration
- Evidence-based responses
"""

from agno.agent import Agent
from agno.models.openai.like import OpenAILike
from agno.models.message import Message
from dotenv import load_dotenv
from typing import Optional, Dict, Any, List
import os
import sys

# Load environment variables
load_dotenv()

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import research tools
from app.tools.research import RESEARCH_TOOLS, search_pubmed, search_arxiv, get_latest_dental_research

# Import database config
from app.database.supabase import get_agent_config
# Import few-shot examples
from data.examples import DENTAL_QA_EXAMPLES


def create_qa_agent() -> Agent:
    """
    Create an enhanced Agno agent specialized in knownledge and Q&A (Odonto QA).

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

    # Fetch configuration from DB
    config = get_agent_config("odonto-qa")
    
    model_id = os.getenv("OPENROUTER_MODEL_QA", "openai/gpt-4o-mini")
    api_key = os.getenv("OPENROUTER_API_KEY")
    base_url = "https://openrouter.ai/api/v1"

    # Só usa config do DB se for OpenRouter (evita modelos inválidos de outros providers)
    if config:
        metadata = config.get("metadata", {}) or {}
        config_base_url = metadata.get("base_url", "")
        
        # Validar se é OpenRouter antes de usar config do DB
        is_openrouter = "openrouter" in config_base_url.lower() if config_base_url else True
        
        if is_openrouter:
            if config.get("model_id"):
                model_id = config.get("model_id")
            if metadata.get("api_key"):
                api_key = metadata.get("api_key")
            if config_base_url:
                base_url = config_base_url

    # Prepare few-shot examples
    additional_context = "\n\n".join([
        f"User: {msg.content}\nAssistant: " if msg.role == "user" else msg.content
        for msg in DENTAL_QA_EXAMPLES
    ])

    qa_agent = Agent(
        name="odonto-qa",
        model=OpenAILike(
            id=model_id,
            api_key=api_key,
            base_url=base_url,
            max_tokens=4000
        ),
        db=db,
        add_history_to_context=True,
        num_history_messages=5,
        add_datetime_to_context=True,

        # Descrição aprimorada profissional
        description="""Você é o Odonto QA, uma base de conhecimento interativa.
        Responda dúvidas pontuais de forma precisa, citando fontes e evitando suposições.""",

        # Instruções abrangentes
        instructions=[
            # IDENTIDADE
            "Você é o **Odonto QA**.",
            "Uma enciclopédia odontológica viva.",
            
            # ESTILO DE RESPOSTA
            "1. **Direto ao Ponto**: Comece com a resposta resumida.",
            "2. **Detalhamento**: Use listas (bullets) para expandir.",
            "3. **Evidência**: Cite a fonte (artigo, diretriz, livro) de onde tirou a informação.",
            
            # ÉTICA
            "Nunca invente informações. Se não souber, diga 'Não encontrei evidências suficientes sobre isso no momento'.",
            "Mantenha distinção clara entre fatos estabelecidos e teorias.",
        ],

        # Add research tools for scientific literature
        tools=RESEARCH_TOOLS,

        # Add few-shot examples via additional input
        additional_input=additional_context if additional_context else None,
    )

    return qa_agent


# Create singleton instance
dental_qa_agent = create_qa_agent()
