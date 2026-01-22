"""
Ferramentas para templates e revisão de escrita acadêmica
Suporta TCCs, artigos científicos e revisão de textos
"""

from typing import Dict, Any, List, Optional
from agno.tools import tool
import logging

logger = logging.getLogger(__name__)


@tool
def generate_tcc_structure(
    specialty: str,
    research_type: str = "literature_review"
) -> str:
    """
    Gera estrutura completa de TCC (Trabalho de Conclusão de Curso).
    
    Tipos de pesquisa suportados:
    - literature_review: Revisão de literatura
    - clinical_case: Estudo de caso clínico
    - experimental: Pesquisa experimental
    - field_research: Pesquisa de campo
    
    Args:
        specialty (str): Especialidade odontológica do TCC
        research_type (str): Tipo de pesquisa (padrão: "literature_review")
    
    Returns:
        str: Estrutura completa do TCC formatada em markdown
    """
    try:
        tcc_template = f"""
# 📑 Estrutura de TCC em {specialty.title()}

**Tipo de Pesquisa:** {_translate_research_type(research_type)}
**Normas:** ABNT (Associação Brasileira de Normas Técnicas)

---

## 📋 Elementos Pré-Textuais

### 1. Capa
- Nome da instituição
- Nome do curso
- Nome do autor
- Título do TCC
- Subtítulo (se houver)
- Local (cidade)
- Ano

### 2. Folha de Rosto
- Nome do autor
- Título
- Natureza do trabalho (TCC para obtenção do título de...)
- Nome do orientador
- Local e ano

### 3. Folha de Aprovação
- Nome do autor
- Título
- Banca examinadora (orientador + 2 membros)
- Data de aprovação
- Assinaturas

### 4. Dedicatória (Opcional)
- Breve dedicatória pessoal

### 5. Agradecimentos (Opcional)
- Agradecimentos a orientadores, instituições, familiares

### 6. Epígrafe (Opcional)
- Citação que inspire ou contextualize o trabalho

### 7. Resumo (Obrigatório)
**Extensão:** 150-500 palavras
**Conteúdo:**
- Contextualização breve
- Objetivo do estudo
- Metodologia (resumida)
- Principais resultados
- Conclusão principal

**Palavras-chave:** 3-5 termos descritivos

### 8. Abstract (Obrigatório)
- Tradução do resumo para inglês
- Keywords: 3-5 termos em inglês

### 9. Lista de Ilustrações (se aplicável)
- Figuras, quadros, gráficos

### 10. Lista de Tabelas (se aplicável)

### 11. Lista de Abreviaturas e Siglas (se aplicável)

### 12. Sumário (Obrigatório)
- Índice completo com paginação

---

## 📖 Elementos Textuais

### 1. INTRODUÇÃO (3-5 páginas)

**1.1 Contextualização do Tema**
- Apresentação do tema em {specialty}
- Justificativa da relevância do estudo
- Problema de pesquisa identificado

**1.2 Objetivos**

**1.2.1 Objetivo Geral**
- Objetivo principal do TCC (1 frase)

**1.2.2 Objetivos Específicos**
- 3-5 objetivos específicos que detalham o objetivo geral

**1.3 Justificativa**
- Por que este estudo é importante?
- Contribuições para a área de {specialty}
- Impacto esperado (acadêmico, clínico, social)

**1.4 Estrutura do Trabalho**
- Breve descrição dos capítulos

---

### 2. REVISÃO DE LITERATURA (15-25 páginas)

{_get_literature_review_structure(specialty, research_type)}

---

### 3. {_get_methodology_title(research_type)} (5-10 páginas)

{_get_methodology_structure(research_type)}

---

### 4. {_get_results_title(research_type)} (10-15 páginas)

{_get_results_structure(research_type)}

---

### 5. DISCUSSÃO (8-12 páginas)

**5.1 Análise dos Resultados**
- Interpretação dos achados principais
- Comparação com literatura existente
- Pontos de convergência e divergência

**5.2 Implicações Clínicas**
- Aplicabilidade prática dos resultados
- Relevância para a prática odontológica

**5.3 Limitações do Estudo**
- Limitações metodológicas
- Vieses potenciais
- Aspectos que limitam generalizações

**5.4 Sugestões para Pesquisas Futuras**
- Lacunas identificadas
- Direções para novos estudos

---

### 6. CONCLUSÃO (2-3 páginas)

- Síntese dos principais achados
- Retomada dos objetivos (foram alcançados?)
- Considerações finais
- Contribuições do estudo para {specialty}

**IMPORTANTE:** Não introduzir informações novas na conclusão

---

## 📚 Elementos Pós-Textuais

### 1. REFERÊNCIAS (Obrigatório)
- Lista completa de obras citadas
- Formatação conforme ABNT NBR 6023:2018
- Ordem alfabética por autor

**Mínimo recomendado:** 30-50 referências para TCC
**Distribuição sugerida:**
- 60% artigos científicos (últimos 10 anos)
- 20% livros e capítulos
- 20% outros (teses, guidelines, etc.)

### 2. APÊNDICES (se aplicável)
- Materiais elaborados pelo autor
- Exemplos: questionários desenvolvidos, protocolos criados

### 3. ANEXOS (se aplicável)
- Materiais de terceiros
- Exemplos: pareceres do CEP, autorizações

---

## 📏 Formatação Geral (ABNT)

**Fonte:** Times New Roman ou Arial, tamanho 12
**Espaçamento:** 1,5 entre linhas
**Margens:**
- Superior: 3 cm
- Inferior: 2 cm
- Esquerda: 3 cm
- Direita: 2 cm

**Paginação:** 
- Elementos pré-textuais: algarismos romanos (i, ii, iii...)
- Elementos textuais e pós-textuais: algarismos arábicos (1, 2, 3...)

**Citações:**
- Curtas (até 3 linhas): dentro do texto, entre aspas
- Longas (mais de 3 linhas): parágrafo próprio, recuo 4 cm, fonte 10

**Extensão Total Sugerida:** 50-80 páginas

---

## 💡 Dicas Importantes

1. **Comece pela Revisão de Literatura** - Base teórica é fundamental
2. **Defina objetivos claros e alcançáveis** - Evite objetivos muito amplos
3. **Metodologia detalhada** - Permita que outro pesquisador replique
4. **Citações adequadas** - Todo dado/afirmação deve ter fonte
5. **Revisão ortográfica e gramatical** - Fundamental para qualidade
6. **Orientador** - Mantenha comunicação constante
7. **Cronograma** - Planeje com antecedência (6-12 meses)

---

*Estrutura gerada para TCC em {specialty} | Tipo: {_translate_research_type(research_type)}*
"""
        
        return tcc_template.strip()
    
    except Exception as e:
        logger.error(f"Erro ao gerar estrutura de TCC: {str(e)}")
        return f"Erro ao gerar estrutura de TCC: {str(e)}"


