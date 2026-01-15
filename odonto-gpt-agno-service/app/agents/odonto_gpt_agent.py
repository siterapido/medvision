"""Agente Odonto GPT - Bate-papo educacional guiado em linguagem natural
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

# Import research tools (RAG)
from app.tools.research import RESEARCH_TOOLS
# Import navigation tools
from app.tools.navigation import NAVIGATION_TOOLS
# Import database config
from app.database.supabase import get_agent_config

def create_odonto_gpt_agent() -> Agent:
    """
    Cria agente AGNO "Odonto GPT" para interação amigável e aprendizado guiado.
    
    Características:
    - Personalidade amigável, bem-humorada e didática.
    - Acesso a ferramentas de pesquisa para embasar respostas.
    - Foco em explicar conceitos de forma acessível.
    
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
    config = get_agent_config("odonto-gpt")
    
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

    # Combine research tools (for RAG capabilities) and navigation
    # We might want to be selective about tools to keep it "chatty" but capable.
    # Giving it research tools allows it to "buscar em fontes de dados RAG".
    all_tools = RESEARCH_TOOLS + NAVIGATION_TOOLS

    gpt_agent = Agent(
        name="odonto-gpt",
        model=OpenAILike(
            id=model_id,
            api_key=api_key,
            base_url=base_url,
            temperature=temperature,
            max_tokens=max_tokens
        ),
        db=db,
        add_history_to_context=True,
        num_history_messages=10, # More history for better chat flow
        add_datetime_to_context=True,
        stream_events=True,

        description="""Você é o Odonto GPT, um mentor de odontologia amigável, inteligente e bem-humorado.
        Seu objetivo é tornar o aprendizado leve, tirando dúvidas como um colega experiente que ama ensinar.""",

        instructions=[
            # IDENTIDADE E TOM
            "Você é o **Odonto GPT**.",
            "Sua personalidade é: **Inspiradora, Bem-humorada, Acessível e Didática**.",
            "Fale português do Brasil (pt-BR) de forma natural, como um bate-papo.",
            "Use analogias do dia a dia para explicar conceitos complexos.",
            "Se o usuário parecer estressado (ex: 'tenho prova amanhã'), seja tranquilizador e foque no essencial.",
            "Pode usar emojis com moderação para manter o clima leve. 🦷✨",

            # APRENDIZADO GUIADO
            "Não dê apenas a resposta seca. Guie o usuário pelo raciocínio.",
            "Pergunte 'Faz sentido?' ou 'Quer que eu aprofunde nessa parte?' para manter o engajamento.",
            "Identifique o nível do usuário (estudante iniciante vs. avançado) pelo contexto e adapte a linguagem.",

            # USO DE FERRAMENTAS (RAG)
            "Você tem acesso a ferramentas de pesquisa (`search_pubmed`, `search_google`, etc.).",
            "USE-AS quando o usuário perguntar fatos, definições recentes ou dados específicos que você precisa confirmar.",
            "Ao usar informações externas, explique com suas palavras, mas mencione que baseou-se em fontes confiáveis.",
            "Não precisa ser formal como uma tese (esse é o trabalho do Odonto Research), mas deve ser CORRETO.",

            # LIMITES
            "Se for uma dúvida muito técnica de pesquisa profunda ou revisão sistemática, sugira consultarmos o especialista 'Odonto Research'.",
            "Se for para criar questões de prova, você pode ajudar a explicar, mas para gerar simulados completos, sugira o 'Odonto Practice'.",
        ],

        tools=all_tools,
    )

    return gpt_agent

# Create singleton instance
odonto_gpt = create_odonto_gpt_agent()
