"""
Exemplo de Integração dos Novos Agentes no API.py

Este arquivo mostra como adicionar endpoints para os 3 novos agentes especializados.
Adicione estes endpoints ao arquivo app/api.py existente.
"""

from app.agents.science_agent import dr_ciencia
from app.agents.study_agent import prof_estudo
from app.agents.writer_agent import dr_redator
from app.agents.team import equipe_dental, rotear_para_agente_apropriado, executar_agente

# ============================================================================
# Novos Endpoints para Agentes Especializados
# ============================================================================

@router.post("/agentes/dr-ciencia/chat")
async def chat_dr_ciencia(request: ChatRequest):
    """
    Chat com Dr. Ciência - Especialista em Pesquisa Científica.
    
    Capacidades:
    - Busca em PubMed e arXiv
    - Formatação de citações (ABNT, APA, Vancouver)
    - Síntese de literatura científica
    - Análise de níveis de evidência
    """
    return StreamingResponse(
        stream_generator(dr_ciencia, request.message, session_id=request.sessionId, agent_id="dr-ciencia"),
        media_type="text/plain",
        headers={"Content-Type": "text/plain; charset=utf-8"}
    )


@router.post("/agentes/prof-estudo/chat")
async def chat_prof_estudo(request: ChatRequest):
    """
    Chat com Prof. Estudo - Especialista em Questões e Simulados.
    
    Capacidades:
    - Geração de questões de múltipla escolha
    - Criação de questões dissertativas
    - Simulados personalizados (ENADE, Residência)
    - Explicações pedagógicas detalhadas
    """
    return StreamingResponse(
        stream_generator(prof_estudo, request.message, session_id=request.sessionId, agent_id="prof-estudo"),
        media_type="text/plain",
        headers={"Content-Type": "text/plain; charset=utf-8"}
    )


@router.post("/agentes/dr-redator/chat")
async def chat_dr_redator(request: ChatRequest):
    """
    Chat com Dr. Redator - Especialista em Escrita Acadêmica.
    
    Capacidades:
    - Estruturas de TCC por especialidade
    - Templates de artigos científicos (IMRAD)
    - Revisão de textos acadêmicos
    - Sugestões de metodologia de pesquisa
    - Formatação de referências
    """
    return StreamingResponse(
        stream_generator(dr_redator, request.message, session_id=request.sessionId, agent_id="dr-redator"),
        media_type="text/plain",
        headers={"Content-Type": "text/plain; charset=utf-8"}
    )


@router.post("/equipe/chat")
async def chat_equipe(request: ChatRequest):
    """
    Chat com roteamento inteligente automático para o agente apropriado.
    
    A equipe analisa a mensagem e roteia para:
    - Dr. Ciência: pesquisa, artigos, evidências
    - Prof. Estudo: questões, simulados, avaliação  
    - Dr. Redator: TCCs, artigos, escrita
    - Dental Image: análise de imagens
    - Equipe: quando múltiplos agentes são necessários
    """
    # Rotear automaticamente
    tipo_agente = rotear_para_agente_apropriado(
        mensagem_usuario=request.message,
        tem_imagem=bool(request.imageUrl)
    )
    
async def stream_com_roteamento(message: str, image_url: str = None, session_id: str = None):
        """Generator que roteia e executa o agente apropriado"""
        full_response = ""
        try:
            # Determinar agente
            tipo = rotear_para_agente_apropriado(message, tem_imagem=bool(image_url))
            
            # Salvar mensagem do usuário
            if session_id:
                save_agent_message(
                    session_id=session_id,
                    agent_id=f"equipe-{tipo}",
                    role="user",
                    content=message
                )
            
            # Executar agente apropriado
            resultado = await executar_agente(
                tipo_agente=tipo,
                mensagem=message,
                contexto={"image_url": image_url} if image_url else None
            )
            
            # Stream resposta
            response_text = resultado.get('response', '')
            full_response = response_text
            yield response_text
            
        except Exception as e:
            error_msg = f"Erro: {str(e)}"
            full_response = error_msg
            yield error_msg
        finally:
            # Salvar resposta do assistente
            if session_id and full_response:
                save_agent_message(
                    session_id=session_id,
                    agent_id=f"equipe-{tipo}",
                    role="assistant",
                    content=full_response
                )
    
    return StreamingResponse(
        stream_com_roteamento(request.message, request.imageUrl, session_id=request.sessionId),
        media_type="text/plain",
        headers={"Content-Type": "text/plain; charset=utf-8"}
    )


