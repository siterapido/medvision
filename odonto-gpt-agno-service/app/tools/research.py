"""
Research Tools for Dental Scientific Literature Search
Provides integration with PubMed and arXiv for evidence-based dentistry
"""

from typing import List, Dict, Any, Optional
from agno.tools import tool
import arxiv
from datetime import datetime
import logging
import requests
import os
import json

logger = logging.getLogger(__name__)


@tool
def ask_perplexity(query: str) -> str:
    """
    Performs a deep online search using Perplexity AI to answer complex questions.
    Use this tool when you need up-to-date information, citations, or broad web coverage
    that exceeds internal knowledge or specific databases like PubMed.

    Args:
        query (str): The research question or topic.

    Returns:
        str: A comprehensive answer with citations and sources.
    """
    api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        return "Error: API key for Perplexity/OpenRouter not configured."

    # Se a chave começar com sk-or-v1, é OpenRouter. Se começar com pplx-, é Perplexity nativo.
    # Assumindo OpenRouter conforme instrução do usuário.
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("APP_URL", "http://localhost:3000"),
        "X-Title": "OdontoGPT Research Agent",
    }

    # Modelo Perplexity Sonar (que faz web search)
    # Upgrade para o modelo reasoning que é superior para pesquisa acadêmica
    model = os.getenv("OPENROUTER_MODEL_RESEARCH", "perplexity/sonar-reasoning")

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Você é um assistente de pesquisa acadêmica para Odonto GPT. "
                    "Sua tarefa é encontrar artigos científicos e evidências clínicas atualizadas. "
                    "Responda sempre em Português (Brasil). "
                    "Inclua citações no corpo do texto. "
                    "CRITICAL: No final da resposta, crie uma seção '### Fontes' com a lista numerada de URLs usadas."
                ),
            },
            {"role": "user", "content": query},
        ],
        "temperature": 0.1,
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        # Logar erro detalhado se falhar
        if response.status_code != 200:
            logger.error(f"OpenRouter Error {response.status_code}: {response.text}")
            return f"Error querying Perplexity (Status {response.status_code}): {response.text}"

        response.raise_for_status()
        data = response.json()

        if "choices" in data and len(data["choices"]) > 0:
            content = data["choices"][0]["message"]["content"]
            return content
        else:
            return "Error: No content received from Perplexity API."

    except Exception as e:
        logger.error(f"Perplexity search error: {str(e)}")
        return f"Error querying Perplexity: {str(e)}"


@tool
def search_pubmed(
    query: str, max_results: int = 5, specialty: Optional[str] = None
) -> str:
    """
    Search PubMed for dental and medical research articles.

    Ideal for finding recent clinical studies, systematic reviews,
    and evidence-based dental research.

    Args:
        query (str): Search query (e.g., "dental implant failure", "periodontal treatment")
        max_results (int): Number of results to return (default: 5)
        specialty (str): Filter by dental specialty (optional)

    Returns:
        str: Formatted search results with titles, abstracts, and citations
    """
    try:
        from pymed import PubMed

        pubmed = PubMed(tool="OdontoGPT-Agent", email="odonto@example.com")

        # Build search query with dental filters
        search_query = query
        if specialty:
            search_query = f"{query} AND {specialty}"

        # Execute search
        results = pubmed.query(search_query, max_results=max_results)

        # Format results
        formatted_results = []
        formatted_results.append(f"## PubMed Search Results: '{query}'\n")
        formatted_results.append(f"Found {len(list(results))} relevant articles\n")

        for article in results:
            pubmed_id = article.pubmed_id.split("\n")[0] if article.pubmed_id else "N/A"
            title = article.title if article.title else "No title"
            abstract = article.abstract if article.abstract else "No abstract available"
            publication_date = (
                article.publication_date if article.publication_date else "N/A"
            )
            authors = ", ".join(article.authors[:3]) if article.authors else "Unknown"

            formatted_results.append(f"### {title}")
            formatted_results.append(f"**PMID:** {pubmed_id}")
            formatted_results.append(f"**Authors:** {authors}")
            formatted_results.append(f"**Published:** {publication_date}")
            formatted_results.append(
                f"**Abstract:** {abstract[:500]}..."
                if len(abstract) > 500
                else f"**Abstract:** {abstract}"
            )
            formatted_results.append("")

        return "\n".join(formatted_results)

    except Exception as e:
        logger.error(f"PubMed search error: {str(e)}")
        return f"Error searching PubMed: {str(e)}\nTip: Try a simpler query or check your internet connection."


