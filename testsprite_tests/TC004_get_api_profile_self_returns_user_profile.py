import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Replace this with a valid user's email for magic link login
test_user_email = "testuser@example.com"

def get_auth_token(email: str) -> str:
    """Simulate token retrieval for authenticated user. Magic link endpoint returns 'ok', no token."
    url = f"{BASE_URL}/api/auth/magic-link"
    payload = {"email": email}
    headers = {"Content-Type": "application/json"}
    resp = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Expected 200 OK from magic-link, got {resp.status_code}"
    # PRD says response is 'ok' not token, so token retrieval must be handled by other means
    raise AssertionError("Token acquisition must be done by test setup; cannot retrieve from /api/auth/magic-link")

def test_get_api_profile_self_returns_user_profile():
    try:
        token = get_auth_token(test_user_email)
    except Exception as e:
        raise AssertionError(f"Valid auth token not available; failing test. Reason: {e}")

    headers_auth = {"Authorization": f"Bearer {token}"}
    url_profile_self = f"{BASE_URL}/api/profile/self"

    resp = requests.get(url_profile_self, headers=headers_auth, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Expected 200 OK, got {resp.status_code}"
    profile = resp.json()
    assert isinstance(profile, dict), "Profile response is not a JSON object"
    assert "id" in profile or "email" in profile or "name" in profile, "Profile missing expected user fields"

    resp_no_auth = requests.get(url_profile_self, timeout=TIMEOUT)
    assert resp_no_auth.status_code == 401, f"Expected 401 Unauthorized, got {resp_no_auth.status_code}"


test_get_api_profile_self_returns_user_profile()