@tool
def generate_article_template(
    article_type: str = "original_research",
    specialty: Optional[str] = None
) -> str:
    """
    Gera template de artigo científico seguindo estrutura IMRAD.
    
    Tipos de artigo suportados:
    - original_research: Artigo original de pesquisa
    - review: Artigo de revisão
    - case_report: Relato de caso clínico
    - systematic_review: Revisão sistemática
    
    Args:
        article_type (str): Tipo de artigo (padrão: "original_research")
        specialty (Optional[str]): Especialidade odontológica
    
    Returns:
        str: Template do artigo formatado em markdown
    """
    try:
        specialty_text = f" em {specialty}" if specialty else ""
        
        article_template = f"""
# 📄 Template de Artigo Científico{specialty_text}

**Tipo:** {_translate_article_type(article_type)}
**Estrutura:** IMRAD (Introduction, Methods, Results, And Discussion)

---

## 📋 Metadados do Artigo

**Título:**
- Conciso e informativo (máximo 20 palavras)
- Evitar abreviações
- Incluir palavras-chave principais

**Título Resumido (Running Title):**
- Máximo 40 caracteres

**Autores:**
- Nome completo de cada autor
- Afiliações institucionais
- ORCID de cada autor
- Contribuições específicas de cada autor

**Autor Correspondente:**
- Nome
- E-mail
- Endereço completo
- Telefone

---

## 📝 ABSTRACT / RESUMO

{_get_abstract_structure(article_type)}

---

## 1. INTRODUCTION / INTRODUÇÃO (2-3 páginas)

### 1.1 Background / Contexto
- Estado atual do conhecimento sobre o tema
- Epidemiologia (se relevante)
- Importância clínica/científica

### 1.2 Knowledge Gap / Lacuna do Conhecimento
- O que ainda não sabemos?
- Que pergunta este estudo responde?
- Por que este estudo é necessário?

### 1.3 Objective / Objetivo
- Objetivo claro e específico do estudo
- Hipótese (se aplicável)

**Última frase:** Deve apresentar o objetivo do estudo

---

## 2. MATERIALS AND METHODS / MATERIAIS E MÉTODOS (3-5 páginas)

{_get_methods_structure(article_type, specialty)}

---

## 3. RESULTS / RESULTADOS (4-6 páginas)

{_get_article_results_structure(article_type)}

---

## 4. DISCUSSION / DISCUSSÃO (5-7 páginas)

### 4.1 Summary of Main Findings / Resumo dos Principais Achados
- Recapitular brevemente os resultados principais
- Responder à pergunta de pesquisa

### 4.2 Interpretation / Interpretação
- O que os resultados significam?
- Como se comparam com a literatura?
- Mecanismos biológicos/clínicos envolvidos

### 4.3 Comparison with Previous Studies / Comparação com Estudos Anteriores
- Concordâncias e discordâncias
- Possíveis explicações para diferenças

### 4.4 Clinical Implications / Implicações Clínicas
- Aplicabilidade prática
- Impacto na prática odontológica
- Recomendações baseadas nos achados

### 4.5 Strengths and Limitations / Pontos Fortes e Limitações
- **Pontos fortes:** Desenho metodológico, amostra, etc.
- **Limitações:** Vieses, restrições, generalizabilidade

### 4.6 Future Research / Pesquisas Futuras
- Direções para novos estudos
- Questões não respondidas

---

## 5. CONCLUSION / CONCLUSÃO (1 parágrafo)

- Resposta direta ao objetivo
- Síntese dos principais achados
- Implicação prática principal
- **NÃO** incluir informações novas

---

## 📚 REFERENCES / REFERÊNCIAS

- Formatação: Vancouver (ICMJE) ou outro estilo da revista-alvo
- Numeração: Ordem de citação no texto
- Quantidade recomendada: 30-50 para artigo original

**Distribuição sugerida:**
- 70%+ artigos dos últimos 5 anos
- Artigos clássicos/seminais quando relevantes
- Evitar excesso de autocitações

---

## 📊 TABLES AND FIGURES / TABELAS E FIGURAS

### Diretrizes
- **Tabelas:** Dados numéricos, comparações
- **Figuras:** Imagens, gráficos, fluxogramas

### Boas Práticas
- Cada tabela/figura deve ser autoexplicativa
- Legendas completas (o que, quando, onde, como)
- Citar todas as tabelas/figuras no texto
- Qualidade de imagem: mínimo 300 dpi

---

## 📋 SUPPLEMENTARY MATERIAL / MATERIAL SUPLEMENTAR (opcional)

- Dados brutos
- Análises estatísticas adicionais
- Protocolos detalhados
- Vídeos de procedimentos

---

## 🔍 CHECKLIST PRÉ-SUBMISSÃO

### Conteúdo
- [ ] Título claro e conciso
- [ ] Abstract segue limite de palavras da revista
- [ ] Objetivos claramente declarados
- [ ] Métodos reproduzíveis
- [ ] Resultados objetivos, sem interpretação
- [ ] Discussão aborda limitações
- [ ] Conclusão alinhada com objetivos
- [ ] Todas as referências citadas no texto

### Formatação
- [ ] Seguir guia de autores da revista-alvo
- [ ] Figuras em alta resolução
- [ ] Tabelas formatadas corretamente
- [ ] Referências no estilo correto

### Ética
- [ ] Aprovação do Comitê de Ética (se aplicável)
- [ ] Consentimento informado (pesquisa com humanos)
- [ ] Declaração de conflito de interesses
- [ ] Fontes de financiamento declaradas

---

## 💡 Dicas para Publicação

1. **Escolha a revista certa** - Escopo alinhado com seu estudo
2. **Siga rigorosamente o guia de autores** - Formatação correta evita desk rejection
3. **Peer review constructivo** - Peça para colegas revisarem antes de submeter
4. **Cover letter forte** - Destaque originalidade e importância
5. **Responda revisores com respeito** - Mesmo se discordar, seja profissional

---

*Template gerado para {_translate_article_type(article_type)}{specialty_text}*
"""
        
        return article_template.strip()
    
    except Exception as e:
        logger.error(f"Erro ao gerar template de artigo: {str(e)}")
        return f"Erro ao gerar template de artigo: {str(e)}"


