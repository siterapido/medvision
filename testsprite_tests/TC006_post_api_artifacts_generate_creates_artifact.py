import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# You must set this token value for authorization prior to running the test
AUTH_TOKEN = "your_valid_bearer_token_here"


def test_post_api_artifacts_generate_creates_artifact():
    url = f"{BASE_URL}/api/artifacts/generate"
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json",
    }
    # Minimal valid payload for artifact generation - "prompt" is required
    payload = {
        "prompt": "Generate a test artifact for dental analysis"
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise AssertionError(f"Request to {url} failed: {e}")

    if response.status_code == 200:
        try:
            artifact = response.json()
        except ValueError:
            raise AssertionError("Response body is not valid JSON")

        # Validate minimal expected keys in artifact response
        assert isinstance(artifact, dict), "Artifact response is not a JSON object"
        assert "id" in artifact or "_id" in artifact, "Artifact does not have an 'id' field"
        assert "prompt" in artifact, "Artifact response missing 'prompt' field"
        assert artifact["prompt"] == payload["prompt"], "Artifact prompt does not match request"
    elif response.status_code == 500:
        # Check error response for external model failure
        try:
            error_resp = response.json()
        except ValueError:
            raise AssertionError("500 response body is not valid JSON")

        assert "status" in error_resp, "Error response missing 'status' field"
        assert error_resp["status"].lower() in ("error", "internal server error", "fail", "failed", "500"), \
            "Error status not indicating server error"
    else:
        raise AssertionError(f"Unexpected status code: {response.status_code} - {response.text}")


test_post_api_artifacts_generate_creates_artifact()