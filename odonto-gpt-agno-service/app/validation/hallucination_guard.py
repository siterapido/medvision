"""
Hallucination Guard

Detecta e mitiga alucinações em outputs de agentes de IA,
especialmente no contexto odontológico/médico.
"""

import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator
import logging

logger = logging.getLogger(__name__)


class ValidationResult(BaseModel):
    """Resultado da validação de conteúdo."""
    is_valid: bool = True
    confidence: int = Field(default=100, ge=0, le=100)
    warnings: List[str] = Field(default_factory=list)
    critical_issues: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)


class HallucinationGuard:
    """
    Detecta e mitiga alucinações em outputs de agentes.
    
    Verifica:
    - Claims absolutos sem evidência
    - Informações potencialmente incorretas
    - Falta de citações para afirmações científicas
    - Nomes/pessoas inventadas
    - Dosagens suspeitas
    
    Uso:
        guard = HallucinationGuard()
        result = guard.validate_content(content)
        if not result.is_valid:
            content = guard.sanitize_output(content)
    """
    
    # Padrões suspeitos que indicam possíveis alucinações
    SUSPICIOUS_PATTERNS = [
        # Claims absolutos
        (r"100%\s+(eficaz|eficácia|garantido|certo|seguro)", "claim_absoluto"),
        (r"sempre\s+(funciona|cura|resolve)", "claim_absoluto"),
        (r"nunca\s+(falha|causa|provoca)", "claim_absoluto"),
        (r"totalmente\s+(seguro|inofensivo)", "claim_absoluto"),
        
        # Afirmações científicas sem citação
        (r"estudos\s+(mostram|comprovam|indicam)(?!\s*[\[\(])", "sem_citacao"),
        (r"pesquisas?\s+(recentes?|atuais?)\s+(mostram|indicam)(?!\s*[\[\(])", "sem_citacao"),
        (r"comprovado\s+cientificamente(?!\s*[\[\(])", "sem_citacao"),
        (r"evidências?\s+(científicas?|clínicas?)\s+(mostram|indicam)(?!\s*[\[\(])", "sem_citacao"),
        
        # Estatísticas suspeitas
        (r"\b(99|98|97)\s*%\s*(dos\s+casos|de\s+sucesso|eficácia)", "estatistica_suspeita"),
        (r"\b(todos|todas)\s+os?\s+(pacientes|casos|estudos)", "generalizacao"),
        
        # Nomes possivelmente inventados
        (r"(?:Dr\.|Prof\.|Dra\.)\s+[A-Z][a-záéíóú]+\s+[A-Z][a-záéíóú]+\s+[A-Z][a-záéíóú]+", "nome_suspeito"),
    ]
    
    # Termos que requerem citação quando usados
    CITATION_REQUIRED_TERMS = [
        "meta-análise", "metanálise", "revisão sistemática",
        "ensaio clínico", "ensaio randomizado", "RCT",
        "estatisticamente significativo", "p < 0.05", "p<0.05",
        "IC 95%", "intervalo de confiança",
        "nível de evidência", "grau de recomendação"
    ]
    
    # Dosagens comuns em odontologia (para validação básica)
    COMMON_DOSAGES = {
        "amoxicilina": ["500mg", "875mg", "1g"],
        "ibuprofeno": ["200mg", "400mg", "600mg"],
        "paracetamol": ["500mg", "750mg", "1g"],
        "lidocaína": ["2%", "3%"],
        "articaína": ["4%"],
        "clorexidina": ["0.12%", "0.2%", "2%"],
    }
    
    @classmethod
    def validate_content(cls, content: str) -> ValidationResult:
        """
        Valida conteúdo e retorna resultado com warnings.
        
        Args:
            content: Texto a ser validado
            
        Returns:
            ValidationResult com status e detalhes
        """
        warnings = []
        critical_issues = []
        suggestions = []
        
        content_lower = content.lower()
        
        # 1. Detectar padrões suspeitos
        for pattern, issue_type in cls.SUSPICIOUS_PATTERNS:
            matches = re.findall(pattern, content, re.IGNORECASE)
            if matches:
                if issue_type == "claim_absoluto":
                    critical_issues.append(
                        f"Afirmação absoluta detectada: '{matches[0]}' - Claims de 100% eficácia são raramente verdadeiros"
                    )
                elif issue_type == "sem_citacao":
                    warnings.append(
                        f"Afirmação científica sem citação aparente: '{matches[0]}'"
                    )
                    suggestions.append("Adicione referências bibliográficas para afirmações científicas")
                elif issue_type == "estatistica_suspeita":
                    warnings.append(
                        f"Estatística possivelmente exagerada: '{matches[0]}'"
                    )
                elif issue_type == "nome_suspeito":
                    warnings.append(
                        f"Nome longo detectado (verifique se é real): '{matches[0]}'"
                    )
        
        # 2. Verificar citações para termos científicos
        for term in cls.CITATION_REQUIRED_TERMS:
            if term.lower() in content_lower:
                term_pos = content_lower.find(term.lower())
                # Verificar se há citação num raio de 100 caracteres
                surrounding = content[max(0, term_pos-50):min(len(content), term_pos+len(term)+100)]
                if not re.search(r'[\[\(]\d+[\]\)]', surrounding):
                    warnings.append(
                        f"Termo '{term}' usado sem citação próxima"
                    )
        
        # 3. Verificar dosagens (básico)
        for drug, valid_doses in cls.COMMON_DOSAGES.items():
            if drug in content_lower:
                # Encontrar dosagens mencionadas
                dose_pattern = rf"{drug}\s+(\d+(?:\.\d+)?)\s*(mg|g|%)"
                matches = re.findall(dose_pattern, content, re.IGNORECASE)
                for dose_num, unit in matches:
                    dose_str = f"{dose_num}{unit}"
                    if dose_str not in valid_doses:
                        warnings.append(
                            f"Dosagem de {drug} ({dose_str}) pode estar incorreta. Verificar."
                        )
        
        # 4. Calcular confiança
        penalty = len(critical_issues) * 25 + len(warnings) * 10
        confidence = max(0, 100 - penalty)
        
        is_valid = len(critical_issues) == 0 and confidence >= 50
        
        return ValidationResult(
            is_valid=is_valid,
            confidence=confidence,
            warnings=warnings,
            critical_issues=critical_issues,
            suggestions=list(set(suggestions))  # Remove duplicatas
        )
    
    @classmethod
    def sanitize_output(cls, content: str, add_disclaimers: bool = True) -> str:
        """
        Remove ou sinaliza conteúdo problemático.
        
        Args:
            content: Texto a ser sanitizado
            add_disclaimers: Se deve adicionar avisos inline
            
        Returns:
            Texto sanitizado
        """
        result = content
        
        if add_disclaimers:
            # Adicionar aviso para claims absolutos
            for pattern, issue_type in cls.SUSPICIOUS_PATTERNS:
                if issue_type == "claim_absoluto":
                    result = re.sub(
                        pattern,
                        r"⚠️ **[Verificar]** \g<0>",
                        result,
                        flags=re.IGNORECASE
                    )
        
        # Adicionar disclaimer geral se houver muitos problemas
        validation = cls.validate_content(content)
        if validation.confidence < 70:
            disclaimer = (
                "\n\n---\n"
                "⚠️ **Aviso**: Este conteúdo foi gerado por IA e pode conter imprecisões. "
                "Sempre verifique informações clínicas com fontes confiáveis antes de aplicar na prática.\n"
            )
            if disclaimer not in result:
                result += disclaimer
        
        return result
    
    @classmethod
    def get_quality_adjustment(cls, content: str) -> int:
        """
        Calcula ajuste de qualidade baseado na validação.
        
        Returns:
            Ajuste a ser aplicado ao score de qualidade (-100 a 0)
        """
        validation = cls.validate_content(content)
        
        # Penalidades
        critical_penalty = len(validation.critical_issues) * 20
        warning_penalty = len(validation.warnings) * 5
        
        return -min(100, critical_penalty + warning_penalty)


class ValidatedArtifact(BaseModel):
    """
    Artefato com validação anti-alucinação automática.
    
    Uso:
        artifact = ValidatedArtifact(content="...")
        # Validação acontece automaticamente
    """
    content: str
    validation_result: Optional[ValidationResult] = None
    was_sanitized: bool = False
    
    @field_validator('content')
    @classmethod
    def validate_and_sanitize(cls, v: str) -> str:
        """Valida e opcionalmente sanitiza o conteúdo."""
        result = HallucinationGuard.validate_content(v)
        
        if not result.is_valid:
            logger.warning(
                f"Content validation failed. Confidence: {result.confidence}%. "
                f"Critical issues: {len(result.critical_issues)}, Warnings: {len(result.warnings)}"
            )
            
            # Sanitizar se tiver problemas críticos
            if result.critical_issues:
                return HallucinationGuard.sanitize_output(v)
        
        return v
    
    def model_post_init(self, __context) -> None:
        """Executa validação após inicialização."""
        self.validation_result = HallucinationGuard.validate_content(self.content)
        
        # Marcar como sanitizado se o conteúdo foi modificado
        original_content = self.__dict__.get('_original_content', self.content)
        self.was_sanitized = original_content != self.content
