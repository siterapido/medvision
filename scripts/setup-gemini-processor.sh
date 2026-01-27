#!/bin/bash

# Setup script for Gemini Flash PDF Processor
# Installs system dependencies and Python packages

set -e

echo "========================================================================"
echo "🚀 Setting up Gemini Flash PDF Processor"
echo "========================================================================"

# Check if poppler is installed (required for pdf2image)
if ! command -v pdftoppm &> /dev/null; then
    echo "📦 Installing poppler..."
    if command -v brew &> /dev/null; then
        brew install poppler
    elif command -v apt &> /dev/null; then
        apt-get update
        apt-get install -y poppler-utils
    else
        echo "❌ Please install poppler manually"
        echo "   macOS: brew install poppler"
        echo "   Ubuntu/Debian: apt-get install poppler-utils"
        exit 1
    fi
else
    echo "✓ poppler already installed"
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -q -r "$(dirname "$0")/requirements-gemini-pdf.txt"

echo ""
echo "========================================================================"
echo "✅ Setup complete!"
echo "========================================================================"
echo ""
echo "Environment variables required (check .env.local):"
echo "  - OPENROUTER_API_KEY"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "Usage:"
echo "  python3 scripts/gemini-pdf-processor.py [directory]"
echo ""
echo "Examples:"
echo "  python3 scripts/gemini-pdf-processor.py 'Assuntos com PDF'"
echo "  python3 scripts/gemini-pdf-processor.py 'Assuntos com PDF/Dentística'"
echo ""
