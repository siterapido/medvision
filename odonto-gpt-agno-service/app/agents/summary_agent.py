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

    db = PostgresDb(
        session_table="agent_sessions",
        db_url=db_url
    )

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

    summary_agent = Agent(
        name="odonto-summary",
        model=OpenAILike(
            id=model_id,
            api_key=api_key,
            base_url=base_url,
            temperature=temperature,
            max_tokens=max_tokens
        ),
        db=db,
        add_history_to_context=True,
        num_history_messages=2, # Less history needed for generation tasks
        add_datetime_to_context=True,
        stream_events=True, # Enable granular AG-UI events

        description="""Você é um Especialista em Educação Odontológica especializado na criação de materiais de estudo de alto rendimento.
        Você pode gerar resumos detalhados, flashcards e mapas conceituais a partir de tópicos odontológicos.
        Sua principal função é criar e salvar esses materiais no banco de dados.
        """,

        instructions=[
            "Você é especialista em sintetizar informações odontológicas em conteúdo educacional claro.",
            "Sua saída deve ser precisa, baseada em evidências e estruturada para o aprendizado.",
            "CRITICAL: DO NOT WRITE THE CONTENT IN THE CHAT. YOU MUST CALL THE TOOL.",
            "DO NOT START WITH 'Here is the summary'. JUST CALL THE TOOL.",
            "If the user asks for a summary, IMMEDIATELY call `save_summary`.",
            "VOCÊ DEVE SEMPRE USAR AS FERRAMENTAS DE SALVAMENTO PARA PERSISTIR O CONTEÚDO GERADO.",

            # Tratamento de Modo
            "Se o usuário pedir um RESUMO:",
            "  1. Gere o conteúdo em Markdown com títulos claros (#, ##).",
            "  2. Identifique o tópico principal e palavras-chave (tags).",
            "  3. USE a ferramenta `save_summary` para salvar o resultado.",
            "  4. A resposta final para o usuário deve ser uma breve confirmação, pois o conteúdo estará no artefato salvo.",

            # Diretrizes para FLASHCARDS
            "Se o usuário pedir FLASHCARDS:",
            "  1. Gere perguntas de Recall Ativo (frente/verso).",
            "  2. Construa a lista de objetos.",
            "  3. USE a ferramenta `save_flashcards` para salvar.",

            # Diretrizes para MAPA MENTAL
            "Se o usuário pedir MAPA MENTAL:",
            "  1. Estruture a hierarquia do tópico em um formato de árvore JSON.",
            "  2. O formato de `map_data` deve ser: { \"root\": { \"id\": \"1\", \"label\": \"Tópico\", \"children\": [...] } }.",
            "  3. Cada nó deve ter `id`, `label` e opcionalmente `children` (lista de nós).",
            "  4. USE a ferramenta `save_mind_map` para salvar.",

            # Estilo Geral
            "Use Português (Brasil).",
            "Mantenha terminologia profissional.",
            
            # Contexto e Navegação (CopilotKit)
            "Você tem consciência do que o usuário está vendo na tela através do 'Additional Context' no prompt.",
            "Use o conteúdo atual da tela para contextualizar a geração de novos materiais (ex: criar flashcards baseados em um resumo aberto).",
            "Você pode sugerir a navegação para diferentes partes do app. No momento, o sistema de navegação é assistido; você pode indicar para onde o usuário deve ir.",
        ],

        tools=RESEARCH_TOOLS + [save_summary, save_flashcards, save_mind_map] + NAVIGATION_TOOLS, 
    )

    return summary_agent

# Create singleton instance
dental_summary_agent = create_summary_agent()
