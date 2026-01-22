"""Agente especializado em escrita acadêmica e científica (Odonto Writer)

Enhanced com:
- Templates de TCC e artigos científicos (IMRAD)
- Revisão de textos acadêmicos
- Sugestões metodológicas
- Formatação de referências bibliográficas
- Orientação em escrita científica
"""

from agno.agent import Agent
from agno.models.openai.like import OpenAILike
from dotenv import load_dotenv
from typing import Optional, Dict, Any
import os
import sys

# Load environment variables
load_dotenv()

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import academic writing tools
from app.tools.academic_templates import ACADEMIC_TOOLS
# Import citation tools
from app.tools.citation_formatter import CITATION_TOOLS
# Import research tools (for literature support)
from app.tools.research import search_pubmed, search_arxiv
# Import database config
from app.database.supabase import get_agent_config


def create_writer_agent() -> Agent:
    """
    Cria agente AGNO especializado em escrita acadêmica (Odonto Writer).
    
    Características:
    - Templates completos de TCC por especialidade
    - Templates de artigos científicos (IMRAD)
    - Revisão crítica de textos acadêmicos
    - Sugestões de metodologia de pesquisa
    - Formatação de referências bibliográficas
    - Orientação em escrita científica rigorosa
    
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
    config = get_agent_config("odonto-write")
    
    model_id = os.getenv("OPENROUTER_MODEL_QA", "google/gemma-2-27b-it:free")
    api_key = os.getenv("OPENROUTER_API_KEY")
    base_url = "https://openrouter.ai/api/v1"
    
    temperature = 0.7
    max_tokens = 4000
    
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

            # Aplica parâmetros de geração se existirem no DB
            if config.get("temperature") is not None:
                temperature = float(config.get("temperature"))
            if config.get("max_tokens"):
                max_tokens = int(config.get("max_tokens"))

    # Combine tools
    all_tools = ACADEMIC_TOOLS + CITATION_TOOLS + [search_pubmed, search_arxiv]

    odonto_write = Agent(
        name="odonto-write",
        model=OpenAILike(
            id=model_id,
            api_key=api_key,
            base_url=base_url,
            temperature=temperature,
            max_tokens=max_tokens
        ),
        db=db,
        add_history_to_context=True,
        num_history_messages=6,
        add_datetime_to_context=True,
        markdown=True,
        stream_events=True,

        # Descrição especializada profissional
        description="""Você é o Odonto Writer, um consultor de escrita acadêmica e científica.
        Sua especialidade é estruturar trabalhos (TCC, Teses), formatar normas (ABNT, Vancouver) e revisar textos para garantir rigor científico.""",

        # Instruções especializadas para escrita acadêmica
        instructions=[
            # IDENTIDADE
            "Você é o **Odonto Writer**.",
            "Seu foco é ESTRUTURA, CLAREZA e NORMATIZAÇÃO.",
            "Não escreva o trabalho pelo aluno. Oriente, revise e forneça modelos (scaffolding).",
            
            # ESTRUTURAÇÃO CIENTÍFICA (IMRAD)
            "Ao orientar artigos, exija o padrão IMRAD:",
            "- **Introduction**: O que se sabe + O gap + O objetivo.",
            "- **Methods**: Como foi feito (reprodutibilidade).",
            "- **Results**: O que foi achado (sem opiniões).",
            "- **Discussion**: O que isso significa (comparação com literatura).",
            
            # FORMATAÇÃO E CITAÇÃO
            "1. **Rigor nas Referências**: Use `format_citation` para garantir precisão.",
            "2. **ABNT**: Padrão para TCCs brasileiros (NBR 6023, 10520).",
            "3. **Vancouver**: Padrão para artigos internacionais biomédicos.",
            
            # REVISÃO DE TEXTO
            "Ao revisar (`review_academic_text`):",
            "- Aponte problemas de coesão e coerência.",
            "- Verifique se as afirmações têm citações ('citation needed').",
            "- Sugira linguagem impessoal e técnica (evite 'eu acho', 'nós fizemos').",
            
            # USO DE FERRAMENTAS
            "- Para criar roteiros: `generate_tcc_structure`.",
            "- Para templates de artigo: `generate_article_template`.",
            "- Para buscar suporte teórico: `search_pubmed` (via ferramentas integradas).",
        ],

        # Add academic writing and citation tools
        tools=all_tools,
    )

    return odonto_write


# Create singleton instance
odonto_write = create_writer_agent()
