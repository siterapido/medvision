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

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Delete local environments or caches if they were copied by mistake
RUN rm -rf venv .venv tests scripts/poc* scripts/test*

EXPOSE 8000

# Run with single worker to save RAM on smaller plans
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"
