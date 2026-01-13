#!/usr/bin/env python3
"""
Populate Knowledge Base Script

Exports all courses, modules, and lessons from Supabase and creates
vector embeddings for RAG (Retrieval-Augmented Generation).

Usage:
    cd odonto-gpt-agno-service
    python scripts/populate_knowledge.py

Options:
    --force: Re-index all content (default: skip already indexed)
    --specialty: Filter by specialty (e.g., periodontia, endodontia)
    --dry-run: Show what would be indexed without actually indexing
"""

import os
import sys
import json
import argparse
from typing import List, Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from psycopg2.extras import RealDictCursor
from app.tools.database.supabase import get_supabase_connection
from app.tools.knowledge import generate_embedding

load_dotenv()


def create_knowledge_base_table():
    """
    Create knowledge_base table if it doesn't exist.
    Includes pgvector extension and proper indexes.
    """
    conn = get_supabase_connection()
    cur = conn.cursor()

    try:
        # Check if pgvector extension exists
        cur.execute("""
            SELECT EXISTS (
                SELECT 1 FROM pg_extension WHERE extname = 'vector'
            );
        """)
        has_pgvector = cur.fetchone()[0]

        if not has_pgvector:
            print("⚠️  WARNING: pgvector extension not found")
            print("   Run: CREATE EXTENSION IF NOT EXISTS vector;")
            print("   Vector embeddings will be stored but not searchable")

        # Create knowledge_base table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_base (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title TEXT NOT NULL,
                content TEXT,
                specialty TEXT,
                source_type TEXT NOT NULL,
                source_id UUID NOT NULL,
                metadata JSONB,
                embedding vector(1536),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),

                UNIQUE(source_type, source_id)
            );
        """)

        # Create indexes for performance
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_knowledge_base_specialty
            ON knowledge_base(specialty);

            CREATE INDEX IF NOT EXISTS idx_knowledge_base_source_type
            ON knowledge_base(source_type);

            CREATE INDEX IF NOT EXISTS idx_knowledge_base_source_id
            ON knowledge_base(source_id);
        """)

        # Create full-text search index
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_knowledge_base_fulltext
            ON knowledge_base
            USING gin(to_tsvector('portuguese', title || ' ' || COALESCE(content, '')));
        """)

        conn.commit()
        print("✓ knowledge_base table created/verified")

    except Exception as e:
        conn.rollback()
        print(f"✗ Error creating knowledge_base table: {e}")
        raise
    finally:
        cur.close()
        conn.close()


def fetch_all_content(specialty: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Fetch all courses, modules, and lessons from Supabase.

    Args:
        specialty: Optional filter by specialty

    Returns:
        List of content items with metadata
    """
    conn = get_supabase_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        content_items = []

        # Fetch courses
        course_query = """
            SELECT
                id,
                title,
                description,
                category,
                published,
                'course' as source_type,
                NULL as specialty,
                NULL as module_id,
                created_at
            FROM courses
            WHERE published = true
        """

        if specialty:
            course_query += f" AND category = '{specialty}'"

        course_query += " ORDER BY created_at DESC"

        cur.execute(course_query)
        courses = cur.fetchall()

        for course in courses:
            course_dict = dict(course)
            course_dict['metadata'] = {
                'type': 'course',
                'category': course.get('category'),
                'published': course.get('published'),
            }
            content_items.append(course_dict)

            # Fetch lessons for this course
            lesson_query = """
                SELECT
                    l.id,
                    l.title,
                    l.content,
                    l.specialty,
                    l.order_index,
                    'lesson' as source_type,
                    l.course_id,
                    l.created_at
                FROM lessons l
                WHERE l.course_id = %s
            """

            if specialty:
                lesson_query += f" AND l.specialty = '{specialty}'"

            lesson_query += " ORDER BY l.order_index ASC"

            cur.execute(lesson_query, (course['id'],))
            lessons = cur.fetchall()

            for lesson in lessons:
                lesson_dict = dict(lesson)
                lesson_dict['metadata'] = {
                    'type': 'lesson',
                    'course_title': course.get('title'),
                    'specialty': lesson.get('specialty'),
                    'order_index': lesson.get('order_index'),
                }
                content_items.append(lesson_dict)

        return content_items

    except Exception as e:
        print(f"✗ Error fetching content: {e}")
        raise
    finally:
        cur.close()
        conn.close()


