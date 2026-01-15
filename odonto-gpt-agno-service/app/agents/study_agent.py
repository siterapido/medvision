"""Agente especializado em educação, questões e simulados (Odonto Practice)

Enhanced com:
- Geração de questões (múltipla escolha, dissertativas)
- Criação de simulados personalizados
- Explicações pedagógicas detalhadas
- Avaliação adaptativa de dificuldade
- Feedback construtivo
- Persistência de simulados e questões
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

# Import question generation tools
from app.tools.question_generator import QUESTION_TOOLS
# Import knowledge search
from app.tools.knowledge import search_knowledge_base
# Import persistence tools
from app.tools.artifacts_db import save_practice_exam
# Import database config
from app.database.supabase import get_agent_config
# Import navigation tools
from app.tools.navigation import NAVIGATION_TOOLS


def create_study_agent() -> Agent:
    """
    Cria agente AGNO especializado em educação e avaliação (Odonto Practice).
    
    Características:
    - Geração de questões de múltipla escolha e dissertativas
    - Criação de simulados personalizados (ENADE, residência)
    - Explicações pedagógicas detalhadas
    - Feedback construtivo e motivacional
    - Adaptação de dificuldade ao nível do aluno
    - Salvar simulados para prática posterior
    
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
    config = get_agent_config("odonto-practice")
    
    model_id = os.getenv("OPENROUTER_MODEL_QA", "google/gemma-2-27b-it:free")
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

    # Combine tools
    all_tools = QUESTION_TOOLS + [search_knowledge_base, save_practice_exam] + NAVIGATION_TOOLS

    odonto_practice = Agent(
        name="odonto-practice",
        model=OpenAILike(
            id=model_id,
            api_key=api_key,
            base_url=base_url,
            temperature=temperature,
            max_tokens=max_tokens
        ),
        db=db,
        add_history_to_context=True,
        num_history_messages=8,  # Mais histórico para acompanhar progresso do aluno
        add_datetime_to_context=True,
        stream_events=True,

        # Descrição especializada profissional
        description="""Você é o Odonto Practice, um mentor educacional focado em avaliação e consolidação de conhecimento.
        Você cria questões desafiadoras, simulados alinhados com bancas (ENADE/Residências) e fornece explicações detalhadas.""",

        # Instruções especializadas para educação
        instructions=[
            # IDENTIDADE
            "Você é o **Odonto Practice**, focado em educação e avaliação.",
            "Utilize a Metodologia Socrática: estimule o pensamento crítico com perguntas guiadas.",
            "Seja motivador mas EXIGENTE. O foco é a aprovação e a excelência clínica.",
            
            # GERAÇÃO DE QUESTÕES
            "1. **Contexto Clínico**: Questões sempre devem ter um cenário prático (paciente x anos, queixa tal).",
            "2. **Plausibilidade**: As alternativas erradas (distratores) devem ser erros comuns, não absurdos óbvios.",
            "3. **Feedback Rico**: Ao explicar a resposta, detalhe POR QUE a certa é certa e POR QUE as outras estão erradas.",
            
            # USO DE ARTEFATOS
            "Sempre que o usuário pedir um simulado ou lista de exercícios:",
            "  1. PRIMEIRO gere o conteúdo visível para o usuário.",
            "  2. EM SEGUIDA, use `save_practice_exam` para salvar a lista estruturada.",
            "  3. Defina a dificuldade (fácil/médio/difícil) e o tópico principal com precisão.",
            "  4. Obtenha o `user_id` do contexto.",
            
            # ADAPTABILIDADE
            "- Se o usuário errar, explique o conceito fundamental e ofereça uma questão mais simples de reforço.",
            "- Se acertar tudo, proponha um 'Desafio Clínico' mais complexo.",
            "Não apenas dê o gabarito. Ensine o raciocínio diagnóstico.",
            
            # INTEGRIDADE
            "Nunca forneça questões reais copiadas de provas recentes (proteção de direitos autorais). Crie questões originais similares (isomórficas).",
        ],

        # Add question generation and knowledge tools
        tools=all_tools,
    )

    return odonto_practice


# Create singleton instance
odonto_practice = create_study_agent()
