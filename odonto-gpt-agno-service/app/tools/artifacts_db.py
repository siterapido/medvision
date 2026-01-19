"""
Database Tools for Saving Artifacts
Persists generated content (Research, Practice Exams) to Supabase.
"""

import os
import logging
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from agno.tools import tool
from supabase import create_client, Client

logger = logging.getLogger(__name__)


def _get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get(
        "SUPABASE_SERVICE_ROLE_KEY"
    )  # Use Service Role para garantir permissões de escrita em nome do user
    if not url or not key:
        raise ValueError("Supabase URL or Key not found in environment")
    return create_client(url, key)


@tool
def save_research(
    user_id: str,
    title: str,
    content: str,
    query: str = "",
    sources: Optional[List[Dict[str, Any]]] = None,
    suggestions: Optional[List[str]] = None,
    research_type: str = "literature_review",
) -> str:
    """
    Saves a research artifact to the database.

    Args:
        user_id (str): The ID of the user
        title (str): Title of the research
        content (str): Markdown content
        query (str): Search query
        sources (List[Dict]): List of sources [{"title": "...", "url": "..."}]
        suggestions (List[str]): List of strings with suggestions
        research_type (str): Type of research
    """
    # Defaults
    sources = sources or []
    suggestions = suggestions or []

    try:
        supabase = _get_supabase_client()

        data = {
            "user_id": user_id,
            "title": title,
            "query": query,
            "content": content,
            "sources": sources,
            "suggestions": suggestions,
            "type": research_type,
            "status": "completed",
            "updated_at": datetime.now().isoformat(),
        }

        response = supabase.table("research_artifacts").insert(data).execute()

        if response.data:
            return json.dumps(
                {
                    "success": True,
                    "message": f"Pesquisa salva com sucesso! ID: {response.data[0]['id']}",
                    "artifact": {
                        "id": response.data[0]["id"],
                        "title": response.data[0]["title"],
                        "type": response.data[0]["type"],
                    },
                },
                ensure_ascii=False,
            )
        else:
            return json.dumps(
                {
                    "success": False,
                    "message": "Erro ao salvar pesquisa: Nenhuma resposta do banco de dados.",
                },
                ensure_ascii=False,
            )

    except Exception as e:
        logger.error(f"Error saving research: {str(e)}")
        return json.dumps(
            {"success": False, "message": f"Erro ao salvar pesquisa: {str(e)}"},
            ensure_ascii=False,
        )


@tool
def save_practice_exam(
    user_id: str,
    title: str,
    topic: str,
    questions: List[Dict[str, Any]],
    specialty: str = "Geral",
    difficulty: str = "medium",
    exam_type: str = "custom",
) -> str:
    """
    Saves a generated practice exam (simulado) to the database.

    Args:
        user_id (str): The ID of the user
        title (str): Title of the exam
        topic (str): Main topic
        questions (List[Dict]): List of questions. Each question must have:
            - question_text (str)
            - options (List[str] or Dict)
            - correct_answer (str)
            - explanation (str)
            - difficulty (str)
            - type (str): 'multiple_choice' or 'essay'
        specialty (str): Dental specialty
        difficulty (str): Overall difficulty level
        exam_type (str): 'custom', 'enade', 'residency'

    Returns:
        str: Confirmation message
    """
    try:
        supabase = _get_supabase_client()

        # 1. Insert Exam
        exam_data = {
            "user_id": user_id,
            "title": title,
            "topic": topic,
            "specialty": specialty,
            "difficulty": difficulty,
            "exam_type": exam_type,
            "status": "ready",
            "updated_at": datetime.now().isoformat(),
        }

        exam_res = supabase.table("practice_exams").insert(exam_data).execute()

        if not exam_res.data:
            return "Erro ao criar exame: Falha na inserção principal."

        exam_id = exam_res.data[0]["id"]

        # 2. Insert Questions
        questions_data = []
        for idx, q in enumerate(questions):
            questions_data.append(
                {
                    "exam_id": exam_id,
                    "question_text": q.get("question_text"),
                    "type": q.get("type", "multiple_choice"),
                    "options": q.get("options"),
                    "correct_answer": q.get("correct_answer"),
                    "explanation": q.get("explanation"),
                    "difficulty": q.get("difficulty", "medium"),
                    "order_index": idx,
                }
            )

        if questions_data:
            supabase.table("practice_questions").insert(questions_data).execute()

        return f"Simulado '{title}' salvo com sucesso! ID: {exam_id} com {len(questions_data)} questões."

    except Exception as e:
        logger.error(f"Error saving exam: {str(e)}")
        return f"Erro ao salvar simulado: {str(e)}"


