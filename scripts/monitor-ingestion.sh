#!/bin/bash
# Monitor RAG ingestion progress

cd "$(dirname "$0")/.."

echo "🔍 Monitorando ingestão de PDFs..."
echo ""

export $(cat .env.local | grep -E "^NEXT_PUBLIC_SUPABASE_URL=|^SUPABASE_SERVICE_ROLE_KEY=" | xargs)

while true; do
    # Get total chunks from database
    TOTAL=$(psql "${DATABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}" -t -c "SELECT COUNT(*) FROM knowledge_documents;" 2>/dev/null || echo "0")

    # Get chunks by specialty
    echo -ne "\033[2J\033[H"  # Clear screen
    echo "================================================"
    echo "📊 PROGRESSO DA INGESTÃO RAG"
    echo "================================================"
    echo ""
    echo "💾 Total de chunks no banco: $TOTAL"
    echo ""

    # Check if process is still running
    if pgrep -f "extract-pdfs-split.py" > /dev/null; then
        echo "✅ Processo ATIVO - Atualizando a cada 10s"
    else
        echo "⏸️  Processo FINALIZADO"
        echo ""
        echo "📖 Por especialidade:"
        psql "${DATABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}" -c \
            "SELECT specialty, COUNT(*) as chunks,
             COUNT(DISTINCT parent_document_id) as docs
             FROM knowledge_documents
             GROUP BY specialty
             ORDER BY specialty;" 2>/dev/null || echo "Não foi possível conectar ao banco"
        break
    fi

    echo ""
    echo "================================================"
    echo "Pressione Ctrl+C para sair"

    sleep 10
done
