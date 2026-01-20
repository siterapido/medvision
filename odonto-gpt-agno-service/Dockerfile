# ==========================================
# OPTIMIZED DOCKERFILE FOR AI SERVICES
# Targets < 4GB for Railway deployment
# ==========================================
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (Keep it minimal)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# CRITICAL OTIMIZATION: Install PyTorch CPU version FIRST
# This prevents downloading the massive 2GB+ CUDA/GPU version
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code (excluding large dirs via .dockerignore)
COPY . .

# Delete local environments or caches if they were copied by mistake
RUN rm -rf venv .venv tests scripts/poc*

EXPOSE 8000

# Run with single worker to save RAM on smaller plans
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"