@tool
def save_summary(
    user_id: str, title: str, content: str, tags: List[str] = [], topic: str = ""
) -> str:
    """
    Saves a generated summary (Resumo) to the database.

    Args:
        user_id (str): The ID of the user
        title (str): Title of the summary
        content (str): Markdown content
        tags (List[str]): Keywords/tags
        topic (str): Main topic

    Returns:
        str: Confirmation message with ID
    """
    try:
        supabase = _get_supabase_client()

        data = {
            "user_id": user_id,
            "title": title,
            "topic": topic,
            "content": content,
            "tags": tags,
            "created_at": datetime.now().isoformat(),
        }

        # Check if table exists or use generic artifacts table if preferred
        # Assuming 'summaries' table exists as per info
        response = supabase.table("summaries").insert(data).execute()

        if response.data:
            return f"Resumo salvo com sucesso! ID: {response.data[0]['id']}"
        else:
            return "Erro ao salvar resumo: Nenhuma resposta do banco."

    except Exception as e:
        logger.error(f"Error saving summary: {str(e)}")
        return f"Erro ao salvar resumo: {str(e)}"


@tool
def save_flashcards(
    user_id: str, title: str, cards: List[Dict[str, str]], topic: str = ""
) -> str:
    """
    Saves a set of flashcards to the database.

    Args:
        user_id (str): The ID of the user
        title (str): Title of the flashcard set
        cards (List[Dict]): List of cards [{"front": "...", "back": "..."}]
        topic (str): Main topic

    Returns:
        str: Confirmation message with ID
    """
    try:
        supabase = _get_supabase_client()

        # 1. Create Flashcard Deck in 'flashcard_decks' table

        data = {
            "user_id": user_id,
            "title": title,
            "topic": topic,
            "cards": cards,
            "created_at": datetime.now().isoformat(),
        }

        response = supabase.table("flashcard_decks").insert(data).execute()

        if response.data:
            return f"Flashcards salvos com sucesso! ID: {response.data[0]['id']}"

    except Exception as e:
        logger.error(f"Error saving flashcards: {str(e)}")
        return f"Erro ao salvar flashcards: {str(e)}"


@tool
def save_mind_map(
    user_id: str, title: str, map_data: Dict[str, Any], topic: str = ""
) -> str:
    """
    Saves a mind map to the database.

    Args:
        user_id (str): The ID of the user
        title (str): Title of the mind map
        map_data (Dict): JSON structure of the mind map
        topic (str): Main topic

    Returns:
        str: Confirmation message with ID
    """
    try:
        supabase = _get_supabase_client()

        data = {
            "user_id": user_id,
            "title": title,
            "topic": topic,
            "data": map_data,
            "created_at": datetime.now().isoformat(),
        }

        response = supabase.table("mind_map_artifacts").insert(data).execute()

        if response.data:
            return f"Mapa mental salvo com sucesso! ID: {response.data[0]['id']}"
        else:
            return "Erro ao salvar mapa mental."

    except Exception as e:
        logger.error(f"Error saving mind map: {str(e)}")
        return f"Erro ao salvar mapa mental: {str(e)}"


@tool
def save_image_analysis(
    user_id: str,
    title: str,
    analysis: str,
    image_url: str = "",
    findings: List[str] = [],
    recommendations: List[str] = [],
    metadata: Dict[str, Any] = {},
) -> str:
    """
    Saves a dental image analysis artifact to the database.

    Args:
        user_id (str): The ID of the user
        title (str): Title/Identifier for the analysis
        analysis (str): Full markdown content of the analysis
        image_url (str): URL of the analyzed image
        findings (List[str]): Key findings extracted
        recommendations (List[str]): Recommendations extracted
        metadata (Dict): Additional metadata (model, confidence, etc.)

    Returns:
        str: Confirmation message with ID
    """
    try:
        supabase = _get_supabase_client()

        data = {
            "user_id": user_id,
            "title": title,
            "image_url": image_url,
            "analysis": analysis,
            "findings": findings,
            "recommendations": recommendations,
            "metadata": metadata,
            "status": "completed",
            "updated_at": datetime.now().isoformat(),
        }

        response = supabase.table("image_artifacts").insert(data).execute()

        if response.data:
            return json.dumps(
                {
                    "success": True,
                    "message": f"Análise de imagem salva com sucesso! ID: {response.data[0]['id']}",
                    "artifact": {
                        "id": response.data[0]["id"],
                        "title": response.data[0]["title"],
                        "type": "image_analysis",
                    },
                },
                ensure_ascii=False,
            )
        else:
            return json.dumps(
                {
                    "success": False,
                    "message": "Erro ao salvar análise de imagem: Nenhuma resposta do banco.",
                },
                ensure_ascii=False,
            )

    except Exception as e:
        logger.error(f"Error saving image analysis: {str(e)}")
        return json.dumps(
            {
                "success": False,
                "message": f"Erro ao salvar análise de imagem: {str(e)}",
            },
            ensure_ascii=False,
        )


ARTIFACT_TOOLS = [
    save_research,
    save_practice_exam,
    save_summary,
    save_flashcards,
    save_mind_map,
    save_image_analysis,
]
