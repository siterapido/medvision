import requests
import json
import time
import uuid
import os

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
USER_ID = "test-user-cache-validation"
QUERY = "O que é periodontite e quais são os tratamentos?"


def run_query(query, session_id):
    """Executes a chat query and returns the total time and full response text."""
    url = f"{BASE_URL}/equipe/chat"
    payload = {
        "message": query,
        "userId": USER_ID,
        "sessionId": session_id,
        "agentType": "auto",
    }

    start_time = time.time()
    full_text = ""
    events = []

    try:
        response = requests.post(url, json=payload, stream=True)
        if response.status_code != 200:
            print(f"Error: HTTP {response.status_code} - {response.text}")
            return None, 0

        for line in response.iter_lines():
            if line:
                decoded = line.decode("utf-8")
                try:
                    event = json.loads(decoded)
                    events.append(event)
                    if event.get("type") == "text.delta":
                        full_text += event.get("content", "")
                except:
                    pass
    except Exception as e:
        print(f"Exception: {e}")
        return None, 0

    end_time = time.time()
    duration = end_time - start_time
    return full_text, duration


def main():
    print("--- Starting Semantic Cache Performance Test ---\n")

    # 1. Warm-up / First Run (Expect Miss)
    session_id_1 = str(uuid.uuid4())
    print(f"1. Sending FIRST query (Cold Cache): '{QUERY}'")
    resp1, duration1 = run_query(QUERY, session_id_1)

    if resp1:
        print(f"   Response Length: {len(resp1)} chars")
        print(f"   Duration: {duration1:.4f} seconds")
    else:
        print("   Failed to get response.")
        return

    print("\n   Waiting 2 seconds to ensure async cache write completes...")
    time.sleep(2)

    # 2. Second Run (Expect Hit)
    session_id_2 = str(uuid.uuid4())
    print(f"\n2. Sending SECOND query (Warm Cache): '{QUERY}'")
    resp2, duration2 = run_query(QUERY, session_id_2)

    if resp2:
        print(f"   Response Length: {len(resp2)} chars")
        print(f"   Duration: {duration2:.4f} seconds")

        # Verify content similarity (should be identical or very close)
        similarity_ratio = len(set(resp1.split()) & set(resp2.split())) / len(
            set(resp1.split())
        )
        print(f"   Content Overlap: {similarity_ratio:.2%}")
    else:
        print("   Failed to get response.")
        return

    # 3. Analysis
    print("\n--- Results Analysis ---")
    speedup = duration1 / duration2 if duration2 > 0 else 0
    print(f"Speedup Factor: {speedup:.2f}x")

    if duration2 < 0.5:
        print("✅ SUCCESS: Cache Hit latency is under 500ms.")
    elif duration2 < duration1 * 0.5:
        print("⚠️ WARNING: Cache Hit is faster but exceeded 500ms target.")
    else:
        print("❌ FAILURE: Cache Hit was not significantly faster.")


if __name__ == "__main__":
    main()
