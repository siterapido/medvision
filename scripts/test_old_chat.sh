#!/bin/bash
# Teste do endpoint /api/chat
curl -N -v -X POST http://127.0.0.1:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Olá"
      }
    ],
    "agentId": "odonto-gpt"
  }'
