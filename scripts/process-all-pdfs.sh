#!/bin/bash

# Batch process PDFs from all specialties
# Usage: bash scripts/process-all-pdfs.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PDF_BASE_DIR="Assuntos com PDF"
ADMIN_API_KEY="${ADMIN_API_KEY:-$(grep ADMIN_API_KEY .env.local | cut -d= -f2)}"
APP_URL="${APP_URL:-http://localhost:3000}"

if [ -z "$ADMIN_API_KEY" ]; then
  echo -e "${RED}Error: ADMIN_API_KEY not found in .env.local${NC}"
  exit 1
fi

# Specialties to process
declare -a SPECIALTIES=(
    "Endodontia"
    "Cirurgia Oral Menor"
    "Dentística"
    "Prótese dentária"
    "Anestesiologia"
    "Oclusão"
    "Periodontia"
)

# Log file
LOG_FILE="batch_processing_$(date +%Y%m%d_%H%M%S).log"

echo -e "${BLUE}=== Odonto GPT PDF Batch Processing ===${NC}"
echo "Log file: $LOG_FILE"
echo "Starting time: $(date)"
echo ""

# Track overall results
TOTAL_SUCCESS=0
TOTAL_FAILED=0
TOTAL_PROCESSED=0

# Process each specialty
for specialty in "${SPECIALTIES[@]}"; do
    echo -e "${YELLOW}Processing $specialty...${NC}"

    specialty_dir="$PDF_BASE_DIR/$specialty"

    if [ ! -d "$specialty_dir" ]; then
        echo -e "${RED}✗ Directory not found: $specialty_dir${NC}"
        continue
    fi

    # Run extraction
    export ADMIN_API_KEY
    export APP_URL

    if python3 scripts/extract-and-ingest-pdfs.py "$specialty_dir" >> "$LOG_FILE" 2>&1; then
        echo -e "${GREEN}✓ $specialty completed${NC}"
        TOTAL_SUCCESS=$((TOTAL_SUCCESS + 1))
    else
        echo -e "${RED}✗ $specialty failed${NC}"
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
    fi

    TOTAL_PROCESSED=$((TOTAL_PROCESSED + 1))

    # Small delay between specialties to avoid rate limiting
    sleep 2
done

echo ""
echo -e "${BLUE}=== Processing Summary ===${NC}"
echo "Total specialties processed: $TOTAL_PROCESSED"
echo -e "Successful: ${GREEN}$TOTAL_SUCCESS${NC}"
echo -e "Failed: ${RED}$TOTAL_FAILED${NC}"
echo "Completion time: $(date)"
echo ""
echo -e "${BLUE}Log file: $LOG_FILE${NC}"

# Show summary from log
echo ""
echo -e "${BLUE}=== Details ===${NC}"
grep "Successfully ingested" "$LOG_FILE" | tail -5 || echo "No successful ingestions yet"
echo ""
grep "SUMMARY" "$LOG_FILE" -A 20 | tail -20 || echo "No summary available"

# Exit code
if [ $TOTAL_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All specialties processed successfully!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some specialties failed${NC}"
    exit 1
fi
