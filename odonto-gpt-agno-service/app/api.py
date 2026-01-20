from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import (
    ChatRequest,
    ImageAnalysisRequest,
    QARequest,
    WhatsAppRequest,
    WhatsAppResponse,
    SummaryGenerationRequest,
)
from app.agents.image_agent import odonto_vision
from app.agents.science_agent import odonto_research
from app.services.orchestrator import orchestrator
from app.tools.whatsapp import send_whatsapp_message
from app.tools.database.supabase import get_supabase_client
from typing import Optional, Sequence, List, Dict, Any, Union
from agno.media import Image
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint to verify backend availability"""
    return {"status": "ok", "service": "odonto-gpt-agno-service"}


@router.post("/qa/chat")
async def chat_qa(request: QARequest):
    """Chat with the Q&A Dental Agent via Orchestrator."""
    return StreamingResponse(
        orchestrator.get_stream(
            agent_key="qa",
            message=request.question,
            session_id=request.sessionId,
            user_id=request.userId,
        ),
        media_type="application/x-ndjson",
        headers={"Content-Type": "application/x-ndjson"},
    )


@router.post("/chat")
async def general_chat(request: ChatRequest):
    """Unified chat endpoint with intelligent routing."""
    has_image = bool(request.imageUrl)
    images = [Image(url=request.imageUrl)] if request.imageUrl else None

    agent_key = request.agentType
    if not agent_key or agent_key == "auto":
        agent_key = orchestrator.route_request(
            message=request.message, has_image=has_image, context=request.context
        )

    return StreamingResponse(
        orchestrator.get_stream(
            agent_key=agent_key,
            message=request.message,
            session_id=request.sessionId,
            context=request.context,
            images=images,
            user_id=request.userId,
        ),
        media_type="application/x-ndjson",
        headers={"Content-Type": "application/x-ndjson"},
    )


@router.post("/equipe/chat")
async def chat_equipe(request: ChatRequest):
    """Alias for general_chat focusing on team/orchestrated requests."""
    return await general_chat(request)


@router.post("/image/analyze")
async def analyze_image(request: ImageAnalysisRequest):
    """Synchronous image analysis."""
    try:
        response = odonto_vision.run(
            request.question or "Analyze this dental image.",
            images=[Image(url=request.imageUrl)] if request.imageUrl else None,
            stream=False,
            session_id=request.sessionId,
        )
        return {"analysis": response.content, "metadata": response.metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions")
async def get_sessions(userId: str):
    """List user sessions."""
    try:
        supabase = get_supabase_client()
        result = (
            supabase.table("agent_sessions")
            .select("id, agent_type, status, metadata, created_at, updated_at")
            .eq("user_id", userId)
            .order("updated_at", desc=True)
            .execute()
        )
        return result.data if result.data else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions")
async def create_session(request: dict):
    """Create a new agent session."""
    try:
        supabase = get_supabase_client()
        user_id = request.get("userId")
        if not user_id:
            raise HTTPException(status_code=400, detail="userId is required")

        session_data = {
            "user_id": user_id,
            "agent_type": request.get("agentType", "qa"),
            "status": "active",
            "metadata": request.get("metadata", {}),
        }
        if request.get("id"):
            session_data["id"] = request.get("id")

        result = supabase.table("agent_sessions").insert(session_data).execute()
        if not result or not result.data:
            raise HTTPException(status_code=500, detail="Failed to create session")

        # Explicit type cast/check for s
        data_list = result.data
        if not isinstance(data_list, list) or len(data_list) == 0:
            raise HTTPException(status_code=500, detail="Empty response from database")

        s = data_list[0]
        if not isinstance(s, dict):
            raise HTTPException(
                status_code=500, detail="Invalid data format from database"
            )

        return {
            "id": s.get("id"),
            "agentType": s.get("agent_type"),
            "status": s.get("status"),
            "metadata": s.get("metadata"),
            "createdAt": s.get("created_at"),
            "updatedAt": s.get("updated_at"),
        }
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Get session details and messages."""
    try:
        supabase = get_supabase_client()
        result = (
            supabase.table("agent_sessions")
            .select("*, agent_messages(*)")
            .eq("id", session_id)
            .single()
            .execute()
        )
        if not result or not result.data:
            raise HTTPException(status_code=404, detail="Session not found")

        s = result.data
        if not isinstance(s, dict):
            raise HTTPException(status_code=404, detail="Invalid session data")

        msgs_raw = s.get("agent_messages", [])
        msgs: List[Dict[str, Any]] = msgs_raw if isinstance(msgs_raw, list) else []

        return {
            "id": s.get("id"),
            "agentType": s.get("agent_type"),
            "messages": [
                {
                    "id": m.get("id"),
                    "role": m.get("role"),
                    "content": m.get("content"),
                    "createdAt": m.get("created_at"),
                }
                for m in msgs
                if isinstance(m, dict)
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/whatsapp")
async def whatsapp_chat(request: WhatsAppRequest):
    """Z-API WhatsApp integration."""
    try:
        msg = request.message
        if not msg or not isinstance(msg, str):
            raise HTTPException(
                status_code=400, detail="Valid message string is required"
            )

        session_id = request.sessionId or str(uuid.uuid4())
        response = odonto_research.run(msg, stream=False, session_id=session_id)
        response_text = (
            str(response.content) if hasattr(response, "content") else str(response)
        )
        send_whatsapp_message(request.phone, response_text)
        return WhatsAppResponse(
            success=True,
            message=response_text,
            phone=request.phone,
            agentType="odonto-research",
            sessionId=session_id,
        )
    except Exception as e:
        logger.error(f"WhatsApp error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resumos/generate")
async def generate_summary(request: SummaryGenerationRequest):
    """Generate study materials via Orchestrator."""
    topics = request.topics if isinstance(request.topics, list) else []
    prompt = f"Generate {request.format} for: {', '.join(topics)}. Complexity: {request.complexity}"

    return StreamingResponse(
        orchestrator.get_stream(
            agent_key="resumo",
            message=prompt,
            session_id=f"summary_{request.summaryId}",
            user_id="system",
        ),
        media_type="text/plain",
    )