@router.get("/agentes")
async def listar_agentes():
    """
    Lista todos os agentes disponíveis com suas capacidades.
    """
    return {
        "agentes": [
            {
                "id": "dr-ciencia",
                "nome": "Dr. Ciência",
                "descricao": "Especialista em pesquisa científica odontológica",
                "capacidades": [
                    "Busca em PubMed e arXiv",
                    "Formatação de citações (ABNT/APA/Vancouver)",
                    "Síntese de literatura",
                    "Análise de níveis de evidência"
                ],
                "endpoint": "/agentes/dr-ciencia/chat"
            },
            {
                "id": "prof-estudo",
                "nome": "Prof. Estudo",
                "descricao": "Especialista em questões e simulados educacionais",
                "capacidades": [
                    "Geração de questões (múltipla escolha, dissertativas)",
                    "Criação de simulados (ENADE, Residência)",
                    "Explicações pedagógicas detalhadas",
                    "Avaliação adaptativa"
                ],
                "endpoint": "/agentes/prof-estudo/chat"
            },
            {
                "id": "dr-redator",
                "nome": "Dr. Redator",
                "descricao": "Especialista em escrita acadêmica e científica",
                "capacidades": [
                    "Estruturas de TCC completas",
                    "Templates de artigos (IMRAD)",
                    "Revisão de textos acadêmicos",
                    "Sugestões de metodologia",
                    "Formatação de referências"
                ],
                "endpoint": "/agentes/dr-redator/chat"
            },
            {
                "id": "analise-imagem",
                "nome": "Dental Image Agent",
                "descricao": "Especialista em análise de imagens odontológicas",
                "capacidades": [
                    "Análise de radiografias",
                    "Interpretação de imagens clínicas",
                    "Diagnóstico por imagem"
                ],
                "endpoint": "/image/analyze"
            },
            {
                "id": "equipe",
                "nome": "Equipe Educacional",
                "descricao": "Roteamento inteligente automático",
                "capacidades": [
                    "Roteamento automático para agente apropriado",
                    "Coordenação multi-agente quando necessário"
                ],
                "endpoint": "/equipe/chat"
            }
        ]
    }


# ============================================================================
# Instruções de Integração
# ============================================================================

"""
COMO INTEGRAR NO app/api.py EXISTENTE:

1. Adicionar imports no início do arquivo (após os imports existentes):
   
   from app.agents.science_agent import dr_ciencia
   from app.agents.study_agent import prof_estudo
   from app.agents.writer_agent import dr_redator
   from app.agents.team import equipe_dental, rotear_para_agente_apropriado, executar_agente

2. Adicionar os endpoints acima ao router existente (após os endpoints atuais)

3. Testar endpoints via Swagger UI:
   http://localhost:8000/docs
   
4. Exemplos de uso:

   # Dr. Ciência
   POST /agentes/dr-ciencia/chat
   {
     "message": "Busque artigos sobre osseointegração de implantes",
     "sessionId": "session_123"
   }
   
   # Prof. Estudo
   POST /agentes/prof-estudo/chat
   {
     "message": "Crie um simulado de periodontia com 10 questões",
     "sessionId": "session_123"
   }
   
   # Dr. Redator
   POST /agentes/dr-redator/chat
   {
     "message": "Crie a estrutura de um TCC sobre implantodontia",
     "sessionId": "session_123"
   }
   
   # Equipe (roteamento automático)
   POST /equipe/chat
   {
     "message": "Preciso escrever um TCC e encontrar literatura recente",
     "sessionId": "session_123"
   }
"""
