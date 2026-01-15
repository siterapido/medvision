
import asyncio
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agents.odonto_gpt_agent import odonto_gpt
from app.agents.team import rotear_para_agente_apropriado, odonto_flow

async def main():
    print("--- Testing Odonto GPT Instantiation ---")
    print(f"Agent Name: {odonto_gpt.name}")
    print(f"Model ID: {odonto_gpt.model.id}")
    
    print("\n--- Testing Routing Logic ---")
    test_phrases = [
        "Como funciona o tratamento de canal?", # Should be GPT or Ciencia
        "Me explica o que é periodontite", # GPT
        "pesquisar artigos sobre implantes", # Ciencia
        "quais os sintomas de cárie", # GPT or Ciencia
        "vamos bater um papo", # GPT
        "estou com dúvida na matéria", # GPT
        "crie uma prova sobre anatomia", # Estudo
    ]
    
    for phrase in test_phrases:
        route = rotear_para_agente_apropriado(phrase)
        print(f"Phrase: '{phrase}' -> Route: {route}")

if __name__ == "__main__":
    asyncio.run(main())
