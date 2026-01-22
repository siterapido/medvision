
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    print("Adding default generation for agent_sessions.id...")
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        print("Error: SUPABASE_DB_URL not set")
        return

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    try:
        # Set default for id to gen_random_uuid()::text
        cur.execute("""
            ALTER TABLE agent_sessions 
            ALTER COLUMN id SET DEFAULT gen_random_uuid()::text
        """)
        
        conn.commit()
        print("Successfully added default value for id.")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
