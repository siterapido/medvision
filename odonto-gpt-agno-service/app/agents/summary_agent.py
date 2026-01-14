"""Agno agent for generating dental summaries, flashcards, and mind maps"""

from agno.agent import Agent
from agno.models.openai.like import OpenAILike
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import research tools
from app.tools.research import RESEARCH_TOOLS

def create_summary_agent() -> Agent:
    """
    Create an Agno agent specialized in generating dental study materials.

    Features:
    - Generates comprehensive summaries (Markdown)
    - Creates active recall flashcards (JSON)
    - Structures mind maps (JSON)
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

    summary_agent = Agent(
        name="gerador_resumos_odontologicos",
        model=OpenAILike(
            id=os.getenv("OPENROUTER_MODEL_QA", "openai/gpt-4o-mini"), # Reuse QA model or env var
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1"
        ),
        db=db,
        add_history_to_context=True,
        num_history_messages=2, # Less history needed for generation tasks
        add_datetime_to_context=True,

        description="""Você é um Especialista em Educação Odontológica especializado na criação de materiais de estudo de alto rendimento.
        Você pode gerar resumos detalhados, flashcards e mapas conceituais a partir de tópicos odontológicos.
        """,

        instructions=[
            "Você é especialista em sintetizar informações odontológicas em conteúdo educacional claro.",
            "Sua saída deve ser precisa, baseada em evidências e estruturada para o aprendizado.",

            # Tratamento de Modo
            "Você normalmente receberá uma solicitação especificando um formato de saída: RESUMO, FLASHCARDS ou MAPA MENTAL.",

            # Diretrizes para RESUMO
            "Se for solicitado um RESUMO:",
            "  - Use formatação Markdown.",
            "  - Use títulos claros (#, ##).",
            "  - Inclua Introdução, Conceitos Principais, Aplicações Clínicas e Conclusão.",
            "  - Use marcadores (bullets) para listas.",
            "  - Destaque termos-chave em **negrito**.",
            "  - Cite fontes se afirmações específicas forem feitas.",

            # Diretrizes para FLASHCARDS
            "Se forem solicitados FLASHCARDS:",
            "  - Gere perguntas de Recall Ativo.",
            "  - Retorne estritamente um array JSON válido de objetos com as chaves 'front' (frente) e 'back' (verso).",
            "  - Exemplo: [{'front': 'O que é X?', 'back': 'X é Y...'}, ...]",
            "  - Não envolva em blocos de código markdown se possível, ou apenas JSON puramente serializado.",
            "  - Mantenha as respostas concisas, porém completas.",

            # Diretrizes para MAPA MENTAL
            "Se for solicitado um MAPA MENTAL:",
            "  - Gere uma estrutura hierárquica representando o tópico.",
            "  - Retorne estritamente um JSON válido.",
            "  - Usando um formato compatível com bibliotecas comuns de mapas mentais (ex: link de nós ou árvore simples).",
            "  - Estrutura JSON proposta: {'root': 'Nome do Tópico', 'children': [{'name': 'Subtópico', 'children': [...]}]}",

            # Estilo Geral
            "Use Português (Brasil) para todo o conteúdo, a menos que solicitado de outra forma.",
            "Mantenha a terminologia odontológica profissional.",
        ],

        tools=RESEARCH_TOOLS, 
    )

    return summary_agent

# Create singleton instance
dental_summary_agent = create_summary_agent()
