from agno.agent import Agent
from agno.models.openai import OpenAIChat
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=".env")

# Mock tool
def get_weather(city: str) -> str:
    """Get weather for a city."""
    return f"The weather in {city} is sunny."

api_key = os.getenv("OPENROUTER_API_KEY")

agent = Agent(
    model=OpenAIChat(
        id="openai/gpt-3.5-turbo",
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1"
    ),
    tools=[get_weather],
)

print("--- Starting Stream with Events ---")
try:
    # Try passing stream_events to run
    for chunk in agent.run("What is the weather in London?", stream=True, stream_events=True):
        try:
             # Print simplified dict of the chunk/event
             data = vars(chunk).copy()
             if 'messages' in data: del data['messages']
             print(f"Event Type: {chunk.event}")
             print(f"Event Data: {data}")
        except:
             print(f"Raw Chunk: {chunk}")
except Exception as e:
    print(f"Error: {e}")
