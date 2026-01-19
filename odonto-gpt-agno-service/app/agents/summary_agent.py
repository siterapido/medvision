"""Agno agent for generating dental summaries, flashcards, and mind maps"""

from agno.agent import Agent
from agno.models.openai.like import OpenAILike
from dotenv import load_dotenv
import os
import sys

# Load environment variables
load_dotenv()

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import research and artifact tools
from app.tools.research import RESEARCH_TOOLS
from app.tools.artifacts_db import save_summary, save_flashcards, save_mind_map

# Import navigation tools
from app.tools.navigation import NAVIGATION_TOOLS

# Import database config
from app.database.supabase import get_agent_config


def create_summary_agent() -> Agent:
    """
    Create an Agno agent specialized in generating dental study materials.

    Features:
    - Generates comprehensive summaries (Markdown) -> Persists to DB
    - Creates active recall flashcards (JSON) -> Persists to DB
    - Structures mind maps (JSON) -> Persists to DB
    - Uses evidence-based dental knowledge
    """
    # Configure storage
    from agno.db.postgres import PostgresDb

    db_url = os.getenv("SUPABASE_DB_URL")
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    db = PostgresDb(session_table="agent_sessions", db_url=db_url)

    # Fetch configuration from DB
    config = get_agent_config("odonto-summary")

    model_id = os.getenv("OPENROUTER_MODEL_QA", "google/gemini-2.0-flash-exp:free")
    api_key = os.getenv("OPENROUTER_API_KEY")
    base_url = "https://openrouter.ai/api/v1"

    temperature = 0.7
    max_tokens = 4096

    # Só usa config do DB se for OpenRouter (evita modelos inválidos de outros providers)
    if config:
        metadata = config.get("metadata", {}) or {}
        config_base_url = metadata.get("base_url", "")

        # Validar se é OpenRouter antes de usar config do DB
        is_openrouter = (
            "openrouter" in config_base_url.lower() if config_base_url else True
        )

        if is_openrouter:
            if config.get("model_id"):
                model_id = str(config.get("model_id"))
            if metadata.get("api_key"):
                api_key = str(metadata.get("api_key"))
            if config_base_url:
                base_url = config_base_url

            # Aplica parâmetros de geração se existirem no DB
            temp_val = config.get("temperature")
            if temp_val is not None:
                temperature = float(temp_val)

            tokens_val = config.get("max_tokens")
            if tokens_val:
                max_tokens = int(tokens_val)

    summary_agent = Agent(
        name="odonto-summary",
        model=OpenAILike(
            id=model_id,
            api_key=api_key,
            base_url=base_url,
            temperature=temperature,
            max_tokens=max_tokens,
        ),
        db=db,
        add_history_to_context=True,
        num_history_messages=2,  # Less history needed for generation tasks
        add_datetime_to_context=True,
        stream_events=True,  # Enable granular AG-UI events
        description="""Você é um Especialista em Educação Odontológica especializado em estratégias de Active Recall.
        Sua missão é transformar tópicos clínicos complexos em materiais de estudo de alto rendimento (Resumos, Flashcards e Mapas Mentais).
        """,
        instructions=[
            "## Role & Responsibilities",
            "Você é especialista em sintetizar informações odontológicas em conteúdo educacional claro e estruturado.",
            "Sua saída deve ser precisa, baseada em evidências e otimizada para retenção de conhecimento.",
            "## Critical Rules",
            "1. DO NOT WRITE THE CONTENT IN THE CHAT. YOU MUST CALL THE TOOL.",
            "2. DO NOT START WITH 'Here is the summary'. JUST CALL THE TOOL.",
            "3. Se o usuário pedir um artefato, IMEDIATAMENTE chame a ferramenta de salvamento correspondente.",
            "## Workflow & Artifact Standards",
            "### 1. SUMMARY (Resumos)",
            "- Tool: `save_summary`",
            "- Format: Markdown rico com cabeçalhos (#, ##), bullet points e negrito para termos chave.",
            "- Structure: Introdução -> Fisiopatologia/Mecanismo -> Características Clínicas -> Tratamento -> Conclusão.",
            "- Style: Didático, objetivo e técnico.",
            "### 2. FLASHCARDS",
            "- Tool: `save_flashcards`",
            "- Strategy: Active Recall (Evite perguntas de Sim/Não).",
            "- Format: JSON List of Objects. Keys must be lowercase: 'front' and 'back'.",
            "- front: Pergunta clara e direta (ex: 'Quais os 3 sinais de...').",
            "- back: Resposta concisa e completa.",
            "### 3. MIND MAP (Mapas Mentais)",
            "- Tool: `save_mind_map`",
            "- Format: JSON Tree Object (The root node itself, do not wrap in 'root' key).",
            "- Structure: O objeto deve ter 'name' (título do nó) e 'children' (lista de nós filhos).",
            "- Hierarchy: Mantenha até 3 níveis de profundidade.",
            '- JSON Schema: { "id": "1", "name": "Main Topic", "children": [ { "id": "2", "name": "Subtopic", "children": [] } ] }',
            "## Context Awareness",
            "Use o 'Additional Context' fornecido para alinhar o material gerado com o que o usuário está vendo ou estudando no momento.",
            "Se o usuário estiver visualizando um caso clínico, gere materiais relevantes para esse caso específico.",
        ],
        tools=RESEARCH_TOOLS
        + [save_summary, save_flashcards, save_mind_map]
        + NAVIGATION_TOOLS,
    )

    return summary_agent


# Create singleton instance
dental_summary_agent = create_summary_agent()
