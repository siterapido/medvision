import json
import time
import uuid
import os
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000/api/v1"
USER_ID = "test-user-automation"
REPORT_DIR = ".context/reports"
RAW_DATA_FILE = os.path.join(REPORT_DIR, "raw_data.json")


def run_chat_turn(message, session_id):
    url = f"{BASE_URL}/equipe/chat"
    payload = {
        "message": message,
        "userId": USER_ID,
        "sessionId": session_id,
        "agentType": "qa",
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}
    )

    start_time = time.time()
    events = []
    full_text = ""
    ttft = None

    try:
        with urllib.request.urlopen(req) as response:
            for line in response:
                if line:
                    decoded = line.decode("utf-8")
                    try:
                        event = json.loads(decoded)
                        timestamp = time.time()
                        event["_timestamp"] = timestamp
                        events.append(event)

                        if event.get("type") == "text.delta":
                            if ttft is None:
                                ttft = timestamp - start_time
                            full_text += event.get("content", "")

                    except:
                        pass
    except urllib.error.URLError as e:
        return {"error": str(e), "details": "Backend likely down"}
    except Exception as e:
        return {"error": str(e)}

    end_time = time.time()

    return {
        "input": message,
        "start_time": start_time,
        "end_time": end_time,
        "duration": end_time - start_time,
        "ttft": ttft,
        "full_text": full_text,
        "events": events,
    }


def main():
    print("Starting full agent activation test...")

    results = []

    # Scenario 1: Greeting (Low Complexity)
    sid1 = str(uuid.uuid4())
    print(f"Running Scenario 1 (Greeting) - Session {sid1}")
    res1 = run_chat_turn("Olá, tudo bem? Sou um novo paciente.", sid1)
    res1["scenario"] = "greeting"
    results.append(res1)

    # Scenario 2: Complex Research (High Complexity)
    sid2 = str(uuid.uuid4())
    print(f"Running Scenario 2 (Research) - Session {sid2}")
    res2 = run_chat_turn(
        "Doutor, tenho diabetes controlada e quero fazer implante. Minha vizinha disse que não pega. É verdade?",
        sid2,
    )
    res2["scenario"] = "complex_research"
    results.append(res2)

    # Save raw data
    with open(RAW_DATA_FILE, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"Test complete. Raw data saved to {RAW_DATA_FILE}")


if __name__ == "__main__":
    main()
