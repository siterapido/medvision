import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# These tokens should be replaced with valid tokens for the test environment
ADMIN_TOKEN = "your_admin_authorized_token_here"
NON_ADMIN_TOKEN = "your_non_admin_token_here"

def test_get_api_admin_users_lists_users_for_admin_only():
    headers_admin = {
        "Authorization": f"Bearer {ADMIN_TOKEN}"
    }
    headers_non_admin = {
        "Authorization": f"Bearer {NON_ADMIN_TOKEN}"
    }
    url = f"{BASE_URL}/api/admin/users"

    # Test with admin authorized token
    try:
        response_admin = requests.get(url, headers=headers_admin, timeout=TIMEOUT)
        assert response_admin.status_code == 200, f"Expected 200, got {response_admin.status_code}"
        data = response_admin.json()
        assert isinstance(data, list), "Expected response to be a list of users"
    except requests.RequestException as e:
        assert False, f"Request with admin token failed: {str(e)}"
    except ValueError:
        assert False, "Response with admin token is not a valid JSON"

    # Test with non-admin token
    try:
        response_non_admin = requests.get(url, headers=headers_non_admin, timeout=TIMEOUT)
        assert response_non_admin.status_code == 403, f"Expected 403, got {response_non_admin.status_code}"
    except requests.RequestException as e:
        assert False, f"Request with non-admin token failed: {str(e)}"

test_get_api_admin_users_lists_users_for_admin_only()