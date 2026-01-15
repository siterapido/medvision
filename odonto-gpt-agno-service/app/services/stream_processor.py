
import json
import uuid
import logging
from typing import AsyncGenerator, Any, Optional

logger = logging.getLogger(__name__)

class StreamEventProcessor:
    """
    Handles the processing of Agno agent streams, converting them into 
    NDJSON events for the frontend (Vercel AI SDK compatible).
    """

    def __init__(self, agent_id: str, session_id: str = None):
        self.agent_id = agent_id
        self.current_agent_id = agent_id
        self.session_id = session_id
        self.full_response = ""
        self.artifact_tools = [
            "save_research", "save_practice_exam", "save_summary", 
            "save_flashcards", "save_mind_map", "save_academic_text"
        ]

    def _format_event(self, event_type: str, data: dict = None) -> str:
        """Helper to format event as NDJSON line"""
        payload = {"type": event_type}
        if data:
            payload.update(data)
        return json.dumps(payload, ensure_ascii=False) + "\n"

    async def process(self, response_stream: Any) -> AsyncGenerator[str, None]:
        """
        Iterates over the Agno response stream and yields formatted NDJSON events.
        Accumulates the full text response in self.full_response.
        """
        
        # Emit initial run started
        yield self._format_event("run.started", {"agent_id": self.agent_id})

        for chunk in response_stream:
            try:
                # Handle legacy string chunks (fallback)
                if isinstance(chunk, str):
                    yield self._format_event("text.delta", {"content": chunk})
                    self.full_response += chunk
                    continue

                # Handle Agno Events
                event_type = getattr(chunk, "event", None)
                
                # Check for agent switch first
                chunk_agent_name = getattr(chunk, "agent_name", None)
                
                # Detect Agent Switch using Canonical IDs
                if chunk_agent_name and chunk_agent_name.lower() != self.current_agent_id:
                     new_agent_id = chunk_agent_name.lower()
                     self.current_agent_id = new_agent_id
                     yield self._format_event("agent.switch", {"agentId": new_agent_id})

                if event_type == "RunStarted":
                    pass

                elif event_type == "RunContent":
                    content = getattr(chunk, "content", "")
                    if content:
                        yield self._format_event("text.delta", {"content": content})
                        self.full_response += content

                elif event_type == "ToolCallStarted":
                    tool_call = getattr(chunk, "tool_call", {})
                    
                    tool_name = "unknown_tool"
                    tool_id = str(uuid.uuid4())
                    
                    if hasattr(chunk, "tool_name"):
                         tool_name = chunk.tool_name
                    elif hasattr(chunk, "tool_call") and hasattr(chunk.tool_call, "function"):
                         tool_name = chunk.tool_call.function.name

                    tool_args = "{}"
                    if hasattr(chunk, "tool_args"):
                         tool_args = chunk.tool_args
                    elif hasattr(chunk, "tool_call") and hasattr(chunk.tool_call, "function"):
                         tool_args = chunk.tool_call.function.arguments

                    yield self._format_event("tool_call.start", {
                        "toolCallId": tool_id,
                        "toolCallName": tool_name,
                        "args": tool_args
                    })

                elif event_type == "ToolCallCompleted":
                    tool_output = getattr(chunk, "tool_output", None)
                    content = ""
                    if tool_output:
                         content = str(tool_output.content) if hasattr(tool_output, "content") else str(tool_output)
                    
                    tool_name = getattr(chunk, "tool_name", "unknown_tool")
                    
                    # Emit tool result
                    yield self._format_event("tool_call.result", {
                        "toolCallId": "unknown", 
                        "toolCallName": tool_name,
                        "result": content
                    })

                    # Intercept artifact creation tools to emit a dedicated event
                    if tool_name in self.artifact_tools and '"success": true' in content:
                        try:
                            result_data = json.loads(content)
                            if "artifact" in result_data:
                                yield self._format_event("artifact.created", {
                                    "artifact": result_data["artifact"]
                                })
                        except:
                            pass
                    
                elif event_type == "RunCompleted":
                    yield self._format_event("run.finished")
                
                elif event_type == "RunError":
                     err_msg = getattr(chunk, "content", "Unknown error")
                     yield self._format_event("error", {"message": err_msg})

            except Exception as e:
                logger.warning(f"Error processing chunk in StreamEventProcessor: {e}")
                continue
