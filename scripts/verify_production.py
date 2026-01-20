import requests
import sys
import json

# URL de produção do Railway
BASE_URL = "https://v0-odonto-gpt-ui-production.up.railway.app"


def test_health():
    print(f"Testing Health Check at {BASE_URL}/health...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health Check Passed!")
            print(response.json())
        else:
            print(f"❌ Health Check Failed: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Connection Error: {e}")


def test_list_agents():
    print(f"\nTesting List Agents at {BASE_URL}/api/v1/agentes...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/agentes")
        if response.status_code == 200:
            print("✅ List Agents Passed!")
            agents = response.json().get("agentes", [])
            print(f"Found {len(agents)} agents:")
            for agent in agents:
                print(f" - {agent['nome']} (ID: {agent['id']})")
        else:
            print(f"❌ List Agents Failed: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Connection Error: {e}")


def test_agent_chat():
    print(f"\nTesting Agent Chat Proxy at {BASE_URL}/api/v1/agentes/dr-ciencia/chat...")
    payload = {
        "message": "Olá, qual sua especialidade?",
        "userId": "test-user-verification",
        "sessionId": "test-session-verification",
        "agentType": "dr-ciencia",  # This should be overridden by the proxy logic but sent anyway
    }

    try:
        # Note: The chat endpoint returns a stream, so checking 200 OK header is enough for basic connectivity
        response = requests.post(
            f"{BASE_URL}/api/v1/agentes/dr-ciencia/chat", json=payload, stream=True
        )
        if response.status_code == 200:
            print("✅ Agent Chat Proxy Passed (Connection Established)!")
            print("Response Headers:", response.headers)
            # Read first chunk just to be sure
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    print("Received Data Chunk (Preview):", chunk[:100])
                    break
        else:
            print(f"❌ Agent Chat Proxy Failed: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Connection Error: {e}")


if __name__ == "__main__":
    print("=== Production Backend Verification ===")
    test_health()
    test_list_agents()
    test_agent_chat()
