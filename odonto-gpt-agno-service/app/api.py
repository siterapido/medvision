
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from app.models.schemas import (
    ChatRequest,
    ImageAnalysisRequest,
    QARequest,
    WhatsAppRequest,
    WhatsAppResponse,
    SummaryGenerationRequest,
    SummaryPreviewRequest
)
from app.agents.qa_agent import dental_qa_agent
from app.agents.image_agent import odonto_vision
from app.agents.summary_agent import dental_summary_agent
# Novos agentes especializados
from app.agents.science_agent import odonto_research
from app.agents.study_agent import odonto_practice
from app.agents.writer_agent import odonto_write
from app.agents.team import rotear_para_agente_apropriado, odonto_flow
from app.tools.database.supabase import get_supabase_client
from app.database.supabase import save_agent_message
from app.tools.whatsapp import send_whatsapp_message
from typing import AsyncGenerator, Optional
from datetime import datetime
import json
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint to verify backend availability"""
    return {"status": "ok", "service": "odonto-gpt-agno-service"}

def get_agent_response(agent, message: str, stream: bool = True):
    """Get response from AGNO agent"""
    try:
        response = agent.run(message, stream=stream)
        return response
    except Exception as e:
        print(f"Error running agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def stream_generator(agent, message: str, session_id: str = None, agent_id: str = "qa") -> AsyncGenerator[str, None]:
    """Generate streaming response from AGNO agent and save to database"""
    full_response = ""
    try:
        # Save user message first (if session_id provided)
        if session_id:
            try:
                save_agent_message(
                    session_id=session_id,
                    agent_id=agent_id,
                    role="user",
                    content=message
                )
            except Exception as e:
                logger.warning(f"Failed to save user message: {e}")

        # Agent.run returns a generator when stream=True
        response_stream = agent.run(message, stream=True, session_id=session_id)
        
        for chunk in response_stream:
            # Check the structure of the chunk returned by AGNO
            chunk_content = ""
            if hasattr(chunk, "content"):
                chunk_content = chunk.content or ""
            elif isinstance(chunk, str):
                chunk_content = chunk
            else:
                chunk_content = str(chunk)
            
            full_response += chunk_content
            yield chunk_content
                 
    except Exception as e:
        yield f"Error: {str(e)}"
        full_response = f"Error: {str(e)}"
    finally:
        # Save assistant response after streaming completes
        if session_id and full_response:
            try:
                save_agent_message(
                    session_id=session_id,
                    agent_id=agent_id,
                    role="assistant",
                    content=full_response
                )
            except Exception as e:
                logger.warning(f"Failed to save assistant message: {e}")

@router.post("/qa/chat")
async def chat_qa(request: QARequest):
    """
    Chat with the Q&A Dental Agent.
    Supports streaming response using Vercel AI SDK Text Stream Protocol.
    """
    return StreamingResponse(
        stream_generator(dental_qa_agent, request.question, session_id=request.sessionId),
        media_type="text/plain",
        headers={
            "Content-Type": "text/plain; charset=utf-8"
        }
    )

@router.post("/image/analyze")
async def analyze_image(request: ImageAnalysisRequest):
    """
    Analyze dental images.
    Usually not streamed as it returns structured data often, but we can stream the analysis text.
    """
    # Construct the message for the image agent
    message = request.question or "Analyze this dental image."
    
    # For image agent, we might need to pass the image URL in a specific way
    # AGNO agents usually take images in the message content or context
    # dental_image_agent uses OpenAI tools, so we likely check if it supports image input in .run()
    # OR we construct a message with image content if supported by the model wrapper.
    # Looking at image_agent.py, it expects standard interaction.
    # However, standard text-only run() might not suffice for passing image URL if not handled inside agent.
    
    # Simplest approach for now: Pass the URL in the text if the agent is instructed to look for it, 
    # BUT Gpt-4o vision needs the image in the messages payload.
    # We might need to adjust how we call run() to include images if AGNO requires specific formatting.
    # Assuming standard AGNO usage for now:
    
    # Create a message that includes the image URL for the agent to use via its tools or internal mechanism
    # If the agent is configured with Vision support (which it is: gpt-4o + vision=True), 
    # we usually pass images parameter to agent.run() or print_response().
    
    try:
        response = odonto_vision.run(
            message, 
            images=[request.imageUrl],
            stream=False, # Image analysis usually better as complete response
            session_id=request.sessionId
        )
        return {"analysis": response.content, "metadata": response.metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def general_chat(request: ChatRequest):
    """
    Unified chat endpoint that routes to appropriate agent.
    Uses Vercel AI SDK Text Stream Protocol.
    """
    target_agent = dental_qa_agent
    agent_id = "qa"

    prompt = request.message
    images = []

    if request.imageUrl or request.agentType == "odonto-vision":
        target_agent = odonto_vision
        agent_id = "odonto-vision"
        if request.imageUrl:
            images = [request.imageUrl]

    return StreamingResponse(
        stream_generator_with_images(target_agent, prompt, images, session_id=request.sessionId, agent_id=agent_id) if images else stream_generator(target_agent, prompt, session_id=request.sessionId, agent_id=agent_id),
        media_type="text/plain",
        headers={
            "Content-Type": "text/plain; charset=utf-8"
        }
    )

async def stream_generator_with_images(agent, message: str, images: list, session_id: str = None, agent_id: str = "image-analysis") -> AsyncGenerator[str, None]:
    """Generate streaming response with images and save to database"""
    full_response = ""
    try:
        # Save user message first
        if session_id:
            try:
                save_agent_message(
                    session_id=session_id,
                    agent_id=agent_id,
                    role="user",
                    content=message,
                    metadata={"images": images} if images else None
                )
            except Exception as e:
                logger.warning(f"Failed to save user message: {e}")

        response_stream = agent.run(message, images=images, stream=True, session_id=session_id)
        for chunk in response_stream:
            chunk_content = ""
            if hasattr(chunk, "content"):
                chunk_content = chunk.content or ""
            elif isinstance(chunk, str):
                chunk_content = chunk
            else:
                chunk_content = str(chunk)
            
            full_response += chunk_content
            yield chunk_content
    except Exception as e:
        yield f"Error: {str(e)}"
        full_response = f"Error: {str(e)}"
    finally:
        # Save assistant response
        if session_id and full_response:
            try:
                save_agent_message(
                    session_id=session_id,
                    agent_id=agent_id,
                    role="assistant",
                    content=full_response
                )
            except Exception as e:
                logger.warning(f"Failed to save assistant message: {e}")


# ============================================================================
# Session Management Endpoints
# ============================================================================

@router.get("/sessions")
async def get_sessions(userId: str):
    """
    List all sessions for a user.
    """
    try:
        supabase = get_supabase_client()
        
        # Select fields needed for the sidebar list
        result = supabase.table("agent_sessions").select(
            "id, agent_type, status, metadata, created_at, updated_at"
        ).eq("user_id", userId).order("updated_at", desc=True).execute()

        if not result.data:
            return []

        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions")
async def create_session(request: dict):
    """
    Create a new agent session in the database.
    This is called by the frontend to track sessions.
    """
    try:
        supabase = get_supabase_client()

        user_id = request.get("userId")
        agent_type = request.get("agentType", "qa")
        metadata = request.get("metadata", {})

        if not user_id:
            raise HTTPException(status_code=400, detail="userId is required")

        # Create session in database
        session_data = {
            "user_id": user_id,
            "agent_type": agent_type,
            "status": "active",
            "metadata": metadata
        }

        # Allow passing a custom ID (must be valid UUID for production schema)
        # If not provided, Supabase will auto-generate one via gen_random_uuid()
        if request.get("id"):
            session_data["id"] = request.get("id")

        logger.info(f"Creating session for user {user_id} with agent_type {agent_type}")
        result = supabase.table("agent_sessions").insert(session_data).execute()

        if not result.data:
            logger.error("Failed to create session: No data returned from Supabase")
            raise HTTPException(status_code=500, detail="Failed to create session")

        logger.info(f"Session created successfully: {result.data[0]['id']}")
        return {
            "id": result.data[0]["id"],
            "agentType": result.data[0]["agent_type"],
            "status": result.data[0]["status"],
            "metadata": result.data[0]["metadata"],
            "createdAt": result.data[0]["created_at"],
            "updatedAt": result.data[0]["updated_at"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """
    Get a specific session with its messages.
    """
    try:
        supabase = get_supabase_client()

        result = supabase.table("agent_sessions").select(
            "*, agent_messages(*)"
        ).eq("id", session_id).single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Session not found")

        session = result.data
        return {
            "id": session["id"],
            "agentType": session["agent_type"],
            "status": session["status"],
            "metadata": session["metadata"],
            "createdAt": session["created_at"],
            "updatedAt": session["updated_at"],
            "messages": [
                {
                    "id": msg["id"],
                    "agentId": msg["agent_id"],
                    "role": msg["role"],
                    "content": msg["content"],
                    "toolCalls": msg.get("tool_calls"),
                    "toolResults": msg.get("tool_results"),
                    "metadata": msg.get("metadata"),
                    "createdAt": msg["created_at"]
                }
                for msg in session.get("agent_messages", [])
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """
    Delete a session and its messages.
    """
    try:
        supabase = get_supabase_client()

        supabase.table("agent_sessions").delete().eq("id", session_id).execute()

        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Novos Endpoints dos Agentes Especializados
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
        stream_generator(odonto_research, request.message, session_id=request.sessionId, agent_id="odonto-research"),
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
        stream_generator(odonto_practice, request.message, session_id=request.sessionId, agent_id="odonto-practice"),
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
        stream_generator(odonto_write, request.message, session_id=request.sessionId, agent_id="odonto-write"),
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
        tem_imagem=bool(request.imageUrl) if hasattr(request, 'imageUrl') else False
    )
    
    # Mapear tipo de agente para o agente correto
    agent_map = {
        'ciencia': (odonto_research, 'odonto-research'),
        'estudo': (odonto_practice, 'odonto-practice'),
        'redator': (odonto_write, 'odonto-write'),
        'imagem': (odonto_vision, 'odonto-vision'),
    }
    
    agent, agent_id = agent_map.get(tipo_agente, (odonto_research, 'odonto-research'))
    
    # Se tem imagem, usar stream_generator_with_images
    if hasattr(request, 'imageUrl') and request.imageUrl:
        return StreamingResponse(
            stream_generator_with_images(agent, request.message, [request.imageUrl], session_id=request.sessionId, agent_id=agent_id),
            media_type="text/plain",
            headers={"Content-Type": "text/plain; charset=utf-8"}
        )
    
    return StreamingResponse(
        stream_generator(agent, request.message, session_id=request.sessionId, agent_id=agent_id),
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
                "id": "odonto-research",
                "nome": "Odonto Research",
                "descricao": "Encontre evidência científica odontológica em segundos. Busca, resume e valida artigos, guidelines e referências clínicas com precisão.",
                "capacidades": [
                    "Busca em PubMed e arXiv",
                    "Formatação de citações (ABNT/APA/Vancouver)",
                    "Síntese de literatura",
                    "Análise de níveis de evidência"
                ],
                "endpoint": "/agentes/dr-ciencia/chat"
            },
            {
                "id": "odonto-practice",
                "nome": "Odonto Practice",
                "descricao": "Treine para provas, concursos e residência com simulados inteligentes. Questões comentadas, repetição adaptativa e foco no que precisa melhorar.",
                "capacidades": [
                    "Geração de questões (múltipla escolha, dissertativas)",
                    "Criação de simulados (ENADE, Residência)",
                    "Explicações pedagógicas detalhadas",
                    "Avaliação adaptativa"
                ],
                "endpoint": "/agentes/prof-estudo/chat"
            },
            {
                "id": "odonto-write",
                "nome": "Odonto Write",
                "descricao": "Produza textos acadêmicos e documentação clínica impecáveis. Crie artigos, TCCs, resumos e relatórios com linguagem técnica correta.",
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
                "id": "odonto-vision",
                "nome": "Odonto Vision",
                "descricao": "Interprete radiografias e imagens odontológicas com apoio de IA. Auxílio na leitura clínica, identificação de padrões e geração de laudos.",
                "capacidades": [
                    "Análise de radiografias",
                    "Interpretação de imagens clínicas",
                    "Diagnóstico por imagem"
                ],
                "endpoint": "/image/analyze"
            },
            {
                "id": "odonto-flow",
                "nome": "Odonto Flow",
                "descricao": "Central inteligente que entende a necessidade do usuário e ativa o módulo certo automaticamente.",
                "capacidades": [
                    "Roteamento automático para agente apropriado",
                    "Coordenação multi-agente quando necessário"
                ],
                "endpoint": "/equipe/chat"
            }
        ]
    }


# ============================================================================
# WhatsApp Integration Endpoints
# ============================================================================

@router.post("/whatsapp", response_model=WhatsAppResponse)
async def whatsapp_chat(request: WhatsAppRequest):
    """
    Process a WhatsApp message and send the response back via WhatsApp.

    This endpoint integrates with Z-API to provide a complete WhatsApp bot experience:
    1. Receives message and phone number
    2. Routes to appropriate AI agent (Q&A or Image Analysis)
    3. Sends response back via WhatsApp

    Ideal for direct integration with Z-API webhooks or manual triggering.

    Args:
        request: WhatsApp request with phone, message, and optional userId/sessionId

    Returns:
        WhatsAppResponse with success status and details

    Example:
        POST /whatsapp
        {
            "phone": "+5511999999999",
            "message": "What is the best treatment for gingivitis?",
            "userId": "user_123",
            "sessionId": "session_456",
            "agentType": "auto"
        }
    """
    try:
        # Determine which agent to use
        target_agent = odonto_research
        agent_type = "odonto-research"

        if request.agentType == "odonto-vision":
            target_agent = odonto_vision
            agent_type = "odonto-vision"

        # Generate or use provided session ID
        session_id = request.sessionId or str(uuid.uuid4())

        # Get response from agent (non-streaming for WhatsApp)
        response = target_agent.run(
            request.message,
            stream=False,
            session_id=session_id
        )

        response_text = response.content if hasattr(response, 'content') else str(response)

        # Send response via WhatsApp
        try:
            send_whatsapp_message(request.phone, response_text)
            message_sent = True
            error_message = None
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message: {e}")
            message_sent = False
            error_message = f"AI response generated but failed to send via WhatsApp: {str(e)}"

        return WhatsAppResponse(
            success=message_sent,
            message=response_text,
            phone=request.phone,
            agentType=agent_type,
            sessionId=session_id
        )

    except Exception as e:
        logger.error(f"Error processing WhatsApp request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Summary Endpoints
# ============================================================================

@router.post("/resumos/generate")
async def generate_summary(request: SummaryGenerationRequest):
    """
    Generate dental study materials (Summary, Flashcards, or Mindmap).
    Streams the response from the Agno agent.
    """
    # 1. Update status to 'generating' in Supabase (optional, usually handled by frontend before call)
    # But good to ensure here. 
    # For now, we assume frontend creates the record with 'generating' status.
    
    # 2. Construct prompt
    prompt = f"Please generate a {request.format} for the following dental topics: {', '.join(request.topics)}."
    prompt += f"\nComplexity Level: {request.complexity}"
    
    if request.format == "FLASHCARDS":
        prompt += "\nReturn a VALID JSON array of flashcards. Do not include markdown code blocks."
    elif request.format == "MINDMAP":
        prompt += "\nReturn a VALID JSON object representing the mindmap structure."
    
    # 3. Stream response
    # We use a session ID linked to the summary ID for tracking
    session_id = f"summary_{request.summaryId}"
    
    return StreamingResponse(
        stream_summary_generator(dental_summary_agent, prompt, request.summaryId, request.format, session_id=session_id, agent_id="summary"),
        media_type="text/plain",
        headers={
            "Content-Type": "text/plain; charset=utf-8"
        }
    )

async def stream_summary_generator(agent, message: str, summary_id: str, format: str, session_id: str = None, agent_id: str = "summary") -> AsyncGenerator[str, None]:
    """Generate streaming response and update appropriate tables based on format"""
    full_response = ""
    try:
        response_stream = agent.run(message, stream=True, session_id=session_id)
        
        for chunk in response_stream:
            chunk_content = ""
            if hasattr(chunk, "content"):
                chunk_content = chunk.content or ""
            elif isinstance(chunk, str):
                chunk_content = chunk
            else:
                chunk_content = str(chunk)
            
            full_response += chunk_content
            yield chunk_content
            
    except Exception as e:
        logger.error(f"Error in stream generation: {e}")
        yield f"Error: {str(e)}"
        # Update summary status to failed if it was a summary generation
        if format == "SUMMARY":
            try:
                supabase = get_supabase_client()
                supabase.table("summaries").update({
                    "status": "failed",
                    "content": str(e)
                }).eq("id", summary_id).execute()
            except:
                pass
    finally:
        # Save complete content to DB based on format
        if full_response:
            try:
                supabase = get_supabase_client()
                
                if format == "SUMMARY":
                    supabase.table("summaries").update({
                        "content": full_response,
                        "status": "ready",
                        "updated_at": datetime.utcnow().isoformat()
                    }).eq("id", summary_id).execute()
                    
                elif format == "FLASHCARDS":
                    # Clean markdown code blocks if present
                    json_str = full_response.replace("```json", "").replace("```", "").strip()
                    flashcards_data = json.loads(json_str)
                    
                    # Prepare inserts
                    inserts = []
                    for card in flashcards_data:
                        inserts.append({
                            "summary_id": summary_id,
                            "front": card.get("front", ""),
                            "back": card.get("back", "")
                        })
                    
                    if inserts:
                        # Delete existing flashcards for this summary to avoid duplicates/mess (optional strategy)
                        # For now, let's just insert. A clearer strategy might be needed later.
                        supabase.table("flashcards").insert(inserts).execute()
                        
                elif format == "MINDMAP":
                    # Clean markdown code blocks
                    json_str = full_response.replace("```json", "").replace("```", "").strip()
                    mindmap_data = json.loads(json_str)
                    
                    supabase.table("mind_maps").insert({
                        "summary_id": summary_id,
                        "structure": mindmap_data
                    }).execute()
                    
            except Exception as e:
                logger.error(f"Failed to save generated content to DB: {e}")

@router.post("/resumos/preview")
async def preview_summary(request: SummaryPreviewRequest):
    """
    Calculate estimates for the summary generation.
    Returns estimated token count, time, and content size.
    """
    # Simple estimation logic based on topic count and complexity
    num_topics = len(request.topics)
    multiplier = 1.0
    if request.complexity == "advanced":
        multiplier = 1.5
    elif request.complexity == "basic":
        multiplier = 0.8
        
    estimated_words = num_topics * 500 * multiplier
    estimated_time_seconds = (estimated_words / 15) # Assume ~15 words/sec generation speed
    
    return {
        "estimatedWords": int(estimated_words),
        "estimatedTimeSeconds": int(estimated_time_seconds),
        "estimatedFlashcards": int(num_topics * 5),
        "estimatedDiagrams": int(num_topics * 1),
        "complexity": request.complexity
    }

