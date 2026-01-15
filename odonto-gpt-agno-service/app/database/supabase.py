"""Supabase PostgreSQL connection and utilities"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from typing import Optional, Dict, Any, List
from datetime import datetime
from dotenv import load_dotenv
import json

load_dotenv()


def get_supabase_connection():
    """
    Create a connection to Supabase PostgreSQL database.

    Returns:
        psycopg2.connection: Database connection

    Raises:
        Exception: If connection fails
    """
    db_url = os.getenv("SUPABASE_DB_URL")

    if not db_url:
        raise Exception("SUPABASE_DB_URL environment variable not set")

    try:
        conn = psycopg2.connect(db_url)
        return conn
    except Exception as e:
        raise Exception(f"Failed to connect to Supabase: {str(e)}")


# ============================================================================
# Agent Sessions
# ============================================================================

def create_agent_session(
    user_id: str,
    agent_type: str,
    metadata: Optional[Dict[str, Any]] = None
) -> str:
    """
    Create a new agent session in the database.

    Args:
        user_id: User ID from Supabase auth
        agent_type: Type of agent (image-analysis, qa, orchestrated)
        metadata: Additional session metadata

    Returns:
        str: Created session ID
    """
    conn = get_supabase_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            INSERT INTO agent_sessions (user_id, agent_type, status, metadata)
            VALUES (%s, %s, 'active', %s)
            RETURNING id
        """, (user_id, agent_type, Json(metadata) if metadata else None))

        session_id = cur.fetchone()[0]
        conn.commit()

        return session_id

    except Exception as e:
        conn.rollback()
        raise Exception(f"Failed to create agent session: {str(e)}")
    finally:
        cur.close()
        conn.close()


def get_agent_session(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve an agent session by ID.

    Args:
        session_id: Session UUID

    Returns:
        Dict with session data or None if not found
    """
    conn = get_supabase_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT * FROM agent_sessions
            WHERE id = %s
        """, (session_id,))

        result = cur.fetchone()
        return dict(result) if result else None

    except Exception as e:
        raise Exception(f"Failed to get agent session: {str(e)}")
    finally:
        cur.close()
        conn.close()


def update_agent_session(
    session_id: str,
    status: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Update an agent session.

    Args:
        session_id: Session UUID
        status: New status (optional)
        metadata: Updated metadata (optional)

    Returns:
        bool: True if successful
    """
    conn = get_supabase_connection()
    cur = conn.cursor()

    try:
        updates = []
        params = []
        param_count = 1

        if status:
            updates.append(f"status = ${param_count}")
            params.append(status)
            param_count += 1

        if metadata:
            updates.append(f"metadata = ${param_count}")
            params.append(Json(metadata))
            param_count += 1

        if not updates:
            return True

        updates.append(f"updated_at = ${param_count}")
        params.append(datetime.utcnow())
        param_count += 1

        params.append(session_id)

        query = f"""
            UPDATE agent_sessions
            SET {', '.join(updates)}
            WHERE id = ${param_count}
        """

        cur.execute(query, params)
        conn.commit()

        return True

    except Exception as e:
        conn.rollback()
        raise Exception(f"Failed to update agent session: {str(e)}")
    finally:
        cur.close()
        conn.close()


# ============================================================================
# Agent Messages
# ============================================================================

def save_agent_message(
    session_id: str,
    agent_id: str,
    role: str,
    content: str,
    tool_calls: Optional[List[Dict[str, Any]]] = None,
    tool_results: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> str:
    """
    Save an agent message to the database.

    Args:
        session_id: Session UUID
        agent_id: Agent identifier
        role: Message role (user, assistant, system)
        content: Message content
        tool_calls: Optional tool invocations
        tool_results: Optional tool outputs
        metadata: Optional message metadata

    Returns:
        str: Created message ID
    """
    conn = get_supabase_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            INSERT INTO agent_messages (
                session_id, agent_id, role, content,
                tool_calls, tool_results, metadata
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            session_id, agent_id, role, content,
            Json(tool_calls) if tool_calls else None,
            Json(tool_results) if tool_results else None,
            Json(metadata) if metadata else None
        ))

        message_id = cur.fetchone()[0]
        conn.commit()

        return message_id

    except Exception as e:
        conn.rollback()
        raise Exception(f"Failed to save agent message: {str(e)}")
    finally:
        cur.close()
        conn.close()


def get_session_messages(session_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Retrieve messages for a session.

    Args:
        session_id: Session UUID
        limit: Maximum number of messages to retrieve

    Returns:
        List of message dictionaries
    """
    conn = get_supabase_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT * FROM agent_messages
            WHERE session_id = %s
            ORDER BY created_at ASC
            LIMIT %s
        """, (session_id, limit))

        results = cur.fetchall()
        return [dict(row) for row in results]

    except Exception as e:
        raise Exception(f"Failed to get session messages: {str(e)}")
    finally:
        cur.close()
        conn.close()


# ============================================================================
# User Messages (Existing chat_threads table)
# ============================================================================

def get_user_chat_history(user_id: str, thread_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Retrieve chat history from existing chat_threads table.

    Args:
        user_id: User ID from Supabase auth
        thread_id: Chat thread UUID
        limit: Maximum number of messages

    Returns:
        List of message dictionaries
    """
    conn = get_supabase_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT role, content, created_at
            FROM chat_messages
            WHERE thread_id = %s AND user_id = %s
            ORDER BY created_at ASC
            LIMIT %s
        """, (thread_id, user_id, limit))

        results = cur.fetchall()
        return [dict(row) for row in results]

    except Exception as e:
        raise Exception(f"Failed to get chat history: {str(e)}")
    finally:
        cur.close()
        conn.close()

# ============================================================================
# Agent Configuration
# ============================================================================

def get_agent_config(agent_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve agent configuration from agent_configs table.

    Args:
        agent_id: Agent identifier (e.g., 'odonto-research')

    Returns:
        Dict with config data or None if not found
    """
    conn = get_supabase_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT * FROM agent_configs
            WHERE agent_id = %s
            AND is_enabled = true
        """, (agent_id,))

        result = cur.fetchone()
        return dict(result) if result else None

    except Exception as e:
        # Log error but don't crash, return None to use defaults
        print(f"Warning: Failed to get agent config for {agent_id}: {str(e)}")
        return None
    finally:
        cur.close()
        conn.close()
