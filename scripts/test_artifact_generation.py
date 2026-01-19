import asyncio
import os
import sys
import json
from dotenv import load_dotenv
import unittest.mock

# --- SETUP DE AMBIENTE ---
current_file = os.path.abspath(__file__)
base_dir = os.path.dirname(os.path.dirname(current_file))
service_dir = os.path.join(base_dir, "odonto-gpt-agno-service")
sys.path.insert(0, service_dir)

# Carregar .env.local
env_path = os.path.join(base_dir, ".env.local")
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"✅ .env carregado")

# --- MOCKS ---
# Mockar PostgresDb e Supabase Config
sys.modules["agno.db.postgres"] = unittest.mock.MagicMock()


class MockDb:
    def __init__(self, **kwargs):
        pass

    def get_session(self, **kwargs):
        return None

    def create_session(self, **kwargs):
        return "mock-session"

    def upsert_session(self, **kwargs):
        pass

    def log_message(self, **kwargs):
        pass


sys.modules["agno.db.postgres"].PostgresDb = MockDb

sys.modules["app.database.supabase"] = unittest.mock.MagicMock()
sys.modules["app.database.supabase"].get_agent_config = lambda x: {}

# Mockar a tool save_research para capturar os dados
# Vamos fazer um patch na função save_research dentro do módulo artifacts_db
# Mas como o agente importa a função, precisamos patchar onde ela é usada ou importada.
# O jeito mais fácil é usar unittest.mock.patch no agente instanciado se possível,
# mas o Agno encapsula as tools.
# Melhor estratégia: Definir uma nova tool save_research_mock e substituir na lista de tools do agente.

from app.tools.research import ask_perplexity, search_pubmed

# Precisamos da assinatura correta para o Agno aceitar como tool
from agno.tools import tool

captured_artifact = None


@tool
def save_research_mock(
    title: str,
    content: str,
    sources: list = [],
    suggestions: list = [],
    research_type: str = "literature_review",
) -> str:
    """Mock da ferramenta de salvar pesquisa para validação."""
    global captured_artifact
    print("\n💾 save_research chamado!")
    captured_artifact = {
        "title": title,
        "content_preview": content[:200] + "...",
        "content_len": len(content),
        "sources": sources,
        "suggestions": suggestions,
        "type": research_type,
    }
    # Validar fontes
    print(f"  - Título: {title}")
    print(f"  - Fontes identificadas: {len(sources)}")
    for source in sources:
        print(f"    * {source.get('title', 'No Title')}: {source.get('url', 'No URL')}")

    return "Artefato de pesquisa salvo com sucesso (MOCK)."


# Importar o agente
try:
    from app.agents.science_agent import odonto_research
except ImportError as e:
    print(f"❌ Erro import: {e}")
    sys.exit(1)

# SUBSTITUIR a tool save_research pela nossa mock
# Vamos tentar identificar a tool pelo nome da função
new_tools = []
print("Inspecionando tools do agente:")
for t in odonto_research.tools:
    # Agno tools podem ser Tool objects ou funções
    tool_name = getattr(t, "name", None)
    if not tool_name and hasattr(t, "_name"):  # Check private attr
        tool_name = t._name
    if not tool_name and hasattr(t, "__name__"):  # Check function name
        tool_name = t.__name__

    # Se for um objeto Tool do agno, o nome pode estar em .name
    # Se for Toolkit, é diferente.

    print(f"  - Tool encontrada: {tool_name} (Tipo: {type(t)})")

    if tool_name == "save_research":
        print("    -> Substituindo por mock!")
        new_tools.append(save_research_mock)
    else:
        new_tools.append(t)

odonto_research.tools = new_tools
# Recarregar toolkit se necessário (depende da versão do Agno)
# Em versões recentes, tools são processadas no .run(). Vamos torcer para funcionar.


async def run_test():
    print("\n🧪 Teste de Geração de Artefato com Perplexity Sonar")
    print("Tema: Protocolos de tratamento para Peri-implantite (2024/2025)")

    context = {"user_id": "tester"}
    question = "Gere uma pesquisa completa sobre os protocolos atuais (2024-2025) para tratamento de peri-implantite. Inclua abordagem cirúrgica vs não-cirúrgica."

    try:
        response = await odonto_research.arun(question, context=context)

        print("\n📝 Resposta Final do Agente:")
        print("-" * 50)
        # print(response.content) # Opcional, pode ser longo
        print("(Texto gerado omitido para brevidade)")
        print("-" * 50)

        if captured_artifact:
            print("\n✅ SUCESSO: Artefato capturado!")

            # Validações
            if len(captured_artifact["sources"]) > 0:
                print("✅ Fontes presentes.")
            else:
                print(
                    "⚠️ AVISO: Nenhuma fonte estruturada foi passada (o Sonar pode não ter retornado URLs claras ou o parser falhou)."
                )

            if len(captured_artifact["suggestions"]) > 0:
                print("✅ Sugestões presentes.")
            else:
                print("⚠️ AVISO: Nenhuma sugestão gerada.")

            if (
                "peri-implantite" in captured_artifact["title"].lower()
                or "periimplantite" in captured_artifact["title"].lower()
            ):
                print("✅ Título relevante.")
            else:
                print(f"⚠️ Título pode não ser ideal: {captured_artifact['title']}")

        else:
            print("\n❌ FALHA: save_research NÃO foi chamado.")
            print("Verifique se o modelo orquestrador entendeu a instrução.")

    except Exception as e:
        print(f"Erro execução: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(run_test())
