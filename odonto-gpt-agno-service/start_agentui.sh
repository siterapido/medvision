#!/bin/bash
# Script para iniciar a AgentUI (interface web para AgentOS)

echo "🚀 Iniciando AgentUI..."
echo ""
echo "A AgentUI estará disponível em: http://localhost:3000"
echo "Conecte-se ao AgentOS local em: http://localhost:7777"
echo ""
echo "Pressione Ctrl+C para parar"
echo ""

# Verifica se o npx está disponível
if ! command -v npx &> /dev/null; then
    echo "❌ npx não encontrado. Instale Node.js para usar a AgentUI."
    echo "   Ou use: http://localhost:7777/docs (Swagger UI)"
    exit 1
fi

# Inicia a AgentUI
npx @agno-agi/agent-ui serve --port 3000