def index_content_item(item: Dict[str, Any], force: bool = False) -> bool:
    """
    Index a single content item into knowledge_base.

    Args:
        item: Content item with title, content, metadata
        force: Re-index even if already exists

    Returns:
        True if indexed/updated, False if skipped
    """
    conn = get_supabase_connection()
    cur = conn.cursor()

    try:
        source_type = item['source_type']
        source_id = item['id']

        # Check if already indexed
        if not force:
            cur.execute("""
                SELECT id FROM knowledge_base
                WHERE source_type = %s AND source_id = %s
                LIMIT 1
            """, (source_type, source_id))

            if cur.fetchone():
                return False  # Skip

        # Prepare content for embedding
        title = item['title']
        content = item.get('content') or item.get('description') or ''

        # Create combined text for embedding
        if source_type == 'lesson':
            combined_text = f"{title}\n\n{content}"
        else:  # course
            combined_text = f"{title}\n\n{content}"

        # Generate embedding
        print(f"  → Generating embedding for {source_type}: {title[:50]}...")
        embedding = generate_embedding(combined_text)

        # Insert or update
        cur.execute("""
            INSERT INTO knowledge_base (title, content, specialty, source_type, source_id, metadata, embedding)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (source_type, source_id) DO UPDATE
            SET
                title = EXCLUDED.title,
                content = EXCLUDED.content,
                specialty = EXCLUDED.specialty,
                metadata = EXCLUDED.metadata,
                embedding = EXCLUDED.embedding,
                updated_at = NOW()
        """, (
            title,
            content,
            item.get('specialty'),
            source_type,
            source_id,
            json.dumps(item.get('metadata', {})),
            embedding
        ))

        conn.commit()
        return True

    except Exception as e:
        conn.rollback()
        print(f"✗ Error indexing item {item.get('title')}: {e}")
        return False
    finally:
        cur.close()
        conn.close()


def populate_knowledge_base(
    force: bool = False,
    specialty: Optional[str] = None,
    dry_run: bool = False
) -> Dict[str, Any]:
    """
    Main function to populate knowledge base with all content.

    Args:
        force: Re-index all content
        specialty: Filter by specialty
        dry_run: Show what would be indexed without indexing

    Returns:
        Statistics dict with indexed/skipped/failed counts
    """
    print("\n" + "="*60)
    print("📚 Odonto GPT Knowledge Base Population")
    print("="*60 + "\n")

    # Step 1: Ensure table exists
    print("Step 1: Creating/verifying knowledge_base table...")
    if not dry_run:
        create_knowledge_base_table()
    else:
        print("  [DRY RUN] Would create knowledge_base table")

    # Step 2: Fetch all content
    print("\nStep 2: Fetching content from Supabase...")
    content_items = fetch_all_content(specialty=specialty)
    print(f"  Found {len(content_items)} items to potentially index")

    if dry_run:
        print("\n  [DRY RUN] Items to index:")
        for item in content_items[:10]:  # Show first 10
            print(f"    - {item['source_type']}: {item['title'][:50]}")
        if len(content_items) > 10:
            print(f"    ... and {len(content_items) - 10} more")
        return {
            'total': len(content_items),
            'indexed': 0,
            'skipped': 0,
            'failed': 0
        }

    # Step 3: Index content
    print("\nStep 3: Indexing content with vector embeddings...")
    indexed = 0
    skipped = 0
    failed = 0

    for i, item in enumerate(content_items, 1):
        print(f"\n[{i}/{len(content_items)}] Processing: {item['title'][:50]}")

        try:
            result = index_content_item(item, force=force)
            if result:
                indexed += 1
                print(f"  ✓ Indexed")
            else:
                skipped += 1
                print(f"  ⊘ Skipped (already indexed)")
        except Exception as e:
            failed += 1
            print(f"  ✗ Failed: {e}")

    # Step 4: Summary
    print("\n" + "="*60)
    print("📊 Indexing Summary")
    print("="*60)
    print(f"Total items:     {len(content_items)}")
    print(f"Indexed:         {indexed} ✓")
    print(f"Skipped:         {skipped} ⊘")
    print(f"Failed:          {failed} ✗")
    print(f"Success rate:    {indexed / len(content_items) * 100:.1f}%")
    print("="*60 + "\n")

    return {
        'total': len(content_items),
        'indexed': indexed,
        'skipped': skipped,
        'failed': failed
    }


def main():
    parser = argparse.ArgumentParser(
        description='Populate Odonto GPT knowledge base with course content'
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Re-index all content (default: skip already indexed)'
    )
    parser.add_argument(
        '--specialty',
        type=str,
        help='Filter by specialty (e.g., periodontia, endodontia)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be indexed without actually indexing'
    )

    args = parser.parse_args()

    try:
        stats = populate_knowledge_base(
            force=args.force,
            specialty=args.specialty,
            dry_run=args.dry_run
        )

        if not args.dry_run and stats['failed'] > 0:
            sys.exit(1)

    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n✗ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
