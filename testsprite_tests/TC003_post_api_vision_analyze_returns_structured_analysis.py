import requests
import base64

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Set your valid bearer token here for authorized requests
VALID_BEARER_TOKEN = "your_valid_token_here"

def post_api_vision_analyze_returns_structured_analysis():
    headers_auth = {
        "Authorization": f"Bearer {VALID_BEARER_TOKEN}",
        "Content-Type": "application/json"
    }

    # A small valid base64 image (1x1 px PNG)
    valid_base64_image = (
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAA"
        "AAC0lEQVR42mP8/xcAAwIB/1fnKm8AAAAASUVORK5CYII="
    )

    # Corrupt base64 string (invalid)
    corrupt_base64_image = "thisisnotvalidbase64=="

    # 1) Test valid authorization + valid image returns 200 with structured analysis
    try:
        payload_valid = {
            "base64": valid_base64_image
        }
        response = requests.post(
            f"{BASE_URL}/api/vision/analyze",
            headers=headers_auth,
            json=payload_valid,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    try:
        analysis_result = response.json()
    except Exception as e:
        assert False, f"Response not valid JSON: {e}"

    # Check that the result contains structure indicating analysis result
    # Since schema is not detailed, check presence of expected keys
    # Based on PRD: "Resultado da análise" (structured result)
    assert isinstance(analysis_result, dict), "Analysis result is not a dict"
    # Typically expect some keys like 'analysis', 'result', 'data', etc.
    # We'll assert presence of at least one key:
    assert len(analysis_result) > 0, "Analysis result is empty"

    # 2) Test valid authorization + corrupt/unsupported image returns 400 Bad Request
    try:
        payload_corrupt = {
            "base64": corrupt_base64_image
        }
        response_bad = requests.post(
            f"{BASE_URL}/api/vision/analyze",
            headers=headers_auth,
            json=payload_corrupt,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response_bad.status_code == 400, f"Expected 400 Bad Request, got {response_bad.status_code}"
    try:
        error_response = response_bad.json()
    except Exception as e:
        assert False, f"Error response not valid JSON: {e}"

    assert isinstance(error_response, dict), "Error response is not a dict"
    # Expect 'error' or 'message' key in error details
    assert (
        "error" in error_response or "message" in error_response
    ), "Error response missing error details"

    # 3) Test POST without Authorization header returns 401 Unauthorized
    payload_no_auth = {
        "base64": valid_base64_image
    }
    try:
        response_unauth = requests.post(
            f"{BASE_URL}/api/vision/analyze",
            headers={"Content-Type": "application/json"},
            json=payload_no_auth,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response_unauth.status_code == 401, f"Expected 401 Unauthorized, got {response_unauth.status_code}"

post_api_vision_analyze_returns_structured_analysis()