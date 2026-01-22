"""Knowledge base tools for RAG (Retrieval-Augmented Generation)

Enhanced with hybrid search (vector + full-text) and rich metadata support
for optimal dental education content retrieval.
"""

import os
from openai import OpenAI
from typing import List, Dict, Any, Optional, Literal
from psycopg2.extras import RealDictCursor
from .database.supabase import get_supabase_client
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

# Search types for different use cases
SearchType = Literal["vector", "hybrid", "text"]


def generate_embedding(
    text: str,
    model: Optional[str] = None,
    dimensions: int = 1536
) -> List[float]:
    """
    Generate embedding for text using OpenAI API (via OpenRouter).

    Args:
        text: Text to embed
        model: Model to use (defaults to OPENROUTER_MODEL_EMBEDDING env var)
        dimensions: Embedding dimensions (default: 1536 for text-embedding-3-small)

    Returns:
        List of embedding values
    """
    try:
        # Use provided model or default to env var
        if model is None:
            model = os.getenv("OPENROUTER_MODEL_EMBEDDING", "openai/text-embedding-3-small")

        response = client.embeddings.create(
            model=model,
            input=text,
            dimensions=dimensions if "text-embedding-3" in model else None
        )
        return response.data[0].embedding
    except Exception as e:
        raise Exception(f"Failed to generate embedding: {str(e)}")


