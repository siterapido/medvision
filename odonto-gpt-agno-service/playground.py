from dotenv import load_dotenv
load_dotenv()

from phi.playground import Playground, serve_playground_app
from app.agents.qa_agent import dental_qa_agent
from app.agents.image_agent import dental_image_agent

from fastapi.middleware.cors import CORSMiddleware

# Create the Playground instance
playground = Playground(agents=[dental_qa_agent, dental_image_agent])
app = playground.get_app()

# Explicitly add CORS for the hosted phidata.app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all for phidata.app to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    serve_playground_app("playground:app", reload=True)
