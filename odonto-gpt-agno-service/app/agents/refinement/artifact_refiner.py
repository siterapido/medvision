"""
Agente Refinador de Artefatos

Especializado em melhorar artefatos baseado na análise prévia,
mantendo precisão científica e aplicabilidade clínica.
"""

from agno.agent import Agent
from agno.models.openai.like import OpenAILike
from agno.db.postgres import PostgresDb
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import logging

from .artifact_analyzer import QualityScore

logger = logging.getLogger(__name__)

# ============================================================================
# MODELOS PYDANTIC
# ============================================================================

class RefinedArtifact(BaseModel):
    """Artefato após processo de refinamento"""
    version: int = Field(
        default=1,
        description="Número da versão do artefato"
    )
    content: str = Field(
        description="Conteúdo refinado completo"
    )
    changes_made: List[str] = Field(
        default_factory=list,
        description="Lista de mudanças realizadas"
    )
    quality_score: QualityScore = Field(
        default_factory=QualityScore,
        description="Score de qualidade após refinamento"
    )
    refinement_notes: str = Field(
        default="",
        description="Notas do processo de refinamento"
    )
    parent_version: Optional[int] = Field(
        default=None,
        description="Versão anterior do artefato"
    )


# ============================================================================
# AGENTE REFINADOR
# ============================================================================

def create_artifact_refiner_agent() -> Agent:
    """
    Cria agente especializado em refinar/melhorar artefatos.
    
    Returns:
        Configured Agno Agent instance
    """
    db_url = os.getenv("SUPABASE_DB_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    db = None
    if db_url:
        try:
            db = PostgresDb(
                session_table="artifact_refinement_sessions",
                db_url=db_url
            )
        except Exception as e:
            logger.warning(f"Could not connect to DB for refiner: {e}")
    
    model_id = os.getenv("OPENROUTER_MODEL_QA", "google/gemini-2.0-flash-exp:free")
    api_key = os.getenv("OPENROUTER_API_KEY")
    
    # Importar ferramentas de persistência
    try:
        from app.tools.artifacts_db import ARTIFACT_TOOLS
        tools = ARTIFACT_TOOLS
    except ImportError:
        logger.warning("Could not import ARTIFACT_TOOLS")
        tools = []
    
    return Agent(
        name="artifact-refiner",
        model=OpenAILike(
            id=model_id,
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            temperature=0.4,  # Criatividade moderada
            max_tokens=8000
        ),
        db=db,
        enable_user_memories=True if db else False,
        enable_agentic_memory=True if db else False,
        add_history_to_context=True,
        num_history_messages=5,
        add_datetime_to_context=True,
        
        description="""Você é o Artifact Refiner, um especialista em melhorar artefatos 
        educacionais e científicos odontológicos. Você recebe a análise de qualidade 
        e o artefato original, e produz uma versão significativamente melhorada.""",
        
        instructions=[
            "## PROTOCOLO DE REFINAMENTO",
            "",
            "1. **Receba a Análise**: Leia atentamente o relatório do Artifact Analyzer.",
            "",
            "2. **Priorize Correções**:",
            "   - CRÍTICO: Erros factuais ou informações incorretas",
            "   - ALTO: Lacunas de conteúdo importantes",
            "   - MÉDIO: Problemas de estrutura ou clareza",
            "   - BAIXO: Melhorias estéticas ou de formatação",
            "",
            "3. **Aplique Melhorias**:",
            "   - Corrija TODOS os erros factuais identificados",
            "   - Preencha lacunas de conteúdo com informação precisa",
            "   - Melhore a estrutura e organização",
            "   - Adicione citações/referências quando necessário",
            "   - Mantenha linguagem adequada ao público odontológico",
            "",
            "4. **Preserve a Essência**:",
            "   - NÃO altere o tema ou foco principal",
            "   - NÃO remova informações corretas e relevantes",
            "   - Mantenha o estilo e tom do original",
            "",
            "5. **Documente Mudanças**:",
            "   - Liste TODAS as alterações realizadas em `changes_made`",
            "   - Seja específico (ex: 'Corrigido dosagem de amoxicilina de 500mg para 875mg')",
            "",
            "6. **Reavalie Qualidade**:",
            "   - Forneça novo QualityScore após refinamento",
            "   - O score deve refletir as melhorias realizadas",
            "",
            "## DIRETRIZES DE QUALIDADE ODONTOLÓGICA",
            "- Informações clínicas devem ser baseadas em evidências",
            "- Dosagens e protocolos devem seguir guidelines atuais",
            "- Terminologia deve ser precisa e profissional",
            "- Conteúdo educacional deve ser didático e aplicável",
        ],
        
        tools=tools,
        response_model=RefinedArtifact,
        structured_outputs=True,
    )


# Singleton
artifact_refiner = create_artifact_refiner_agent()
