#!/bin/bash

# Test RAG Document Ingestion
# Usage: bash scripts/test-rag-ingest.sh [document_index]
# Example: bash scripts/test-rag-ingest.sh 1

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_URL="${APP_URL:-http://localhost:3000}"
ADMIN_API_KEY="${ADMIN_API_KEY:-$(grep ADMIN_API_KEY .env.local | cut -d= -f2)}"

if [ -z "$ADMIN_API_KEY" ]; then
  echo -e "${RED}Error: ADMIN_API_KEY not found in .env.local${NC}"
  exit 1
fi

# Sample documents for testing
declare -A DOCS=(
  [1]='{"title":"Endodontia - Tratamento de Canal","sourceType":"textbook","sourceName":"Endodontia Clássica","specialty":"endodontia","author":"Paul Bauman","content":"O tratamento endodôntico, também conhecido como terapia de canal radicular, é um procedimento que remove o tecido inflamado ou infectado (polpa) do interior do dente. A polpa é o tecido conectivo que contém os vasos sanguíneos e nervos dentro da cavidade pulpar do dente.\n\nINDICAÇÕES CLÍNICAS:\n1. Polpa inflamada - Pulpite reversível\n2. Polpa necrosada - Necrose pulpar\n3. Complicações periapicais - Abscesso periapical\n4. Lesões traumáticas\n5. Necessidade de espaço para retenção protética\n\nPROTOCOLO CLÍNICO:\nPasso 1: Anestesia local adequada - Infiltrativa ou bloqueio (Lidocaína 2%)\nPasso 2: Isolamento absoluto com dique de borracha\nPasso 3: Acesso - Remoção de cáries e tecido cariado\nPasso 4: Localização do(s) canal(is)\nPasso 5: Instrumentação até o comprimento de trabalho\nPasso 6: Limpeza e conformação\nPasso 7: Desinfecção intra-canalicular\nPasso 8: Obturação tridimensional (técnica lateral ou vertical)\nPasso 9: Selamento coronário\n\nMATERIAIS UTILIZADOS:\n- Limas endodônticas (série K ou Ni-Ti)\n- Hidróxido de cálcio como medicação intracanal\n- Guta-percha e sealer para obturação\n- Ácido cítrico 17% para limpeza final\n\nCOMPLICAÇÕES POSSÍVEIS:\n- Perfuração do canal radicular\n- Fratura de instrumento\n- Bloqueio do canal (calcificação)\n- Extravasamento periapical\n- Lesão ao tecido periapical"}'
  [2]='{"title":"Periodontia - Raspagem e Alisamento Radicular","sourceType":"article","sourceName":"Journal of Periodontal Research","specialty":"periodontia","author":"Klaus Gotteik","content":"A raspagem supragengival e o alisamento radicular (SRP) são procedimentos não-cirúrgicos fundamental para o tratamento de doenças periodontais. O objetivo é remover biofilme bacteriano, cálculo, e endotoxinas das superfícies radiculares.\n\nDETALHES DA TÉCNICA:\nOs instrumentos manuais (curetas Gracey) oferecem melhor feedback tátil e controle.\nOs instrumentos ultrassônicos (sônicos e ultrassônicos) são mais eficientes em remover cálculo grosseiro.\n\nPROTOCOLO PADRÃO:\n1. Anestesia: Infiltrativa ou bloqueio conforme necessidade\n2. Isolamento relativo com afastadores e sugador\n3. Seleção do instrumento apropriado\n4. Instrumentação de cada face (facial, lingual, mesial, distal)\n5. Pressão controlada para remover cálculo sem danificar cemento\n6. Monitoramento com explorador periodontal\n7. Polimento final com copa e pasta\n8. Enxágue com clorexidina 0.12%\n\nEFICACIA:\n- Redução de profundidade de bolsa em 2-3mm\n- Ganho de inserção em 1-2mm\n- Diminuição de sangramento à sondagem em 60-80% dos casos\n- Resultado mais evidente em gengivite e periodontite leve a moderada\n\nCOMPLICAÇÕES E CUIDADOS:\n- Recessão gengival em 5-10% dos casos\n- Sensibilidade pós-operatória (usar dessensibilizantes)\n- Lesão ao cemento (usar instrumentação suave)\n- Contraindicado em anticoagulação não controlada"}'
  [3]='{"title":"Implantodontia - Cirurgia de Colocação de Implantes","sourceType":"protocol","sourceName":"Protocol Manual - Straumann","specialty":"implantologia","author":"Tord Berglundh","content":"A colocação de implantes dentários é um procedimento cirúrgico que requer planejamento cuidadoso, técnica asséptica e compreensão da anatomia.\n\nFASES DO TRATAMENTO:\n1. Diagnóstico e Planejamento\n   - CBCT para avaliar volume ósseo\n   - Planejamento digital (software)\n   - Determinação do volume e densidade óssea\n   - Identificação de estruturas anatômicas críticas\n\n2. Fase Cirúrgica\n   - Antissepsia extra e intra-oral\n   - Anestesia local ou bloqueio (Lidocaína 2% com epinefrina)\n   - Incisão gengival (crista ou intrasulcular)\n   - Levantamento de retalho\n   - Seqüência de furos com brocas progressivas\n   - Implantação com chave de catraca\n   - Sutura da mucosa\n\n3. Fase de Osseointegração\n   - Repouso de 3-4 meses em mandíbula\n   - Repouso de 4-6 meses em maxila\n   - Fatores que afetam: densidade óssea, estabilidade primária, qualidade do implante\n\n4. Fase Protética\n   - Reabertura cirúrgica (pino de cicatrização)\n   - Moldagem\n   - Confecção de coroa ou prótese\n   - Cimentação ou parafusagem\n\nCRITÉRIOS DE SUCESSO:\n- Ausência de mobilidade clínica\n- Ausência de dor espontânea\n- Ausência de infecção periimplantar\n- Ausência de reabsorção óssea acelerada\n- Radiograficamente: contato ósseo ao redor do implante"}'
)

# Function to ingest a document
ingest_document() {
  local doc_index=$1
  local doc_data="${DOCS[$doc_index]}"

  if [ -z "$doc_data" ]; then
    echo -e "${RED}Invalid document index. Available: 1, 2, 3${NC}"
    exit 1
  fi

  echo -e "${YELLOW}Ingesting document $doc_index...${NC}"

  response=$(curl -s -X POST "$APP_URL/api/admin/ingest-document" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_API_KEY" \
    -d "$doc_data")

  echo "$response" | jq '.'

  # Check if successful
  if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Document ingested successfully${NC}"
    echo "Chunks: $(echo "$response" | jq -r '.successCount') / $(echo "$response" | jq -r '.totalChunks')"
  else
    echo -e "${RED}✗ Ingestion failed${NC}"
    exit 1
  fi
}

# Test RAG search
test_rag_search() {
  local query="Como fazer um tratamento de canal?"

  echo -e "\n${YELLOW}Testing RAG search with query: \"$query\"${NC}"

  # This would need a test endpoint - for now just show the format
  echo "RAG search would return documents and user context based on:"
  echo "- Semantic similarity (vector embeddings)"
  echo "- Keyword matching (full-text search)"
}

# Main
if [ -z "$1" ]; then
  echo -e "${YELLOW}Ingesting all sample documents...${NC}"
  ingest_document 1
  ingest_document 2
  ingest_document 3
  echo -e "\n${GREEN}All documents ingested. The system is ready for testing!${NC}"
else
  ingest_document "$1"
fi

test_rag_search
