
import requests
import uuid
import json
import time

BASE_URL = "http://localhost:8000/api/v1"
TEST_USER_ID = str(uuid.uuid4())

def test_session_creation():
    print(f"--- Testando Criação de Sessão para User: {TEST_USER_ID} ---")
    payload = {
        "userId": TEST_USER_ID,
        "agentType": "qa",
        "metadata": {"title": "Sessão de Teste"}
    }
    
    try:
        response = requests.post(f"{BASE_URL}/sessions", json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            session_id = data.get("id")
            print(f"Sessão criada com sucesso! ID: {session_id}")
            return session_id
        else:
            print(f"Erro ao criar sessão: {response.text}")
            return None
    except Exception as e:
        print(f"Erro na requisição: {e}")
        return None

def test_chat(session_id):
    print(f"\n--- Testando Chat para Sessão: {session_id} ---")
    payload = {
        "message": "Olá, isso é um teste de integração.",
        "userId": TEST_USER_ID,
        "sessionId": session_id,
        "agentType": "qa"
    }
    
    try:
        # Chat é streaming, vamos ler os chunks
        response = requests.post(f"{BASE_URL}/chat", json=payload, stream=True)
        print(f"Status Code Chat: {response.status_code}")
        
        if response.status_code == 200:
            print("Recebendo resposta (stream): ", end="", flush=True)
            full_content = ""
            for chunk in response.iter_content(chunk_size=None):
                if chunk:
                    text = chunk.decode("utf-8")
                    full_content += text
                    print(text, end="", flush=True)
            print("\nStream finalizado.")
            return True
        else:
            print(f"Erro no chat: {response.text}")
            return False
    except Exception as e:
        print(f"Erro na requisição de chat: {e}")
        return False

if __name__ == "__main__":
    sid = test_session_creation()
    if sid:
        time.sleep(1) # Esperar um pouco
        test_chat(sid)
