"""
Ferramentas para geração de questões e simulados educacionais
Suporta múltipla escolha, dissertativas e simulados completos
"""

from typing import Dict, Any, List, Optional
from agno.tools import tool
import logging
import random

logger = logging.getLogger(__name__)


@tool
def generate_multiple_choice(
    topic: str,
    difficulty: str = "medium",
    specialty: Optional[str] = None,
    num_options: int = 5
) -> str:
    """
    Gera questão de múltipla escolha com explicações pedagógicas.
    
    A questão incluirá:
    - Enunciado contextualizado
    - Alternativas plausíveis
    - Gabarito correto
    - Explicação para cada alternativa
    - Nível de dificuldade
    
    Args:
        topic (str): Tema da questão (ex: "periodontite crônica", "tratamento endodôntico")
        difficulty (str): Nível de dificuldade ("easy", "medium", "hard")
        specialty (Optional[str]): Especialidade odontológica
        num_options (int): Número de alternativas (padrão: 5)
    
    Returns:
        str: Questão formatada em markdown com gabarito e explicações
    """
    try:
        # Template de resposta
        question_template = f"""
## 📝 Questão de Múltipla Escolha

**Tema:** {topic}
**Especialidade:** {specialty or 'Geral'}
**Dificuldade:** {_translate_difficulty(difficulty)}

---

### Enunciado

Use o conhecimento sobre {topic} para gerar uma questão contextualizada e clinicamente relevante.
O enunciado deve apresentar um caso clínico ou situação prática.

**INSTRUÇÕES PARA GERAÇÃO:**
1. Crie um enunciado descritivo (2-4 linhas)
2. Formule a pergunta direta
3. Elabore {num_options} alternativas plausíveis
4. Identifique a alternativa correta
5. Forneça explicação pedagógica para CADA alternativa

**FORMATO ESPERADO:**

**Enunciado:**
[Caso clínico contextualizado sobre {topic}]

**Pergunta:**
[Pergunta direta relacionada ao enunciado]

**Alternativas:**
a) [Alternativa plausível]
b) [Alternativa plausível]
c) [Alternativa correta]
d) [Alternativa plausível]
e) [Alternativa plausível]

**Gabarito:** [Letra da alternativa correta]

**Explicações:**

a) **INCORRETA.** [Por que está errada e conceito envolvido]

b) **INCORRETA.** [Por que está errada e conceito envolvido]

c) **CORRETA.** [Por que é a resposta certa, com fundamentação teórica]

d) **INCORRETA.** [Por que está errada e conceito envolvido]

e) **INCORRETA.** [Por que está errada e conceito envolvido]

**Dicas de estudo:**
- [Conceito-chave 1]
- [Conceito-chave 2]
- [Referência bibliográfica ou tema para aprofundamento]

---

*Dificuldade: {_translate_difficulty(difficulty)} | Especialidade: {specialty or 'Geral'}*
"""
        
        return question_template.strip()
    
    except Exception as e:
        logger.error(f"Erro ao gerar questão de múltipla escolha: {str(e)}")
        return f"Erro ao gerar questão: {str(e)}"


@tool
def generate_essay_question(
    topic: str,
    specialty: Optional[str] = None,
    expected_length: int = 500
) -> str:
    """
    Gera questão dissertativa com critérios de avaliação.
    
    Args:
        topic (str): Tema da questão dissertativa
        specialty (Optional[str]): Especialidade odontológica
        expected_length (int): Extensão esperada da resposta em palavras (padrão: 500)
    
    Returns:
        str: Questão dissertativa formatada com rubrica de avaliação
    """
    try:
        question_template = f"""
## 📄 Questão Dissertativa

**Tema:** {topic}
**Especialidade:** {specialty or 'Geral'}
**Extensão esperada:** {expected_length} palavras

---

### Enunciado

**INSTRUÇÕES PARA GERAÇÃO:**
1. Crie uma questão que exija análise crítica e síntese
2. Incentive aplicação prática do conhecimento
3. Permita demonstração de raciocínio clínico

**Questão:**
[Elabore uma questão dissertativa sobre {topic} que requeira:
- Definição de conceitos
- Explicação de processos/mecanismos
- Aplicação clínica
- Análise crítica ou comparação]

---

### Critérios de Avaliação (Rubrica)

| Critério | Peso | Descrição |
|----------|------|-----------|
| **Conhecimento teórico** | 30% | Demonstra domínio dos conceitos fundamentais sobre {topic} |
| **Raciocínio clínico** | 30% | Aplica conhecimento a situações práticas/clínicas |
| **Organização e clareza** | 20% | Texto bem estruturado, coeso e objetivo |
| **Fundamentação** | 20% | Cita evidências, estudos ou protocolos quando aplicável |

---

### Resposta Modelo (Resumida)

**ESTRUTURA SUGERIDA:**

1. **Introdução (10%):** Definição do tema e contexto
2. **Desenvolvimento (70%):** 
   - Conceitos teóricos fundamentais
   - Aplicação clínica/prática
   - Exemplos ou casos quando relevante
3. **Conclusão (20%):** Síntese e considerações finais

**Pontos-chave que devem ser abordados:**
- [Conceito fundamental 1]
- [Conceito fundamental 2]
- [Aplicação clínica/prática]
- [Evidências ou recomendações]

---

*Extensão: {expected_length} palavras | Especialidade: {specialty or 'Geral'}*
"""
        
        return question_template.strip()
    
    except Exception as e:
        logger.error(f"Erro ao gerar questão dissertativa: {str(e)}")
        return f"Erro ao gerar questão dissertativa: {str(e)}"


