from fastapi import FastAPI
from dotenv import load_dotenv
import os

load_dotenv()
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
# Read allowed origins from environment variable for production
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
origins = allowed_origins.split(",") if allowed_origins != "*" else ["*"]

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
