#!/bin/bash
# Script para expor AgentOS via ngrok para o os.agno.com

echo "🌐 Expondo AgentOS via ngrok..."
echo ""
echo "1. Instale o ngrok se não tiver:"
echo "   brew install ngrok"
echo ""
echo "2. Autenticar (uma vez só):"
echo "   ngrok config add-authtoken YOUR_TOKEN"
echo "   (pegue o token em https://ngrok.com/signup)"
echo ""
echo "3. Este comando vai criar um túnel público:"
echo ""
echo "   ngrok http 7777"
echo ""
echo "4. Copie a URL pública (ex: https://abc123.ngrok-free.app)"
echo "5. Use essa URL no os.agno.com"
echo ""

# Verifica se ngrok está instalado
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok encontrado! Iniciando túnel..."
    echo ""
    ngrok http 7777
else
    echo "❌ ngrok não encontrado"
    echo ""
    echo "Instale com:"
    echo "  brew install ngrok"
    echo ""
    echo "Ou baixe em: https://ngrok.com/download"
fi
