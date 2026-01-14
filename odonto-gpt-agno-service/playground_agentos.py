"""
Playground usando AgentOS (novo método no Agno v2)
O Playground antigo foi depreciado em favor do AgentOS
"""

from dotenv import load_dotenv
load_dotenv()

from agno.os import AgentOS
from agno.agent import Agent
from agno.models.openai.like import OpenAILike
from agno.db.postgres import PostgresDb
import os

# Database connection
db_url = os.getenv("SUPABASE_DB_URL")
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

db = PostgresDb(
    db_url=db_url
)

# QA Agent
qa_agent = Agent(
    name="Agente Odonto QA",
    role="Assistente odontológico educacional",
    id="dental-qa-agent",
    model=OpenAILike(
        id=os.getenv("OPENROUTER_MODEL_QA", "google/gemma-3-27b-it:free"),
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
    ),
    db=db,
    add_history_to_context=True,
    num_history_messages=5,
    markdown=True,
    instructions=[
        "Você é um professor de odontologia experiente.",
        "Forneça respostas claras e educacionais.",
        "Use terminologia técnica adequada.",
        "Quando apropriado, inclua referências a estudos científicos.",
    ],
    description="""
    Você é um Especialista em Educação Odontológica e Conhecimento.
    Você fornece conteúdo educacional claro e preciso sobre odontologia.
    """,
)

# Image Agent
image_agent = Agent(
    name="Agente de Imagem Odonto",
    role="Radiologista odontológico",
    id="dental-image-agent",
    model=OpenAILike(
        id=os.getenv("OPENROUTER_MODEL_IMAGE", "openai/gpt-4o"),
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
    ),
    db=db,
    add_history_to_context=True,
    num_history_messages=3,
    markdown=True,
    instructions=[
        "Você é um radiologista odontológico com 20 anos de experiência.",
        "Analise imagens com precisão clínica.",
        "Descreva achados de forma clara e estruturada.",
        "Sempre inclua um disclaimer educacional.",
    ],
    description="""
    Você é um Especialista em Radiologia Odontológica e Clínico especializado em
    analisar radiografias dentárias, fotos intraorais e imagens clínicas.
    """,
)

# Create AgentOS instance
agent_os = AgentOS(
    id="odonto-gpt-agentos",
    name="Odonto GPT AgentOS",
    description="Sistema multi-agente para educação e análise odontológica",
    agents=[qa_agent, image_agent],
)

# Get the FastAPI app
app = agent_os.get_app()

# CORS for frontend
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import socket

    # Get local IP address
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)

    print("=" * 60)
    print("🎯 Odonto GPT AgentOS (Novo Método)")
    print("=" * 60)
    print()
    print("Agentes disponíveis:")
    for agent in agent_os.agents:
        print(f"  • {agent.name} (ID: {agent.id})")
    print()
    print("Endpoints:")
    print(f"  • Local:         http://localhost:7777")
    print(f"  • IP Local:      http://{local_ip}:7777")
    print(f"  • API Docs:      http://localhost:7777/docs")
    print(f"  • MCP Server:    http://localhost:7777/mcp")
    print()
    print("⚠️  Para conectar no os.agno.com:")
    print(f"    1. Abra https://os.agno.com")
    print(f"    2. Clique em 'Add new OS' → 'Local'")
    print(f"    3. Endpoint: http://{local_ip}:7777")
    print(f"    4. Name: Odonto GPT Local")
    print()
    print("=" * 60)
    print()

    # Serve using AgentOS com host=0.0.0.0 para acesso externo
    agent_os.serve(app="playground_agentos:app", host="0.0.0.0", port=7777, reload=True)
