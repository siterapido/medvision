
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from app.models.schemas import (
    ChatRequest,
    ImageAnalysisRequest,
    QARequest,
    WhatsAppRequest,
    WhatsAppResponse
)
from app.agents.qa_agent import dental_qa_agent
from app.agents.image_agent import dental_image_agent
from app.tools.database.supabase import get_supabase_client
from app.tools.whatsapp import send_whatsapp_message
from typing import AsyncGenerator, Optional
from datetime import datetime
import json
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

def get_agent_response(agent, message: str, stream: bool = True):
    """Get response from AGNO agent"""
    try:
        response = agent.run(message, stream=stream)
        return response
    except Exception as e:
        print(f"Error running agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def stream_generator(agent, message: str, session_id:str = None) -> AsyncGenerator[str, None]:
    """Generate streaming response from AGNO agent"""
    try:
        # Agent.run returns a generator when stream=True
        response_stream = agent.run(message, stream=True, session_id=session_id)
        
        for chunk in response_stream:
            # Check the structure of the chunk returned by AGNO
            # Usually it returns an object with content or just a string depending on configuration
            # We assume it sends string chunks or objects with .content based on standard patterns
            if hasattr(chunk, "content"):
                yield chunk.content
            elif isinstance(chunk, str):
                yield chunk
            else:
                 # Fallback for other types
                 yield str(chunk)
                 
    except Exception as e:
        yield f"Error: {str(e)}"

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
        response = dental_image_agent.run(
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
    stream = True

    prompt = request.message
    images = []

    if request.imageUrl or request.agentType == "image-analysis":
        target_agent = dental_image_agent
        if request.imageUrl:
            images = [request.imageUrl]

    return StreamingResponse(
        stream_generator_with_images(target_agent, prompt, images, session_id=request.sessionId) if images else stream_generator(target_agent, prompt, session_id=request.sessionId),
        media_type="text/plain",
        headers={
            "Content-Type": "text/plain; charset=utf-8"
        }
    )

async def stream_generator_with_images(agent, message: str, images: list, session_id: str = None) -> AsyncGenerator[str, None]:
    try:
        response_stream = agent.run(message, images=images, stream=True, session_id=session_id)
        for chunk in response_stream:
             if hasattr(chunk, "content"):
                yield chunk.content
             elif isinstance(chunk, str):
                yield chunk
             else:
                 yield str(chunk)
    except Exception as e:
        yield f"Error: {str(e)}"


# ============================================================================
# Session Management Endpoints
# ============================================================================

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

        result = supabase.table("agent_sessions").insert(session_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create session")

        return {
            "id": result.data[0]["id"],
            "agentType": result.data[0]["agent_type"],
            "status": result.data[0]["status"],
            "metadata": result.data[0]["metadata"],
            "createdAt": result.data[0]["created_at"],
            "updatedAt": result.data[0]["updated_at"]
        }
    except Exception as e:
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
        target_agent = dental_qa_agent
        agent_type = "qa"

        if request.agentType == "image-analysis":
            target_agent = dental_image_agent
            agent_type = "image-analysis"

        # Generate or use provided session ID
        session_id = request.sessionId or f"wa_{request.phone}_{uuid.uuid4().hex[:8]}"

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
