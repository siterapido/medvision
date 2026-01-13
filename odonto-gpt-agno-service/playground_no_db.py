"""Playground sem banco de dados para testes rápidos"""

from dotenv import load_dotenv
load_dotenv()

from phi.playground import Playground, serve_playground_app
from agents_no_db import dental_qa_agent_simple, dental_image_agent_simple

from fastapi.middleware.cors import CORSMiddleware

# Create the Playground instance sem banco de dados
playground = Playground(agents=[dental_qa_agent_simple, dental_image_agent_simple])
app = playground.get_app()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    print("🎮 Playground Odonto GPT (sem banco de dados)")
    print("=" * 50)
    print("Acesse: http://localhost:8000")
    print("=" * 50)
    serve_playground_app("playground_no_db:app", reload=True)
