"""
Módulo de Refinamento de Artefatos

Contém agentes especializados para análise e melhoria de artefatos gerados.
"""

from .artifact_analyzer import artifact_analyzer, ArtifactAnalysis, QualityScore
from .artifact_refiner import artifact_refiner, RefinedArtifact

__all__ = [
    "artifact_analyzer",
    "artifact_refiner", 
    "ArtifactAnalysis",
    "RefinedArtifact",
    "QualityScore"
]