def search_knowledge_base(
    query: str,
    specialty: Optional[str] = None,
    match_threshold: float = 0.7,
    match_count: int = 5,
    search_type: SearchType = "hybrid"
) -> List[Dict[str, Any]]:
    """
    Search knowledge base using vector similarity, hybrid, or full-text search.

    Hybrid search combines semantic similarity (vector) with keyword matching (full-text)
    for optimal results on technical/medical content.

    Args:
        query: Search query
        specialty: Optional specialty filter (periodontia, endodontia, etc.)
        match_threshold: Minimum similarity score (0-1)
        match_count: Maximum number of results
        search_type: "vector" (semantic), "hybrid" (vector + text), or "text" (keyword only)

    Returns:
        List of relevant knowledge base entries with similarity scores
    """
    try:
        # Generate query embedding
        query_embedding = generate_embedding(query)

        # Connect to database
        conn = get_supabase_client()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Try vector/hybrid search first (requires knowledge_base table with pgvector)
        try:
            if search_type in ["vector", "hybrid"]:
                # Vector similarity search
                cur.execute("""
                    SELECT
                        id,
                        title,
                        content,
                        specialty,
                        source_type,
                        source_id,
                        metadata,
                        1 - (embedding <=> %s::vector) as similarity
                    FROM knowledge_base
                    WHERE
                        1 - (embedding <=> %s::vector) > %s
                        AND (%s IS NULL OR specialty = %s)
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                """, (query_embedding, query_embedding, match_threshold,
                     specialty, specialty, query_embedding, match_count))

                results = [dict(row) for row in cur.fetchall()]

                # If hybrid search, also run full-text and merge results
                if search_type == "hybrid" and results:
                    # Run full-text search
                    cur.execute("""
                        SELECT
                            id,
                            title,
                            content,
                            specialty,
                            source_type,
                            source_id,
                            metadata,
                            ts_rank_cd(
                                to_tsvector('portuguese', title || ' ' || COALESCE(content, '')),
                                plainto_tsquery('portuguese', %s)
                            ) as text_rank
                        FROM knowledge_base
                        WHERE
                            to_tsvector('portuguese', title || ' ' || COALESCE(content, ''))
                                @@ plainto_tsquery('portuguese', %s)
                            AND (%s IS NULL OR specialty = %s)
                        ORDER BY text_rank DESC
                        LIMIT %s
                    """, (query, query, specialty, specialty, match_count))

                    text_results = [dict(row) for row in cur.fetchall()]

                    # Merge results, prioritizing vector similarity but boosting text matches
                    seen_ids = {r['id'] for r in results}
                    for text_result in text_results:
                        if text_result['id'] not in seen_ids:
                            # Add text-only results with lower similarity
                            text_result['similarity'] = min(text_result.get('text_rank', 0) * 0.5, match_threshold)
                            results.append(text_result)

                    # Re-sort by combined score
                    results.sort(key=lambda x: x.get('similarity', 0), reverse=True)
                    results = results[:match_count]

                return results

            elif search_type == "text":
                # Full-text search only
                cur.execute("""
                    SELECT
                        id,
                        title,
                        content,
                        specialty,
                        source_type,
                        source_id,
                        metadata,
                        ts_rank_cd(
                            to_tsvector('portuguese', title || ' ' || COALESCE(content, '')),
                            plainto_tsquery('portuguese', %s)
                        ) as similarity
                    FROM knowledge_base
                    WHERE
                        to_tsvector('portuguese', title || ' ' || COALESCE(content, ''))
                            @@ plainto_tsquery('portuguese', %s)
                        AND (%s IS NULL OR specialty = %s)
                    ORDER BY similarity DESC
                    LIMIT %s
                """, (query, query, specialty, specialty, match_count))

                return [dict(row) for row in cur.fetchall()]

        except Exception as vector_error:
            # Fallback: If knowledge_base doesn't exist or no pgvector,
            # search in courses/lessons tables using full-text
            print(f"Vector search not available ({search_type}), using fallback: {vector_error}")

            cur.execute("""
                SELECT
                    id,
                    title,
                    COALESCE(description, '') as content,
                    NULL as specialty,
                    'course' as source_type,
                    id as source_id,
                    NULL as metadata,
                    ts_rank_cd(
                        to_tsvector('portuguese', title || ' ' || COALESCE(description, '')),
                        plainto_tsquery('portuguese', %s)
                    ) as similarity
                FROM courses
                WHERE
                    to_tsvector('portuguese', title || ' ' || COALESCE(description, ''))
                        @@ plainto_tsquery('portuguese', %s)
                ORDER BY similarity DESC
                LIMIT %s
            """, (query, query, match_count))

            results = [dict(row) for row in cur.fetchall()]

            # If no results in courses, try lessons
            if not results:
                cur.execute("""
                    SELECT
                        l.id,
                        l.title,
                        l.content,
                        l.specialty,
                        'lesson' as source_type,
                        l.id as source_id,
                        NULL as metadata,
                        ts_rank_cd(
                            to_tsvector('portuguese', l.title || ' ' || COALESCE(l.content, '')),
                            plainto_tsquery('portuguese', %s)
                        ) as similarity
                    FROM lessons l
                    WHERE
                        to_tsvector('portuguese', l.title || ' ' || COALESCE(l.content, ''))
                            @@ plainto_tsquery('portuguese', %s)
                        AND (%s IS NULL OR l.specialty = %s)
                    ORDER BY similarity DESC
                    LIMIT %s
                """, (query, query, specialty, specialty, match_count))

                results = [dict(row) for row in cur.fetchall()]

            return results

    except Exception as e:
        raise Exception(f"Knowledge base search failed: {str(e)}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


def search_by_specialty(
    specialty: str,
    query: Optional[str] = None,
    match_count: int = 10
) -> List[Dict[str, Any]]:
    """
    Search knowledge base filtered by dental specialty.

    Args:
        specialty: Specialty name (periodontia, endodontia, cirurgia, etc.)
        query: Optional search query within specialty
        match_count: Maximum results

    Returns:
        List of knowledge base entries for the specialty
    """
    return search_knowledge_base(
        query=query or specialty,
        specialty=specialty,
        match_count=match_count,
        search_type="hybrid"
    )


def get_course_content(course_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve full course content with lessons and materials.

    Args:
        course_id: Course UUID

    Returns:
        Course data with lessons and materials
    """
    conn = get_supabase_client()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Get course
        cur.execute("""
            SELECT * FROM courses WHERE id = %s
        """, (course_id,))

        course = cur.fetchone()

        if not course:
            return None

        # Get lessons
        cur.execute("""
            SELECT * FROM lessons
            WHERE course_id = %s
            ORDER BY created_at ASC
        """, (course_id,))

        lessons = cur.fetchall()

        # Get materials for each lesson
        for lesson in lessons:
            cur.execute("""
                SELECT * FROM materials
                WHERE lesson_id = %s
                ORDER BY created_at ASC
            """, (lesson['id'],))

            lesson['materials'] = cur.fetchall()

        return {
            **dict(course),
            'lessons': [dict(l) for l in lessons]
        }

    except Exception as e:
        raise Exception(f"Failed to get course content: {str(e)}")
    finally:
        cur.close()
        conn.close()


def index_course_content(course_id: str) -> bool:
    """
    Index course content into knowledge_base table.

    Args:
        course_id: Course UUID to index

    Returns:
        True if successful
    """
    try:
        # Get course content
        course = get_course_content(course_id)

        if not course:
            raise Exception(f"Course {course_id} not found")

        conn = get_supabase_client()
        cur = conn.cursor()

        # Check if knowledge_base table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'knowledge_base'
            )
        """)
        table_exists = cur.fetchone()[0]

        if not table_exists:
            print("knowledge_base table doesn't exist. Skipping indexing.")
            return False

        # Index course
        embedding = generate_embedding(
            f"{course['title']}\n\n{course.get('description', '')}"
        )

        cur.execute("""
            INSERT INTO knowledge_base (title, content, specialty, source_type, source_id, embedding)
            VALUES (%s, %s, %s, 'course', %s, %s)
            ON CONFLICT (source_type, source_id) DO UPDATE
            SET title = EXCLUDED.title,
                content = EXCLUDED.content,
                embedding = EXCLUDED.embedding
        """, (
            course['title'],
            course.get('description', ''),
            None,  # No specialty at course level
            course_id,
            embedding
        ))

        # Index lessons
        for lesson in course.get('lessons', []):
            lesson_content = f"{lesson['title']}\n\n{lesson.get('content', '')}"
            lesson_embedding = generate_embedding(lesson_content)

            cur.execute("""
                INSERT INTO knowledge_base (title, content, specialty, source_type, source_id, embedding)
                VALUES (%s, %s, %s, 'lesson', %s, %s)
                ON CONFLICT (source_type, source_id) DO UPDATE
                SET title = EXCLUDED.title,
                    content = EXCLUDED.content,
                    embedding = EXCLUDED.embedding
            """, (
                lesson['title'],
                lesson.get('content', ''),
                lesson.get('specialty'),  # Specialty from lesson
                lesson['id'],
                lesson_embedding
            ))

        conn.commit()
        return True

    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
        raise Exception(f"Failed to index course: {str(e)}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


def initialize_knowledge_base() -> Dict[str, Any]:
    """
    Initialize knowledge base by indexing all existing courses.

    Returns:
        Dict with indexing statistics
    """
    conn = get_supabase_client()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Get all courses
        cur.execute("SELECT id FROM courses")
        courses = cur.fetchall()

        indexed = 0
        failed = 0

        for course in courses:
            try:
                success = index_course_content(course['id'])
                if success:
                    indexed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"Failed to index course {course['id']}: {e}")
                failed += 1

        return {
            "total": len(courses),
            "indexed": indexed,
            "failed": failed
        }

    except Exception as e:
        raise Exception(f"Failed to initialize knowledge base: {str(e)}")
    finally:
        cur.close()
        conn.close()
