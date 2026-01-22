"""Equipe multi-agente para tarefas educacionais odontológicas coordenadas

Agentes especializados:
- Odonto Research: Pesquisa científica e literatura
- Odonto Practice: Questões, simulados e avaliação
- Odonto Writer: Escrita acadêmica (TCCs, artigos)
- Odonto Vision: Análise de imagens
- Odonto Summary: Resumos, flashcards e mapas mentais
"""

from agno.team import Team
from agno.agent import Agent
from agno.models.openai import OpenAIChat

from .odonto_gpt_agent import odonto_gpt
from .image_agent import odonto_vision
from .science_agent import odonto_research
from .study_agent import odonto_practice
from .writer_agent import odonto_write
from .summary_agent import dental_summary_agent
from app.tools.navigation import NAVIGATION_TOOLS
from app.database.supabase import get_agent_config
from app.router import hybrid_router
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import os
import logging
import re

# Load environment variables
load_dotenv()

# Configurar logger
logger = logging.getLogger(__name__)


def create_dental_education_team() -> Team:
    """
    Cria equipe multi-agente para educação odontológica coordenada.

    Returns:
        Configured Agno Team instance
    """

    # Configure storage
    from agno.db.postgres import PostgresDb

    db_url = os.getenv("SUPABASE_DB_URL")
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    db = PostgresDb(session_table="agent_sessions", db_url=db_url)

    # Fetch configuration from DB
    config = get_agent_config("odonto-flow")

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
                temperature = float(config.get("temperature"))
            if config.get("max_tokens"):
                max_tokens = int(config.get("max_tokens"))

    odonto_gpt_team = Team(
        name="odonto-gpt-team",
        members=[
            odonto_research,
            odonto_practice,
            odonto_write,
            odonto_vision,
            dental_summary_agent,
            odonto_gpt,
        ],
        db=db,
        markdown=True,
        add_datetime_to_context=True,
        stream_events=True,
        instructions=[
            # =================================================================
            # IDENTIDADE E PERSONALIDADE (Unificada do Odonto GPT)
            # =================================================================
            "Você é o **Odonto GPT**, o assistente central inteligente da Odonto Suite.",
            "Sua personalidade é: **Inspiradora, Bem-humorada, Acessível e Didática**.",
            "Fale português do Brasil (pt-BR) de forma natural, como um bate-papo entre colegas.",
            "Use analogias do dia a dia para explicar conceitos complexos.",
            "Pode usar emojis com moderação para manter o clima leve. 🦷✨",
            # =================================================================
            # ORQUESTRAÇÃO E DELEGAÇÃO INTELIGENTE
            # =================================================================
            "Você é capaz de responder a maioria das dúvidas gerais diretamente.",
            "No entanto, você tem uma equipe de especialistas à sua disposição. DELEGUE tarefas quando necessário:",
            "- **Pesquisa Científica/Artigos**: Se o usuário pedir fontes, papers, ou uma revisão bibliográfica profunda -> Chame **Odonto Research**.",
            "- **Questões/Simulados**: Se o usuário quiser treinar, fazer quiz ou estudar para provas -> Chame **Odonto Practice**.",
            "- **Resumos/Flashcards**: Se o usuário pedir material de revisão, mapas mentais ou resumos -> Chame **Odonto Summary**.",
            "- **Imagens/Radiografias**: Se houver uma imagem para analisar ou pedido de laudo -> Chame **Odonto Vision**.",
            "- **Redação Acadêmica**: Se o usuário pedir ajuda com TCC, escrita formal ou artigos -> Chame **Odonto Writer**.",
            # =================================================================
            # REGRAS DE COMUNICAÇÃO
            # =================================================================
            "- Se for uma conversa casual ou dúvida simples, RESPONDA DIRETAMENTE (não chame especialistas sem necessidade).",
            "- Ao responder, seja didático. Não dê apenas a resposta seca. Guie o usuário pelo raciocínio.",
            "- Sempre termine sua resposta com uma pergunta para guiar o usuário ou clarificar a necessidade ('Faz sentido?', 'Quer aprofundar nisso?').",
        ],
        model=OpenAIChat(
            id=model_id,
            base_url=base_url,
            api_key=api_key,
            temperature=temperature,
            max_tokens=max_tokens,
        ),
        tools=NAVIGATION_TOOLS,
        description="Odonto GPT: Assistente unificado com acesso a especialistas.",
    )

    return odonto_gpt_team


# Create singleton instance
odonto_gpt_unified = create_dental_education_team()
# Manter alias para compatibilidade se necessário, mas idealmente usar o unificado
odonto_gpt_team = odonto_gpt_unified


