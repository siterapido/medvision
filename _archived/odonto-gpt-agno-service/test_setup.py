#!/usr/bin/env python3
"""
Script de Teste Rápido - Odonto GPT Agno Service

Verifica se a configuração está correta e testa os componentes principais.
"""

import os
import sys
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

def test_env_vars():
    """Testa se as variáveis de ambiente estão configuradas corretamente."""
    print("\n" + "="*60)
    print("1️⃣  TESTANDO VARIÁVEIS DE AMBIENTE")
    print("="*60)

    required_vars = {
        "OPENROUTER_API_KEY": "sk-or-v1-",
        "SUPABASE_DB_URL": "postgresql://",
        "SUPABASE_URL": "https://",
        "SUPABASE_ANON_KEY": None
    }

    all_ok = True
    for var, prefix in required_vars.items():
        value = os.getenv(var, "")

        # Verificar se é placeholder
        is_placeholder = any(x in value for x in ["[project]", "[password]", "your-"])

        if is_placeholder:
            print(f"  ❌ {var}: PLACEHOLDER detectado!")
            print(f"     Edite .env e substitua pelo valor real")
            all_ok = False
        elif prefix and not value.startswith(prefix):
            print(f"  ❌ {var}: Formato incorreto (deve começar com {prefix})")
            all_ok = False
        elif not value:
            print(f"  ❌ {var}: VAZIA")
            all_ok = False
        else:
            # Mostrar apenas os primeiros caracteres para segurança
            safe_value = value[:15] + "..." if len(value) > 15 else value
            print(f"  ✅ {var}: OK ({safe_value})")

    return all_ok

def test_supabase_connection():
    """Testa a conexão com o Supabase."""
    print("\n" + "="*60)
    print("2️⃣  TESTANDO CONEXÃO SUPABASE")
    print("="*60)

    try:
        from app.database.supabase import get_supabase_connection

        conn = get_supabase_connection()
        cur = conn.cursor()

        # Teste simples
        cur.execute("SELECT version()")
        version = cur.fetchone()[0]

        print(f"  ✅ Conexão OK!")
        print(f"  PostgreSQL: {version[:50]}...")

        # Verificar se pgvector está instalado
        try:
            cur.execute("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')")
            has_pgvector = cur.fetchone()[0]
            if has_pgvector:
                print(f"  ✅ pgvector extension: INSTALADA")
            else:
                print(f"  ⚠️  pgvector extension: NÃO instalada (opcional, para RAG)")
        except:
            print(f"  ⚠️  Não foi possível verificar pgvector")

        conn.close()
        return True

    except ImportError as e:
        print(f"  ❌ Erro de importação: {e}")
        return False
    except Exception as e:
        print(f"  ❌ Erro de conexão: {e}")
        print(f"     Verifique SUPABASE_DB_URL no .env")
        return False

def test_openrouter_connection():
    """Testa a conexão com o OpenRouter."""
    print("\n" + "="*60)
    print("3️⃣  TESTANDO OPENROUTER API")
    print("="*60)

    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1"
        )

        # Teste simples com poucos tokens
        response = client.chat.completions.create(
            model=os.getenv("OPENROUTER_MODEL_QA", "openai/gpt-4o-mini"),
            messages=[{"role": "user", "content": "Responda apenas: OK"}],
            max_tokens=5
        )

        result = response.choices[0].message.content
        print(f"  ✅ OpenRouter API: OK")
        print(f"  Modelo: {os.getenv('OPENROUTER_MODEL_QA', 'openai/gpt-4o-mini')}")
        print(f"  Resposta: {result}")

        return True

    except ImportError as e:
        print(f"  ❌ Erro de importação: {e}")
        return False
    except Exception as e:
        print(f"  ❌ Erro na API: {e}")
        print(f"     Verifique OPENROUTER_API_KEY no .env")
        return False

def test_research_tools():
    """Testa as ferramentas de pesquisa."""
    print("\n" + "="*60)
    print("4️⃣  TESTANDO FERRAMENTAS DE PESQUISA")
    print("="*60)

    try:
        from app.tools.research import search_pubmed

        print("  Testando PubMed search...")
        result = search_pubmed("dental", max_results=1)

        if "PubMed" in result or "dental" in result.lower():
            print(f"  ✅ PubMed search: OK")
            return True
        else:
            print(f"  ⚠️  PubMed search: Resultado inesperado")
            return False

    except ImportError as e:
        print(f"  ❌ Erro de importação: {e}")
        print(f"     Execute: pip install arxiv pymed")
        return False
    except Exception as e:
        print(f"  ❌ Erro: {e}")
        return False

def test_knowledge_base():
    """Testa o knowledge base (RAG)."""
    print("\n" + "="*60)
    print("5️⃣  TESTANDO KNOWLEDGE BASE (RAG)")
    print("="*60)

    try:
        from app.tools.knowledge import search_knowledge_base

        print("  Testando busca de conhecimento...")
        results = search_knowledge_base(
            query="dente",
            match_count=3,
            search_type="text"  # Usa full-text que funciona sem pgvector
        )

        print(f"  ✅ Busca RAG: OK ({len(results)} resultados)")

        if results:
            print(f"  Primeiro resultado: {results[0].get('title', 'N/A')}")

        return True

    except Exception as e:
        print(f"  ⚠️  Knowledge base: {e}")
        print(f"     Isso é normal se ainda não populou a KB")
        print(f"     Execute: python scripts/populate_knowledge.py")
        return False

def main():
    """Executa todos os testes."""
    print("\n" + "🧪"*30)
    print("  TESTE DE CONFIGURAÇÃO - ODONTO GPT AGNO")
    print("🧪"*30)

    results = {
        "Variáveis de Ambiente": test_env_vars(),
        "Conexão Supabase": test_supabase_connection(),
        "OpenRouter API": test_openrouter_connection(),
        "Ferramentas de Pesquisa": test_research_tools(),
        "Knowledge Base": test_knowledge_base(),
    }

    # Resumo final
    print("\n" + "="*60)
    print("📊 RESUMO DOS TESTES")
    print("="*60)

    passed = sum(results.values())
    total = len(results)

    for test, result in results.items():
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"  {status}: {test}")

    print(f"\n  Total: {passed}/{total} testes passaram")

    if passed == total:
        print("\n  🎉 PARABÉNS! Sistema configurado corretamente!")
        print("\n  Próximos passos:")
        print("  1. Popular Knowledge Base: python scripts/populate_knowledge.py")
        print("  2. Iniciar Playground: python playground_agentos.py")
        print("  3. Acessar: http://localhost:7777")
        print("\n" + "="*60)
        return 0
    else:
        print("\n  ⚠️  Alguns testes falharam.")
        print("\n  Ações necessárias:")
        if not results["Variáveis de Ambiente"]:
            print("  1. Edite 'odonto-gpt-agno-service/.env'")
            print("  2. Substitua os placeholders pelos valores reais")
            print("  3. Consulte 'SETUP_CHECKLIST.md' para detalhes")

        if not results["Conexão Supabase"]:
            print("  4. Verifique SUPABASE_DB_URL no .env")
            print("  5. Confirme que o projeto Supabase está ativo")

        if not results["OpenRouter API"]:
            print("  6. Verifique OPENROUTER_API_KEY no .env")
            print("  7. Confirme que a chave começa com 'sk-or-v1-'")

        if not results["Ferramentas de Pesquisa"]:
            print("  8. Execute: pip install arxiv pymed")

        print("\n" + "="*60)
        return 1

if __name__ == "__main__":
    sys.exit(main())