@tool
def create_exam(
    specialty: str,
    num_questions: int = 20,
    difficulty_mix: Optional[str] = None,
    exam_type: str = "residency"
) -> str:
    """
    Cria simulado completo com gabarito e explicações.
    
    Args:
        specialty (str): Especialidade odontológica do simulado
        num_questions (int): Número total de questões (padrão: 20)
        difficulty_mix (Optional[str]): Distribuição de dificuldade em formato JSON
            Exemplo: '{"easy": 5, "medium": 10, "hard": 5}'
            Se None, usa distribuição padrão
        exam_type (str): Tipo de simulado ("enade", "residency", "custom")
    
    Returns:
        str: Simulado completo formatado em markdown
    """
    try:
        # Parse difficulty mix ou usar padrão
        if difficulty_mix:
            import json
            try:
                mix = json.loads(difficulty_mix)
            except:
                mix = {"easy": 5, "medium": 10, "hard": 5}
        else:
            # Distribuição padrão
            if exam_type == "enade":
                mix = {"easy": 8, "medium": 10, "hard": 2}
            elif exam_type == "residency":
                mix = {"easy": 3, "medium": 10, "hard": 7}
            else:  # custom
                # Distribuição balanceada
                easy_count = num_questions // 4
                hard_count = num_questions // 4
                medium_count = num_questions - easy_count - hard_count
                mix = {"easy": easy_count, "medium": medium_count, "hard": hard_count}
        
        exam_template = f"""
# 📋 Simulado: {specialty.title()}

**Tipo de Prova:** {_translate_exam_type(exam_type)}
**Total de Questões:** {num_questions}
**Distribuição de Dificuldade:**
- Fácil: {mix.get('easy', 0)} questões
- Médio: {mix.get('medium', 0)} questões
- Difícil: {mix.get('hard', 0)} questões

---

## Instruções

1. Leia atentamente cada questão antes de responder
2. Escolha apenas UMA alternativa por questão
3. Após finalizar, confira suas respostas com o gabarito
4. Revise as explicações para aprender com os erros

**Tempo sugerido:** {num_questions * 3} minutos ({num_questions} questões × 3 min)

---

## 📝 Questões

**INSTRUÇÕES PARA GERAÇÃO:**

Gere {num_questions} questões de múltipla escolha sobre {specialty} seguindo a distribuição:
- {mix.get('easy', 0)} questões de nível FÁCIL
- {mix.get('medium', 0)} questões de nível MÉDIO  
- {mix.get('hard', 0)} questões de nível DIFÍCIL

Para cada questão, inclua:
1. Número da questão
2. Enunciado contextualizado
3. 5 alternativas (a, b, c, d, e)
4. Indicação de dificuldade ao final

**FORMATO:**

---

### Questão 1 (Fácil)

**Enunciado:** [Caso clínico ou contexto]

**Pergunta:** [Questão direta]

a) [Alternativa]
b) [Alternativa]
c) [Alternativa]
d) [Alternativa]
e) [Alternativa]

---

### Questão 2 (Médio)

[... e assim por diante até completar {num_questions} questões]

---

## ✅ Gabarito

| Questão | Resposta | Dificuldade |
|---------|----------|-------------|
| 1       | [X]      | Fácil       |
| 2       | [X]      | Médio       |
| ...     | ...      | ...         |

---

## 📚 Explicações Detalhadas

### Questão 1
**Gabarito:** [X]

**Explicações por alternativa:**
- a) **INCORRETA.** [Explicação]
- b) **INCORRETA.** [Explicação]
- c) **CORRETA.** [Explicação com fundamentação]
- d) **INCORRETA.** [Explicação]
- e) **INCORRETA.** [Explicação]

**Conceito-chave:** [Tema principal abordado]

---

[Repetir para todas as questões]

---

## 📊 Avaliação do Desempenho

Após conferir suas respostas:

| Acertos | Aproveitamento | Classificação |
|---------|----------------|---------------|
| {int(num_questions * 0.9)}+ | 90-100% | Excelente |
| {int(num_questions * 0.7)}-{int(num_questions * 0.89)} | 70-89% | Bom |
| {int(num_questions * 0.5)}-{int(num_questions * 0.69)} | 50-69% | Regular |
| < {int(num_questions * 0.5)} | < 50% | Necessita mais estudo |

---

*Simulado gerado para {specialty} | Tipo: {_translate_exam_type(exam_type)}*
"""
        
        return exam_template.strip()
    
    except Exception as e:
        logger.error(f"Erro ao criar simulado: {str(e)}")
        return f"Erro ao criar simulado: {str(e)}"


def _translate_difficulty(difficulty: str) -> str:
    """Traduz nível de dificuldade para português"""
    translations = {
        "easy": "Fácil",
        "medium": "Médio",
        "hard": "Difícil"
    }
    return translations.get(difficulty.lower(), difficulty)


def _translate_exam_type(exam_type: str) -> str:
    """Traduz tipo de simulado para português"""
    translations = {
        "enade": "ENADE (Exame Nacional de Desempenho)",
        "residency": "Prova de Residência",
        "custom": "Simulado Personalizado"
    }
    return translations.get(exam_type.lower(), exam_type)


# Lista de ferramentas para exportação
QUESTION_TOOLS = [
    generate_multiple_choice,
    generate_essay_question,
    create_exam,
]
