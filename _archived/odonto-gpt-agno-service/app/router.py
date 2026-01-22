import logging
import re
from typing import List, Dict, Any, Optional, Set

# Configure logger
logger = logging.getLogger(__name__)

# Type aliases for clarity
AgentScoreMap = Dict[str, float]


class HybridRouter:
    """
    Lightweight Router focused on Keyword Boosting and Regex Intents.
    Optimized for environments with <4GB RAM (Railway).
    """

    def __init__(self):
        # Initialize keywords (migrated from legacy routing)
        self.keywords: Dict[str, Dict[str, int]] = self._initialize_keywords()

    def _initialize_keywords(self) -> Dict[str, Dict[str, int]]:
        """
        Define keyword weights for each agent.
        Higher weights = stronger signal.
        """
        return {
            "ciencia": {
                "pubmed": 10,
                "revisão sistemática": 10,
                "revisões sistemáticas": 10,
                "meta-análise": 10,
                "meta-análises": 10,
                "pesquisa": 8,
                "pesquisar": 8,
                "busca": 5,
                "buscar": 5,
                "evidência": 10,
                "evidências": 10,
                "artigo": 4,
                "artigos": 4,
                "estudos": 5,
                "referências": 10,
                "referência": 10,
                "bibliografia": 10,
                "saber sobre": 5,
                "literatura": 6,
                "estudo clínico": 8,
            },
            "estudo": {
                "questão": 10,
                "questões": 10,
                "simulado": 10,
                "prova": 10,
                "quiz": 10,
                "exercício": 10,
                "exercícios": 10,
                "praticar": 8,
                "estudar": 8,
                "gabarito": 8,
                "teste": 8,
                "testes": 8,
            },
            "redator": {
                "tcc": 10,
                "monografia": 10,
                "artigo científico": 8,
                "escrever": 6,
                "redigir": 6,
                "abnt": 10,
                "vancouver": 10,
                "formatar": 8,
                "referências": 4,
                "estruturar": 8,
                "metodologia": 10,
                "abstract": 8,
                "paper": 6,
            },
            "imagem": {
                "radiografia": 10,
                "imagem": 8,
                "raio-x": 10,
                "tomografia": 10,
                "analise": 5,
                "laudo": 8,
                "veja": 4,
                "foto": 6,
                "panorâmica": 10,
            },
            "resumo": {
                "resumo": 10,
                "resumir": 10,
                "sintetize": 8,
                "flashcards": 10,
                "flashcard": 10,
                "cards": 8,
                "cartões": 8,
                "mapa mental": 10,
                "mind map": 10,
            },
            "gpt": {
                "explicação": 8,
                "me explica": 10,
                "entender": 8,
                "duvida": 10,
                "bate papo": 10,
                "conversa": 8,
                "ajuda": 5,
                "não entendi": 10,
                "regras": 10,
                "contexto": 10,
                "quem é você": 10,
            },
        }

    def route(
        self, text: str, has_image: bool = False, current_agent: Optional[str] = None
    ) -> str:
        """
        Main routing method using Keyword and Regex Logic.
        """
        text_lower = text.lower()

        # 1. HARD OVERRIDES (Safety Layer)
        if has_image:
            if len(text.split()) > 8 and re.search(
                r"pesquis|quest|simul|exerc", text_lower
            ):
                return "equipe"
            return "imagem"

        # Check for multi-intent patterns
        is_formatting = bool(
            re.search(r"\b(abnt|vancouver|apa|formatação|normas)\b", text_lower)
        )
        has_research = bool(
            re.search(r"\b(pesquis|busca|encontre|artig|referênc|bibliog)", text_lower)
        )
        has_study = bool(re.search(r"\b(quest|simul|exerc|prova)", text_lower))

        if is_formatting and has_research:
            return "equipe"

        # 2. KEYWORD SCORING
        scores: AgentScoreMap = {agent: 0.0 for agent in self.keywords}
        for agent, words in self.keywords.items():
            for word, weight in words.items():
                if word in text_lower:
                    scores[agent] += weight

        # 3. DECISION
        best_agent = max(scores, key=lambda k: scores.get(k, 0.0))
        max_score = scores[best_agent]

        logger.info(f"Routing '{text[:30]}...': Best={best_agent} (Score={max_score})")

        # Multi-intent catch-all
        active_intents = sum([1 for x in [has_research, has_study, is_formatting] if x])
        if active_intents >= 2:
            return "equipe"

        # Confidence Threshold Fallback
        if max_score < 3:
            return "gpt"

        return best_agent


# Singleton instance
hybrid_router = HybridRouter()
