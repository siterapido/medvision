
import requests
import json
import time
import uuid

BASE_URL = "http://localhost:8000/api/v1"
USER_ID = "test-user-automation"
SESSION_ID_PREFIX = "test-session-"

def print_result(name, success, details=""):
    icon = "✅" if success else "❌"
    print(f"{icon} [{name}]: {details}")

def create_session(agent_type="qa"):
    session_id = str(uuid.uuid4())
    try:
        payload = {
            "userId": USER_ID,
            "agentType": agent_type,
            "id": session_id,
            "metadata": {"title": "Test Session"}
        }
        response = requests.post(f"{BASE_URL}/sessions", json=payload)
        if response.status_code in [200, 201]:
            return session_id
        else:
            print(f"Failed to create session: {response.text}")
            return None
    except Exception as e:
        print(f"Error creating session: {e}")
        return None

def test_chat_stream(flow_name, message, session_id, expected_agent_id=None, expect_artifact=False):
    print(f"\n--- Testing Flow: {flow_name} ---")
    print(f"Message: '{message}'")
    
    start_time = time.time()
    url = f"{BASE_URL}/equipe/chat" # Using unified endpoint
    payload = {
        "message": message,
        "userId": USER_ID,
        "sessionId": session_id,
        "agentType": "qa" # Initial routing often starts here or flow
    }

    try:
        response = requests.post(url, json=payload, stream=True)
        
        if response.status_code != 200:
            print_result(flow_name, False, f"HTTP {response.status_code}: {response.text}")
            return

        received_agent_switch = False
        detected_agent_id = None
        received_artifact = False
        full_text = ""
        
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                try:
                    event = json.loads(decoded_line)
                    
                    if event.get("type") == "agent.switch":
                        received_agent_switch = True
                        detected_agent_id = event.get("agentId") or event.get("agent_id")
                        print(f"  -> Switched to Agent: {detected_agent_id}")
                        
                    elif event.get("type") == "text.delta":
                        content = event.get("content", "")
                        full_text += content
                        # print(content, end="", flush=True)

                    elif event.get("type") == "artifact.created":
                        received_artifact = True
                        art = event.get("artifact", {})
                        print(f"  -> Artifact Created: {art.get('title')} ({art.get('type')})")
                        
                except json.JSONDecodeError:
                    pass
        
        end_time = time.time()
        duration = end_time - start_time
        print(f"\n  -> Duration: {duration:.2f}s")
        
        # Validations
        success = True
        details = []
        
        if expected_agent_id:
            # Check if we eventually switched to or stayed at expected agent
            # Note: The routing logic might happen at start. 
            # If no agent switch event, we assume default or retained.
            if detected_agent_id and detected_agent_id != expected_agent_id:
                 # Check simple normalization
                 if expected_agent_id in detected_agent_id: 
                     pass
                 else:
                    success = False
                    details.append(f"Expected agent {expected_agent_id}, got {detected_agent_id}")
        
        if expect_artifact and not received_artifact:
            success = False
            details.append("Expected artifact creation, but none received.")

        if success:
            print_result(flow_name, True, f"OK ({len(full_text)} chars)")
        else:
            print_result(flow_name, False, ", ".join(details))

    except Exception as e:
        print_result(flow_name, False, f"Exception: {e}")

def run_tests():
    # Wait for backend to be ready
    print("Waiting for backend...")
    for _ in range(5):
        try:
            if requests.get(f"{BASE_URL}/health").status_code == 200:
                print("Backend is ready.")
                break
        except:
            time.sleep(2)
    else:
        print("Backend not reachable. Exiting.")
        return

    # Flow 1: Simple Question (General or Research)
    sid1 = create_session()
    if sid1:
        test_chat_stream(
            "Fluxo 1: Pergunta Geral", 
            "O que é periodontite?", 
            sid1, 
            expected_agent_id="odonto-research" # Usually goes to research for definitions
        )

    # Flow 2: Explicit Agent Request (Study/Practice)
    sid2 = create_session()
    if sid2:
        test_chat_stream(
            "Fluxo 2: Questões (Prof. Estudo)", 
            "Crie uma questão de múltipla escolha sobre anatomia dental.", 
            sid2, 
            expected_agent_id="odonto-practice"
        )

    # Flow 3: Artifact Generation (Summary)
    sid3 = create_session()
    if sid3:
        test_chat_stream(
            "Fluxo 3: Geração de Artefato (Resumo)", 
            "Crie um resumo estruturado sobre Cárie Dental para estudo.", 
            sid3, 
            expected_agent_id="odonto-summary", # Might be routed to summary or research depending on impl
            expect_artifact=True
        )

if __name__ == "__main__":
    run_tests()
