#!/bin/bash

URL="https://www.odontogpt.com/api/newchat"
DATA='{
  "messages": [
    {
      "role": "user",
      "content": "oi",
      "id": "msg1",
      "parts": [{"type": "text", "text": "oi"}]
    }
  ],
  "agentId": "odonto-gpt",
  "userId": "test-user-id"
}'

echo "Testando endpoint /api/newchat com parts..."
curl -v -X POST "$URL" \
     -H "Content-Type: application/json" \
     -d "$DATA"

