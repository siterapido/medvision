#!/bin/bash

# Run Gemini Flash PDF Processor
# Processes all PDFs and uploads to Supabase

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "${BLUE}========================================================================"
echo "🚀 Gemini Flash 2.0 PDF Processor"
echo "========================================================================${NC}"
echo ""

# Check environment variables
echo "${YELLOW}Checking environment variables...${NC}"
if [ -z "$OPENROUTER_API_KEY" ]; then
    if [ -f ".env.local" ]; then
        export $(grep OPENROUTER_API_KEY .env.local | xargs)
    else
        echo "${RED}❌ OPENROUTER_API_KEY not set${NC}"
        exit 1
    fi
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    if [ -f ".env.local" ]; then
        export $(grep NEXT_PUBLIC_SUPABASE_URL .env.local | xargs)
    else
        echo "${RED}❌ NEXT_PUBLIC_SUPABASE_URL not set${NC}"
        exit 1
    fi
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    if [ -f ".env.local" ]; then
        export $(grep SUPABASE_SERVICE_ROLE_KEY .env.local | xargs)
    else
        echo "${RED}❌ SUPABASE_SERVICE_ROLE_KEY not set${NC}"
        exit 1
    fi
fi

echo "${GREEN}✓ Environment variables loaded${NC}"
echo ""

# Check if poppler is installed
echo "${YELLOW}Checking dependencies...${NC}"
if ! command -v pdftoppm &> /dev/null; then
    echo "${YELLOW}poppler not found, installing...${NC}"
    bash "$SCRIPT_DIR/setup-gemini-processor.sh"
else
    echo "${GREEN}✓ poppler installed${NC}"
fi

# Check Python dependencies
if ! python3 -c "import pdf2image" 2>/dev/null; then
    echo "${YELLOW}Installing Python dependencies...${NC}"
    pip install -q -r "$SCRIPT_DIR/requirements-gemini-pdf.txt"
else
    echo "${GREEN}✓ Python dependencies installed${NC}"
fi

echo ""

# Determine target directory
TARGET_DIR="${1:-.}"

if [ ! -d "$TARGET_DIR" ]; then
    echo "${RED}❌ Directory not found: $TARGET_DIR${NC}"
    exit 1
fi

# Count PDFs
PDF_COUNT=$(find "$TARGET_DIR" -type f -name "*.pdf" | grep -v ".temp_" | wc -l)

if [ "$PDF_COUNT" -eq 0 ]; then
    echo "${RED}❌ No PDFs found in $TARGET_DIR${NC}"
    exit 1
fi

echo "${BLUE}Found $PDF_COUNT PDFs in: $TARGET_DIR${NC}"
echo ""

# Run processor
echo "${BLUE}Starting processing...${NC}"
echo ""

python3 "$SCRIPT_DIR/gemini-pdf-processor.py" "$TARGET_DIR"

echo ""
echo "${BLUE}========================================================================"
echo "Processing complete!"
echo "========================================================================${NC}"
echo ""
echo "${YELLOW}Validation:${NC}"
echo "  Run: psql -U postgres -d postgres -h localhost < scripts/validate-gemini-upload.sql"
echo ""
echo "${YELLOW}Or using Supabase CLI:${NC}"
echo "  supabase query 'SELECT COUNT(*) FROM knowledge_documents WHERE metadata->>\"extractionMethod\" = \"gemini-flash-vision\";'"
echo ""
