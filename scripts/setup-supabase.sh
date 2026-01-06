#!/bin/bash

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Setup do Supabase para Odonto GPT ===${NC}\n"

# 1. Verificar Node.js e npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Erro: npm não encontrado. Instale Node.js primeiro.${NC}"
    exit 1
fi

# 2. Instalar dependências se necessário
echo -e "${YELLOW}Verificando dependências...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Instalando node_modules..."
    npm install
fi

# 3. Verificar Supabase CLI
echo -e "${YELLOW}Verificando Supabase CLI...${NC}"
if ! npx supabase --version &> /dev/null; then
    echo -e "${RED}Erro: Supabase CLI não funcionou via npx. Tentando instalar...${NC}"
    npm install -D supabase
fi

# 4. Login no Supabase
echo -e "\n${YELLOW}Configurando autenticação...${NC}"
echo "Você precisará do seu Access Token do Supabase."
echo "Se ainda não estiver logado, o navegador será aberto."
echo "Pressione ENTER para continuar..."
read

npx supabase login

# 5. Linkar Projeto
echo -e "\n${YELLOW}Linkando ao projeto remoto...${NC}"
# ID do projeto obtido do config.toml ou hardcoded como fallback
PROJECT_ID="qphofwxpmmhfplylozsh"
echo "Usando Project ID: $PROJECT_ID"

# Tenta linkar. Se falhar, pede a senha do banco
npx supabase link --project-ref "$PROJECT_ID"

# 6. Validar conexão e migrações
echo -e "\n${YELLOW}Validando conexão e migrações...${NC}"
npm run db:status

echo -e "\n${GREEN}=== Setup Concluído! ===${NC}"
echo -e "Para verificar o status das migrações a qualquer momento, execute:"
echo -e "${BLUE}npm run db:status${NC}"
echo -e "Para aplicar novas migrações:"
echo -e "${BLUE}npm run db:push${NC}"



