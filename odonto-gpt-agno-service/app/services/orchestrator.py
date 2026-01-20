import json
import logging
import uuid
from typing import AsyncGenerator, Optional, Dict, Any, Sequence, Tuple
from fastapi.responses import StreamingResponse
from agno.media import Image

# Import Agents
from app.agents.qa_agent import dental_qa_agent
from app.agents.image_agent import odonto_vision
from app.agents.summary_agent import dental_summary_agent
from app.agents.science_agent import odonto_research
from app.agents.study_agent import odonto_practice
from app.agents.writer_agent import odonto_write
from app.agents.odonto_gpt_agent import odonto_gpt
from app.agents.team import (
    rotear_para_agente_apropriado,
    odonto_gpt_team,
    odonto_coordinator,
)

# Import Utils
from app.database.supabase import save_agent_message
from app.tools.database.supabase import get_supabase_client
from app.services.stream_processor import StreamEventProcessor
from app.cache import semantic_cache

logger = logging.getLogger(__name__)


class Orchestrator:
    """
    Central service to handle agent selection, routing, and response generation.
    Decouples FastAPI routes from Agno/Logic concerns.
    """

    def __init__(self):
        self.agent_map = self._initialize_agent_map()

    def _initialize_agent_map(self) -> Dict[str, Tuple[Any, str]]:
        # UNIFICATION: 'gpt', 'equipe', and 'odonto-gpt' all point to the Unified Team
        return {
            "ciencia": (odonto_research, "odonto-research"),
            "estudo": (odonto_practice, "odonto-practice"),
            "redator": (odonto_write, "odonto-write"),
            "imagem": (odonto_vision, "odonto-vision"),
            "resumo": (dental_summary_agent, "odonto-summary"),
            # Unified endpoints
            "equipe": (odonto_gpt_team, "odonto-gpt"),
            "gpt": (odonto_gpt_team, "odonto-gpt"),  # Redirects to Unified Team
            "odonto-flow": (odonto_gpt_team, "odonto-gpt"),
            "odonto-gpt-team": (odonto_gpt_team, "odonto-gpt"),
            "odonto-gpt": (odonto_gpt_team, "odonto-gpt"),  # Redirects to Unified Team
            "coordenador": (odonto_coordinator, "odonto-coordinator"),
            # Direct ID mappings for specialists
            "odonto-research": (odonto_research, "odonto-research"),
            "odonto-practice": (odonto_practice, "odonto-practice"),
            "odonto-write": (odonto_write, "odonto-write"),
            "odonto-vision": (odonto_vision, "odonto-vision"),
            "odonto-summary": (dental_summary_agent, "odonto-summary"),
            "odonto-coordinator": (odonto_coordinator, "odonto-coordinator"),
        }

    async def get_stream(
        self,
        agent_key: str,
        message: str,
        session_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        images: Optional[Sequence[Image]] = None,
        user_id: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """Core streaming logic with caching and DB persistence."""

        # Default to Unified Team (odonto_gpt_team) instead of old standalone agent
        agent, agent_id = self.agent_map.get(agent_key, (odonto_gpt_team, "odonto-gpt"))

        # 1. Save User Message
        if session_id:
            try:
                img_urls = [img.url for img in images] if images else []
                save_agent_message(
                    session_id=session_id,
                    agent_id=agent_id,
                    role="user",
                    content=message,
                    metadata={"images": img_urls} if img_urls else None,
                )
            except Exception as e:
                logger.warning(f"Orchestrator: Failed to save user message: {e}")

        # 2. Check Cache (Text only)
        if not images:
            try:
                cached = semantic_cache.get(message, agent_id_filter=agent_id)
                if cached:
                    logger.info(f"Orchestrator: Cache HIT for {agent_id}")
                    yield (
                        json.dumps({"type": "run.started", "agent_id": agent_id}) + "\n"
                    )
                    yield (
                        json.dumps(
                            {
                                "type": "thought",
                                "content": "Recuperando resposta do conhecimento local...",
                            }
                        )
                        + "\n"
                    )
                    yield json.dumps({"type": "text.delta", "content": cached}) + "\n"
                    yield json.dumps({"type": "run.finished"}) + "\n"
                    return
            except Exception as e:
                logger.warning(f"Orchestrator: Cache check failed: {e}")

        # 3. Execute Agent
        try:
            ctx_str = f"Context: Current User ID is '{user_id}'."
            if context:
                ctx_str += (
                    f"\nAdditional Context: {json.dumps(context, ensure_ascii=False)}"
                )

            run_message = f"{ctx_str}\n\n{message}" if ctx_str else message

            response_stream = agent.run(
                run_message,
                images=images,
                stream=True,
                stream_events=True,
                session_id=session_id,
            )

            processor = StreamEventProcessor(agent_id=agent_id, session_id=session_id)
            async for chunk in processor.process(response_stream):
                yield chunk

            # 4. Save Result and Update Cache
            if processor.full_response:
                if not images:
                    semantic_cache.set(message, processor.full_response, agent_id)

                if session_id:
                    save_agent_message(
                        session_id=session_id,
                        agent_id=agent_id,
                        role="assistant",
                        content=processor.full_response,
                    )

        except Exception as e:
            logger.error(f"Orchestrator: Error in agent execution: {e}")
            yield json.dumps({"type": "error", "message": str(e)}) + "\n"

    def route_request(
        self, message: str, has_image: bool = False, context: Optional[dict] = None
    ) -> str:
        """Determines the best agent for the request."""
        return rotear_para_agente_apropriado(
            mensagem_usuario=message, tem_imagem=has_image, contexto=context
        )


# Singleton Instance
orchestrator = Orchestrator()