def create_coordinator_agent() -> Agent:
    """
    Cria Agente Coordenador para saudações e clarificação de intenção.
    Este agente NÃO possui ferramentas, servindo apenas para interagir rapidamente com o usuário.
    """
    return Agent(
        name="odonto-coordinator",
        model=OpenAIChat(
            id="google/gemini-2.0-flash-exp:free",  # Lightweight coordinator
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        ),
        instructions=[
            "Você é o Coordenador do Odonto Flow.",
            "Sua função é APENAS saudar ou lidar com mensagens TOTALMENTE vazias de intenção (ex: 'Oi').",
            "Se o usuário pedir algo específico (mesmo que vago, como 'dor de dente'), NÃO PERGUNTE. DELEGUE.",
        ],
        description="Agente coordenador para triagem inicial.",
    )


odonto_coordinator = create_coordinator_agent()


def rotear_para_agente_apropriado(
    mensagem_usuario: str,
    tem_imagem: bool = False,
    contexto: Optional[Dict[str, Any]] = None,
    agente_atual: Optional[str] = None,
) -> str:
    """
    Roteia requisição.

    ATUALIZAÇÃO UNIFICADA:
    A prioridade agora é sempre o 'equipe' (Odonto GPT Unificado),
    a menos que haja uma diretiva explícita no contexto ou imagem.
    """
    # Se tem imagem, vai direto para o especialista de visão (via equipe ou direto, mas aqui simplificamos)
    # Na verdade, a Equipe sabe lidar com isso, mas para performance, podemos atalhar se o frontend já souber.
    # Mas para "Unificação", vamos preferir 'equipe' que orquestra.

    # Mas mantemos a lógica de override manual se vier do frontend
    if contexto:
        target = contexto.get("target_agent") or contexto.get("agentType")
        if target and target != "auto":
            mapping = {
                "odonto-research": "ciencia",
                "odonto-practice": "estudo",
                "odonto-write": "redator",
                "odonto-vision": "imagem",
                "odonto-summary": "resumo",
                "odonto-gpt": "gpt",
                "odonto-coordinator": "coordenador",
                "odonto-gpt-team": "equipe",
                "odonto-flow": "equipe",
            }
            if target in mapping:
                return mapping[target]

    # Padrão unificado: Tudo vai para a equipe (que é o Odonto GPT Unificado)
    # A menos que seja muito trivial (saudação), mas o próprio GPT lida bem com isso.
    return "equipe"


async def executar_agente(
    tipo_agente: str, mensagem: str, contexto: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Executa agente ou equipe apropriado.

    NOTA: Removemos 'await' das chamadas .run() pois a biblioteca Agno (ex-Phidata)
    geralmente executa .run() de forma síncrona (bloqueante) ou retorna um iterador se stream=True.
    Se a biblioteca atualizou para async, reverteremos.
    Assumindo sincronismo baseado nos diagnósticos de tipo anteriores.
    """
    try:
        # Helper para rodar sync em executor se necessário, ou apenas chamar direto.
        # Por enquanto chamamos direto (removendo await que causava erro de tipo)

        if tipo_agente == "imagem":
            # Image analysis agent
            response = odonto_vision.run(mensagem, context=contexto or {})
            return {
                "response": response.response,
                "agent": "odonto-vision",
                "tool_calls": response.tool_calls
                if hasattr(response, "tool_calls")
                else [],
            }

        elif tipo_agente == "ciencia":
            response = odonto_research.run(mensagem, context=contexto or {})
            return {
                "response": response.response,
                "agent": "odonto-research",
                "sources": response.sources if hasattr(response, "sources") else [],
            }

        elif tipo_agente == "estudo":
            response = odonto_practice.run(mensagem, context=contexto or {})
            return {
                "response": response.response,
                "agent": "odonto-practice",
                "metadata": response.metadata if hasattr(response, "metadata") else {},
            }

        elif tipo_agente == "redator":
            response = odonto_write.run(mensagem, context=contexto or {})
            return {
                "response": response.response,
                "agent": "odonto-write",
                "metadata": response.metadata if hasattr(response, "metadata") else {},
            }

        elif tipo_agente == "resumo":
            response = dental_summary_agent.run(mensagem, context=contexto or {})
            return {
                "response": response.response,
                "agent": "odonto-summary",
                "metadata": response.metadata if hasattr(response, "metadata") else {},
            }

        elif tipo_agente == "equipe":
            # Multi-agent team (Odonto GPT Unificado)
            response = odonto_gpt_unified.run(mensagem, context=contexto or {})
            return {
                "response": response.response,
                "agent": "odonto-gpt",  # Identidade unificada
                "participants": response.participants
                if hasattr(response, "participants")
                else [],
            }

        elif tipo_agente == "coordenador":
            response = odonto_coordinator.run(mensagem, context=contexto or {})
            return {"response": response.response, "agent": "odonto-coordinator"}

        elif tipo_agente == "gpt":
            # Fallback para o agente antigo se forçado
            response = odonto_gpt.run(mensagem, context=contexto or {})
            return {
                "response": response.response,
                "agent": "odonto-gpt",
                "tool_calls": response.tool_calls
                if hasattr(response, "tool_calls")
                else [],
            }

        else:
            raise ValueError(f"Tipo de agente desconhecido: {tipo_agente}")

    except Exception as e:
        raise Exception(f"Execução do agente falhou: {str(e)}")
