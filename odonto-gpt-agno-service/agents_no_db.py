"""Agentes para testes sem banco de dados"""

from dotenv import load_dotenv
load_dotenv()

from agno.agent import Agent
from agno.models.openai.like import OpenAILike
import os


def create_qa_agent_no_db() -> Agent:
    """Agente Q&A sem banco de dados (sem persistência)"""
    qa_agent = Agent(
        name="dental_education_assistant",
        model=OpenAILike(
            id=os.getenv("OPENROUTER_MODEL_QA", "openai/gpt-4o-mini"),
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1",
        ),
        # Sem db=None - memória apenas durante a sessão
        add_history_to_context=False,  # Desabilita histórico
        description="You are an Expert Dental Educator and Knowledge Specialist.",
        instructions=[
            "You are a distinguished dental professor with extensive teaching experience.",
            "Provide accurate, well-sourced answers to dental questions.",
        ],
    )
    return qa_agent


def create_image_agent_no_db() -> Agent:
    """Agente de imagem sem banco de dados (sem persistência)"""
    image_agent = Agent(
        name="dental_image_analyzer",
        model=OpenAILike(
            id=os.getenv("OPENROUTER_MODEL_IMAGE", "openai/gpt-4o"),
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1",
        ),
        # Sem db=None - memória apenas durante a sessão
        add_history_to_context=False,
        description="You are an Expert Dental Radiologist and Clinician.",
        instructions=[
            "You are an experienced dental radiologist with 20 years of experience.",
            "Analyze dental images with clinical precision.",
        ],
    )
    return image_agent


# Criar instâncias
dental_qa_agent_simple = create_qa_agent_no_db()
dental_image_agent_simple = create_image_agent_no_db()


if __name__ == "__main__":
    # Teste rápido
    print("Testando agentes sem banco de dados...")
    print("-" * 50)

    response = dental_qa_agent_simple.run("O que é endodontia?", stream=False)
    print(f"Resposta: {response.content if hasattr(response, 'content') else response}")
