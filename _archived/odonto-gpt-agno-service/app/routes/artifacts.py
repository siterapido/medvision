"""
Rotas de API para Artefatos

Endpoints para geração direta e gerenciamento de artefatos.
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
from typing import Optional
import logging

from app.workflows import generate_direct_artifact

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/artifacts", tags=["artifacts"])


class GenerateArtifactRequest(BaseModel):
    """Request para geração direta de artefato."""
    artifact_type: str = Field(description="Tipo: pesquisa, simulado, resumo, flashcards, mindmap")
    topic: str = Field(description="Tema/tópico do artefato")
    user_id: str = Field(description="ID do usuário")
    instructions: Optional[str] = Field(default=None, description="Instruções adicionais")
    difficulty: Optional[str] = Field(default="medium", description="Dificuldade (para simulados)")
    num_items: Optional[int] = Field(default=None, description="Número de itens")


class GenerateArtifactResponse(BaseModel):
    """Response da geração de artefato."""
    success: bool
    artifact_id: Optional[str] = None
    artifact_type: str
    title: Optional[str] = None
    message: str
    error: Optional[str] = None


@router.post("/generate", response_model=GenerateArtifactResponse)
async def generate_artifact(
    request: GenerateArtifactRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Gera um artefato diretamente (sem chat).
    
    Este endpoint permite que o frontend solicite a criação de artefatos
    através de um formulário, sem precisar passar pelo fluxo de chat.
    """
    # Usar user_id do header se não vier no body
    user_id = request.user_id or x_user_id
    
    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="user_id é obrigatório (body ou header X-User-ID)"
        )
    
    logger.info(f"Direct artifact generation requested: type={request.artifact_type}, topic={request.topic[:50]}")
    
    try:
        result = await generate_direct_artifact(
            artifact_type=request.artifact_type,
            topic=request.topic,
            user_id=user_id,
            instructions=request.instructions,
            difficulty=request.difficulty,
            num_items=request.num_items
        )
        
        return GenerateArtifactResponse(
            success=result.success,
            artifact_id=result.artifact_id,
            artifact_type=result.artifact_type,
            title=result.title,
            message=result.message,
            error=result.error
        )
        
    except Exception as e:
        logger.error(f"Error generating artifact: {e}")
        return GenerateArtifactResponse(
            success=False,
            artifact_type=request.artifact_type,
            title=None,
            message="Erro ao gerar artefato",
            error=str(e)
        )


@router.get("/types")
async def get_artifact_types():
    """Retorna os tipos de artefatos disponíveis para geração direta."""
    return {
        "types": [
            {
                "id": "pesquisa",
                "label": "Pesquisa Científica",
                "description": "Revisão de literatura com fontes científicas",
                "icon": "🔬",
                "supports_num_items": False
            },
            {
                "id": "simulado",
                "label": "Simulado",
                "description": "Questões de múltipla escolha com gabarito",
                "icon": "📝",
                "supports_num_items": True,
                "default_num_items": 10
            },
            {
                "id": "resumo",
                "label": "Resumo de Estudo",
                "description": "Síntese didática do conteúdo",
                "icon": "📄",
                "supports_num_items": False
            },
            {
                "id": "flashcards",
                "label": "Flashcards",
                "description": "Cartões de memorização ativa",
                "icon": "🃏",
                "supports_num_items": True,
                "default_num_items": 20
            },
            {
                "id": "mindmap",
                "label": "Mapa Mental",
                "description": "Estrutura hierárquica de conceitos",
                "icon": "🗺️",
                "supports_num_items": False
            }
        ]
    }
