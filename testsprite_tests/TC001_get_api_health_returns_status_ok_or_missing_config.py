import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_get_api_health_returns_status_ok_or_missing_config():
    url = f"{BASE_URL}/api/health"
    try:
        response = requests.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

    # According to PRD, response can be 200 or 500 depending on config presence
    assert response.status_code in (200, 500), f"Unexpected status code: {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate response content based on status code
    if response.status_code == 200:
        # Must have status 'ok', and include keys 'checks' and 'timestamp'
        assert data.get("status") == "ok", f"Expected status 'ok' for 200 response, got {data.get('status')}"
        assert "checks" in data, "'checks' key missing in 200 response"
        assert "timestamp" in data, "'timestamp' key missing in 200 response"
    else:  # 500
        # Must have status 'missing-config' and include key 'checks'
        assert data.get("status") == "missing-config", f"Expected status 'missing-config' for 500 response, got {data.get('status')}"
        assert "checks" in data, "'checks' key missing in 500 response"
        # timestamp is not expected in 500 response per PRD

test_get_api_health_returns_status_ok_or_missing_config()