@tool
def review_academic_text(
    text: str,
    review_type: str = "full"
) -> str:
    """
    Revisa texto acadêmico e fornece sugestões de melhoria.
    
    Tipos de revisão:
    - full: Revisão completa (gramática, estrutura, rigor científico)
    - grammar: Apenas correções gramaticais e ortográficas
    - structure: Foco em estrutura e organização
    - scientific_rigor: Foco em rigor científico e clareza

    Args:
        text (str): Texto a ser revisado (máximo 5000 caracteres recomendado)
        review_type (str): Tipo de revisão (padrão: "full")
    
    Returns:
        str: Análise detalhada com sugestões de melhoria
    """
    try:
        if len(text) > 10000:
            return "⚠️ Texto muito longo. Para revisão detalhada, envie trechos de até 5000 caracteres por vez."
        
        review_template = f"""
## 📝 Revisão de Texto Acadêmico

**Tipo de revisão:** {_translate_review_type(review_type)}
**Extensão do texto:** {len(text)} caracteres / ~{len(text.split())} palavras

---

### 📄 Texto Original

{text[:500]}{"..." if len(text) > 500 else ""}

---

### ✏️ Análise e Sugestões

**INSTRUÇÕES PARA REVISÃO {review_type.upper()}:**

{_get_review_instructions(review_type)}

**FORMATO DE RESPOSTA:**

#### 1. Resumo Executivo
- **Qualidade geral:** [Excelente / Boa / Regular / Necessita revisão]
- **Pontos fortes:** [2-3 pontos]
- **Principais melhorias necessárias:** [2-3 pontos]

#### 2. Análise Detalhada

{_get_detailed_review_sections(review_type)}

#### 3. Texto Revisado (sugestão)

[Forneça uma versão melhorada do texto com as correções aplicadas]

#### 4. Comentários Específicos

- **Linha/Trecho 1:** [Comentário e sugestão]
- **Linha/Trecho 2:** [Comentário e sugestão]
[... conforme necessário]

#### 5. Recomendações Finais

- [ ] [Ação 1 a ser tomada]
- [ ] [Ação 2 a ser tomada]
- [ ] [Ação 3 a ser tomada]

---

*Revisão tipo: {_translate_review_type(review_type)}*
"""
        
        return review_template.strip()
    
    except Exception as e:
        logger.error(f"Erro ao revisar texto: {str(e)}")
        return f"Erro ao revisar texto: {str(e)}"


