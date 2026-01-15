"""Agente especializado em pesquisa científica odontológica (Odonto Research)

Enhanced com:
- Ferramentas de pesquisa (PubMed, arXiv, Google Scholar)
- Formatação de citações (ABNT, APA, Vancouver)
- Síntese de literatura científica
- Análise de evidências baseadas em pesquisa
- Persistência de pesquisas no banco de dados
"""

from agno.agent import Agent
from agno.models.openai.like import OpenAILike
from dotenv import load_dotenv
from typing import Optional, Dict, Any
import os
import sys

# Load environment variables
load_dotenv()

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import research tools
from app.tools.research import RESEARCH_TOOLS
# Import citation tools
from app.tools.citation_formatter import CITATION_TOOLS
# Import persistence tools
from app.tools.artifacts_db import save_research
# Import navigation tools
from app.tools.navigation import NAVIGATION_TOOLS
# Import database config
from app.database.supabase import get_agent_config
# Import few-shot examples
from data.examples import DENTAL_QA_EXAMPLES


def create_science_agent() -> Agent:
    """
    Cria agente AGNO especializado em pesquisa científica odontológica (Odonto Research).
    
    Características:
    - Acesso a PubMed, arXiv e Google Scholar
    - Formatação de citações em múltiplos padrões
    - Síntese de literatura científica
    - Análise crítica de evidências
    - Recomendações baseadas em evidência científica
    - Capacidade de salvar pesquisas para consulta futura
    
    Returns:
        Configured Agno Agent instance
    """
    # Configure storage
    from agno.db.postgres import PostgresDb

    db_url = os.getenv("SUPABASE_DB_URL")
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    db = PostgresDb(
        session_table="agent_sessions",
        db_url=db_url
    )

    # Fetch configuration from DB
    config = get_agent_config("odonto-research")
    
    model_id = os.getenv("OPENROUTER_MODEL_QA", "google/gemma-2-27b-it:free")
    api_key = os.getenv("OPENROUTER_API_KEY")
    base_url = "https://openrouter.ai/api/v1"
    
    temperature = 0.7
    max_tokens = 4000
    
    # Só usa config do DB se for OpenRouter (evita modelos inválidos de outros providers)
    if config:
        metadata = config.get("metadata", {}) or {}
        config_base_url = metadata.get("base_url", "")
        
        # Validar se é OpenRouter antes de usar config do DB
        is_openrouter = "openrouter" in config_base_url.lower() if config_base_url else True
        
        if is_openrouter:
            if config.get("model_id"):
                model_id = config.get("model_id")
            if metadata.get("api_key"):
                api_key = metadata.get("api_key")
            if config_base_url:
                base_url = config_base_url
            
            # Aplica parâmetros de geração se existirem no DB
            if config.get("temperature") is not None:
                temperature = float(config.get("temperature"))
            if config.get("max_tokens"):
                max_tokens = int(config.get("max_tokens"))

    # Prepare few-shot examples
    additional_context = "\n\n".join([
        f"User: {msg.content}\nAssistant: " if msg.role == "user" else msg.content
        for msg in DENTAL_QA_EXAMPLES
    ])

    # Combine research tools and citation tools
    all_tools = RESEARCH_TOOLS + CITATION_TOOLS + [save_research] + NAVIGATION_TOOLS

    dr_research = Agent(
        name="odonto-research",
        model=OpenAILike(
            id=model_id,
            api_key=api_key,
            base_url=base_url,
            temperature=temperature,
            max_tokens=max_tokens
        ),
        db=db,
        add_history_to_context=True,
        num_history_messages=5,
        add_datetime_to_context=True,
        stream_events=True,

        # Descrição especializada profissional
        description="""Você é o Odonto Research, um assistente de pesquisa avançado especializado em odontologia baseada em evidências.
        Sua função é fornecer sínteses de literatura científica de alta qualidade, classificando evidências e formatando referências rigorosamente.""",

        # Instruções especializadas para pesquisa científica
        instructions=[
            # IDENTIDADE
            "Você é o **Odonto Research**, especialista em metodologia científica e prática baseada em evidências.",
            "Seu tom é OBJETIVO, ACADÊMICO e PRECISO.",
            "Evite jargões emocionais ou 'piadinhas de nerd'. Foque nos dados.",

            # PROCESSO DE PESQUISA
            "1. **Busca Ativa**: Use `search_pubmed` e `search_arxiv` para encontrar fontes primárias.",
            "2. **Hierarquia de Evidência**: Priorize Revisões Sistemáticas e Meta-análises (Nível 1) > Ensaios Clínicos (Nível 2) > Observacionais.",
            "3. **Síntese**: Não apenas liste artigos. Compare resultados, aponte consensos e divergências.",
            
            # ESTRUTURAÇÃO DE ARTEFATOS
            "Sempre que gerar uma revisão ou levantamento bibliográfico:",
            "  1. Use a ferramenta `save_research` para salvar automaticamente.",
            "  2. Obtenha o `user_id` do contexto (Additional Context).",
            "  3. Estruture o conteúdo em Markdown claro (Introdução, Metodologia de Busca, Resultados, Conclusão).",

            # CITAÇÕES
            "Todas as afirmações devem ter suporte bibliográfico.",
            "Use o formato Vancouver numérico [1], [2] para clareza no texto, ou ABNT (Autor, Ano) se solicitado.",
            "Liste Referências completas ao final.",

            # DETALHES IMPORTANTES
            "- Indique o Nível de Evidência de cada estudo principal citado.",
            "- Mencione limitações metodológicas (tamanho de amostra pequeno, viés, etc).",
            "- Se não houver evidência forte, declare 'Evidência insuficiente/inconclusiva'.",
            
            # CONTEXTO
            "Use a informação do 'Additional Context' para saber o que o usuário já visualizou.",

            # FONTES E LINKS (CRÍTICO)
            "4. **Fontes e Links**: É OBRIGATÓRIO incluir o campo `sources` na ferramenta `save_research`.",
            "   - Cada fonte deve ter `title` e `url` VÁLIDA (link real do PubMed/ArXiv/Scholar).",
            "   - NÃO invente links. Se não tiver link direto, use o link da busca ou DOI.",

            # SUGESTÕES DE PERGUNTAS (NOVO)
            "5. **Sugestões de Perguntas**: Gere 3 a 4 perguntas de follow-up relevantes sobre o tema pesquisado.",
            "   - Estas perguntas devem estimular o aprofundamento no assunto.",
            "   - OBRIGATÓRIO passar estas perguntas na lista `suggestions` da ferramenta `save_research`.",
            "   - Exemplo: ['Quais os tratamentos alternativos?', 'Qual a prevalência em idosos?', 'Existem contraindicações?']",
        ],

        # Add research and citation tools
        tools=all_tools,

        # Add few-shot examples
        additional_input=additional_context if additional_context else None,
    )

    return dr_research


# Create singleton instance
odonto_research = create_science_agent()
