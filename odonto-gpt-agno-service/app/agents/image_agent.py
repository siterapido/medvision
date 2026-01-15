"""Agente Agno para análise de imagens odontológicas (Odonto Vision)

Enhanced with research tools for evidence-based image interpretation
and scientific literature support for radiographic findings.
"""

from agno.agent import Agent
from agno.models.openai.like import OpenAILike
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import research tools
from app.tools.research import RESEARCH_TOOLS
# Import database config
from app.database.supabase import get_agent_config
# Import artifact tools
from app.tools.artifacts_db import save_image_analysis
# Import navigation tools
from app.tools.navigation import NAVIGATION_TOOLS


def create_image_analysis_agent() -> Agent:
    """
    Create an enhanced Agno agent specialized in dental image analysis (Odonto Vision).

    Features:
    - Vision-based image analysis (radiographs, intraoral photos)
    - Research tools for evidence-based interpretation
    - Scientific literature support for findings
    - Comprehensive reporting with differential diagnoses

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
    config = get_agent_config("odonto-vision")
    
    model_id = os.getenv("OPENROUTER_MODEL_IMAGE", "openai/gpt-4o")
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

    odonto_vision = Agent(
        name="odonto-vision",
        model=OpenAILike(
            id=model_id,
            api_key=api_key,
            base_url=base_url,
            temperature=temperature,
            max_tokens=max_tokens
        ), # GPT-4o tem capacidades nativas de visão
        db=db,
        add_history_to_context=True,
        markdown=True,
        add_datetime_to_context=True,
        stream_events=True,

        # Descrição especializada profissional
        description="""Você é o Odonto Vision, especialista em radiologia odontológica e imaginologia diagnóstica.
        Sua função é interpretar imagens com precisão técnica e fundamentação científica.""",

        instructions=[
            # IDENTIDADE
            "Você é o **Odonto Vision**. Aja como um Radiologista Odontológico Sênior.",
            
            # PROTOCOLO DE LAUDO
            "Ao analisar uma imagem, siga o fluxo:",
            "  1. **Técnica/Qualidade**: Identifique o tipo de exame (Panorâmica, Periapical, TC) e a qualidade.",
            "  2. **Anatomia Normal**: Liste estruturas visíveis.",
            "  3. **Alterações**: Descreva com terminologia radiográfica (radiopaco, radiolúcido, unilocular, limites definidos/indefinidos).",
            "  4. **Hipóteses Diagnósticas**: Liste em ordem de probabilidade baseada na literatura e epidemiologia.",
            
            # SUPORTE CIENTÍFICO
            "- Use `search_pubmed` se encontrar algo incomum ou para sugerir diagnósticos diferenciais raros.",
            "- Cite diretrizes da AAOMR (American Academy of Oral and Maxillofacial Radiology) quando aplicável.",
            
            # SEGURANÇA E ÉTICA
            "- **Disclaimer Obrigatório**: 'Esta análise é uma ferramenta de suporte educacional e não substitui o laudo oficial assinado por um radiologista.'",
            "- Indique urgência se houver sinais de malignidade ou infecção aguda.",
            
            # CLAREZA
            "Seja técnico mas claro. Se usar termos muito específicos, brevemente explique.",
        ],

        # Add research tools and image artifact tools
        tools=RESEARCH_TOOLS + NAVIGATION_TOOLS + [save_image_analysis],
    )

    return odonto_vision


# Create singleton instance
odonto_vision = create_image_analysis_agent()
