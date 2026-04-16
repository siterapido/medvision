import requests
import os

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Please set environment variable AUTH_TOKEN with a valid Bearer token to authorize requests.
AUTH_TOKEN = os.getenv("AUTH_TOKEN")

assert AUTH_TOKEN, "Environment variable AUTH_TOKEN with valid Bearer token must be set."

HEADERS = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}

def test_post_api_courses_lessons_complete_marks_lesson_completed():
    """
    Verify POST /api/courses/lessons/complete with valid authorization and lessonId marks lesson as completed and returns 200 ok.
    If no lessonId is known, create a lesson, mark completion, then cleanup.
    """
    lesson_id = None
    # Since there's no direct create lesson endpoint, we'll expect LESSON_ID environment variable to be set.
    LESSON_ID = os.getenv("LESSON_ID")
    assert LESSON_ID, "Environment variable LESSON_ID with valid lessonId must be set to run this test."
    lesson_id = LESSON_ID

    url = f"{BASE_URL}/api/courses/lessons/complete"
    payload = {
        "lessonId": lesson_id
    }

    try:
        response = requests.post(url, headers=HEADERS, json=payload, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}, Response: {response.text}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"


test_post_api_courses_lessons_complete_marks_lesson_completed()
