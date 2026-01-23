#!/bin/bash

URL="https://www.odontogpt.com/api/newchat"
DATA='{
  "messages": [
    {
      "role": "user",
      "content": "Olá, você está funcionando?",
      "id": "test-msg-id"
    }
  ],
  "agentId": "odonto-gpt",
  "userId": "test-user-id"
}'

echo "Testando endpoint /api/newchat..."
curl -X POST "$URL" \
     -H "Content-Type: application/json" \
     -d "$DATA" \
     --max-time 15

