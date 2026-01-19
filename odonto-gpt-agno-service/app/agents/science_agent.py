"""Agente especializado em pesquisa científica odontológica (Odonto Research)

Enhanced com:
- Motor de Pesquisa Online (Perplexity Sonar via OpenRouter)
- Ferramentas de pesquisa especializadas (PubMed, arXiv)
- Formatação de citações (ABNT, APA, Vancouver)
- Síntese de literatura científica com Chain of Thought
- Persistência de pesquisas no banco de dados com fontes estruturadas
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

# Import research tools
from app.tools.research import RESEARCH_TOOLS

# Import citation tools
from app.tools.citation_formatter import CITATION_TOOLS

# Import persistence tools
from app.tools.artifacts_db import save_research

# Import navigation tools
from app.tools.navigation import NAVIGATION_TOOLS

# Import database config
from app.database.supabase import get_agent_config

# Import few-shot examples
from data.examples import DENTAL_QA_EXAMPLES


def create_science_agent() -> Agent:
    """
    Cria agente AGNO especializado em pesquisa científica odontológica (Odonto Research).

    Características:
    - Motor: Perplexity Sonar Reasoning (Online Search nativo)
    - Acesso complementar: PubMed, arXiv
    - Formatação de citações em múltiplos padrões
    - Síntese de literatura científica com raciocínio profundo
    - Análise crítica de evidências
    - Persistência estruturada de artefatos

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
    config = get_agent_config("odonto-research")

    # Configuração: Modelo Orquestrador (com suporte a Tools) + Tool de Pesquisa Perplexity
    # Usamos um modelo inteligente e rápido para orquestrar a chamada da tool ask_perplexity e depois formatar o JSON
    model_id = os.getenv("OPENROUTER_MODEL_ORCHESTRATOR", "google/gemini-2.0-flash-001")
    api_key = os.getenv("OPENROUTER_API_KEY")
    base_url = "https://openrouter.ai/api/v1"

    # Temperatura balanceada para o orquestrador
    temperature = 0.5
    max_tokens = 4000

    # Sobrescrever com config do DB se existir
    if config:
        metadata = config.get("metadata", {}) or {}
        config_base_url = metadata.get("base_url", "")

        is_openrouter = (
            "openrouter" in config_base_url.lower() if config_base_url else True
        )

        if is_openrouter:
            # Se o DB tiver config específica de modelo, respeitamos, mas o ideal é manter o orquestrador
            if config.get("model_id"):
                model_id = config.get("model_id")
            if metadata.get("api_key"):
                api_key = metadata.get("api_key")
            if config_base_url:
                base_url = config_base_url

            if config.get("temperature") is not None:
                temperature = float(str(config.get("temperature")))
            if config.get("max_tokens"):
                max_tokens = int(str(config.get("max_tokens")))

    # Prepare few-shot examples
    additional_context = "\n\n".join(
        [
            f"User: {str(msg.content)}\nAssistant: "
            if msg.role == "user"
            else str(msg.content)
            for msg in DENTAL_QA_EXAMPLES
            if msg.content is not None
        ]
    )

    # Combine research tools and citation tools
    # ask_perplexity agora está incluído em RESEARCH_TOOLS
    all_tools = RESEARCH_TOOLS + CITATION_TOOLS + [save_research] + NAVIGATION_TOOLS

    dr_research = Agent(
        name="odonto-research",
        model=OpenAILike(
            id=str(model_id),
            api_key=str(api_key) if api_key else "",
            base_url=str(base_url),
            temperature=temperature,
            max_tokens=max_tokens,
        ),
        db=db,
        add_history_to_context=True,
        num_history_messages=5,
        add_datetime_to_context=True,
        stream_events=True,
        # Descrição especializada profissional
        description="""Você é o Odonto Research, um assistente de pesquisa avançado.
        Sua função é orquestrar pesquisas profundas usando a ferramenta `ask_perplexity` e sintetizar os resultados em artefatos estruturados.""",
        # Instruções especializadas para pesquisa híbrida
        instructions=[
            # IDENTIDADE & FLUXO
            "Você é o **Odonto Research**. Seu objetivo é criar artefatos de pesquisa de alta qualidade.",
            "Para isso, você segue um fluxo de 2 passos:",
            # PASSO 1: PESQUISA (PERPLEXITY TOOL)
            "1. **Busca Online**: Use SEMPRE a ferramenta `ask_perplexity` para responder perguntas de pesquisa.",
            "   - Esta ferramenta acessa a web em tempo real e retorna citações.",
            "   - Não responda com seu conhecimento interno se o usuário pedir uma pesquisa ou atualização.",
            "   - Use `search_pubmed` apenas como complemento se `ask_perplexity` indicar necessidade.",
            # PASSO 2: PERSISTÊNCIA (SAVE TOOL)
            "2. **Persistência**: Após receber a resposta do Perplexity:",
            "   - Analise o texto retornado.",
            "   - Extraia as URLs listadas na seção '### Fontes' (ou espalhadas pelo texto).",
            "   - Use a ferramenta `save_research` para salvar o resultado.",
            "   - O título deve ser em Português.",
            "   - Preencha o campo `content` com uma síntese bem formatada em Markdown.",
            "   - Preencha o campo `sources` com a lista de URLs encontradas: `[{'title': 'Fonte 1', 'url': '...'}]`.",
            "   - Preencha o campo `suggestions` com perguntas de follow-up.",
            # ESTRUTURA DO CONTEÚDO
            "O conteúdo final (Markdown) deve ter:",
            "  - Título claro.",
            "  - Introdução.",
            "  - Desenvolvimento (sintetizando o que o Perplexity trouxe).",
            "  - Conclusão Clínica.",
            "  - Referências Bibliográficas no final.",
            # CRÍTICO
            "NUNCA invente fontes. Use apenas o que a ferramenta `ask_perplexity` retornou.",
            "VOCÊ É OBRIGADO A CHAMAR A TOOL `save_research` PARA FINALIZAR A TAREFA. NÃO RETORNE APENAS TEXTO.",
        ],
        # Add tools
        tools=all_tools,
        # Add few-shot examples
        additional_input=[additional_context] if additional_context else None,
    )

    return dr_research


# Create singleton instance
odonto_research = create_science_agent()
