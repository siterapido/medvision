"""Equipe multi-agente para tarefas educacionais odontológicas coordenadas

Agentes especializados:
- Dr. Ciência: Pesquisa científica e literatura
- Prof. Estudo: Questões, simulados e avaliação
- Dr. Redator: Escrita acadêmica (TCCs, artigos)
- Dental Image Agent: Análise de imagens (mantido do original)
"""

from agno import Team
from agno.models.openai import OpenAIChat
from .image_agent import odonto_vision
from .science_agent import odonto_research
from .study_agent import odonto_practice
from .writer_agent import odonto_write
from typing import List, Dict, Any, Optional
import os


def create_dental_education_team() -> Team:
    """
    Cria equipe multi-agente para educação odontológica coordenada.
    
    Returns:
        Configured Agno Team instance
    """
    
    # Configure storage
    from agno.storage.agent.postgres import PostgresAgentStorage
    
    db_url = os.getenv("SUPABASE_DB_URL")
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    storage = PostgresAgentStorage(
        table_name="team_sessions",
        db_url=db_url
    )

    odonto_flow = Team(
        name="odonto_flow",
        agents=[odonto_research, odonto_practice, odonto_write, odonto_vision],
        storage=storage,
        instructions=[
            "Você é o Odonto Flow, a central inteligente que entende a necessidade do usuário e ativa o módulo certo automaticamente dentro da Odonto Suite.",
            "Coordene efetivamente para fornecer insights educacionais abrangentes em odontologia",
            "Compartilhe contexto relevante entre agentes quando benéfico",
            "Priorize segurança do paciente e padrões profissionais",
            "Garanta que todas as respostas incluam disclaimers apropriados",
            
            # Especialização dos módulos
            "Odonto Research: Especialista em pesquisa científica, PubMed, arXiv, citações",
            "Odonto Practice: Especialista em questões, simulados, avaliação educacional",
            "Odonto Write: Especialista em TCCs, artigos científicos, escrita acadêmica",
            "Odonto Vision: Especialista em análise de imagens, radiografias",
            
            # Coordenação
            "Quando questão requer múltiplos módulos, trabalhe sequencialmente:",
            "  Exemplo 1: TCC com pesquisa → Odonto Research busca literatura → Odonto Write estrutura TCC",
            "  Exemplo 2: Questão com imagem → Odonto Vision analisa → Odonto Practice cria questão baseada",
            "  Exemplo 3: Artigo científico → Odonto Research revisa evidências → Odonto Write formata IMRAD",
            
            "Evite informações redundantes nas respostas da equipe",
            "Cada módulo deve focar em sua especialidade",
        ],
        process="sequential",  # Agentes trabalham em sequência
        model=OpenAIChat(
            id=os.getenv("OPENROUTER_MODEL_QA", "google/gemma-2-27b-it:free"),
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        ),
        description="Odonto Flow: Central inteligente que entende a necessidade do usuário e ativa o módulo certo automaticamente."
    )

    return odonto_flow


# Create singleton instance
odonto_flow = create_dental_education_team()


