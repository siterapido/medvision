#!/bin/bash
# Wrapper script to run PDF ingestion with proper environment

set -e

cd "$(dirname "$0")/.."

# Activate virtual environment
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate

# Install dependencies if needed
pip list | grep -q pdfplumber || pip install pdfplumber PyPDF2 requests --quiet

# Export environment variables
export ADMIN_API_KEY="${ADMIN_API_KEY:-test-admin-key-1769526451}"
export APP_URL="${APP_URL:-http://localhost:3000}"

# Run ingestion
echo "Starting PDF ingestion..."
python scripts/extract-pdfs-split.py "${1:-Assuntos com PDF}"
