import requests
from requests.exceptions import RequestException

BASE_URL = "http://localhost:3000"
UPLOAD_ENDPOINT = "/api/upload"
TIMEOUT = 30

# Replace this token with a valid bearer token for authorization
AUTH_TOKEN = "your_valid_bearer_token_here"


def test_post_api_upload_uploads_file_to_blob_storage():
    headers_auth = {"Authorization": f"Bearer {AUTH_TOKEN}"}
    # A small dummy file content for upload test
    file_content = b"Test file content for upload"
    files = {"file": ("test_upload.txt", file_content, "text/plain")}

    # Test with valid authorization
    try:
        response = requests.post(
            BASE_URL + UPLOAD_ENDPOINT,
            headers=headers_auth,
            files=files,
            timeout=TIMEOUT,
        )
        assert response.status_code == 200, f"Expected 200 OK with auth, got {response.status_code}"
        json_resp = response.json()
        assert "url" in json_resp, "Response JSON does not contain 'url'"
        assert isinstance(json_resp["url"], str) and json_resp["url"].startswith("http"), \
            "'url' in response is invalid"

    except RequestException as e:
        raise AssertionError(f"Request with auth failed: {e}")

    # Test without authorization header
    try:
        response_unauth = requests.post(
            BASE_URL + UPLOAD_ENDPOINT,
            files=files,
            timeout=TIMEOUT,
        )
        assert response_unauth.status_code == 401, f"Expected 401 Unauthorized without auth, got {response_unauth.status_code}"

    except RequestException as e:
        raise AssertionError(f"Request without auth failed: {e}")


test_post_api_upload_uploads_file_to_blob_storage()
