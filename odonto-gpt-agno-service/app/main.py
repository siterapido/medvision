from fastapi import FastAPI
from dotenv import load_dotenv
import os

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from app.api import router as api_router
from app.routes.artifacts import router as artifacts_router
from app.models.schemas import HealthResponse
import uvicorn

app = FastAPI(
    title="Odonto GPT Agent Service",
    description="AGNO-powered AI agents for dental education and image analysis",
    version="1.0.0",
)

# CORS Configuration
# Define default allowed origins
default_origins = [
    "https://www.odontogpt.com",
    "https://odontogpt.com",
    "https://odontogpt.vercel.app",
    "http://localhost:3000",
    "https://v0-odonto-gpt-ui-production.up.railway.app",
]

# Read allowed origins from environment variable
env_allowed_origins = os.getenv("ALLOWED_ORIGINS", "")

if env_allowed_origins == "*":
    origins = ["*"]
else:
    # Split by comma and strip whitespace
    env_origins_list = [
        origin.strip() for origin in env_allowed_origins.split(",") if origin.strip()
    ]
    # Combine defaults with env origins, removing duplicates
    origins = list(set(default_origins + env_origins_list))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(api_router, prefix="/api/v1")
app.include_router(artifacts_router)  # Rotas de artefatos em /api/artifacts


@app.get("/", tags=["Health"])
async def root():
    return {"message": "Odonto GPT AGNO Service is running"}


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse()


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
