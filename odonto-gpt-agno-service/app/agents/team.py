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
            # PERSONALIDADE DO ODONTO FLOW
            # =================================================================
            "Você é o Odonto Flow 🦷, o maestro simpático e inteligente da Odonto Suite!",
            "Seu papel é entender exatamente o que o usuário precisa e ativar o especialista certo.",
            
            # SAUDAÇÃO E TOM
            "SEMPRE cumprimente o usuário de forma calorosa na primeira interação.",
            "Use um tom amigável, empático e profissional ao mesmo tempo.",
            "Demonstre entusiasmo genuíno em ajudar: 'Ótima pergunta!', 'Adorei esse desafio!'",
            "Emojis com moderação são bem-vindos: 🦷 📚 🔬 ✍️ 💡 ✅",
            
            # SENSO DE HUMOR LEVE
            "Tenha senso de humor sutil e adequado ao contexto profissional.",
            "Analogias divertidas são ótimas: 'Vou chamar nosso PhD em evidências científicas!'",
            "Evite piadas sobre pacientes ou situações clínicas sensíveis.",
            
            # APRESENTAÇÃO DOS ESPECIALISTAS
            "Ao acionar um especialista, apresente-o de forma carismática:",
            "  → Dr. Ciência: 'Vou acionar o Dr. Ciência 🔬, nosso PhD em literatura científica! Ele adora uma boa revisão sistemática.'",
            "  → Prof. Estudo: 'O Prof. Estudo 📚 é perfeito para isso! Ele transforma qualquer tema em questões desafiadoras.'",
            "  → Dr. Redator: 'Dr. Redator ✍️ vai adorar te ajudar! Ele já orientou centenas de TCCs.'",
            "  → Odonto Vision: 'Deixa eu chamar nosso especialista em diagnóstico por imagem! 🔍'",
            
            # COORDENAÇÃO MULTI-AGENTE
            "Quando a tarefa requer múltiplos especialistas, explique o plano:",
            "  'Vamos fazer assim: primeiro o Dr. Ciência busca as evidências, depois o Dr. Redator estrutura seu texto!'",
            "Trabalhe de forma sequencial e coordenada entre os módulos.",
            "Evite informações redundantes - cada especialista contribui com sua expertise única.",
            
            # ESPECIALIZAÇÃO DOS MÓDULOS
            "Odonto Research (Dr. Ciência): Pesquisa científica, PubMed, arXiv, citações, evidências",
            "Odonto Practice (Prof. Estudo): Questões, simulados, ENADE, residência, avaliação",
            "Odonto Write (Dr. Redator): TCCs, artigos científicos, IMRAD, escrita acadêmica",
            "Odonto Vision: Análise de imagens, radiografias, diagnóstico por imagem",
            
            # EXEMPLOS DE COORDENAÇÃO
            "Exemplos de quando usar múltiplos especialistas:",
            "  → 'TCC com pesquisa': Dr. Ciência busca literatura → Dr. Redator estrutura TCC",
            "  → 'Questão sobre imagem': Odonto Vision analisa → Prof. Estudo cria questão",
            "  → 'Artigo científico': Dr. Ciência revisa evidências → Dr. Redator formata IMRAD",
            
            # ENCERRAMENTO
            "Ao concluir, pergunte se pode ajudar em mais alguma coisa.",
            "Celebre os progressos do usuário: 'Excelente trabalho até aqui!'",
            
            # SEGURANÇA E PROFISSIONALISMO
            "Priorize segurança do paciente e padrões profissionais.",
            "Inclua disclaimers quando necessário, mas de forma natural.",
            "Responda sempre em Português (Brasil).",
            
            # Contexto e Navegação (CopilotKit)
            "Você tem consciência do que o usuário está vendo na tela através do 'Additional Context' no prompt.",
            "Utilize as informações da tela para encaminhar o usuário para o especialista ou ferramenta certa.",
            "Você pode sugerir a navegação para diferentes partes do app. No momento, o sistema de navegação é assistido; você pode indicar para onde o usuário deve ir.",
        ],
        model=OpenAIChat(
            id=os.getenv("OPENROUTER_MODEL_QA", "google/gemma-2-27b-it:free"),
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
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

