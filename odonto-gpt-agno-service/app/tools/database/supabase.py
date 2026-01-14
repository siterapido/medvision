"""Supabase database client for session management"""

import os
from supabase import create_client, Client

# Cache do cliente Supabase
_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    """
    Get or create a Supabase client instance.

    Returns:
        Client: Supabase client configured with environment variables

    Raises:
        ValueError: If SUPABASE_URL or SUPABASE_ANON_KEY are not set
    """
    global _supabase_client

    if _supabase_client is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url:
            raise ValueError("SUPABASE_URL environment variable is required")
        if not supabase_key:
            raise ValueError("SUPABASE_SERVICE_ROLE_KEY environment variable is required")

        _supabase_client = create_client(supabase_url, supabase_key)

    return _supabase_client