@tool
def suggest_methodology(
    research_question: str,
    specialty: str
) -> str:
    """
    Sugere metodologias apropriadas para questão de pesquisa.
    
    Args:
        research_question (str): Questão de pesquisa a ser respondida
        specialty (str): Especialidade odontológica
    
    Returns:
        str: Sugestões de metodologia formatadas
    """
    try:
        methodology_template = f"""
## 🔬 Sugestões de Metodologia

**Questão de Pesquisa:** {research_question}
**Especialidade:** {specialty}

---

**INSTRUÇÕES PARA GERAÇÃO:**

Com base na questão de pesquisa fornecida, sugira metodologias apropriadas incluindo:

### 1. Tipo de Estudo Recomendado

Analise a questão e sugira um ou mais dos seguintes tipos:

- **Experimental:** Ensaio clínico randomizado, estudo laboratorial in vitro/in vivo
- **Observacional:** Coorte, caso-controle, transversal
- **Descritivo:** Série de casos, relato de caso
- **Revisão:** Revisão sistemática, meta-análise, revisão narrativa

**Recomendação principal:** [Tipo de estudo + justificativa]
**Alternativas:** [Outros tipos possíveis]

---

### 2. População e Amostra

**População-alvo:** [Descrever população]
**Critérios de inclusão:** [3-5 critérios]
**Critérios de exclusão:** [3-5 critérios]
**Tamanho amostral:** [Estimativa + método de cálculo  se aplicável]
**Amostragem:** [Tipo de amostragem recomendado]

---

### 3. Desenho do Estudo

**Esquema visual:**
```
[Descrever fluxo do estudo passo a passo]
Exemplo:
Recrutamento → Randomização → Grupo A (intervenção) / Grupo B (controle) → Seguimento → Análise
```

**Duração:** [Tempo estimado do estudo]
**Fases:** [Descrever fases principais]

---

### 4. Variáveis

**Variável dependente (desfecho):**
- [Principal desfecho a ser medido]
- Como será medido: [Instrumento/método]

**Variáveis independentes (exposição/intervenção):**
- [Variável 1]
- [Variável 2]

**Variáveis de confusão/controle:**
- [Variável 1]
- [Variável 2]

---

### 5. Procedimentos e Intervenções

**Protocolo detalhado:**

1. [Passo 1 do procedimento]
2. [Passo 2 do procedimento]
3. [... ]

**Materiais necessários:**
- [Material 1]
- [Material 2]

**Equipamentos:**
- [Equipamento 1]
- [Equipamento 2]

---

### 6. Análise Estatística

**Testes estatísticos sugeridos:**
- Para comparação de grupos: [Teste t, ANOVA, Mann-Whitney, etc.]
- Para associações: [Qui-quadrado, correlação, regressão]
- Nível de significância: p < 0.05

**Software recomendado:**
- SPSS, R, GraphPad Prism, etc.

---

### 7. Considerações Éticas

- [ ] Submissão ao Comitê de Ética em Pesquisa (CEP)
- [ ] Termo de Consentimento Livre e Esclarecido (TCLE)
- [ ] Registro do ensaio clínico (se aplicável - ClinicalTrials.gov, ReBEC)
- [ ] Protocolo conforme Declaração de Helsinki
- [ ] Proteção de dados (LGPD)

---

### 8. Cronograma Estimado

| Fase | Duração | Descrição |
|------|---------|-----------|
| Aprovação ética | 2-3 meses | Submissão e aprovação CEP |
| Recrutamento | [X] meses | Seleção de participantes |
| Coleta de dados | [X] meses | Execução do protocolo |
| Análise | 1-2 meses | Análise estatística |
| Redação | 2-3 meses | Escrita do artigo/TCC |
| **Total** | **[X-Y] meses** | |

---

### 9. Limitações Esperadas

- [Limitação potencial 1]
- [Limitação potencial 2]
- [Como mitigar estas limitações]

---

### 10. Referências Metodológicas Úteis

- [Artigo/livro de metodologia relevante para este tipo de estudo]
- [Guidelines específicos da área]
- [Checklist apropriado: CONSORT, STROBE, PRISMA, CARE, etc.]

---

*Sugestões geradas para: {specialty} | Questão: {research_question[:100]}...*
"""
        
        return methodology_template.strip()
    
    except Exception as e:
        logger.error(f"Erro ao sugerir metodologia: {str(e)}")
        return f"Erro ao sugerir metodologia: {str(e)}"


