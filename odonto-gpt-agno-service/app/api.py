
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest, ImageAnalysisRequest, QARequest
from app.agents.qa_agent import dental_qa_agent
from app.agents.image_agent import dental_image_agent
from typing import AsyncGenerator
import json

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
    Supports streaming response.
    """
    return StreamingResponse(
        stream_generator(dental_qa_agent, request.question, session_id=request.sessionId),
        media_type="text/plain"
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
    """
    target_agent = dental_qa_agent
    stream = True
    
    prompt = request.message
    images = []
    
    if request.imageUrl or request.agentType == "image-analysis":
        target_agent = dental_image_agent
        if request.imageUrl:
            images = [request.imageUrl]
        # Disable streaming for image analysis initially to ensure structure, or enable if robust
        # Let's keep stream=True for consistency if possible, but vision often is slower/complex.
        # We will stream text response.
    
    return StreamingResponse(
        stream_generator_with_images(target_agent, prompt, images, session_id=request.sessionId) if images else stream_generator(target_agent, prompt, session_id=request.sessionId),
        media_type="text/plain"
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
