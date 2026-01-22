"""
Ferramentas para formatação de citações bibliográficas
Suporta padrões ABNT, APA e Vancouver
"""

from typing import Dict, Any, List, Optional
from agno.tools import tool
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


@tool
def format_citation(
    article: Dict[str, Any],
    style: str = "abnt"
) -> str:
    """
    Formata citação bibliográfica conforme padrão especificado.
    
    Suporta os seguintes estilos:
    - abnt: Associação Brasileira de Normas Técnicas
    - apa: American Psychological Association (7ª edição)
    - vancouver: International Committee of Medical Journal Editors
    
    Args:
        article (Dict[str, Any]): Dicionário com informações do artigo
            - title: Título do artigo
            - authors: Lista de autores ou string
            - journal: Nome do periódico
            - year: Ano de publicação
            - volume: Volume (opcional)
            - issue: Número/fascículo (opcional)
            - pages: Páginas (opcional)
            - doi: DOI (opcional)
            - pmid: PubMed ID (opcional)
        style (str): Estilo de citação ("abnt", "apa", "vancouver")
    
    Returns:
        str: Citação formatada no estilo especificado
    """
    try:
        style = style.lower()
        
        if style == "abnt":
            return _format_abnt(article)
        elif style == "apa":
            return _format_apa(article)
        elif style == "vancouver":
            return _format_vancouver(article)
        else:
            return f"Erro: Estilo '{style}' não suportado. Use 'abnt', 'apa' ou 'vancouver'."
    
    except Exception as e:
        logger.error(f"Erro ao formatar citação: {str(e)}")
        return f"Erro ao formatar citação: {str(e)}"


@tool
def format_reference_list(
    articles: List[Dict[str, Any]],
    style: str = "abnt"
) -> str:
    """
    Formata lista completa de referências bibliográficas.
    
    Args:
        articles (List[Dict[str, Any]]): Lista de artigos para formatar
        style (str): Estilo de citação ("abnt", "apa", "vancouver")
    
    Returns:
        str: Lista de referências formatada com numeração ou ordem alfabética
    """
    try:
        style = style.lower()
        formatted_refs = []
        
        if style == "vancouver":
            # Vancouver usa numeração
            for idx, article in enumerate(articles, start=1):
                citation = _format_vancouver(article)
                formatted_refs.append(f"{idx}. {citation}")
        else:
            # ABNT e APA usam ordem alfabética
            sorted_articles = sorted(articles, key=lambda x: x.get('authors', [''])[0] if isinstance(x.get('authors'), list) else x.get('authors', ''))
            for article in sorted_articles:
                if style == "abnt":
                    citation = _format_abnt(article)
                else:  # apa
                    citation = _format_apa(article)
                formatted_refs.append(citation)
        
        return "\n\n".join(formatted_refs)
    
    except Exception as e:
        logger.error(f"Erro ao formatar lista de referências: {str(e)}")
        return f"Erro ao formatar lista de referências: {str(e)}"


def _format_abnt(article: Dict[str, Any]) -> str:
    """Formata citação no padrão ABNT (NBR 6023:2018)"""
    authors = article.get('authors', 'AUTOR DESCONHECIDO')
    if isinstance(authors, list):
        if len(authors) > 3:
            authors = f"{authors[0]} et al."
        else:
            authors = '; '.join(authors)
    
    # Sobrenome em maiúsculas (simplificado)
    authors = authors.upper()
    
    title = article.get('title', 'Título não informado')
    journal = article.get('journal', '')
    year = article.get('year', 'n.d.')
    volume = article.get('volume', '')
    issue = article.get('issue', '')
    pages = article.get('pages', '')
    doi = article.get('doi', '')
    
    citation = f"{authors}. {title}. "
    
    if journal:
        citation += f"**{journal}**, "
    
    if volume:
        citation += f"v. {volume}, "
    if issue:
        citation += f"n. {issue}, "
    if pages:
        citation += f"p. {pages}, "
    
    citation += f"{year}. "
    
    if doi:
        citation += f"DOI: {doi}."
    
    return citation.strip()