# Funções auxiliares para estruturas específicas

def _translate_research_type(research_type: str) -> str:
    translations = {
        "literature_review": "Revisão de Literatura",
        "clinical_case": "Estudo de Caso Clínico",
        "experimental": "Pesquisa Experimental",
        "field_research": "Pesquisa de Campo"
    }
    return translations.get(research_type, research_type)


def _translate_article_type(article_type: str) -> str:
    translations = {
        "original_research": "Artigo Original de Pesquisa",
        "review": "Artigo de Revisão",
        "case_report": "Relato de Caso Clínico",
        "systematic_review": "Revisão Sistemática"
    }
    return translations.get(article_type, article_type)


def _translate_review_type(review_type: str) -> str:
    translations = {
        "full": "Completa",
        "grammar": "Gramatical",
        "structure": "Estrutural",
        "scientific_rigor": "Rigor Científico"
    }
    return translations.get(review_type, review_type)


def _get_literature_review_structure(specialty: str, research_type: str) -> str:
    return f"""
**Objetivo:** Fundamentação teórica do estudo

**2.1 Conceitos Fundamentais**
- Definições e terminologia essencial em {specialty}
- Marco teórico principal

**2.2 Estado da Arte**
- Evolução histórica do tema
- Avanços recentes na literatura
- Consensos e controvérsias

**2.3 [Subtema Específico 1]**
- Aprofundamento em aspecto relevante para o TCC
- Estudos principais sobre o tema

**2.4 [Subtema Específico 2]**
- Outro aspecto importante
- Evidências científicas

**2.5 [Subtema Específico 3]**
- Complementação da fundamentação teórica

**Estrutura:**
- Organização por temas/subtemas (não por autor!)
- Síntese e análise crítica (não apenas descrição)
- Citações diretas e indiretas conforme ABNT
- Mínimo 30-40 referências
"""


