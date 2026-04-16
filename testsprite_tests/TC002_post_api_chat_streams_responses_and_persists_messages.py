import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Replace with a valid Bearer token for authorization testing
VALID_BEARER_TOKEN = "your_valid_bearer_token_here"

def test_post_api_chat_streams_responses_and_persists_messages():
    url = f"{BASE_URL}/api/chat"
    headers = {
        "Authorization": f"Bearer {VALID_BEARER_TOKEN}",
        "Content-Type": "application/json"
    }
    valid_payload = {
        "messages": [
            {"role": "user", "content": "Hello AI agent, please assist me."}
        ]
    }
    invalid_payload = {
        "messages": []
    }

    # Test 1: POST /api/chat with valid authorization and valid payload
    response = requests.post(url, json=valid_payload, headers=headers, timeout=TIMEOUT)
    try:
        assert response.status_code != 401, f"Unauthorized: Bearer token invalid or missing. Got status {response.status_code}"
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
        text = response.text
        assert isinstance(text, str) and len(text) > 0, "Response text should not be empty"
        assert "user" in text or "assistant" in text or "AI" in text or "message" in text.lower(), "Response should include AI chat content"
    except AssertionError:
        raise
    except Exception as e:
        raise AssertionError(f"Unexpected error while validating valid authorized chat response: {e}")

    # Test 2: POST /api/chat without Authorization header -> Expect 401 Unauthorized
    response_unauth = requests.post(url, json=valid_payload, timeout=TIMEOUT)
    try:
        assert response_unauth.status_code == 401, f"Expected 401 Unauthorized, got {response_unauth.status_code}"
    except AssertionError:
        raise
    except Exception as e:
        raise AssertionError(f"Unexpected error while validating unauthorized chat request: {e}")

    # Test 3: POST /api/chat with valid authorization but invalid payload -> Expect 400 Bad Request
    response_bad_request = requests.post(url, json=invalid_payload, headers=headers, timeout=TIMEOUT)
    try:
        assert response_bad_request.status_code == 400, f"Expected 400 Bad Request, got {response_bad_request.status_code}"
    except AssertionError:
        raise
    except Exception as e:
        raise AssertionError(f"Unexpected error while validating bad request on invalid payload: {e}")

test_post_api_chat_streams_responses_and_persists_messages()