def rotear_para_agente_apropriado(
    mensagem_usuario: str,
    tem_imagem: bool = False,
    contexto: Optional[Dict[str, Any]] = None
) -> str:
    """
    Roteia requisição para agente apropriado baseado no conteúdo.
    
    Args:
        mensagem_usuario: Mensagem do usuário
        tem_imagem: Se há imagem anexada
        contexto: Contexto adicional (opcional)
    
    Returns:
        Tipo de agente: 'ciencia', 'estudo', 'redator', 'imagem', ou 'equipe'
    """
    mensagem_lower = mensagem_usuario.lower()
    
    # Keywords por agente
    keywords_ciencia = [
        'pesquisar', 'pesquisa', 'artigos', 'artigo', 'evidências', 'evidência',
        'pubmed', 'estudos', 'estudo', 'literatura', 'científico', 'científica',
        'revisão sistemática', 'meta-análise', 'rct', 'ensaio clínico',
        'referências', 'citação', 'citar', 'fonte', 'fontes'
    ]
    
    keywords_estudo = [
        'questão', 'questões', 'simulado', 'simulados', 'prova', 'teste',
        'exercício', 'exercícios', 'avaliar', 'avaliação', 'gabarito',
        'enade', 'residência', 'concurso', 'múltipla escolha', 'dissertativa'
    ]
    
    keywords_redator = [
        'tcc', 'monografia', 'artigo científico', 'paper', 'escrever',
        'escrita', 'metodologia', 'imrad', 'abstract', 'resumo',
        'introdução', 'discussão', 'conclusão', 'revisão de literatura',
        'revisar texto', 'corrigir', 'formatação', 'abnt', 'vancouver', 'apa'
    ]
    
    keywords_imagem = [
        'imagem', 'radiografia', 'raio-x', 'raio x', 'rx', 'foto',
        'analisar imagem', 'interpretar', 'diagnóstico por imagem'
    ]
    
    # Count matches
    matches_ciencia = sum(1 for kw in keywords_ciencia if kw in mensagem_lower)
    matches_estudo = sum(1 for kw in keywords_estudo if kw in mensagem_lower)
    matches_redator = sum(1 for kw in keywords_redator if kw in mensagem_lower)
    matches_imagem = sum(1 for kw in keywords_imagem if kw in mensagem_lower)
    
    # Imagem tem prioridade se presente
    if tem_imagem or matches_imagem > 0:
        # Se também menciona outros agentes, usar equipe
        if matches_ciencia > 0 or matches_estudo > 0:
            return 'equipe'
        return 'imagem'
    
    # Se múltiplos agentes têm alto match, usar equipe
    high_matches = sum([
        matches_ciencia >= 2,
        matches_estudo >= 2,
        matches_redator >= 2
    ])
    
    if high_matches >= 2:
        return 'equipe'
    
    # Roteamento por maior número de matches
    max_matches = max(matches_ciencia, matches_estudo, matches_redator)
    
    if max_matches == 0:
        # Default: Dr. Ciência para questões gerais
        return 'ciencia'
    
    if matches_ciencia == max_matches:
        return 'ciencia'
    elif matches_estudo == max_matches:
        return 'estudo'
    elif matches_redator == max_matches:
        return 'redator'
    else:
        return 'ciencia'  # fallback


async def executar_agente(
    tipo_agente: str,
    mensagem: str,
    contexto: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Executa agente ou equipe apropriado baseado no tipo.
    
    Args:
        tipo_agente: Tipo de agente ('ciencia', 'estudo', 'redator', 'imagem', 'equipe')
        mensagem: Mensagem do usuário
        contexto: Contexto adicional (imagem URL, session ID, etc.)
    
    Returns:
        Resposta do agente
    """
    try:
        if tipo_agente == 'imagem':
            # Image analysis agent
            response = await odonto_vision.run(
                mensagem,
                context=contexto or {}
            )
            return {
                'response': response.response,
                'agent': 'odonto-vision',
                'tool_calls': response.tool_calls if hasattr(response, 'tool_calls') else []
            }

        elif tipo_agente == 'ciencia':
            # Odonto Research - Scientific research
            response = await odonto_research.run(
                mensagem,
                context=contexto or {}
            )
            return {
                'response': response.response,
                'agent': 'odonto-research',
                'sources': response.sources if hasattr(response, 'sources') else []
            }

        elif tipo_agente == 'estudo':
            # Odonto Practice - Questions and exams
            response = await odonto_practice.run(
                mensagem,
                context=contexto or {}
            )
            return {
                'response': response.response,
                'agent': 'odonto-practice',
                'metadata': response.metadata if hasattr(response, 'metadata') else {}
            }

        elif tipo_agente == 'redator':
            # Odonto Write - Academic writing
            response = await odonto_write.run(
                mensagem,
                context=contexto or {}
            )
            return {
                'response': response.response,
                'agent': 'odonto-write',
                'metadata': response.metadata if hasattr(response, 'metadata') else {}
            }

        elif tipo_agente == 'equipe':
            # Multi-agent team
            response = await odonto_flow.run(
                mensagem,
                context=contexto or {}
            )
            return {
                'response': response.response,
                'agent': 'odonto-flow',
                'participants': response.participants if hasattr(response, 'participants') else []
            }

        else:
            raise ValueError(f"Tipo de agente desconhecido: {tipo_agente}")

    except Exception as e:
        raise Exception(f"Execução do agente falhou: {str(e)}")

