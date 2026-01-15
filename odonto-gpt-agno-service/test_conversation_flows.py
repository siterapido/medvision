#!/usr/bin/env python3
"""
Teste Ponta a Ponta dos Fluxos de Conversa do Odonto Flow

Testa:
1. Mensagem ambígua → espera pergunta de clarificação
2. Fluxo de aprendizado → espera perguntas sobre nível/objetivo
3. Fluxo de pesquisa → espera perguntas sobre tipo de trabalho
4. Delegação para especialistas
"""

import asyncio
import httpx
import json
from typing import AsyncGenerator

BASE_URL = "http://localhost:8000"

async def stream_chat(message: str, session_id: str = None) -> str:
    """Envia mensagem e coleta resposta via streaming"""
    import uuid as uuid_module
    
    # Gerar UUID válido se não fornecido
    if session_id is None:
        session_id = str(uuid_module.uuid4())
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/equipe/chat",
            json={
                "message": message,
                "userId": "test-user-123",
                "sessionId": session_id
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            return f"ERRO: {response.status_code} - {response.text[:200]}"
        
        full_response = ""
        
        # Parse NDJSON response - melhorado para capturar todos os eventos
        for line in response.text.split("\n"):
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                event_type = data.get("type", "")
                
                # Capturar conteúdo de diferentes tipos de eventos
                if event_type == "text.delta":
                    full_response += data.get("content", "")
                elif event_type == "run_response" or event_type == "run_content":
                    full_response += data.get("content", "")
                elif event_type == "error":
                    print(f"  ⚠️ Erro no stream: {data.get('message')}")
                elif event_type in ("run.started", "run.finished", "agent.switch"):
                    # Eventos de controle - apenas log
                    pass
                elif "content" in data and data.get("content"):
                    # Fallback para qualquer evento com content
                    full_response += data["content"]
                    
            except json.JSONDecodeError:
                # Pode ser texto plain - adicionar se não parecer JSON
                if not line.startswith("{") and not line.startswith("["):
                    full_response += line
        
        return full_response.strip() if full_response else f"[Sem conteúdo - Raw: {response.text[:200]}]"


async def test_flow(name: str, message: str, expected_keywords: list[str]):
    """Testa um fluxo específico"""
    print(f"\n{'='*60}")
    print(f"🧪 TESTE: {name}")
    print(f"{'='*60}")
    print(f"📤 Mensagem: {message}")
    print()
    
    try:
        response = await stream_chat(message)
        print(f"📥 Resposta:")
        print(f"{response[:500]}..." if len(response) > 500 else response)
        print()
        
        # Verificar keywords esperadas
        response_lower = response.lower()
        found = [kw for kw in expected_keywords if kw.lower() in response_lower]
        missing = [kw for kw in expected_keywords if kw.lower() not in response_lower]
        
        if found:
            print(f"✅ Keywords encontradas: {found}")
        if missing:
            print(f"⚠️ Keywords não encontradas: {missing}")
        
        return len(found) > 0
        
    except Exception as e:
        print(f"❌ ERRO: {e}")
        return False


async def main():
    """Executa todos os testes"""
    print("\n" + "="*60)
    print("🦷 TESTE PONTA A PONTA - FLUXOS DO ODONTO FLOW")
    print("="*60)
    
    tests = [
        # Teste 1: Mensagem ambígua → deve perguntar
        (
            "Mensagem Ambígua - Clarificação",
            "Preciso de ajuda com implantes",
            ["evidências", "questões", "estudo", "texto acadêmico", "pesquisa", "ajuda"]
        ),
        
        # Teste 2: Saudação simples
        (
            "Saudação Natural",
            "Oi!",
            ["olá", "ajudá-lo", "pesquisa", "prática", "estudo", "escrever", "imagem"]
        ),
        
        # Teste 3: Fluxo de estudo
        (
            "Fluxo de Aprendizado",
            "Quero estudar endodontia pra prova de residência",
            ["simulado", "questões", "múltipla escolha", "tópico específico"]
        ),
        
        # Teste 4: Fluxo de pesquisa
        (
            "Fluxo de Pesquisa",
            "Preciso pesquisar artigos sobre periodontite",
            ["odonto research", "evidências", "literatura", "artigos"]
        ),
        
        # Teste 5: Fluxo de escrita
        (
            "Fluxo de Escrita Acadêmica",
            "Preciso de ajuda com meu TCC sobre ortodontia",
            ["odonto writer", "estruturar", "tcc", "artigo", "abnt"]
        ),
    ]
    
    results = []
    
    for name, message, keywords in tests:
        result = await test_flow(name, message, keywords)
        results.append((name, result))
        await asyncio.sleep(1)  # Pequeno delay entre testes
    
    # Relatório final
    print("\n" + "="*60)
    print("📊 RELATÓRIO FINAL")
    print("="*60)
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"  {status}: {name}")
    
    print(f"\n  Total: {passed}/{total} ({passed/total*100:.0f}%)")
    
    if passed == total:
        print("\n🎉 Todos os testes passaram!")
    else:
        print("\n⚠️ Alguns testes falharam - verificar respostas acima")


if __name__ == "__main__":
    asyncio.run(main())