@tool
def search_arxiv(query: str, max_results: int = 5, sort_by: str = "relevance") -> str:
    """
    Search arXiv for academic papers on AI, ML, and computational dentistry.

    Best for finding research on:
    - AI applications in dentistry
    - Medical imaging and analysis
    - Computational techniques
    - Machine learning models

    Args:
        query (str): Search query (e.g., "dental X-ray deep learning", "tooth detection CNN")
        max_results (int): Number of results to return (default: 5)
        sort_by (str): Sort by "relevance", "lastUpdatedDate", or "submittedDate"

    Returns:
        str: Formatted search results with titles, abstracts, and PDF links
    """
    try:
        # Build arXiv query
        search = arxiv.Search(
            query=query,
            max_results=max_results,
            sort_by=arxiv.SortCriterion.Relevance
            if sort_by == "relevance"
            else arxiv.SortCriterion.SubmittedDate,
        )

        # Format results
        formatted_results = []
        formatted_results.append(f"## arXiv Search Results: '{query}'\n")

        for result in search.results():
            # Format authors
            authors = ", ".join(author.name for author in result.authors[:3])
            if len(result.authors) > 3:
                authors += f" et al. ({len(result.authors)} authors)"

            # Format abstract (truncate if too long)
            abstract = result.summary.replace("\n", " ")
            if len(abstract) > 500:
                abstract = abstract[:500] + "..."

            formatted_results.append(f"### {result.title}")
            formatted_results.append(f"**Authors:** {authors}")
            formatted_results.append(
                f"**Published:** {result.published.strftime('%Y-%m-%d')}"
            )
            formatted_results.append(f"**arXiv ID:** {result.entry_id.split('/')[-1]}")
            formatted_results.append(f"**PDF:** [Download]({result.pdf_url})")
            formatted_results.append(f"**Abstract:** {abstract}")
            formatted_results.append("")

        return "\n".join(formatted_results)

    except Exception as e:
        logger.error(f"arXiv search error: {str(e)}")
        return f"Error searching arXiv: {str(e)}\nTip: Try using English keywords and technical terms."


@tool
def get_latest_dental_research(
    specialty: str = "general", days_back: int = 30, max_results: int = 3
) -> str:
    """
    Get latest dental research from PubMed for a specific specialty.

    Useful for staying updated with recent developments in:
    - Periodontics (periodontia)
    - Endodontics (endodontia)
    - Oral surgery (cirurgia)
    - Orthodontics (ortodontia)
    - Implantology (implantes)
    - General dentistry

    Args:
        specialty (str): Dental specialty (default: "general")
        days_back (int): Search last N days (default: 30)
        max_results (int): Maximum articles to return (default: 3)

    Returns:
        str: Summary of recent research with clinical implications
    """
    try:
        from pymed import PubMed

        pubmed = PubMed(tool="OdontoGPT-Agent", email="odonto@example.com")

        # Build specialty-specific query
        specialty_map = {
            "periodontia": "periodontics OR periodontal",
            "endodontia": "endodontics OR root canal",
            "cirurgia": "oral surgery OR oral surgery",
            "ortodontia": "orthodontics OR orthodontic",
            "implantes": "dental implant",
            "general": "dentistry OR dental",
        }

        search_term = specialty_map.get(specialty.lower(), specialty_map["general"])

        # Add date filter for recent articles
        query = f'({search_term}) AND ("{datetime.now().strftime("%Y/%m/%d")}"[Date - Publication] : {days_back}[days])'

        results = pubmed.query(query, max_results=max_results)

        formatted_results = []
        formatted_results.append(
            f"## Latest {specialty.title()} Research (Last {days_back} Days)\n"
        )

        if not results:
            return f"No recent articles found for {specialty} in the last {days_back} days."

        for article in results:
            title = article.title if article.title else "No title"
            abstract = article.abstract if article.abstract else "No abstract"
            journal = article.journal if article.journal else "Unknown journal"

            formatted_results.append(f"### {title}")
            formatted_results.append(f"**Journal:** {journal}")
            formatted_results.append(
                f"**Summary:** {abstract[:400]}..."
                if len(abstract) > 400
                else f"**Summary:** {abstract}"
            )
            formatted_results.append("")

        return "\n".join(formatted_results)

    except Exception as e:
        logger.error(f"Latest research error: {str(e)}")
        return f"Error fetching latest research: {str(e)}"