def _format_apa(article: Dict[str, Any]) -> str:
    """Formata citação no padrão APA (7ª edição)"""
    authors = article.get('authors', 'Autor Desconhecido')
    if isinstance(authors, list):
        if len(authors) == 1:
            authors = authors[0]
        elif len(authors) == 2:
            authors = f"{authors[0]} & {authors[1]}"
        elif len(authors) > 20:
            # APA 7: mais de 20 autores, listar os 19 primeiros + "..." + último
            authors = ', '.join(authors[:19]) + f", ... {authors[-1]}"
        else:
            authors = ', '.join(authors[:-1]) + f", & {authors[-1]}"
    
    title = article.get('title', 'Título não informado')
    journal = article.get('journal', '')
    year = article.get('year', 'n.d.')
    volume = article.get('volume', '')
    issue = article.get('issue', '')
    pages = article.get('pages', '')
    doi = article.get('doi', '')
    
    citation = f"{authors} ({year}). {title}. "
    
    if journal:
        citation += f"*{journal}*, "
    
    if volume:
        citation += f"*{volume}*"
    if issue:
        citation += f"({issue})"
    if pages:
        citation += f", {pages}"
    
    citation += ". "
    
    if doi:
        citation += f"https://doi.org/{doi}"
    
    return citation.strip()


def _format_vancouver(article: Dict[str, Any]) -> str:
    """Formata citação no padrão Vancouver (ICMJE)"""
    authors = article.get('authors', 'Autor Desconhecido')
    if isinstance(authors, list):
        if len(authors) > 6:
            # Vancouver: máximo 6 autores, depois "et al."
            authors = ', '.join(authors[:6]) + ", et al."
        else:
            authors = ', '.join(authors)
    
    title = article.get('title', 'Título não informado')
    journal = article.get('journal', '')
    year = article.get('year', '')
    volume = article.get('volume', '')
    issue = article.get('issue', '')
    pages = article.get('pages', '')
    pmid = article.get('pmid', '')
    doi = article.get('doi', '')
    
    # Abreviar nomes dos autores (simplificado)
    # Exemplo: Silva JA, Costa MB
    
    citation = f"{authors}. {title}. "
    
    if journal:
        # Vancouver usa abreviação de periódicos (aqui mantemos o nome completo)
        citation += f"{journal}. "
    
    if year and volume:
        citation += f"{year};{volume}"
    elif year:
        citation += f"{year}"
    
    if issue:
        citation += f"({issue})"
    if pages:
        citation += f":{pages}"
    
    citation += ". "
    
    if pmid:
        citation += f"PMID: {pmid}. "
    if doi:
        citation += f"DOI: {doi}."
    
    return citation.strip()


@tool
def extract_citation_from_pubmed(
    pmid: str,
    style: str = "abnt"
) -> str:
    """
    Extrai citação formatada diretamente do PubMed usando PMID.
    
    Args:
        pmid (str): PubMed ID do artigo
        style (str): Estilo de citação ("abnt", "apa", "vancouver")
    
    Returns:
        str: Citação formatada ou mensagem de erro
    """
    try:
        from pymed import PubMed
        
        pubmed = PubMed(tool="OdontoGPT-Agent", email="odonto@example.com")
        
        # Buscar artigo pelo PMID
        results = list(pubmed.query(f"{pmid}[PMID]", max_results=1))
        
        if not results:
            return f"Erro: Artigo com PMID {pmid} não encontrado no PubMed."
        
        article = results[0]
        
        # Construir dicionário de dados do artigo
        article_data = {
            'title': article.title if article.title else 'Título não disponível',
            'authors': article.authors if article.authors else ['Autor desconhecido'],
            'journal': article.journal if article.journal else '',
            'year': article.publication_date.year if article.publication_date else '',
            'pmid': pmid,
        }
        
        # Formatar citação
        return format_citation(article_data, style=style)
    
    except Exception as e:
        logger.error(f"Erro ao extrair citação do PubMed (PMID: {pmid}): {str(e)}")
        return f"Erro ao extrair citação do PubMed: {str(e)}"


# Lista de ferramentas para exportação
CITATION_TOOLS = [
    format_citation,
    format_reference_list,
    extract_citation_from_pubmed,
]
