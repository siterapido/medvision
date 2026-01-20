import os
import logging
import json
from typing import Optional, Dict, Any, List
from app.database.supabase import get_supabase_connection

# Configure logger
logger = logging.getLogger(__name__)

# Try importing the router to reuse the model instance (Memory Optimization)
try:
    from app.router import hybrid_router

    ROUTER_AVAILABLE = True
except ImportError:
    ROUTER_AVAILABLE = False
    hybrid_router = None

try:
    from sentence_transformers import SentenceTransformer

    MODEL_AVAILABLE = True
except ImportError:
    MODEL_AVAILABLE = False
    SentenceTransformer = None
    logger.warning("sentence-transformers not found. SemanticCache disabled.")


class SemanticCache:
    def __init__(self):
        # Use existing Supabase helper from database module instead of creating raw client
        # This ensures consistent connection handling
        self.supabase = None
        self.model = None
        self.mock_mode = False
        self.memory_cache = {}  # For mock mode
        self._load_model()

    def _get_supabase(self):
        # Lazy load to prevent circular imports or init issues
        if self.supabase is not None:
            return self.supabase

        if not self.mock_mode:
            try:
                # Use centralized get_supabase_client
                from app.tools.database.supabase import get_supabase_client

                client = get_supabase_client()
                if client is not None:
                    self.supabase = client
                    return self.supabase
                self.mock_mode = True
            except Exception as e:
                logger.warning(
                    f"Failed to init Supabase client: {e}. Enabling Mock Mode."
                )
                self.mock_mode = True
        return None

    def _load_model(self):
        """
        Loads the embedding model. Reuses HybridRouter's model if available.
        """
        if not MODEL_AVAILABLE or SentenceTransformer is None:
            return

        # 1. Try reuse from router (Best case)
        if (
            ROUTER_AVAILABLE
            and hybrid_router
            and hasattr(hybrid_router, "model")
            and hybrid_router.model is not None
        ):
            logger.info("SemanticCache: Reusing embedding model from HybridRouter.")
            self.model = hybrid_router.model
            return

        # 2. Load fresh model (Fallback)
        if SentenceTransformer:
            try:
                model_name = "paraphrase-multilingual-MiniLM-L12-v2"
                logger.info(f"SemanticCache: Loading model {model_name}...")
                self.model = SentenceTransformer(model_name)
            except Exception as e:
                logger.error(f"SemanticCache: Failed to load model: {e}")

    def get(self, query: str, agent_id_filter: Optional[str] = None) -> Optional[str]:
        """
        Retrieves a cached response if a semantic match is found.
        threshold: 0.95 (Very strict) to avoid hallucinations.
        """
        if not self.model:
            return None

        # Check for mock mode first
        self._get_supabase()
        if self.mock_mode:
            # Simple exact match for mock
            if query in self.memory_cache:
                logger.info(f"Mock Cache HIT for '{query[:20]}...'")
                return self.memory_cache[query]
            return None

        client = self._get_supabase()
        if not client:
            return None

        try:
            # Vectorize query
            query_embedding = self.model.encode(query).tolist()

            # Call RPC
            params = {
                "query_embedding": query_embedding,
                "match_threshold": 0.95,  # High precision required
                "match_count": 1,
            }

            response = client.rpc("match_cached_responses", params).execute()

            # Fix type checking for response.data by assigning to local var
            data = response.data
            if data and isinstance(data, list) and len(data) > 0:
                match = data[0]
                if not isinstance(match, dict):
                    return None

                # Optional: Enforce agent consistency
                if agent_id_filter and match.get("agent_id") != agent_id_filter:
                    logger.info(
                        f"Cache miss: Agent mismatch ({match.get('agent_id')} != {agent_id_filter})"
                    )
                    return None

                logger.info(
                    f"Cache HIT for '{query[:20]}...' (Sim: {match.get('similarity'):.4f})"
                )
                response_text = match.get("response_text")
                return str(response_text) if response_text is not None else None

        except Exception as e:
            logger.error(f"Cache GET error: {e}")

        return None

    def set(self, query: str, response: str, agent_id: str):
        """
        Saves a query-response pair to the cache asynchronously.
        """
        if not self.model:
            return

        self._get_supabase()
        if self.mock_mode:
            self.memory_cache[query] = response
            logger.info(f"Mock Cache SET for '{query[:20]}...'")
            return

        client = self._get_supabase()
        if not client:
            return

        try:
            # Vectorize query
            query_embedding = self.model.encode(query).tolist()

            data = {
                "query_text": query,
                "query_embedding": query_embedding,
                "response_text": response,
                "agent_id": agent_id,
            }

            client.table("semantic_cache").insert(data).execute()
            logger.info(f"Cache SET for '{query[:20]}...'")

        except Exception as e:
            logger.error(f"Cache SET error: {e}")


# Singleton
semantic_cache = SemanticCache()
