import requests
import io

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Replace these tokens with valid ones for the test environment
AUTH_TOKEN = "valid_user_token"
NON_OWNER_TOKEN = "non_owner_user_token"
NO_AUTH_HEADERS = {}
AUTH_HEADERS = {"Authorization": f"Bearer {AUTH_TOKEN}"}
NON_OWNER_HEADERS = {"Authorization": f"Bearer {NON_OWNER_TOKEN}"}


def test_post_lessons_lessonid_attachments_creates_attachment():
    lessonId = "test-lesson-id"

    attachment_id = None

    try:
        # Step 1: POST /api/lessons/[lessonId]/attachments with multipart file and valid auth
        url_post = f"{BASE_URL}/api/lessons/{lessonId}/attachments"
        test_file_content = b"Test attachment content"
        files = {'file': ('testfile.txt', io.BytesIO(test_file_content), 'text/plain')}
        response_post = requests.post(url_post, headers=AUTH_HEADERS, files=files, timeout=TIMEOUT)
        assert response_post.status_code == 200, f"Expected 200 but got {response_post.status_code}"
        attachment = response_post.json()
        assert 'id' in attachment, "Response JSON missing 'id' field for created attachment"
        attachment_id = attachment['id']

        # Step 2: GET /api/lessons/[lessonId]/attachments should list the new attachment
        url_get = f"{BASE_URL}/api/lessons/{lessonId}/attachments"
        response_get = requests.get(url_get, headers=AUTH_HEADERS, timeout=TIMEOUT)
        assert response_get.status_code == 200, f"Expected 200 but got {response_get.status_code}"
        attachments_list = response_get.json()
        assert any(att.get('id') == attachment_id for att in attachments_list), "Created attachment not found in listing"

        # Step 3: DELETE /api/lessons/[lessonId]/attachments/[attachmentId] with valid auth returns 204
        url_delete = f"{BASE_URL}/api/lessons/{lessonId}/attachments/{attachment_id}"
        response_delete = requests.delete(url_delete, headers=AUTH_HEADERS, timeout=TIMEOUT)
        assert response_delete.status_code == 204, f"Expected 204 but got {response_delete.status_code}"

        # Confirm deletion by checking get list again
        response_get_after_delete = requests.get(url_get, headers=AUTH_HEADERS, timeout=TIMEOUT)
        assert response_get_after_delete.status_code == 200, f"Expected 200 but got {response_get_after_delete.status_code}"
        attachments_after_delete = response_get_after_delete.json()
        assert all(att.get('id') != attachment_id for att in attachments_after_delete), "Attachment still found after deletion"

        # Step 4: Unauthorized access to POST returns 401 Unauthorized
        files_unauth = {'file': ('testfile.txt', io.BytesIO(test_file_content), 'text/plain')}
        response_post_unauth = requests.post(url_post, files=files_unauth, timeout=TIMEOUT)
        assert response_post_unauth.status_code == 401, f"Expected 401 but got {response_post_unauth.status_code}"

        # Step 5: Forbidden access to DELETE by non-owner returns 403 Forbidden (assuming attachment recreated)
        # Recreate attachment for this test
        files_recreate = {'file': ('testfile.txt', io.BytesIO(test_file_content), 'text/plain')}
        response_post_recreate = requests.post(url_post, headers=AUTH_HEADERS, files=files_recreate, timeout=TIMEOUT)
        assert response_post_recreate.status_code == 200, f"Expected 200 but got {response_post_recreate.status_code}"
        new_attachment = response_post_recreate.json()
        attach_id_for_forbidden = new_attachment['id']

        # Attempt to delete as non-owner user
        url_delete_forbidden = f"{BASE_URL}/api/lessons/{lessonId}/attachments/{attach_id_for_forbidden}"
        response_delete_forbidden = requests.delete(url_delete_forbidden, headers=NON_OWNER_HEADERS, timeout=TIMEOUT)
        assert response_delete_forbidden.status_code in (401, 403), f"Expected 401 or 403 but got {response_delete_forbidden.status_code}"

        # Clean up recreated attachment by owner
        response_delete_owner = requests.delete(url_delete_forbidden, headers=AUTH_HEADERS, timeout=TIMEOUT)
        assert response_delete_owner.status_code == 204, f"Expected 204 but got {response_delete_owner.status_code}"

    finally:
        # Final cleanup if attachment still exists
        if attachment_id:
            cleanup_url = f"{BASE_URL}/api/lessons/{lessonId}/attachments/{attachment_id}"
            requests.delete(cleanup_url, headers=AUTH_HEADERS, timeout=TIMEOUT)


test_post_lessons_lessonid_attachments_creates_attachment()
