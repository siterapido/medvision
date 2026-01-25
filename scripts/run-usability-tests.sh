#!/bin/bash

# ===========================================
# Script de Testes de Usabilidade - OdontoGPT
# ===========================================

set -e

echo "========================================"
echo "  OdontoGPT - Testes de Usabilidade"
echo "========================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verifica se o playwright esta instalado
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Erro: npx nao encontrado. Instale o Node.js${NC}"
    exit 1
fi

# Funcao para mostrar ajuda
show_help() {
    echo "Uso: $0 [opcoes]"
    echo ""
    echo "Opcoes:"
    echo "  --all         Executa todos os testes"
    echo "  --desktop     Executa apenas testes desktop"
    echo "  --mobile      Executa apenas testes mobile"
    echo "  --agent ID    Testa apenas um agente especifico"
    echo "  --headed      Executa com navegador visivel"
    echo "  --debug       Modo debug com slowMo"
    echo "  --report      Apenas gera relatorio"
    echo "  -h, --help    Mostra esta ajuda"
    echo ""
    echo "Agentes disponiveis:"
    echo "  odonto-gpt, odonto-research, odonto-practice,"
    echo "  odonto-summary, odonto-vision"
}

# Variaveis
RUN_ALL=false
DESKTOP_ONLY=false
MOBILE_ONLY=false
AGENT_FILTER=""
HEADED=""
DEBUG=""
REPORT_ONLY=false

# Parse argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            RUN_ALL=true
            shift
            ;;
        --desktop)
            DESKTOP_ONLY=true
            shift
            ;;
        --mobile)
            MOBILE_ONLY=true
            shift
            ;;
        --agent)
            AGENT_FILTER="$2"
            shift 2
            ;;
        --headed)
            HEADED="--headed"
            shift
            ;;
        --debug)
            DEBUG="--debug"
            shift
            ;;
        --report)
            REPORT_ONLY=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Opcao desconhecida: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Verifica variaveis de ambiente necessarias
if [[ -z "$TEST_USER_EMAIL" || -z "$TEST_USER_PASSWORD" ]]; then
    echo -e "${YELLOW}Aviso: Variaveis TEST_USER_EMAIL e TEST_USER_PASSWORD nao definidas${NC}"
    echo "Os testes de autenticacao podem falhar."
    echo ""
    read -p "Continuar mesmo assim? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Abortado."
        exit 1
    fi
fi

# Inicia o servidor se nao estiver rodando
check_server() {
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}Servidor ja esta rodando em localhost:3000${NC}"
        return 0
    else
        echo -e "${YELLOW}Servidor nao encontrado. Iniciando...${NC}"
        return 1
    fi
}

# Funcao principal de execucao
run_tests() {
    local PROJECT=""
    local GREP=""

    # Define projeto
    if $DESKTOP_ONLY; then
        PROJECT="--project=chromium"
    elif $MOBILE_ONLY; then
        PROJECT="--project=mobile"
    fi

    # Define filtro de agente
    if [[ -n "$AGENT_FILTER" ]]; then
        GREP="--grep=$AGENT_FILTER"
    fi

    echo ""
    echo -e "${GREEN}Executando testes de usabilidade...${NC}"
    echo ""

    # Executa playwright
    npx playwright test tests-e2e/chat-agents-usability.spec.ts \
        $PROJECT \
        $GREP \
        $HEADED \
        $DEBUG \
        --reporter=html,list

    RESULT=$?

    if [ $RESULT -eq 0 ]; then
        echo ""
        echo -e "${GREEN}========================================"
        echo "  Testes concluidos com sucesso!"
        echo "========================================${NC}"
    else
        echo ""
        echo -e "${RED}========================================"
        echo "  Alguns testes falharam"
        echo "========================================${NC}"
    fi

    return $RESULT
}

# Gera relatorio
generate_report() {
    echo ""
    echo "Gerando relatorio HTML..."

    # Abre o relatorio
    if command -v open &> /dev/null; then
        open playwright-report/index.html
    elif command -v xdg-open &> /dev/null; then
        xdg-open playwright-report/index.html
    else
        echo "Relatorio disponivel em: playwright-report/index.html"
    fi
}

# Execucao principal
main() {
    if $REPORT_ONLY; then
        generate_report
        exit 0
    fi

    if ! check_server; then
        echo "Iniciando servidor em background..."
        npm run start &
        SERVER_PID=$!
        sleep 10  # Aguarda servidor iniciar

        # Garante que o servidor sera encerrado ao sair
        trap "kill $SERVER_PID 2>/dev/null" EXIT
    fi

    run_tests
    RESULT=$?

    echo ""
    read -p "Abrir relatorio HTML? (Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        generate_report
    fi

    exit $RESULT
}

main
