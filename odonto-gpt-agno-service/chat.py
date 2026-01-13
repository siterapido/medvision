#!/usr/bin/env python3
"""Chat interativo simples com o agente odontológico"""

from dotenv import load_dotenv
load_dotenv()

from app.agents.qa_agent import dental_qa_agent
from app.agents.image_agent import dental_image_agent
import sys

def print_section(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def chat_with_agent(agent, agent_name):
    """Chat interativo com um agente"""
    print_section(f"Chat com {agent_name}")
    print("Digite 'sair' ou 'quit' para encerrar\n")

    session_id = None

    while True:
        try:
            user_input = input("Você: ").strip()

            if not user_input:
                continue

            if user_input.lower() in ['sair', 'quit', 'exit', 'q']:
                print("\n👋 Encerrando conversa...")
                break

            print(f"\n🤖 {agent_name}: ", end="", flush=True)

            # Run agent with streaming
            response = agent.run(user_input, stream=True, session_id=session_id)

            full_response = ""
            for chunk in response:
                if hasattr(chunk, 'content'):
                    content = chunk.content
                elif isinstance(chunk, str):
                    content = chunk
                else:
                    content = str(chunk)

                print(content, end="", flush=True)
                full_response += content

            print("\n")

        except KeyboardInterrupt:
            print("\n\n👋 Conversa interrompida.")
            break
        except Exception as e:
            print(f"\n❌ Erro: {e}\n")

def main():
    print_section("Odonto GPT - Chat Interativo")
    print("Agente Odontológico com Agno 2.0\n")

    print("Selecione o agente:")
    print("  1. Agente de Perguntas e Respostas (Q&A)")
    print("  2. Agente de Análise de Imagens")
    print()

    choice = input("Escolha (1 ou 2): ").strip()

    if choice == '1':
        chat_with_agent(dental_qa_agent, "Assistente Odontológico")
    elif choice == '2':
        print("\n⚠️  Para análise de imagens, você precisa fornecer uma URL de imagem.")
        print("Este agente é melhor utilizado via API HTTP.")
        print("Use o endpoint: POST /api/v1/image/analyze")
        print()
        chat_with_agent(dental_image_agent, "Radiologista Odontológico")
    else:
        print("❌ Opção inválida. Usando agente Q&A por padrão.")
        chat_with_agent(dental_qa_agent, "Assistente Odontológico")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Até logo!")
        sys.exit(0)
