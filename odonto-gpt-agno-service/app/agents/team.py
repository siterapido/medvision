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
            # IDENTIDADE E OBJETIVO
            # =================================================================
            "Você é o Odonto GPT, o assistente central inteligente da Odonto Suite.",
            "Seu objetivo é conversar em linguagem natural, ser extremamente conciso e coordenar agentes especializados.",
            # =================================================================
            # REGRAS DE COMUNICAÇÃO (PRIORIDADE MÁXIMA)
            # =================================================================
            "- **CONCISÃO EXTREMA**: Suas respostas devem ter NO MÁXIMO 3 LINHAS. Seja direto.",
            "- **PERGUNTE**: Sempre termine sua resposta com uma pergunta para guiar o usuário ou clarificar a necessidade.",
            "- **LINGUAGEM NATURAL**: Converse de forma fluida e amigável.",
            # =================================================================
            # ORQUESTRAÇÃO COM IA-CONTEXT
            # =================================================================
            "- Use o contexto da conversa (ia-context) para identificar quando chamar um especialista.",
            "- Se o usuário pedir 'pesquisa', 'artigos' -> Chame Odonto Research.",
            "- Se o usuário pedir 'questões', 'estudar' -> Chame Odonto Practice.",
            "- Se o usuário pedir 'resumo', 'flashcards' -> Chame Odonto Summary.",
            "- Se o usuário pedir 'imagem', 'raio-x' -> Chame Odonto Vision.",
            "- Se o usuário pedir 'tcc', 'artigo' -> Chame Odonto Writer.",
            # =================================================================
            # CONTEXTO
            # =================================================================
            "- Mantenha o contexto da conversa. Se o usuário der continuidade, use o histórico.",
        ],
        model=OpenAIChat(
            id=model_id,
            base_url=base_url,
            api_key=api_key,
            temperature=temperature,
            max_tokens=max_tokens,
        ),
        tools=NAVIGATION_TOOLS,
        description="Odonto GPT: Assistente central com orquestração inteligente.",
    )

    return odonto_gpt_team


