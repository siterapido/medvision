# Estratégia de Teste Integrado - Fluxo do Chat Principal

## 1. Objetivo
Validar a robustez, performance e qualidade do fluxo de conversação do OdontoGPTWeb, garantindo que a orquestração entre agentes (RAG, Research, Summary) ocorra de forma fluida, com artefatos de dados consistentes e personalidade adequada.

## 2. Escopo do Teste
- **Componente Alvo:** `app/api/chat/route.ts` (e orquestradores associados).
- **Agentes Envolvidos:**
  - `odonto-research`: Busca de informações técnicas.
  - `odonto-summary`: Síntese para o paciente.
  - `code-reviewer`: Validação estrutural de respostas (JSON/Tools).
  - `performance-optimizer`: Monitoramento de latência.
  - `frontend-specialist`: Verificação de renderização de componentes UI (Artifacts).

## 3. Matriz de Execução (Roles)

| Agente Virtual | Responsabilidade no Teste | Critério de Sucesso |
|---|---|---|
| **User Proxy** | Simular input complexo ("Preciso de um implante, mas tenho diabetes. É perigoso?") | Input natural, com ambiguidades propositais. |
| **Orchestrator** | Roteamento da intenção | Deve identificar necessidade de pesquisa externa vs. conhecimento interno. |
| **Odonto-Research** | Buscar contraindicações de implantes em diabéticos | Retornar fontes confiáveis e citar riscos reais. |
| **Odonto-Summary** | Gerar resposta final | Tom empático, linguagem acessível, estrutura clara. |
| **Validator (System)** | Análise de Output | JSON válido, `tool_calls` corretas, tempo de resposta < 3s. |

## 4. Procedimento de Teste

### Passo 1: Injeção do Prompt (Simulação)
Enviar payload para o endpoint de chat simulando um paciente ansioso.

```json
{
  "messages": [
    { "role": "user", "content": "Doutor, tenho diabetes controlada e quero fazer implante. Minha vizinha disse que não pega. É verdade?" }
  ]
}
```

### Passo 2: Verificação de Latência (Performance)
O agente `performance-optimizer` deve analisar os logs de execução:
- **Time to First Token (TTFT):** Alvo < 800ms.
- **Latência Total:** Alvo < 5s (para pesquisas complexas).
- **Overhead de Agentes:** Tempo gasto na troca de contexto entre Research e Summary.

### Passo 3: Análise de Personalidade (Qualidade)
O output deve ser submetido a uma avaliação de heurística (simulada pelo `frontend-specialist`):
- **Empatia:** A resposta valida o medo do paciente?
- **Clareza:** Evita "odontês" desnecessário?
- **Autoridade:** Cita que a decisão final é do dentista presencial?

### Passo 4: Validação Estrutural (Code Review)
O `code-reviewer` verifica se os artefatos gerados (ex: lista de recomendações) seguem o schema:
- Verificação de tipagem no JSON de resposta.
- Verificação se as citações bibliográficas estão formatadas corretamente.

## 5. Artefatos Gerados e Contexto
O teste deve produzir um relatório unificado (`.context/reports/chat-flow-test-run-001.md`) contendo:
1.  **Transcript da Conversa.**
2.  **Trace de Latência:** Gráfico ou tabela de tempos.
3.  **Relatório de Validação JSON:** Pass/Fail.
4.  **Feedback de Personalidade:** Score 1-5.

## 6. Ação Corretiva
Se a latência > 5s ou a validação falhar:
- Acionar `performance-optimizer` para sugerir cache ou simplificação do prompt de sistema.
- Acionar `bug-fixer` se o JSON vier quebrado.
