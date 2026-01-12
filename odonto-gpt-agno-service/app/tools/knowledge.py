"""Knowledge base tools for RAG (Retrieval-Augmented Generation)"""

import os
from openai import OpenAI
from typing import List, Dict, Any, Optional
from psycopg2.extras import RealDictCursor
from .database.supabase import get_supabase_connection
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_embedding(text: str) -> List[float]:
    """
    Generate embedding for text using OpenAI API.

    Args:
        text: Text to embed

    Returns:
        List of embedding values (1536 dimensions for text-embedding-3-small)
    """
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        raise Exception(f"Failed to generate embedding: {str(e)}")


def search_knowledge_base(
    query: str,
    specialty: Optional[str] = None,
    match_threshold: float = 0.7,
    match_count: int = 5
) -> List[Dict[str, Any]]:
    """
    Search knowledge base using vector similarity search.

    Args:
        query: Search query
        specialty: Optional specialty filter (periodontia, endodontia, etc.)
        match_threshold: Minimum similarity score (0-1)
        match_count: Maximum number of results

    Returns:
        List of relevant knowledge base entries
    """
    try:
        # Generate query embedding
        query_embedding = generate_embedding(query)

        # Connect to database
        conn = get_supabase_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Check if knowledge_base table exists and has pgvector
        try:
            # Try using the match function (requires pgvector extension)
            cur.execute("""
                SELECT
                    id,
                    title,
                    content,
                    specialty,
                    source_type,
                    source_id,
                    1 - (embedding <=> %s::vector) as similarity
                FROM knowledge_base
                WHERE
                    1 - (embedding <=> %s::vector) > %s
                    AND (%s IS NULL OR specialty = %s)
                ORDER BY embedding <=> %s::vector
                LIMIT %s
            """, (query_embedding, query_embedding, match_threshold,
                 specialty, specialty, query_embedding, match_count))

            results = cur.fetchall()
            return [dict(row) for row in results]

        except Exception as e:
            # Fallback: If knowledge_base doesn't exist or no pgvector,
            # search in courses/lessons tables
            print(f"Vector search not available, using fallback: {e}")

            cur.execute("""
                SELECT
                    id,
                    title,
                    content,
                    NULL as specialty,
                    'course' as source_type,
                    id as source_id
                FROM courses
                WHERE
                    to_tsvector('portuguese', title || ' ' || COALESCE(description, '')) @@
                    plainto_tsquery('portuguese', %s)
                LIMIT %s
            """, (query, match_count))

            results = cur.fetchall()

            # Add similarity scores (cosine similarity on title/description)
            for result in results:
                # Simple similarity heuristic
                query_words = set(query.lower().split())
                result_words = set(result['title'].lower().split())
                intersection = query_words & result_words
                union = query_words | result_words
                result['similarity'] = len(intersection) / len(union) if union else 0

            return [dict(row) for row in results]

    except Exception as e:
        raise Exception(f"Knowledge base search failed: {str(e)}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


def get_course_content(course_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve full course content with lessons and materials.

    Args:
        course_id: Course UUID

    Returns:
        Course data with lessons and materials
    """
    conn = get_supabase_connection()
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

        conn = get_supabase_connection()
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
    conn = get_supabase_connection()
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
