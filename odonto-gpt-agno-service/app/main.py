
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router as api_router
from app.models.schemas import HealthResponse
import uvicorn
import os

app = FastAPI(
    title="Odonto GPT Agent Service",
    description="AGNO-powered AI agents for dental education and image analysis",
    version="1.0.0"
)

# CORS Configuration
# Allow all origins for development, restrict in production
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix="/api/v1")

@app.get("/", tags=["Health"])
async def root():
    return {"message": "Odonto GPT AGNO Service is running"}

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
