"""Playground simplificado sem banco de dados"""

from dotenv import load_dotenv
load_dotenv()

from phi.playground import Playground, serve_playground_app
from agno.agent import Agent
from agno.models.openai.like import OpenAILike
import os

# Agentes sem banco de dados (mais rápido e sem erros de conexão)
qa_agent = Agent(
    name="dental_qa_simple",
    model=OpenAILike(
        id=os.getenv("OPENROUTER_MODEL_QA", "google/gemma-3-27b-it:free"),
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
    ),
    description="Assistente odontológico para perguntas e respostas.",
    instructions=[
        "Você é um professor de odontologia experiente.",
        "Forneça respostas claras e educacionais.",
    ],
)

image_agent = Agent(
    name="dental_image_simple",
    model=OpenAILike(
        id=os.getenv("OPENROUTER_MODEL_IMAGE", "openai/gpt-4o"),
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
    ),
    description="Radiologista odontológico para análise de imagens.",
    instructions=[
        "Você é um radiologista odontológico com 20 anos de experiência.",
        "Analise imagens com precisão clínica.",
    ],
)

# Criar playground
playground = Playground(agents=[qa_agent, image_agent])
app = playground.get_app()

# CORS
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    print("=" * 60)
    print("🎮 Playground Odonto GPT (Simplificado)")
    print("=" * 60)
    print()
    print("Agentes disponíveis:")
    for agent in playground.agents:
        print(f"  • {agent.name}")
    print()
    print("Acesso local:")
    print("  http://localhost:7777")
    print()
    print("Acesso via Phidata:")
    print("  https://phidata.app/playground?endpoint=localhost%3A7777")
    print("=" * 60)
    print()

    serve_playground_app("playground_simple:app", reload=True)
