#!/bin/bash
# Verify that knowledge_documents table exists

cd "$(dirname "$0")/.."

echo "🔍 Verificando se a migration foi aplicada..."
echo ""

# Test API endpoint
export $(cat .env.local | grep -E "^ADMIN_API_KEY=" | xargs)

curl -s -X GET http://localhost:3000/api/admin/ingest-document \
  -H "Authorization: Bearer $ADMIN_API_KEY" | jq .

echo ""
echo "Se ver 'status: ok', a migration funcionou! ✅"
echo "Próximo passo: python scripts/test-single-ingest.py"
