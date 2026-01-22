
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.getcwd(), "odonto-gpt-agno-service"))

try:
    from app.database.supabase import get_agent_config
    load_dotenv()

    def test_config_loading():
        agents = ["odonto-research", "odonto-practice", "odonto-write", "odonto-vision", "odonto-summary", "odonto-flow"]
        
        print("Testing Agent Config Loading from Supabase...")
        print("-" * 50)
        
        for agent_id in agents:
            config = get_agent_config(agent_id)
            if config:
                print(f"✅ [{agent_id}] Config found:")
                print(f"   - Model: {config.get('model_id')}")
                print(f"   - Temp: {config.get('temperature')} ({type(config.get('temperature'))})")
                print(f"   - Max Tokens: {config.get('max_tokens')} ({type(config.get('max_tokens'))})")
                print(f"   - Enabled: {config.get('is_enabled')}")
            else:
                print(f"⚠️ [{agent_id}] No config found or disabled. Using defaults.")
        
        print("-" * 50)

    if __name__ == "__main__":
        test_config_loading()

except Exception as e:
    print(f"❌ Error during test: {str(e)}")
