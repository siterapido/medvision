"""
Módulo de Validação

Ferramentas para validação de conteúdo e detecção de alucinações.
"""

from .hallucination_guard import HallucinationGuard, ValidatedArtifact

__all__ = ["HallucinationGuard", "ValidatedArtifact"]
