
import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db_connection():
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        raise Exception("SUPABASE_DB_URL environment variable not set")
    return psycopg2.connect(db_url)

def run_migration():
    print("Starting schema migration...")
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # 1. Drop constraints that depend on UUID types
        print("Dropping foreign key constraints...")
        # Try to find the constraint name for agent_messages -> agent_sessions
        cur.execute("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'agent_messages' AND constraint_type = 'FOREIGN KEY';
        """)
        constraints = cur.fetchall()
        for (constraint_name,) in constraints:
            print(f"Dropping constraint {constraint_name} on agent_messages")
            cur.execute(f"ALTER TABLE agent_messages DROP CONSTRAINT {constraint_name}")

        # Try to find the constraint name for agent_sessions -> auth.users
        cur.execute("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'agent_sessions' AND constraint_type = 'FOREIGN KEY';
        """)
        constraints = cur.fetchall()
        for (constraint_name,) in constraints:
            print(f"Dropping constraint {constraint_name} on agent_sessions")
            cur.execute(f"ALTER TABLE agent_sessions DROP CONSTRAINT {constraint_name}")
            
        # 2. Alter agent_sessions table
        print("Altering agent_sessions table...")
        
        # Drop the generated column 'session_id' if it exists (it was id::text)
        # We need to check if it exists first or just try dropping it
        try:
            cur.execute("ALTER TABLE agent_sessions DROP COLUMN IF EXISTS session_id")
        except Exception as e:
            print(f"Note: Could not drop column session_id: {e}")
            conn.rollback()
            cur = conn.cursor()

        # Change id from UUID to TEXT
        cur.execute("ALTER TABLE agent_sessions ALTER COLUMN id TYPE TEXT USING id::text")
        
        # Change user_id from UUID to TEXT
        cur.execute("ALTER TABLE agent_sessions ALTER COLUMN user_id TYPE TEXT USING user_id::text")

        # 3. Alter agent_messages table
        print("Altering agent_messages table...")
        cur.execute("ALTER TABLE agent_messages ALTER COLUMN session_id TYPE TEXT USING session_id::text")

        # 4. Re-add Foreign Key for agent_messages -> agent_sessions
        print("Re-adding foreign key constraint for agent_messages...")
        cur.execute("""
            ALTER TABLE agent_messages 
            ADD CONSTRAINT fk_agent_messages_session 
            FOREIGN KEY (session_id) 
            REFERENCES agent_sessions(id) 
            ON DELETE CASCADE
        """)

        conn.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
