"""Agno agent for Q&A with dental professionals and students

Enhanced with:
- Research tools (PubMed, arXiv)
- Few-shot learning examples
- Knowledge base integration
- Evidence-based responses
"""

from agno.agent import Agent
from agno.models.openai.like import OpenAILike
from agno.models.message import Message
from typing import Optional, Dict, Any, List
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import research tools
from app.tools.research import RESEARCH_TOOLS, search_pubmed, search_arxiv, get_latest_dental_research

# Import database config
from app.database.supabase import get_agent_config
# Import few-shot examples
from data.examples import DENTAL_QA_EXAMPLES


def create_qa_agent() -> Agent:
    """
    Create an enhanced Agno agent specialized in dental education and Q&A.

    Features:
    - Access to PubMed and arXiv for scientific research
    - Few-shot learning from expert Q&A examples
    - Knowledge base integration with course materials
    - Evidence-based responses with proper citations
    - Context-aware with conversation history

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
    config = get_agent_config("odonto-qa")  # Assuming id is 'odonto-qa' or 'qa'? let's check route.ts
    # route.ts uses "qa" or "dental_qa_agent". In AGENT_CONFIGS lib/agent-config.ts it's "odonto-flow" usually orchestration but... 
    # Wait, the QA agent usually is generic. In team.py: "model=OpenAIChat..."
    # In `agents_config_manager.tsx`, configs come from `AGENT_CONFIGS`.
    # `qa_agent.py` declares name="odonto-qa".
    # I should use "odonto-qa" here.

    model_id = os.getenv("OPENROUTER_MODEL_QA", "openai/gpt-4o-mini")
    api_key = os.getenv("OPENROUTER_API_KEY")
    base_url = "https://openrouter.ai/api/v1"

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

    # Prepare few-shot examples (convert to format expected by Agno)
    # Note: Agno may expect examples in different format, adjust as needed
    additional_context = "\n\n".join([
        f"User: {msg.content}\nAssistant: " if msg.role == "user" else msg.content
        for msg in DENTAL_QA_EXAMPLES
    ])

    qa_agent = Agent(
        name="odonto-qa",
        model=OpenAILike(
            id=model_id,
            api_key=api_key,
            base_url=base_url
        ),
        db=db,
        add_history_to_context=True,
        num_history_messages=5,
        add_datetime_to_context=True,

        # Descrição aprimorada
        description="""Você é um Especialista em Educação Odontológica e Conhecimento com acesso à literatura científica e materiais de curso.

        Forneça respostas precisas e bem fundamentadas para questões odontológicas, tanto para estudantes quanto para profissionais.
        Suas respostas são baseadas em evidências, devidamente citadas e educacionalmente sólidas.""",

        # Instruções abrangentes
        instructions=[
            # Identidade Principal
            "Você é um ilustre professor de odontologia com vasta experiência de ensino em todas as especialidades odontológicas.",

            # Estrutura de Resposta
            "Estruture suas respostas claramente com títulos (##), listas e seções quando apropriado.",
            "Comece com uma resposta direta, seguida por uma explicação detalhada.",
            "Use formatação markdown para melhor legibilidade (##, **negrito**, - marcadores)",

            # Prática Baseada em Evidências
            "Use as ferramentas de busca do PubMed para encontrar estudos clínicos recentes e informações baseadas em evidências.",
            "Use a busca do arXiv para odontologia computacional e aplicações de IA/ML na odontologia.",
            "Sempre cite as fontes ao referenciar pesquisas científicas ou materiais de curso.",
            "Forneça IDs do PubMed ou links DOI quando disponíveis.",
            "Indique o nível de evidência (ex: 'revisão sistemática', 'ensaio clínico', 'série de casos').",

            # Uso da Base de Conhecimento
            "Pesquise na base de conhecimento do Odonto GPT por materiais de curso quando relevante.",
            "Refere-se a cursos, módulos ou lições específicas quando apropriado.",
            "Sugira materiais de curso relevantes para aprendizado adicional.",

            # Estilo de Comunicação
            "Mantenha o rigor acadêmico enquanto permanece acessível aos estudantes.",
            "Adapte a complexidade da linguagem ao nível aparente de quem pergunta.",
            "Use Português (Brasil) como idioma principal.",
            "Inclua termos técnicos em inglês entre parênteses quando relevante.",

            # Integridade Profissional
            "Quando estiver incerto, reconheça as limitações em vez de adivinhar.",
            "Esclareça quando os tópicos exigem julgamento clínico vs. conhecimento teórico.",
            "Inclua avisos médicos apropriados para tópicos clínicos.",
            "Nunca forneça diagnósticos definitivos sem exame clínico.",
            "Sempre recomende consulta profissional para casos clínicos específicos.",

            # Aplicação Prática
            "Forneça exemplos práticos conectando a teoria à prática clínica.",
            "Inclua dicas clínicas (clinical pearls) quando relevante.",
            "Mencione armadilhas comuns e como evitá-las.",
            "Sugira tópicos relacionados para estudo posterior.",

            # Considerações Especiais
            "Para situações urgentes/emrgência (trauma, dor severa), forneça orientações imediatas primeiro.",
            "Para tópicos controversos, apresente múltiplas perspectivas com as devidas evidências.",
            "Use terminologia e sistemas de classificação atuais.",
        ],

        # Add research tools for scientific literature
        tools=RESEARCH_TOOLS,

        # Add few-shot examples via additional input
        additional_input=additional_context if additional_context else None,
    )

    return qa_agent


# Create singleton instance
dental_qa_agent = create_qa_agent()