@tool
def search_clinical_trials(condition: str, max_results: int = 5) -> str:
    """
    Search for ongoing or completed clinical trials in dentistry.

    Useful for finding evidence-based treatments and ongoing research.

    Args:
        condition (str): Dental condition or treatment (e.g., "periodontitis", "dental implant")
        max_results (int): Number of trials to return (default: 5)

    Returns:
        str: Summary of relevant clinical trials
    """
    try:
        from pymed import PubMed

        pubmed = PubMed(tool="OdontoGPT-Agent", email="odonto@example.com")

        # Search for clinical trials
        query = f'("{condition}") AND (clinical trial[pt] OR randomized[title])'

        results = pubmed.query(query, max_results=max_results)

        formatted_results = []
        formatted_results.append(f"## Clinical Trials: '{condition}'\n")

        if not results:
            return f"No clinical trials found for '{condition}'. Try a different search term."

        for article in results:
            title = article.title if article.title else "No title"
            abstract = article.abstract if article.abstract else "No abstract available"

            formatted_results.append(f"### {title}")
            formatted_results.append(
                f"**Abstract:** {abstract[:500]}..."
                if len(abstract) > 500
                else f"**Abstract:** {abstract}"
            )
            formatted_results.append("")

        return "\n".join(formatted_results)

    except Exception as e:
        logger.error(f"Clinical trials search error: {str(e)}")
        return f"Error searching clinical trials: {str(e)}"


@tool
def verify_sources(urls: List[str]) -> List[Dict[str, Any]]:
    """
    Verifies if the provided URLs are accessible and valid.
    Use this tool after receiving search results to ensure you don't provide dead links.

    Args:
        urls (List[str]): List of URLs to check.

    Returns:
        List[Dict[str, Any]]: List of results with status (valid/invalid) and title.
    """
    results = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    for url in urls:
        if not url.startswith("http"):
            results.append({"url": url, "status": "invalid", "reason": "Malformed URL"})
            continue

        try:
            # Try a HEAD request first (faster)
            response = requests.head(
                url, headers=headers, timeout=5, allow_redirects=True
            )

            # If HEAD is not allowed or 405, try GET but only for status
            if response.status_code >= 400:
                response = requests.get(url, headers=headers, timeout=5, stream=True)

            if response.status_code < 400:
                results.append(
                    {"url": url, "status": "valid", "code": response.status_code}
                )
            else:
                results.append(
                    {"url": url, "status": "invalid", "code": response.status_code}
                )

        except Exception as e:
            results.append({"url": url, "status": "invalid", "reason": str(e)})

    return results


# Export tools list for easy import
RESEARCH_TOOLS = [
    ask_perplexity,
    verify_sources,
    search_pubmed,
    search_arxiv,
    get_latest_dental_research,
    search_clinical_trials,
]
