"""
Workflow de Criação Direta de Artefatos

Permite gerar artefatos sem histórico de chat prévio,
usando os agentes especializados em modo de tarefa única.
"""

import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class DirectCreationRequest(BaseModel):
    """Requisição para criação direta de artefato"""
    artifact_type: str = Field(description="Tipo do artefato: pesquisa, simulado, resumo, flashcards, mindmap")
    topic: str = Field(description="Tema/tópico do artefato")
    user_id: str = Field(description="ID do usuário")
    instructions: Optional[str] = Field(default=None, description="Instruções adicionais")
    difficulty: Optional[str] = Field(default="medium", description="Dificuldade (para simulados)")
    num_items: Optional[int] = Field(default=None, description="Número de itens (questões, flashcards)")


class DirectCreationResponse(BaseModel):
    """Resposta da criação direta"""
    success: bool
    artifact_id: Optional[str] = None
    artifact_type: str
    title: str
    message: str
    error: Optional[str] = None


class DirectArtifactWorkflow:
    """
    Workflow para criação direta de artefatos via interface.
    
    Utiliza os agentes especializados em modo stateless para
    gerar e persistir artefatos em uma única execução.
    """
    
    def __init__(self):
        self._agents = {}
        self._load_agents()
    
    def _load_agents(self):
        """Carrega os agentes especializados sob demanda."""
        try:
            from app.agents.science_agent import odonto_research
            self._agents["pesquisa"] = odonto_research
            self._agents["research"] = odonto_research
        except ImportError as e:
            logger.warning(f"Could not load odonto_research: {e}")
        
        try:
            from app.agents.study_agent import odonto_practice
            self._agents["simulado"] = odonto_practice
            self._agents["exam"] = odonto_practice
            self._agents["questoes"] = odonto_practice
        except ImportError as e:
            logger.warning(f"Could not load odonto_practice: {e}")
        
        try:
            from app.agents.summary_agent import dental_summary_agent
            self._agents["resumo"] = dental_summary_agent
            self._agents["summary"] = dental_summary_agent
            self._agents["flashcards"] = dental_summary_agent
            self._agents["mindmap"] = dental_summary_agent
        except ImportError as e:
            logger.warning(f"Could not load dental_summary_agent: {e}")
    
    async def run(self, request: DirectCreationRequest) -> DirectCreationResponse:
        """
        Executa a criação direta de um artefato.
        
        Args:
            request: Requisição com tipo, tema e configurações
            
        Returns:
            Resposta com ID do artefato criado ou erro
        """
        artifact_type = request.artifact_type.lower()
        agent = self._agents.get(artifact_type)
        
        if not agent:
            return DirectCreationResponse(
                success=False,
                artifact_type=artifact_type,
                title="",
                message="Tipo de artefato não suportado",
                error=f"Não encontrei um agente para o tipo '{artifact_type}'. Tipos disponíveis: {list(self._agents.keys())}"
            )
        
        # Construir prompt baseado no tipo
        prompt = self._build_prompt(request)
        
        try:
            # Executar agente em modo de tarefa única
            response = await agent.arun(
                prompt,
                context={
                    "user_id": request.user_id,
                    "source_type": "direct",
                    "artifact_type": artifact_type
                }
            )
            
            # Extrair informações da resposta
            result = self._parse_agent_response(response, artifact_type)
            
            return DirectCreationResponse(
                success=True,
                artifact_id=result.get("id"),
                artifact_type=artifact_type,
                title=result.get("title", f"Novo {artifact_type}"),
                message=f"Artefato de {artifact_type} criado com sucesso!"
            )
            
        except Exception as e:
            logger.error(f"Error in direct artifact creation: {e}")
            return DirectCreationResponse(
                success=False,
                artifact_type=artifact_type,
                title="",
                message="Erro ao criar artefato",
                error=str(e)
            )
    
    def _build_prompt(self, request: DirectCreationRequest) -> str:
        """Constrói o prompt adequado para cada tipo de artefato."""
        base_context = f"O user_id do usuário é: {request.user_id}. Use este ID ao salvar o artefato."
        
        if request.artifact_type in ["pesquisa", "research"]:
            return f"""
            {base_context}
            
            Realize uma pesquisa científica completa sobre o tema: {request.topic}
            
            Instruções adicionais: {request.instructions or 'Nenhuma'}
            
            IMPORTANTE: Após gerar a pesquisa, use a ferramenta save_research para salvá-la.
            Inclua fontes científicas reais e sugestões de perguntas de follow-up.
            """
        
        elif request.artifact_type in ["simulado", "exam", "questoes"]:
            num_questions = request.num_items or 10
            return f"""
            {base_context}
            
            Crie um simulado completo sobre o tema: {request.topic}
            
            Configurações:
            - Número de questões: {num_questions}
            - Dificuldade: {request.difficulty or 'medium'}
            
            Instruções adicionais: {request.instructions or 'Nenhuma'}
            
            IMPORTANTE: Após gerar o simulado, use a ferramenta save_practice_exam para salvá-lo.
            Cada questão deve ter opções, resposta correta e explicação detalhada.
            """
        
        elif request.artifact_type in ["resumo", "summary"]:
            return f"""
            {base_context}
            
            Crie um resumo de estudo completo sobre o tema: {request.topic}
            
            Instruções adicionais: {request.instructions or 'Nenhuma'}
            
            IMPORTANTE: Após gerar o resumo, use a ferramenta save_summary para salvá-lo.
            O resumo deve ser estruturado, didático e com pontos-chave destacados.
            """
        
        elif request.artifact_type == "flashcards":
            num_cards = request.num_items or 20
            return f"""
            {base_context}
            
            Crie um deck de flashcards sobre o tema: {request.topic}
            
            Configurações:
            - Número de cartões: {num_cards}
            
            Instruções adicionais: {request.instructions or 'Nenhuma'}
            
            IMPORTANTE: Após gerar os flashcards, use a ferramenta save_flashcards para salvá-los.
            Cada cartão deve ter uma pergunta (front) e resposta (back) objetivas.
            """
        
        elif request.artifact_type == "mindmap":
            return f"""
            {base_context}
            
            Crie um mapa mental estruturado sobre o tema: {request.topic}
            
            Instruções adicionais: {request.instructions or 'Nenhuma'}
            
            IMPORTANTE: Após gerar o mapa mental, use a ferramenta save_mind_map para salvá-lo.
            O mapa deve ter um nó central e ramificações organizadas hierarquicamente.
            """
        
        else:
            return f"""
            {base_context}
            
            Gere conteúdo educacional sobre: {request.topic}
            
            Instruções: {request.instructions or 'Crie um conteúdo completo e didático.'}
            """
    
    def _parse_agent_response(self, response: Any, artifact_type: str) -> Dict[str, Any]:
        """Extrai informações relevantes da resposta do agente."""
        result = {"id": None, "title": None}
        
        if hasattr(response, 'tool_calls') and response.tool_calls:
            for tool_call in response.tool_calls:
                if tool_call.result:
                    import json
                    try:
                        parsed = json.loads(tool_call.result)
                        if parsed.get("artifact"):
                            result["id"] = parsed["artifact"].get("id")
                            result["title"] = parsed["artifact"].get("title")
                            break
                    except (json.JSONDecodeError, TypeError):
                        # Tentar regex como fallback
                        import re
                        match = re.search(r'ID:\s*([a-f0-9\-]+)', str(tool_call.result))
                        if match:
                            result["id"] = match.group(1)
        
        return result


# Função helper para uso direto
async def generate_direct_artifact(
    artifact_type: str,
    topic: str,
    user_id: str,
    instructions: Optional[str] = None,
    difficulty: Optional[str] = None,
    num_items: Optional[int] = None
) -> DirectCreationResponse:
    """
    Helper function para criar artefatos diretamente.
    
    Args:
        artifact_type: Tipo do artefato
        topic: Tema/tópico
        user_id: ID do usuário
        instructions: Instruções extras (opcional)
        difficulty: Dificuldade (opcional)
        num_items: Número de itens (opcional)
    
    Returns:
        Resposta com resultado da criação
    """
    workflow = DirectArtifactWorkflow()
    request = DirectCreationRequest(
        artifact_type=artifact_type,
        topic=topic,
        user_id=user_id,
        instructions=instructions,
        difficulty=difficulty,
        num_items=num_items
    )
    return await workflow.run(request)
