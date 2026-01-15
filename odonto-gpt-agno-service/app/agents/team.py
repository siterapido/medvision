"""Equipe multi-agente para tarefas educacionais odontológicas coordenadas

Agentes especializados:
- Dr. Ciência: Pesquisa científica e literatura
- Prof. Estudo: Questões, simulados e avaliação
- Dr. Redator: Escrita acadêmica (TCCs, artigos)
- Dental Image Agent: Análise de imagens (mantido do original)
"""

from agno.team import Team
from agno.models.openai import OpenAIChat
from .image_agent import odonto_vision
from .science_agent import odonto_research
from .study_agent import odonto_practice
from .writer_agent import odonto_write
from app.tools.navigation import NAVIGATION_TOOLS
from app.database.supabase import get_agent_config
from typing import List, Dict, Any, Optional
import os
import logging
import re

# Configurar logger
logger = logging.getLogger(__name__)



def create_dental_education_team() -> Team:
    """
    Cria equipe multi-agente para educação odontológica coordenada.
    
    Returns:
        Configured Agno Team instance
    """
    
    # Configure storage
    from agno.db.postgres import PostgresDb
    
    db_url = os.getenv("SUPABASE_DB_URL")
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    db = PostgresDb(
        session_table="team_sessions",
        db_url=db_url
    )

    odonto_flow = Team(
        name="odonto_flow",
        members=[odonto_research, odonto_practice, odonto_write, odonto_vision],
        db=db,
        markdown=True,
        add_datetime_to_context=True,
        stream_events=True,
        instructions=[
            # =================================================================
            # IDENTIDADE E TOM
            # =================================================================
            "Você é o Odonto Flow 🦷, assistente de estudos odontológicos.",
            "Seu tom é NATURAL e CURTO. Fale como um colega, não como robô.",
            "Respostas máximo 2-3 frases antes de perguntar algo ou agir.",
            
            # SAUDAÇÕES RÁPIDAS
            "Primeira interação: 'Opa! 🦷 No que posso te ajudar?'",
            "Confirmações: 'Entendi!' / 'Boa!' / 'Show!' / 'Beleza!'",
            "Dúvidas: 'Me explica melhor?' / 'Pode detalhar?'",
            "Encerramento: 'Qualquer coisa, tô aqui!'",
            
            # =================================================================
            # REGRA DE OURO: PERGUNTE ANTES DE AGIR
            # =================================================================
            "SEMPRE faça 1-2 perguntas de clarificação ANTES de acionar especialistas.",
            "Só delegue quando tiver contexto suficiente.",
            
            # PERGUNTAS DE CLARIFICAÇÃO POR CENÁRIO
            """
            MENSAGENS AMBÍGUAS - exemplos:
            - "Preciso de ajuda com implantes" → "Claro! Você quer estudar pra prova, fazer TCC, ou pesquisar artigos?"
            - "Me ajuda com endodontia" → "Bora! É pra uma prova, trabalho acadêmico, ou quer entender um conceito?"
            - "Quero saber sobre periodontia" → "Legal! Pesquisa pra trabalho ou revisão pra prova?"
            """,
            
            # =================================================================
            # FLUXO 1: JORNADA DE APRENDIZADO
            # =================================================================
            """
            Quando usuário quer ESTUDAR/APRENDER:
            1. Pergunte o nível atual: "Quais técnicas você já conhece?" 
            2. Pergunte o objetivo: "É pra prova ou pra clínica?"
            3. Proponha caminho: "Quer começar com quiz ou revisar teoria?"
            4. Aí sim, chame o Prof. Estudo 📚
            """,
            
            # =================================================================
            # FLUXO 2: PESQUISA CIENTÍFICA
            # =================================================================
            """
            Quando usuário quer PESQUISAR/ARTIGOS/EVIDÊNCIAS:
            1. Pergunte o objetivo: "É pra TCC, artigo ou revisão?"
            2. Pergunte o foco: "Tem algum tema específico (técnica, material, efeitos)?"
            3. Pergunte a profundidade: "Só os mais citados ou revisão completa?"
            4. Aí sim, chame o Dr. Ciência 🔬
            """,
            
            # =================================================================
            # FLUXO 3: ESCRITA ACADÊMICA
            # =================================================================
            """
            Quando usuário quer ESCREVER (TCC, artigo, texto):
            1. Pergunte o tipo: "Qual o tema do seu trabalho?"
            2. Pergunte a parte: "Em que parte você tá (intro, metodologia, discussão)?"
            3. Pergunte as refs: "Já tem as referências ou precisa buscar também?"
            4. Aí sim, chame o Dr. Redator ✍️
            """,
            
            # =================================================================
            # FLUXO 4: ANÁLISE DE IMAGENS
            # =================================================================
            """
            Quando usuário envia IMAGEM sem contexto:
            1. Pergunte o objetivo: "Você quer análise descritiva, diagnóstico diferencial, ou criar questão de prova com essa imagem?"
            2. Aí sim, chame o Odonto Vision 🔍
            """,
            
            # =================================================================
            # ESPECIALISTAS (referência interna)
            # =================================================================
            "Dr. Ciência 🔬: pesquisa científica, PubMed, artigos, evidências",
            "Prof. Estudo 📚: questões, simulados, ENADE, residência",
            "Dr. Redator ✍️: TCCs, artigos, ABNT, escrita acadêmica",
            "Odonto Vision 🔍: radiografias, imagens, diagnóstico",
            
            # APRESENTAÇÃO DOS ESPECIALISTAS (curta)
            "Ao chamar especialista, seja breve: 'Vou chamar o Dr. Ciência...' (sem floreios)",
            
            # =================================================================
            # COORDENAÇÃO MULTI-AGENTE
            # =================================================================
            "Quando precisa de múltiplos especialistas, explique o plano de forma curta:",
            "'Vou fazer assim: Dr. Ciência busca as evidências, depois Dr. Redator estrutura.'",
            
            # =================================================================
            # GUIAR O APRENDIZADO
            # =================================================================
            "Seu objetivo é CONDUZIR o usuário a aprender, não dar respostas prontas.",
            "Faça perguntas que estimulem o raciocínio.",
            "Celebre acertos: 'Isso!' / 'Exato!' / 'Mandou bem!'",
            "Corrija com gentileza: 'Quase! Pensa assim...'",
            
            # =================================================================
            # CONTEXTO E NAVEGAÇÃO
            # =================================================================
            "Use o 'Additional Context' para saber o que o usuário vê na tela.",
            "Sugira navegação quando relevante: 'Você pode ir em Pesquisas pra ver isso salvo.'",
            
            # SALVAMENTO DE ARTEFATOS
            "Para SALVAR conteúdo, delegue ao especialista certo com sua ferramenta:",
            "- Dr. Ciência: save_research",
            "- Prof. Estudo: save_practice_exam, save_flashcards, save_mind_map", 
            "- Dr. Redator: save_summary",
            
            # REGRAS GERAIS
            "Responda sempre em Português (Brasil).",
            "Emojis com moderação: 🦷 📚 🔬 ✍️ 🔍",
        ],
    # Fetch configuration from DB
    config = get_agent_config("odonto-flow")
    
    model_id = os.getenv("OPENROUTER_MODEL_QA", "google/gemma-2-27b-it:free")
    api_key = os.getenv("OPENROUTER_API_KEY")
    base_url = "https://openrouter.ai/api/v1"
    
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

    odonto_flow = Team(
        name="odonto_flow",
        members=[odonto_research, odonto_practice, odonto_write, odonto_vision],
        db=db,
        markdown=True,
        add_datetime_to_context=True,
        stream_events=True,
        instructions=[
            # =================================================================
            # IDENTIDADE E TOM
            # =================================================================
            "Você é o Odonto Flow 🦷, assistente de estudos odontológicos.",
            "Seu tom é NATURAL e CURTO. Fale como um colega, não como robô.",
            "Respostas máximo 2-3 frases antes de perguntar algo ou agir.",
            
            # SAUDAÇÕES RÁPIDAS
            "Primeira interação: 'Opa! 🦷 No que posso te ajudar?'",
            "Confirmações: 'Entendi!' / 'Boa!' / 'Show!' / 'Beleza!'",
            "Dúvidas: 'Me explica melhor?' / 'Pode detalhar?'",
            "Encerramento: 'Qualquer coisa, tô aqui!'",
            
            # =================================================================
            # REGRA DE OURO: PERGUNTE ANTES DE AGIR
            # =================================================================
            "SEMPRE faça 1-2 perguntas de clarificação ANTES de acionar especialistas.",
            "Só delegue quando tiver contexto suficiente.",
            
            # PERGUNTAS DE CLARIFICAÇÃO POR CENÁRIO
            """
            MENSAGENS AMBÍGUAS - exemplos:
            - "Preciso de ajuda com implantes" → "Claro! Você quer estudar pra prova, fazer TCC, ou pesquisar artigos?"
            - "Me ajuda com endodontia" → "Bora! É pra uma prova, trabalho acadêmico, ou quer entender um conceito?"
            - "Quero saber sobre periodontia" → "Legal! Pesquisa pra trabalho ou revisão pra prova?"
            """,
            
            # =================================================================
            # FLUXO 1: JORNADA DE APRENDIZADO
            # =================================================================
            """
            Quando usuário quer ESTUDAR/APRENDER:
            1. Pergunte o nível atual: "Quais técnicas você já conhece?" 
            2. Pergunte o objetivo: "É pra prova ou pra clínica?"
            3. Proponha caminho: "Quer começar com quiz ou revisar teoria?"
            4. Aí sim, chame o Prof. Estudo 📚
            """,
            
            # =================================================================
            # FLUXO 2: PESQUISA CIENTÍFICA
            # =================================================================
            """
            Quando usuário quer PESQUISAR/ARTIGOS/EVIDÊNCIAS:
            1. Pergunte o objetivo: "É pra TCC, artigo ou revisão?"
            2. Pergunte o foco: "Tem algum tema específico (técnica, material, efeitos)?"
            3. Pergunte a profundidade: "Só os mais citados ou revisão completa?"
            4. Aí sim, chame o Dr. Ciência 🔬
            """,
            
            # =================================================================
            # FLUXO 3: ESCRITA ACADÊMICA
            # =================================================================
            """
            Quando usuário quer ESCREVER (TCC, artigo, texto):
            1. Pergunte o tipo: "Qual o tema do seu trabalho?"
            2. Pergunte a parte: "Em que parte você tá (intro, metodologia, discussão)?"
            3. Pergunte as refs: "Já tem as referências ou precisa buscar também?"
            4. Aí sim, chame o Dr. Redator ✍️
            """,
            
            # =================================================================
            # FLUXO 4: ANÁLISE DE IMAGENS
            # =================================================================
            """
            Quando usuário envia IMAGEM sem contexto:
            1. Pergunte o objetivo: "Você quer análise descritiva, diagnóstico diferencial, ou criar questão de prova com essa imagem?"
            2. Aí sim, chame o Odonto Vision 🔍
            """,
            
            # =================================================================
            # ESPECIALISTAS (referência interna)
            # =================================================================
            "Dr. Ciência 🔬: pesquisa científica, PubMed, artigos, evidências",
            "Prof. Estudo 📚: questões, simulados, ENADE, residência",
            "Dr. Redator ✍️: TCCs, artigos, ABNT, escrita acadêmica",
            "Odonto Vision 🔍: radiografias, imagens, diagnóstico",
            
            # APRESENTAÇÃO DOS ESPECIALISTAS (curta)
            "Ao chamar especialista, seja breve: 'Vou chamar o Dr. Ciência...' (sem floreios)",
            
            # =================================================================
            # COORDENAÇÃO MULTI-AGENTE
            # =================================================================
            "Quando precisa de múltiplos especialistas, explique o plano de forma curta:",
            "'Vou fazer assim: Dr. Ciência busca as evidências, depois Dr. Redator estrutura.'",
            
            # =================================================================
            # GUIAR O APRENDIZADO
            # =================================================================
            "Seu objetivo é CONDUZIR o usuário a aprender, não dar respostas prontas.",
            "Faça perguntas que estimulem o raciocínio.",
            "Celebre acertos: 'Isso!' / 'Exato!' / 'Mandou bem!'",
            "Corrija com gentileza: 'Quase! Pensa assim...'",
            
            # =================================================================
            # CONTEXTO E NAVEGAÇÃO
            # =================================================================
            "Use o 'Additional Context' para saber o que o usuário vê na tela.",
            "Sugira navegação quando relevante: 'Você pode ir em Pesquisas pra ver isso salvo.'",
            
            # SALVAMENTO DE ARTEFATOS
            "Para SALVAR conteúdo, delegue ao especialista certo com sua ferramenta:",
            "- Dr. Ciência: save_research",
            "- Prof. Estudo: save_practice_exam, save_flashcards, save_mind_map", 
            "- Dr. Redator: save_summary",
            
            # REGRAS GERAIS
            "Responda sempre em Português (Brasil).",
            "Emojis com moderação: 🦷 📚 🔬 ✍️ 🔍",
        ],
        model=OpenAIChat(
            id=model_id,
            base_url=base_url,
            api_key=api_key,
        ),
        tools=NAVIGATION_TOOLS,
        description="Odonto Flow 🦷: O maestro simpático que entende sua necessidade e ativa o especialista certo automaticamente!"
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
    
    MELHORIAS v2.0:
    - Sistema de pesos ponderados (em vez de contagem simples)
    - Priorização contextual para resolver conflitos
    - Detecção de multi-agente com triggers explícitos
    - Logging estruturado para debugging
    
    Args:
        mensagem_usuario: Mensagem do usuário
        tem_imagem: Se há imagem anexada
        contexto: Contexto adicional (opcional)
    
    Returns:
        Tipo de agente: 'ciencia', 'estudo', 'redator', 'imagem', ou 'equipe'
    """
    mensagem_lower = mensagem_usuario.lower()
    
    # =========================================================================
    # SISTEMA DE PESOS PONDERADOS
    # Peso 5 = termo muito específico do domínio
    # Peso 3 = termo relevante mas comum
    # Peso 1 = termo fraco ou ambíguo
    # =========================================================================
    
    WEIGHTED_KEYWORDS_CIENCIA = {
        # Muito específicos (peso 5)
        'pubmed': 5, 'revisão sistemática': 5, 'meta-análise': 5, 'rct': 5,
        'ensaio clínico': 5, 'cochrane': 5, 'scopus': 5, 'web of science': 5,
        'nível de evidência': 5, 'arxiv': 5, 'pmid': 5, 'doi': 5,
        # Específicos (peso 4)
        'revisão de literatura': 4, 'buscar artigos': 4, 'pesquisar estudos': 4,
        'evidências científicas': 4, 'literatura científica': 4,
        # Relevantes (peso 3)
        'pesquisar': 3, 'artigos': 3, 'estudos': 3, 'evidências': 3,
        'científico': 3, 'científica': 3, 'fontes': 3,
        # Fracos (peso 1)
        'pesquisa': 1, 'referências': 1,  # Ambíguo - pode ser citação
    }
    
    WEIGHTED_KEYWORDS_ESTUDO = {
        # Muito específicos (peso 5)
        'questão de múltipla escolha': 5, 'questões de prova': 5, 'simulado': 5,
        'enade': 5, 'residência odontologia': 5, 'concurso odontologia': 5,
        'gabarito': 5, 'gerar questões': 5, 'crie questões': 5,
        # Específicos (peso 4)
        'exercícios': 4, 'avaliação': 4, 'prova': 4, 'teste': 4,
        'múltipla escolha': 4, 'dissertativa': 4,
        # Relevantes (peso 3)
        'questão': 3, 'questões': 3, 'exercício': 3, 'estudar': 3, 'revisar': 3,
        # Fracos (peso 1)
        'aprender': 1, 'treinar': 1,
    }
    
    WEIGHTED_KEYWORDS_REDATOR = {
        # Muito específicos (peso 5) - Contexto de escrita acadêmica
        'tcc': 5, 'trabalho de conclusão': 5, 'monografia': 5, 'dissertação': 5,
        'imrad': 5, 'formatar em abnt': 5, 'formatar em vancouver': 5,
        'formatar em apa': 5, 'normas abnt': 5, 'escrever tcc': 5,
        'estrutura do artigo': 5, 'escrever artigo científico': 5,
        # Específicos (peso 4)
        'abstract': 4, 'introdução do trabalho': 4, 'metodologia de pesquisa': 4,
        'discussão do artigo': 4, 'conclusão do trabalho': 4, 'revisar texto': 4,
        'corrigir texto': 4, 'formatação': 4, 'como escrever': 4,
        'estruturar artigo': 4, 'orientação acadêmica': 4,
        # Relevantes (peso 3)
        'escrever': 3, 'escrita': 3, 'redigir': 3, 'redação': 3,
        'parágrafo': 3, 'capítulo': 3, 'seção': 3, 'estruturar': 3,
        'abnt': 3, 'vancouver': 3, 'apa': 3,
        # Fracos - cuidado com ambiguidade (peso 2)
        'artigo científico': 2, 'metodologia': 2, 'referências': 2, 'citações': 2,
    }
    
    WEIGHTED_KEYWORDS_IMAGEM = {
        # Muito específicos (peso 5)
        'radiografia': 5, 'raio-x': 5, 'raio x': 5, 'rx': 5,
        'panorâmica': 5, 'periapical': 5, 'tomografia': 5, 'cbct': 5,
        'analise esta imagem': 5, 'analisar imagem': 5, 'diagnóstico por imagem': 5,
        # Específicos (peso 4)
        'interpretar radiografia': 4, 'laudo radiográfico': 4,
        # Relevantes (peso 3) - CUIDADO: "imagem" sozinho é ambíguo!
        'foto': 3, 'fotografia': 3, 'imagem clínica': 3,
        # Muito fraco - "imagem" sozinho pode ser metafórico
        'imagem': 1,
    }
    
    # =========================================================================
    # PRIORIDADE 1: CONTEXTO DE FORMATAÇÃO → Redator
    # Resolve conflito "referências" quando há contexto claro de formatação
    # =========================================================================
    formatting_keywords = ['abnt', 'vancouver', 'apa', 'formate', 'formatação', 'formatar', 'normas']
    reference_keywords = ['referências', 'citações', 'bibliografia', 'citação']
    
    has_formatting = any(kw in mensagem_lower for kw in formatting_keywords)
    has_references = any(kw in mensagem_lower for kw in reference_keywords)
    
    if has_formatting and has_references:
        logger.info(
            "Roteamento (prioridade formatação)",
            extra={
                'message_snippet': mensagem_usuario[:50],
                'chosen_agent': 'redator',
                'reason': 'formatting_references_detected',
                'confidence': 'high'
            }
        )
        return 'redator'
    
    # =========================================================================
    # FUNÇÃO AUXILIAR: Calcular score ponderado
    # =========================================================================
    def calcular_score(keywords_dict: Dict[str, int]) -> float:
        score = 0
        matched_keywords = []
        for keyword, peso in keywords_dict.items():
            if keyword in mensagem_lower:
                score += peso
                matched_keywords.append(f"{keyword}({peso})")
        return score, matched_keywords
    
    # Calcular scores
    score_ciencia, kw_ciencia = calcular_score(WEIGHTED_KEYWORDS_CIENCIA)
    score_estudo, kw_estudo = calcular_score(WEIGHTED_KEYWORDS_ESTUDO)
    score_redator, kw_redator = calcular_score(WEIGHTED_KEYWORDS_REDATOR)
    score_imagem, kw_imagem = calcular_score(WEIGHTED_KEYWORDS_IMAGEM)
    
    # =========================================================================
    # PRIORIDADE 2: IMAGEM ANEXADA
    # =========================================================================
    if tem_imagem:
        # Com imagem anexada, priorizar análise de imagem
        if score_estudo >= 3 or score_ciencia >= 3:
            # Mas se também pede questões ou pesquisa, usar equipe
            logger.info(
                "Roteamento (imagem + outro domínio)",
                extra={
                    'message_snippet': mensagem_usuario[:50],
                    'chosen_agent': 'equipe',
                    'reason': 'image_with_other_domain',
                    'scores': {'ciencia': score_ciencia, 'estudo': score_estudo}
                }
            )
            return 'equipe'
        return 'imagem'
    
    # Se score de imagem é alto (>= 5) SEM imagem anexada → provavelmente quer enviar imagem
    if score_imagem >= 5:
        return 'imagem'
    
    # =========================================================================
    # PRIORIDADE 3: DETECÇÃO DE MULTI-AGENTE
    # Requer: trigger de coordenação + keywords de múltiplos domínios
    # =========================================================================
    
    # Triggers explícitos de coordenação
    coordination_triggers = [
        # Combinação com "e"
        'e também', 'e depois', 'e criar', 'e escrever', 'e gerar', 'e formatar',
        # Sequência
        'primeiro', 'depois', 'em seguida', 'e então',
        # Dependência
        'com base em', 'baseado em', 'baseado na', 'usando', 'a partir de',
    ]
    
    # Padrões regex para coordenação mais sofisticada
    coordination_patterns = [
        r'pesquis\w+.*e\s+(cri|escrev|ger)',  # pesquisar... e criar/escrever
        r'busc\w+.*e\s+(cri|escrev|ger)',     # buscar... e criar/escrever
        r'escrev\w+.*com base',                # escrever... com base em
        r'cri\w+.*baseado',                    # criar... baseado em
    ]
    
    has_coordination = (
        any(trigger in mensagem_lower for trigger in coordination_triggers) or
        any(re.search(pattern, mensagem_lower) for pattern in coordination_patterns)
    )
    
    # Contar domínios com score significativo (>= 3)
    domains_with_score = sum([
        score_ciencia >= 3,
        score_estudo >= 3,
        score_redator >= 3
    ])
    
    # Multi-agente: coordenação explícita + múltiplos domínios relevantes
    if has_coordination and domains_with_score >= 2:
        logger.info(
            "Roteamento (multi-agente detectado)",
            extra={
                'message_snippet': mensagem_usuario[:50],
                'chosen_agent': 'equipe',
                'reason': 'multi_domain_coordination',
                'scores': {
                    'ciencia': score_ciencia,
                    'estudo': score_estudo,
                    'redator': score_redator
                },
                'coordination_detected': True
            }
        )
        return 'equipe'
    
    # =========================================================================
    # PRIORIDADE 4: ROTEAMENTO POR SCORE MAIS ALTO
    # =========================================================================
    
    # Encontrar score máximo
    scores = {
        'ciencia': score_ciencia,
        'estudo': score_estudo,
        'redator': score_redator
    }
    
    max_score = max(scores.values())
    
    if max_score == 0:
        # Nenhuma keyword encontrada → fallback para ciência (generalista)
        logger.info(
            "Roteamento (fallback - sem keywords)",
            extra={
                'message_snippet': mensagem_usuario[:50],
                'chosen_agent': 'ciencia',
                'reason': 'no_keywords_matched',
                'confidence': 'low'
            }
        )
        return 'ciencia'
    
    # Determinar agente com maior score
    # Em caso de empate, priorizar: redator > estudo > ciencia
    # (redator tem keywords mais específicas, então empate provavelmente é intenção de escrita)
    if score_redator == max_score:
        chosen = 'redator'
    elif score_estudo == max_score:
        chosen = 'estudo'
    else:
        chosen = 'ciencia'
    
    # Log detalhado da decisão
    logger.info(
        "Roteamento decisão final",
        extra={
            'message_snippet': mensagem_usuario[:50],
            'chosen_agent': chosen,
            'scores': scores,
            'max_score': max_score,
            'matched_keywords': {
                'ciencia': kw_ciencia[:3],  # Top 3 keywords
                'estudo': kw_estudo[:3],
                'redator': kw_redator[:3]
            },
            'confidence': 'high' if max_score >= 5 else 'medium' if max_score >= 3 else 'low'
        }
    )
    
    return chosen


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

