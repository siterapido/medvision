"""
Agente Analisador de Artefatos

Especializado em avaliar qualidade de artefatos gerados por IA,
identificando problemas e sugerindo melhorias.
"""

from agno.agent import Agent
from agno.models.openai.like import OpenAILike
from agno.db.postgres import PostgresDb
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum
import os
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# MODELOS PYDANTIC PARA TIPAGEM ESTRITA
# ============================================================================

class ArtifactType(str, Enum):
    CODE = "code"
    DOCUMENT = "document"
    DIAGRAM = "diagram"
    RESEARCH = "research"
    FLASHCARD = "flashcard"
    MINDMAP = "mindmap"
    EXAM = "exam"
    SUMMARY = "summary"
    IMAGE_ANALYSIS = "image_analysis"


class QualityScore(BaseModel):
    """Score de qualidade do artefato em 4 dimensões"""
    completeness: int = Field(
        default=0, 
        ge=0, 
        le=100, 
        description="Completude do conteúdo (0-100)"
    )
    accuracy: int = Field(
        default=0, 
        ge=0, 
        le=100, 
        description="Precisão técnica/científica (0-100)"
    )
    clarity: int = Field(
        default=0, 
        ge=0, 
        le=100, 
        description="Clareza de apresentação (0-100)"
    )
    actionability: int = Field(
        default=0, 
        ge=0, 
        le=100, 
        description="Aplicabilidade prática (0-100)"
    )
    
    @property
    def overall(self) -> float:
        """Calcula score geral como média das 4 dimensões"""
        return (self.completeness + self.accuracy + self.clarity + self.actionability) / 4


class ArtifactAnalysis(BaseModel):
    """Resultado completo da análise de um artefato"""
    artifact_type: ArtifactType = Field(
        description="Tipo do artefato analisado"
    )
    original_content_preview: str = Field(
        default="",
        description="Preview do conteúdo original (primeiros 500 chars)"
    )
    quality_score: QualityScore = Field(
        default_factory=QualityScore,
        description="Scores de qualidade"
    )
    issues_found: List[str] = Field(
        default_factory=list,
        description="Lista de problemas identificados"
    )
    improvement_suggestions: List[str] = Field(
        default_factory=list,
        description="Sugestões de melhoria priorizadas"
    )
    requires_refinement: bool = Field(
        default=True,
        description="Se o artefato precisa de refinamento"
    )
    priority: Literal["low", "medium", "high", "critical"] = Field(
        default="medium",
        description="Prioridade do refinamento"
    )
    estimated_improvement: int = Field(
        default=0,
        ge=0,
        le=100,
        description="Melhoria estimada no score após refinamento (%)"
    )


# ============================================================================
# AGENTE ANALISADOR
# ============================================================================

def create_artifact_analyzer_agent() -> Agent:
    """
    Cria agente especializado em analisar artefatos.
    
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
                session_table="artifact_analysis_sessions",
                db_url=db_url
            )
        except Exception as e:
            logger.warning(f"Could not connect to DB for analyzer: {e}")
    
    model_id = os.getenv("OPENROUTER_MODEL_QA", "google/gemini-2.0-flash-exp:free")
    api_key = os.getenv("OPENROUTER_API_KEY")
    
    return Agent(
        name="artifact-analyzer",
        model=OpenAILike(
            id=model_id,
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            temperature=0.2,  # Baixa temperatura para análise precisa
            max_tokens=4000
        ),
        db=db,
        enable_user_memories=True if db else False,
        add_history_to_context=True,
        num_history_messages=5,
        add_datetime_to_context=True,
        
        description="""Você é o Artifact Analyzer, um especialista em avaliar a qualidade 
        de artefatos educacionais e científicos gerados por IA no contexto odontológico.
        Sua função é identificar problemas, avaliar qualidade e sugerir melhorias.""",
        
        instructions=[
            "## PROTOCOLO DE ANÁLISE",
            "",
            "1. **Identificação do Tipo**: Classifique o artefato (research, exam, summary, flashcard, mindmap, etc).",
            "",
            "2. **Avaliação de Qualidade** (0-100 para cada):",
            "   - **Completeness**: O conteúdo cobre todos os aspectos necessários?",
            "   - **Accuracy**: As informações são cientificamente corretas?",
            "   - **Clarity**: A apresentação é clara e bem estruturada?",
            "   - **Actionability**: O conteúdo é aplicável na prática clínica/estudo?",
            "",
            "3. **Identificação de Problemas**:",
            "   - Erros factuais ou informações desatualizadas",
            "   - Lacunas de conteúdo importantes",
            "   - Problemas de formatação ou estrutura",
            "   - Falta de citações ou referências (quando aplicável)",
            "   - Linguagem inadequada ao público-alvo",
            "",
            "4. **Sugestões de Melhoria**:",
            "   - Liste sugestões CONCRETAS e PRIORIZADAS",
            "   - Foque no que trará maior impacto na qualidade",
            "   - Seja específico (não diga 'melhorar conteúdo', diga 'adicionar seção sobre X')",
            "",
            "5. **Decisão de Refinamento**:",
            "   - Se score geral < 60: requires_refinement=True, priority=high/critical",
            "   - Se score geral 60-75: requires_refinement=True, priority=medium",
            "   - Se score geral 75-85: requires_refinement=True, priority=low",
            "   - Se score geral > 85: requires_refinement=False",
            "",
            "## CONTEXTO ODONTOLÓGICO",
            "Lembre-se que o público são estudantes e profissionais de odontologia.",
            "Priorize precisão científica e aplicabilidade clínica.",
        ],
        
        response_model=ArtifactAnalysis,
        structured_outputs=True,
    )


# Singleton
artifact_analyzer = create_artifact_analyzer_agent()
