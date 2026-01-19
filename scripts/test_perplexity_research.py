import asyncio
import os
import sys
from dotenv import load_dotenv

# Determinar caminhos absolutos
current_file = os.path.abspath(__file__)
base_dir = os.path.dirname(os.path.dirname(current_file))  # Raiz do projeto
service_dir = os.path.join(base_dir, "odonto-gpt-agno-service")
env_path = os.path.join(service_dir, ".env")

# Carregar .env explicitamente
possible_envs = [
    os.path.join(service_dir, ".env"),
    os.path.join(base_dir, ".env.local"),
    os.path.join(base_dir, ".env"),
]

env_loaded = False
for path in possible_envs:
    if os.path.exists(path):
        load_dotenv(path)
        print(f"✅ .env carregado de {path}")
        env_loaded = True
        break

if not env_loaded:
    print(f"⚠️ AVISO: Nenhum arquivo .env encontrado. Procurado em: {possible_envs}")

# Verificar variáveis críticas
db_url = os.getenv("SUPABASE_DB_URL")
if not db_url:
    print("❌ ERRO: SUPABASE_DB_URL não definida no ambiente")
    # Não sair ainda, deixar o import falhar se for o caso

# Adicionar service_dir ao sys.path para importação correta
sys.path.insert(0, service_dir)

# --- MOCK DA DATABASE ---
# Mockar PostgresDb para não precisar de conexão real com banco durante teste de LLM
import unittest.mock
import sys


# Criar classe mock
class MockDb:
    def __init__(self, **kwargs):
        pass

    def get_agent_sessions(self, **kwargs):
        return []

    def create_session(self, **kwargs):
        return "mock-session-id"

    def read_session(self, **kwargs):
        return None

    def upsert_session(self, **kwargs):
        pass

    def log_message(self, **kwargs):
        pass


# Patch no módulo agno.db.postgres (precisa ser feito antes de importar o agente)
# Como não sabemos onde PostgresDb é importado exatamente dentro do agno,
# vamos tentar fazer patch no sys.modules se já carregado, ou mockar o import
sys.modules["agno.db.postgres"] = unittest.mock.MagicMock()
sys.modules["agno.db.postgres"].PostgresDb = MockDb

# Mockar também o get_agent_config do supabase
sys.modules["app.database.supabase"] = unittest.mock.MagicMock()
sys.modules["app.database.supabase"].get_agent_config = lambda x: {}

# Importar agente
try:
    # Recarregar módulo se já tiver sido importado
    if "app.agents.science_agent" in sys.modules:
        del sys.modules["app.agents.science_agent"]

    from app.agents.science_agent import odonto_research

    print("✅ Agente odonto-research importado com sucesso (DB Mockado)")
except ImportError as e:
    print(f"❌ Erro ao importar agente: {e}")
    # Tentar debug detalhado
    import traceback

    traceback.print_exc()
    sys.exit(1)


async def test_agent():
    print("\n🧪 Iniciando teste de pesquisa com Perplexity...")

    # Mock user_id no contexto
    context = {"user_id": "test-user-123"}

    # Pergunta que exige conhecimento recente (prova de online search)
    question = "Quais as principais atualizações nos guidelines de periodontia de 2024/2025? Cite as fontes."

    print(f"❓ Pergunta: {question}")
    print("⏳ Aguardando resposta (isso pode levar alguns segundos)...")

    try:
        response = await odonto_research.arun(question, context=context)

        print("\n✅ Resposta recebida:")
        print("-" * 50)
        content = response.content or ""
        print(content[:500] + "..." if len(content) > 500 else content)
        print("-" * 50)

        # Verificar tool calls
        if hasattr(response, "tool_calls") and response.tool_calls:
            print(f"\n🛠️ Tool calls detectadas: {len(response.tool_calls)}")
            for tool in response.tool_calls:
                # Adaptação para diferentes estruturas de tool_call dependendo da versão do Agno
                tool_name = getattr(tool, "function", tool).name
                tool_args = getattr(tool, "function", tool).arguments

                print(f"  - Tool: {tool_name}")
                # print(f"  - Args: {tool_args}") # Comentado para não poluir log

                if tool_name == "save_research":
                    print("  ✅ save_research foi chamado!")
        else:
            print(
                "\n⚠️ Nenhuma tool call detectada (o agente deveria salvar a pesquisa)."
            )

    except Exception as e:
        print(f"\n❌ Erro durante execução: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_agent())
