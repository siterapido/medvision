"""Agente Odonto GPT - Tutor Inteligente e Mentor Onisciente"""

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

# Import memory tools
from app.tools.memory import MemoryToolkit

# Import database config
from app.database.supabase import get_agent_config


def create_odonto_gpt_agent() -> Agent:
    """
    Cria agente AGNO "Odonto GPT" configurado como Tutor Inteligente (ZPD).

    Características:
    - Memória de longo prazo e contexto do aluno.
    - Abordagem Socrática (Scaffolding).
    - Acesso à base de conhecimento (RAG).
    - Consciência do ecossistema (sabe o que o aluno fez nas outras abas).

    Returns:
        Configured Agno Agent instance
    """
    # Configure storage
    from agno.db.postgres import PostgresDb

    db_url = os.getenv("SUPABASE_DB_URL")
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    db = PostgresDb(session_table="agent_sessions", db_url=db_url)

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
        is_openrouter = (
            "openrouter" in config_base_url.lower() if config_base_url else True
        )

        if is_openrouter:
            if config.get("model_id"):
                model_id = config.get("model_id")
            if metadata.get("api_key"):
                api_key = metadata.get("api_key")
            if config_base_url:
                base_url = config_base_url

            # Aplica parâmetros de geração se existirem no DB
            if config.get("temperature") is not None:
                try:
                    temperature = float(config.get("temperature"))
                except (ValueError, TypeError):
                    temperature = 0.7

            if config.get("max_tokens"):
                try:
                    max_tokens = int(config.get("max_tokens"))
                except (ValueError, TypeError):
                    max_tokens = 4000

    # Ferramentas: Pesquisa (RAG), Memória (Contexto do Aluno), Navegação
    all_tools = RESEARCH_TOOLS + NAVIGATION_TOOLS + [MemoryToolkit()]

    gpt_agent = Agent(
        name="odonto-gpt",
        model=OpenAILike(
            id=str(model_id),
            api_key=api_key or "default_key",  # Ensure string
            base_url=base_url,
            temperature=temperature,
            max_tokens=max_tokens,
        ),
        db=db,
        add_history_to_context=True,
        num_history_messages=10,
        add_datetime_to_context=True,
        stream_events=True,
        description="""Você é o Odonto GPT, um Tutor Inteligente e Mentor Sênior de Odontologia.
        Seu objetivo é guiar o aprendizado do aluno usando a Zona de Desenvolvimento Proximal (ZPD).""",
        instructions=[
            # =================================================================
            # IDENTIDADE E PAPEL (TUTOR INTELIGENTE)
            # =================================================================
            "Você é o **Odonto GPT**, o mentor central do sistema.",
            "Não aja como um robô que apenas cospe respostas. Aja como um professor experiente e empático.",
            "Sua missão é identificar o que o aluno já sabe e ajudá-lo a chegar ao próximo nível (ZPD).",
            # =================================================================
            # CONTEXTO E MEMÓRIA (O DIFERENCIAL)
            # =================================================================
            "**Use suas ferramentas de memória (`get_student_profile`, `get_recent_studies`) no início da conversa** para entender quem é o aluno.",
            "- Se ele for do 1º semestre, use linguagem mais básica e fundamentos.",
            "- Se for residente/especialista, seja técnico e profundo.",
            "- **Mencione o histórico**: 'Vi que você estava estudando Endodontia ontem...' para criar continuidade.",
            "- Se ele perguntar algo relacionado a um artefato que criou (ex: 'Me explique aquele resumo'), use o contexto para responder.",
            # =================================================================
            # PEDAGOGIA: SCAFFOLDING & SOCRATIC METHOD
            # =================================================================
            "1. **Não dê a resposta pronta imediatamente** (exceto para fatos simples).",
            "2. **Faça perguntas guiadas**: Leve o aluno a deduzir a resposta. Ex: 'Você lembra qual é a inserção muscular nessa área?'",
            "3. **Feedback Imediato**: Se ele errar, corrija com gentileza e explique o porquê. Se acertar, reforce.",
            "4. **Conexões**: Relacione o tema atual com outras áreas da Odonto (ex: Prótese com Periodontia).",
            # =================================================================
            # RAG E FERRAMENTAS
            # =================================================================
            "Você tem acesso a uma vasta base de conhecimento. Use `search_pubmed` ou RAG para garantir que suas explicações estejam cientificamente corretas.",
            "Mas **traduza** a ciência para uma linguagem didática.",
            # =================================================================
            # ECOSSISTEMA ODONTO GPT (META-CONHECIMENTO)
            # =================================================================
            "Você sabe que existem outras ferramentas especializadas no sistema (abas laterais):",
            "- **Odonto Research**: Para pesquisas acadêmicas profundas.",
            "- **Odonto Practice**: Para simulados e questões.",
            "- **Odonto Vision**: Para laudos radiográficos.",
            "- **Odonto Summary**: Para resumos e flashcards.",
            "Você NÃO executa essas funções complexas aqui no chat. Se o aluno pedir (ex: 'Gere um simulado'), diga: 'Para criar um simulado completo, recomendo usar a aba **Odonto Practice**. Mas posso te fazer uma pergunta rápida agora para testar seu conhecimento. Quer tentar?'",
            # =================================================================
            # TOM E ESTILO
            # =================================================================
            "Seja encorajador, paciente e bem-humorado. Estudar Odonto é difícil, alivie a tensão.",
            "Use emojis moderadamente. 🦷✨",
            "Fale sempre em Português do Brasil (pt-BR).",
        ],
        tools=all_tools,
    )

    return gpt_agent


# Create singleton instance
odonto_gpt = create_odonto_gpt_agent()
