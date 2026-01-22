#!/bin/bash

# Teste de funcionamento do Odonto GPT
# Pergunta: "Qual o protocolo para uma restauração classe II em resina composta?"

curl -N -v -X POST http://127.0.0.1:3000/api/newchat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Olá! Gostaria de saber qual o protocolo para realizar uma restauração classe II em resina composta."
      },
      {
        "role": "assistant",
        "content": "Olá! Tudo bem? 😊 Restaurar um dente com lesão de cárie classe II em resina composta envolve alguns passos importantes. Em vez de te dar o protocolo completo de cara, que tal explorarmos juntos os pontos cruciais? Para começar, qual a sua maior preocupação ao realizar esse tipo de restauração? O que você considera ser o passo mais desafiador?"
      },
      {
        "role": "user",
        "content": "Minha maior preocupação é o ponto de contato e a adaptação marginal na caixa proximal."
      }




    ],
    "agentId": "odonto-gpt"
  }'