def _get_methodology_title(research_type: str) -> str:
    titles = {
        "literature_review": "METODOLOGIA DA REVISÃO",
        "clinical_case": "METODOLOGIA / RELATO DE CASO",
        "experimental": "MATERIAIS E MÉTODOS",
        "field_research": "METODOLOGIA"
    }
    return titles.get(research_type, "METODOLOGIA")


def _get_methodology_structure(research_type: str) -> str:
    base = """
**3.1 Tipo de Estudo**
- Classificação metodológica
- Justificativa da escolha

**3.2 Local e Período**
- Onde o estudo foi realizado
- Quando (período de coleta)
"""
    if research_type == "literature_review":
        return base + """
**3.3 Estratégia de Busca**
- Bases de dados consultadas (PubMed, Scopus, etc.)
- Descritores utilizados (DeCS/MeSH)
- Booleanos e estratégia de busca

**3.4 Critérios de Seleção**
- Critérios de inclusão
- Critérios de exclusão
- Período de publicação considerado

**3.5 Processo de Seleção**
- Triagem de títulos e resumos
- Leitura completa
- Extração de dados
- Fluxograma PRISMA
"""
    else:
        return base + """
**3.3 População e Amostra**
- Critérios de inclusão
- Critérios de exclusão
- Cálculo amostral (quando aplicável)

**3.4 Procedimentos**
- Descrição detalhada dos procedimentos
- Protocolo passo a passo

**3.5 Análise de Dados**
- Métodos estatísticos utilizados
- Nível de significância adotado
- Software estatístico

**3.6 Aspectos Éticos**
- Aprovação do CEP (número do parecer)
- TCLE (quando aplicável)
"""

def _get_results_title(research_type: str) -> str:
    if research_type == "literature_review":
        return "RESULTADOS DA REVISÃO"
    return "RESULTADOS"


def _get_results_structure(research_type: str) -> str:
    if research_type == "literature_review":
        return """
**4.1 Seleção dos Estudos**
- Número de artigos encontrados
- Fluxograma de seleção (PRISMA)
- Artigos incluídos na revisão final

**4.2 Características dos Estudos**
- Quadro resumo dos estudos incluídos
- Principais características metodológicas

**4.3 Síntese dos Achados**
- Organizar por tema/subtema
- Apresentar evidências encontradas
- Tabelas e figuras quando apropriado

**IMPORTANTE:** Apenas apresentar resultados, sem interpretação
"""
    return """
**4.1 Caracterização da Amostra**
- Dados demográficos
- Características relevantes

**4.2 Resultados Principais**
- Organizar por objetivo específico
- Usar tabelas e gráficos
- Apenas dados objetivos (sem interpretação)

**4.3 Análises Complementares**
- Análises secundárias se houver

**IMPORTANTE:**
- Resultados devem ser objetivos e factuals
- Interpretação é para a Discussão
- Todas as tabelas/figuras devem ser citadas no texto
"""


def _get_abstract_structure(article_type: str) -> str:
    return """
**Word count:** 250-300 palavras (verificar requisitos da revista)

**Estrutura (para artigo original):**

**Background/Contexto:** (2-3 frases)
- Estado atual do conhecimento
- Lacuna que o estudo preenche

**Objective/Objetivo:** (1 frase)
- Objetivo claro e específico

**Methods/Métodos:** (3-4 frases)
- Desenho do estudo
- População/amostra
- Principais procedimentos
- Análise estatística

**Results/Resultados:** (4-5 frases)
- Achados principais (com dados quantitativos)
- Resultados mais relevantes

**Conclusion/Conclusão:** (2 frases)
- Resposta ao objetivo
- Implicação clínica principal

**Keywords:** 3-6 palavras-chave (DeCS/MeSH)
"""