# Create singleton instance
odonto_gpt_team = create_dental_education_team()


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
    Roteia requisição para agente apropriado baseado no conteúdo.

    MELHORIAS v2.2:
    - Prevenção de troca para o mesmo agente (Stickiness)
    - Suporte a contexto de IA e regras (ia-context -> GPT)
    - Pesos ajustados para evitar trocas desnecessárias

    Args:
        mensagem_usuario: Mensagem do usuário
        tem_imagem: Se há imagem anexada
        contexto: Contexto adicional (opcional)
        agente_atual: ID do agente atualmente ativo (ex: 'odonto-gpt', 'odonto-research')

    Returns:
        Tipo de agente: 'ciencia', 'estudo', 'redator', 'imagem', 'resumo' ou 'equipe'
    """
    mensagem_lower = mensagem_usuario.lower()

    # =========================================================================
    # OPTIMIZATION: IA-CONTEXT ROUTING
    # =========================================================================
    # Se o contexto trouxer um agente específico ou instrução de roteamento, usa-o.
    if contexto:
        # Se houver um campo 'target_agent' ou 'agentType' no contexto que não seja 'auto'
        target = contexto.get("target_agent") or contexto.get("agentType")
        if target and target != "auto":
            # Mapeia para as chaves internas
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

    # =========================================================================
    # KEYWORDS ATUALIZADAS (Agressivas)
    # =========================================================================

    WEIGHTED_KEYWORDS_CIENCIA = {  # Odonto Research (Inclui General Knowledge)
        "pubmed": 10,
        "revisão sistemática": 10,
        "meta-análise": 10,
        "pesquisa": 10,
        "pesquisar": 10,
        "busca": 5,
        "buscar": 5,
        "evidências": 10,
        "artigos": 8,
        "artigo": 8,
        "saber sobre": 5,
        "o que é": 5,
        "quais são": 5,
        "sintomas": 5,
        "tratamento": 5,
        "causas": 5,
        "diagnóstico": 5,
        "fale sobre": 4,
        "explicação": 4,
        "literatura": 5,
    }

    WEIGHTED_KEYWORDS_ESTUDO = {  # Odonto Practice
        "questão": 10,
        "questões": 10,
        "simulado": 10,
        "prova": 10,
        "quiz": 10,
        "exercício": 8,
        "praticar": 8,
        "estudar": 8,
        "aprender": 5,
        "ensine": 5,
        "banca": 5,
        "residência": 5,
    }

    WEIGHTED_KEYWORDS_REDATOR = {  # Odonto Writer
        "tcc": 10,
        "monografia": 10,
        "artigo científico": 8,
        "escrever": 6,
        "redigir": 6,
        "abnt": 10,
        "vancouver": 10,
        "formatar": 8,
        "referências": 6,
    }

    WEIGHTED_KEYWORDS_IMAGEM = {  # Odonto Vision
        "radiografia": 10,
        "imagem": 8,
        "raio-x": 10,
        "tomografia": 10,
        "analise": 5,
        "laudo": 8,
        "veja": 4,
    }

    WEIGHTED_KEYWORDS_RESUMO = {  # Odonto Summary
        "resumo": 10,
        "resumir": 10,
        "sintetize": 8,
        "flashcards": 10,
        "flashcard": 10,
        "cards": 8,
        "cartões": 8,
        "memória": 5,
        "mapa mental": 10,
        "mind map": 10,
        "mapa": 8,
        "esquema": 8,
        "conceitos": 5,
    }

    WEIGHTED_KEYWORDS_GPT = {  # Odonto GPT - Chat e Explicações
        "explicação": 8,
        "me explica": 10,
        "entender": 8,
        "duvida": 10,
        "dúvida": 10,
        "como funciona": 8,
        "por que": 5,
        "porque": 5,
        "bate papo": 10,
        "bater papo": 10,
        "conversa": 8,
        "conversar": 8,
        "ajuda": 5,
        "não entendi": 10,
        "me ajude": 8,
        "simples": 5,
        "didatico": 5,
        "papo": 5,
        # IA Context / Rules keywords
        "regras": 10,
        "contexto": 10,
        "instruções": 10,
        "projeto": 8,
        "sistema": 5,
        "quem é você": 10,
        "o que você faz": 10,
        "sua função": 10,
    }

    # ... (restante da lógica de formatação e pontuação permanece)

    # PRIORIDADE 1: CONTEXTO DE FORMATAÇÃO
    # Use regex for precise word matching to avoid false positives (e.g., 'apa' in 'mapa')
    formatting_pattern = r"\b(abnt|vancouver|apa|formatação|normas)\b"
    if re.search(formatting_pattern, mensagem_lower):
        return "redator"

    # FUNÇÃO AUXILIAR SCORE
    def calcular_score(keywords_dict: Dict[str, int]) -> float:
        score = 0
        for keyword, peso in keywords_dict.items():
            if keyword in mensagem_lower:
                score += peso
        return score

    score_ciencia = calcular_score(WEIGHTED_KEYWORDS_CIENCIA)
    score_estudo = calcular_score(WEIGHTED_KEYWORDS_ESTUDO)
    score_redator = calcular_score(WEIGHTED_KEYWORDS_REDATOR)
    score_imagem = calcular_score(WEIGHTED_KEYWORDS_IMAGEM)
    score_resumo = calcular_score(WEIGHTED_KEYWORDS_RESUMO)
    score_gpt = calcular_score(WEIGHTED_KEYWORDS_GPT)

    if tem_imagem:
        return "equipe" if (score_ciencia > 5 or score_estudo > 5) else "imagem"

    if score_imagem >= 8:  # Increased confidence for text-only image requests
        return "imagem"

    scores = {
        "ciencia": score_ciencia,
        "estudo": score_estudo,
        "redator": score_redator,
        "resumo": score_resumo,
        "gpt": score_gpt,
    }

    # Detecção de IA-Context explícito
    if "ia-context" in mensagem_lower or "odonto gpt" in mensagem_lower:
        scores["gpt"] += 20  # Boost massivo para GPT

    # Lógica de "Stickiness" (Inércia)
    # Se já estamos em um agente, aumentamos seu score para evitar trocas por pequenas menções
    if agente_atual:
        # Mapeia IDs de agente para chaves de score
        id_to_key = {
            "odonto-research": "ciencia",
            "odonto-practice": "estudo",
            "odonto-write": "redator",
            "odonto-vision": "imagem",
            "odonto-summary": "resumo",
            "odonto-gpt": "gpt",
            "odonto-gpt-team": "equipe",
        }

        current_key = id_to_key.get(agente_atual)
        if current_key and current_key in scores:
            # Adiciona bônus de inércia (ex: 5 pontos)
            # Isso significa que outro agente precisa ser significativamente mais relevante para justificar a troca
            scores[current_key] += 5.0

    max_score = max(scores.values())

    # SAUDAÇÕES PURAS (Sem outro conteúdo)
    greetings = ["oi", "olá", "ola", "bom dia", "boa tarde"]
    is_pure_greeting = any(mensagem_lower.strip() == g for g in greetings)

    if is_pure_greeting and max_score < 3:
        # Se já estiver no GPT, mantém no GPT em vez de coordenador
        if agente_atual == "odonto-gpt":
            return "gpt"
        return "coordenador"

    # Se pontuação for muito baixa mas tem algum sinal, chuta o melhor (não pergunta!)
    # Threshold reduzido de 4 para 1 para evitar perguntas
    if max_score > 0:
        # Retorna a chave com maior score
        best_agent = max(scores, key=scores.get)
        return best_agent

    # Só chama coordenador se ZERO keywords encontradas
    # Mas se já estivermos num agente conversacional (GPT), mantém ele
    if agente_atual == "odonto-gpt":
        return "gpt"

    return "coordenador"


async def executar_agente(
    tipo_agente: str, mensagem: str, contexto: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Executa agente ou equipe apropriado baseado no tipo.

    Args:
        tipo_agente: Tipo de agente ('ciencia', 'estudo', 'redator', 'imagem', 'equipe', 'resumo')
        mensagem: Mensagem do usuário
        contexto: Contexto adicional (imagem URL, session ID, etc.)

    Returns:
        Resposta do agente
    """
    try:
        if tipo_agente == "imagem":
            # Image analysis agent
            response = await odonto_vision.run(mensagem, context=contexto or {})
            return {
                "response": response.response,
                "agent": "odonto-vision",
                "tool_calls": response.tool_calls
                if hasattr(response, "tool_calls")
                else [],
            }

        elif tipo_agente == "ciencia":
            # Odonto Research - Scientific research
            response = await odonto_research.run(mensagem, context=contexto or {})
            return {
                "response": response.response,
                "agent": "odonto-research",
                "sources": response.sources if hasattr(response, "sources") else [],
            }

        elif tipo_agente == "estudo":
            # Odonto Practice - Questions and exams
            response = await odonto_practice.run(mensagem, context=contexto or {})
            return {
                "response": response.response,
                "agent": "odonto-practice",
                "metadata": response.metadata if hasattr(response, "metadata") else {},
            }

        elif tipo_agente == "redator":
            # Odonto Write - Academic writing
            response = await odonto_write.run(mensagem, context=contexto or {})
            return {
                "response": response.response,
                "agent": "odonto-write",
                "metadata": response.metadata if hasattr(response, "metadata") else {},
            }

        elif tipo_agente == "resumo":
            # Odonto Summary - Summaries, Flashcards, Mindmaps
            response = await dental_summary_agent.run(mensagem, context=contexto or {})
            return {
                "response": response.response,
                "agent": "odonto-summary",
                "metadata": response.metadata if hasattr(response, "metadata") else {},
            }

        elif tipo_agente == "equipe":
            # Multi-agent team
            response = await odonto_gpt_team.run(mensagem, context=contexto or {})
            return {
                "response": response.response,
                "agent": "odonto-gpt",
                "participants": response.participants
                if hasattr(response, "participants")
                else [],
            }

        elif tipo_agente == "coordenador":
            # Coordinator Agent
            response = await odonto_coordinator.run(mensagem, context=contexto or {})
            return {"response": response.response, "agent": "odonto-coordinator"}

        elif tipo_agente == "gpt":
            # Odonto GPT - Chat
            response = await odonto_gpt.run(mensagem, context=contexto or {})
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
