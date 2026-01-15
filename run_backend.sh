#!/bin/bash
# Script to run the Agno backend service

# Navigate to the service directory
cd odonto-gpt-agno-service

# Check if venv exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run the server
echo "Starting Agno Service on port 8000..."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