def _get_methods_structure(article_type: str, specialty: Optional[str]) -> str:
    specialty_note = f" (específico para {specialty})" if specialty else ""
    
    return f"""
### 2.1 Study Design / Desenho do Estudo
- Tipo de estudo (RCT, coorte, transversal, etc.)
- Registro (ClinicalTrials.gov, ReBEC, etc. - se aplicável)
- Período de condução

### 2.2 Ethical Considerations / Considerações Éticas
- Aprovação do Comitê de Ética (número do parecer)
- Consentimento informado
- Declaração de Helsinki

### 2.3 Participants / Participantes{specialty_note}
- Critérios de inclusão (específicos e detalhados)
- Critérios de exclusão
- Recrutamento (como e onde)
- Sample size calculation / Cálculo amostral

### 2.4 Intervention/Procedures / Intervenção/Procedimentos{specialty_note}
- Protocolo detalhado (reproduzível!)
- Materiais e equipamentos (marca, modelo quando relevante)
- Operator training / Treinamento dos operadores
- Standardization / Padronização de procedimentos

### 2.5 Outcome Measures / Desfechos
- Desfecho primário (claramente definido)
- Desfechos secundários
- Como foram medidos (instrumento, método)
- Timepoints / Momentos de avaliação

### 2.6 Statistical Analysis / Análise Estatística
- Software utilizado
- Testes específicos (descrever qual teste para cada comparação)
- Nível de significância adotado
- Handling of missing data / Tratamento de dados faltantes

### 2.7 Reproducibility / Reprodutibilidade
- Calibração (se aplicável)
- Erro intra e inter-examinador
- Kappa coefficient (quando relevante)
"""


def _get_article_results_structure(article_type: str) -> str:
    return """
### 3.1 Participant Flow / Fluxo de Participantes
- Número de indivíduos triados
- Incluídos/excluídos (com razões)
- Perdas de seguimento
- **Diagrama de fluxo (CONSORT flow diagram)**

### 3.2 Baseline Characteristics / Características Basais
- Tabela com características demográficas
- Homogeneidade entre grupos (se aplicável)

### 3.3 Primary Outcome / Desfecho Primário
- Resultados do desfecho principal
- Dados numéricos (média ± DP, IC95%, valor-p)
- Tabela ou figura principal

### 3.4 Secondary Outcomes / Desfechos Secundários
- Resultados dos desfechos secundários
- Análises complementares

### 3.5 Adverse Events / Eventos Adversos (se aplicável)
- Complicações ou efeitos colaterais
- Frequência e gravidade

**REGRA DE OURO:**
- Apenas fatos e dados (sem interpretação!)
- Toda afirmação com dado numérico
- Toda tabela/figura citada no texto
"""


def _get_review_instructions(review_type: str) -> str:
    instructions = {
        "full": """
Analise os seguintes aspectos:
1. **Gramática e ortografia:** erros, concordância, pontuação
2. **Clareza e coesão:** fluxo de ideias, conectivos, transições
3. **Estrutura:** organização lógica, parágrafos, sequência
4. **Rigor científico:** precisão técnica, uso de termos, embasamento
5. **Estilo acadêmico:** formalidade, objetividade, voz ativa/passiva
""",
        "grammar": """
Foque em:
- Erros ortográficos
- Concordância verbal e nominal
- Pontuação inadequada
- Uso de crase
- Acentuação
""",
        "structure": """
Analise:
- Organização de parágrafos
- Sequência lógica de ideias
- Transições entre parágrafos
- Estrutura de introdução-desenvolvimento-conclusão
- Coesão e coerência textual
""",
        "scientific_rigor": """
Avalie:
- Precisão terminológica
- Uso correto de termos técnicos
- Citações apropriadas
- Afirmações embasadas
- Clareza científica
- Objetividade
"""
    }
    return instructions.get(review_type, instructions["full"])


def _get_detailed_review_sections(review_type: str) -> str:
    if review_type == "grammar":
        return """
**a) Ortografia e Gramática**
- [Lista de erros encontrados com correções]

**b) Pontuação**
- [Problemas de pontuação e sugestões]

**c) Concordância**
- [Erros de concordância e correções]
"""
    elif review_type == "structure":
        return """
**a) Organização Geral**
- [Avaliação da estrutura macro]

**b) Estrutura de Parágrafos**
- [Análise dos parágrafos individuais]

**c) Coesão e Coerência**
- [Fluxo de ideias e transições]
"""
    else:  # full ou scientific_rigor
        return """
**a) Gramática e Estilo** (se review_type = full)
- [Principais problemas gramaticais]

**b) Clareza e Precisão Científica**
- [Termos técnicos, precisão, objetividade]

**c) Estrutura e Organização**
- [Sequência lógica, paragrafação]

**d) Rigor Acadêmico**
- [Citações, embasamento, formalidade]
"""


# Lista de ferramentas para exportação
ACADEMIC_TOOLS = [
    generate_tcc_structure,
    generate_article_template,
    review_academic_text,
    suggest_methodology,
]
