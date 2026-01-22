"""
Exemplo de como usar o AgentOSClient para interagir com os agentes
"""

import asyncio
from agno.client import AgentOSClient


async def list_agents():
    """Lista todos os agentes disponíveis"""
    client = AgentOSClient(base_url="http://localhost:7777")
    config = await client.aget_config()

    print("=" * 60)
    print("🤖 Agentes Disponíveis")
    print("=" * 60)
    for agent in config.agents:
        print(f"\n• {agent.name}")
        print(f"  ID: {agent.id}")
        print(f"  Descrição: {agent.description[:100]}...")
    print()


async def chat_with_agent(agent_id: str, message: str):
    """Chat não-streaming com um agente"""
    client = AgentOSClient(base_url="http://localhost:7777")

    print("=" * 60)
    print(f"💬 Chat com {agent_id}")
    print("=" * 60)
    print(f"\nPergunta: {message}\n")

    try:
        result = await client.run_agent(
            agent_id=agent_id,
            message=message,
        )

        print(f"Run ID: {result.run_id}")
        print(f"\nResposta:\n{result.content}\n")
        return result
    except Exception as e:
        print(f"Erro: {e}")
        return None


async def chat_streaming(agent_id: str, message: str):
    """Chat em tempo real com streaming"""
    client = AgentOSClient(base_url="http://localhost:7777")

    print("=" * 60)
    print(f"⚡ Chat Streaming com {agent_id}")
    print("=" * 60)
    print(f"\nPergunta: {message}\n")
    print("Resposta: ", end="", flush=True)

    try:
        async for event in client.run_agent_stream(
            agent_id=agent_id,
            message=message,
        ):
            if event.event == "RunContent" and hasattr(event, "content"):
                print(event.content, end="", flush=True)
            elif event.event == "AgentCompleted" and hasattr(event, "content"):
                if event.content:
                    print(event.content, end="", flush=True)

        print("\n")
    except Exception as e:
        print(f"\nErro: {e}")


async def main():
    """Exemplo de uso"""
    # 1. Listar agentes
    await list_agents()

    # 2. Chat simples
    await chat_with_agent(
        agent_id="dental-qa-agent",
        message="O que é endodontia? Responda em 2 linhas."
    )

    # 3. Chat com streaming
    await chat_streaming(
        agent_id="dental-qa-agent",
        message="Quais são os principais sintomas de pulpite?"
    )


if __name__ == "__main__":
    asyncio.run(main())
