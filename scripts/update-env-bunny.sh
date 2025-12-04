#!/bin/bash

# Script para atualizar variáveis de ambiente do Bunny CDN no .env.local

ENV_FILE=".env.local"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔧 Atualizando configurações do Bunny CDN..."

# Verifica se o arquivo .env.local existe
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env.local não encontrado. Criando novo arquivo...${NC}"
    touch "$ENV_FILE"
fi

# Função para atualizar ou adicionar variável
update_or_add_var() {
    local var_name=$1
    local var_value=$2
    
    if grep -q "^${var_name}=" "$ENV_FILE"; then
        # Atualizar variável existente
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^${var_name}=.*|${var_name}=${var_value}|" "$ENV_FILE"
        else
            # Linux
            sed -i "s|^${var_name}=.*|${var_name}=${var_value}|" "$ENV_FILE"
        fi
        echo -e "${GREEN}✓${NC} Atualizado: ${var_name}"
    else
        # Adicionar nova variável
        echo "${var_name}=${var_value}" >> "$ENV_FILE"
        echo -e "${GREEN}✓${NC} Adicionado: ${var_name}"
    fi
}

# Atualizar variáveis do Bunny
update_or_add_var "BUNNY_STORAGE_ZONE" "odontogptstorage"
update_or_add_var "BUNNY_STORAGE_API_KEY" "2335bbcf   update_or_add_var "BUNNY_STORAGE_API_KEY" "2335bbcf-ae76-4e71-88e0-9d80a694d60d6da73147-04bc-43fb-960a-68fa393572ed"-ae76-4e71-88e0-9d80a694d60d6da73147-04bc-43fb-960a-68fa393572ed"
update_or_add_var "BUNNY_STORAGE_HOST" "storage.bunnycdn.com"
update_or_add_var "BUNNY_CDN_BASE_URL" "https://odonto-gpt.b-cdn.net/"
update_or_add_var "NEXT_PUBLIC_MAX_ATTACHMENT_MB" "1500"

echo ""
echo -e "${GREEN}✅ Configurações do Bunny CDN atualizadas!${NC}"
echo ""
echo "📋 Próximos passos:"
echo "1. Teste a configuração: npm run test:bunny"
echo "2. Reinicie o servidor de desenvolvimento se estiver rodando"
echo "3. Configure as mesmas variáveis na Vercel (produção)"
echo ""
echo "⚠️  IMPORTANTE: Não commite o arquivo .env.local (ele está no .gitignore)"


