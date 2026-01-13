"""Pydantic models for API request/response validation"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime


# ============================================================================
# Chat & Message Models
# ============================================================================

class ChatMessage(BaseModel):
    """Chat message model"""
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    """Request for chat completion"""
    message: str = Field(..., description="User message")
    sessionId: Optional[str] = Field(None, description="Existing session ID")
    userId: str = Field(..., description="User ID from Supabase")
    agentType: Optional[Literal["image-analysis", "qa", "auto"]] = Field(
        "auto",
        description="Which agent to use"
    )
    context: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional context for the conversation"
    )
    imageUrl: Optional[str] = Field(None, description="Image URL for analysis")


class ChatResponse(BaseModel):
    """Response from chat completion"""
    response: str
    agentType: str
    sessionId: str
    toolCalls: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None


# ============================================================================
# Image Analysis Models
# ============================================================================

class ImageAnalysisRequest(BaseModel):
    """Request for dental image analysis"""
    imageUrl: str = Field(..., description="Public URL of dental image")
    question: Optional[str] = Field(
        "Analyze this dental image comprehensively",
        description="Specific question or focus area"
    )
    userId: str = Field(..., description="User ID from Supabase")
    sessionId: Optional[str] = Field(None, description="Session ID for continuity")
    focusArea: Optional[str] = Field(None, description="Specific area to focus on")


class ImageAnalysisResponse(BaseModel):
    """Response from image analysis"""
    analysis: str
    findings: List[str] = Field(default_factory=list)
    confidence: Optional[float] = None
    recommendations: List[str] = Field(default_factory=list)
    disclaimer: str = Field(
        default="This analysis is for educational purposes only. "
                "Clinical examination and professional judgment are required.",
        description="Required disclaimer"
    )
    metadata: Optional[Dict[str, Any]] = None


# ============================================================================
# Q&A Models
# ============================================================================

class QARequest(BaseModel):
    """Request for Q&A agent"""
    question: str = Field(..., description="Question about dental topics")
    userId: str = Field(..., description="User ID from Supabase")
    specialty: Optional[str] = Field(
        None,
        description="Dental specialty filter (periodontia, endodontia, etc.)"
    )
    sessionId: Optional[str] = Field(None, description="Session ID for continuity")


class QAResponse(BaseModel):
    """Response from Q&A agent"""
    answer: str
    sources: List[Dict[str, str]] = Field(default_factory=list)
    specialty: Optional[str] = None
    confidence: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


# ============================================================================
# Session Models
# ============================================================================

class AgentSession(BaseModel):
    """Agent session model"""
    id: str
    userId: str
    agentType: str
    status: Literal["active", "completed", "error"]
    metadata: Optional[Dict[str, Any]] = None
    createdAt: datetime
    updatedAt: datetime


class CreateSessionRequest(BaseModel):
    """Request to create new agent session"""
    userId: str
    agentType: Literal["image-analysis", "qa", "orchestrated"]
    metadata: Optional[Dict[str, Any]] = None


# ============================================================================
# Health Check Models
# ============================================================================

class HealthResponse(BaseModel):
    """Health check response"""
    status: str = "healthy"
    version: str = "1.0.0"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    services: Dict[str, str] = Field(
        default_factory=lambda: {
            "database": "connected",
            "openai": "configured",
            "agno": "ready"
        }
    )


# ============================================================================
# WhatsApp Integration Models
# ============================================================================

class WhatsAppWebhookMessage(BaseModel):
    """Incoming WhatsApp message from Z-API webhook"""
    phone: str
    messageId: str
    isGroup: bool = False
    fromMe: bool = False
    text: Optional[Dict[str, str]] = None
    image: Optional[Dict[str, Any]] = None
    audio: Optional[Dict[str, Any]] = None
    document: Optional[Dict[str, Any]] = None
    senderName: Optional[str] = None
    chatName: Optional[str] = None


class WhatsAppWebhookPayload(BaseModel):
    """Z-API webhook payload"""
    type: Literal["ReceivedCallback", "StatusCallback"]
    phone: str
    body: WhatsAppWebhookMessage


class WhatsAppRequest(BaseModel):
    """Direct request for WhatsApp messaging (without webhook)"""
    phone: str = Field(..., description="Phone number (will be formatted)")
    message: str = Field(..., description="Message to send")
    userId: Optional[str] = Field(None, description="User ID for session tracking")
    sessionId: Optional[str] = Field(None, description="Session ID for continuity")
    agentType: Optional[Literal["image-analysis", "qa", "auto"]] = Field(
        "auto",
        description="Which agent to use"
    )


class WhatsAppResponse(BaseModel):
    """Response from WhatsApp endpoint"""
    success: bool
    message: str
    phone: str
    agentType: str
    sessionId: Optional[str] = None


# ============================================================================
# Error Models
# ============================================================================

class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
