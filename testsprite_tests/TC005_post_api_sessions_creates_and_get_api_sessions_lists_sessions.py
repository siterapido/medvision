import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# These tokens should be replaced by valid tokens in the test environment
OWNER_TOKEN = "Bearer owner_valid_jwt_token"
NON_OWNER_TOKEN = "Bearer non_owner_valid_jwt_token"

def test_post_api_sessions_creates_and_get_api_sessions_lists_sessions():
    headers_owner = {"Authorization": OWNER_TOKEN, "Content-Type": "application/json"}
    headers_non_owner = {"Authorization": NON_OWNER_TOKEN, "Content-Type": "application/json"}
    headers_no_auth = {"Content-Type": "application/json"}

    session_id = None
    try:
        # 1. POST /api/sessions with valid authorization creates a new session
        post_resp = requests.post(
            f"{BASE_URL}/api/sessions",
            json={"title": "Test Session TC005"},
            headers=headers_owner,
            timeout=TIMEOUT,
        )
        assert post_resp.status_code == 200, f"Expected 200, got {post_resp.status_code}"
        session = post_resp.json()
        assert "id" in session, "Response missing 'id'"
        session_id = session["id"]

        # 2. GET /api/sessions returns list of sessions for authorized user
        get_resp = requests.get(
            f"{BASE_URL}/api/sessions",
            headers=headers_owner,
            timeout=TIMEOUT,
        )
        assert get_resp.status_code == 200, f"Expected 200, got {get_resp.status_code}"
        sessions_list = get_resp.json()
        assert isinstance(sessions_list, list), "Sessions response is not a list"
        assert any(s.get("id") == session_id for s in sessions_list), "Created session not in sessions list"

        # 3. GET /api/sessions without authorization returns 401 Unauthorized
        get_no_auth_resp = requests.get(
            f"{BASE_URL}/api/sessions",
            headers=headers_no_auth,
            timeout=TIMEOUT,
        )
        assert get_no_auth_resp.status_code == 401, f"Expected 401, got {get_no_auth_resp.status_code}"

        # 4. DELETE /api/sessions/[id] by owner returns 204 No Content
        delete_owner_resp = requests.delete(
            f"{BASE_URL}/api/sessions/{session_id}",
            headers=headers_owner,
            timeout=TIMEOUT,
        )
        assert delete_owner_resp.status_code == 204, f"Expected 204, got {delete_owner_resp.status_code}"

        # After deletion, session should no longer be listed
        get_after_delete_resp = requests.get(
            f"{BASE_URL}/api/sessions",
            headers=headers_owner,
            timeout=TIMEOUT,
        )
        assert get_after_delete_resp.status_code == 200, f"Expected 200, got {get_after_delete_resp.status_code}"
        sessions_after_delete = get_after_delete_resp.json()
        assert all(s.get("id") != session_id for s in sessions_after_delete), "Deleted session still present in list"

        # 5. Test deleting a session by non-owner returns 403 Forbidden
        # First, create a new session as owner to test forbidden deletion
        create_resp_non_owner = requests.post(
            f"{BASE_URL}/api/sessions",
            json={"title": "Non-owner Deletion Test Session"},
            headers=headers_owner,
            timeout=TIMEOUT,
        )
        assert create_resp_non_owner.status_code == 200, f"Expected 200, got {create_resp_non_owner.status_code}"
        session_non_owner = create_resp_non_owner.json()
        session_non_owner_id = session_non_owner["id"]

        try:
            delete_forbidden_resp = requests.delete(
                f"{BASE_URL}/api/sessions/{session_non_owner_id}",
                headers=headers_non_owner,
                timeout=TIMEOUT,
            )
            assert delete_forbidden_resp.status_code == 403, f"Expected 403, got {delete_forbidden_resp.status_code}"
        finally:
            # Cleanup: delete the created session with owner token
            requests.delete(
                f"{BASE_URL}/api/sessions/{session_non_owner_id}",
                headers=headers_owner,
                timeout=TIMEOUT,
            )

    finally:
        # Cleanup any leftover session if still exists
        if session_id is not None:
            requests.delete(
                f"{BASE_URL}/api/sessions/{session_id}",
                headers=headers_owner,
                timeout=TIMEOUT,
            )

test_post_api_sessions_creates_and_get_api_sessions_lists_sessions()