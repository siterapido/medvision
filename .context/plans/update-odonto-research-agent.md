---
status: in_progress
generated: 2026-01-22
agents:
  - type: "feature-developer"
    role: "Implementar as mudanças na configuração do agente e nas ferramentas de IA"
  - type: "code-reviewer"
    role: "Revisar a lógica do prompt de sistema e a integração com OpenRouter"
  - type: "architect-specialist"
    role: "Garantir que a estrutura do artefato esteja alinhada com o sistema de context"
---

# Plano de Atualização do Agente Odonto Research

Este plano descreve as etapas necessárias para atualizar o agente "Odonto Research", permitindo pesquisas científicas avançadas via Perplexity Sonar, análise detalhada de artigos com resumos concisos e geração de artefatos estruturados integrados ao sistema de contexto.

## 1. Objetivos e Escopo

### Objetivos
- **Integração com Perplexity Sonar**: Utilizar o modelo `perplexity/sonar` via OpenRouter para obter os dados mais recentes e precisos da literatura científica.
- **Análise Qualitativa**: O agente deve analisar o conteúdo de cada artigo encontrado, não apenas listar títulos.
- **Resumos Concisos**: Cada artigo deve ter um resumo de exatamente 3 linhas, focando em objetivo, metodologia e conclusão principal.
- **Artefato Consolidado**: Gerar um documento Markdown completo (`research_artifact`) contendo todas as informações, links verificados e referências.
- **Integração IA Context**: Garantir que as informações geradas possam ser indexadas e utilizadas pelo sistema de contexto do projeto.

### Escopo
- Alteração no arquivo `lib/ai/agents/config.ts` (Prompt de Sistema).
- Alteração no arquivo `lib/ai/tools/definitions.ts` (Ferramenta `askPerplexity`).
- Atualização das constantes de modelos em `lib/ai/openrouter.ts`.

## 2. Fases de Implementação

### Fase 1: Atualização de Infraestrutura e Modelos
- [ ] Atualizar `lib/ai/openrouter.ts` para incluir ou confirmar o modelo `perplexity/sonar` (ou o similar "somar" mencionado).
- [ ] Verificar as variáveis de ambiente necessárias para o OpenRouter.
- [ ] Testar a conectividade básica com o modelo via script de teste simples (opcional).

### Fase 2: Refinamento da Lógica do Agente e Ferramentas
- [ ] Modificar o prompt de sistema do agente `odonto-research` em `lib/ai/agents/config.ts`:
    - Instruções explícitas sobre a pesquisa bibliográfica.
    - Regra estrita de resumo de 3 linhas por artigo.
    - Formato de saída para o artefato.
- [ ] Ajustar a ferramenta `askPerplexity` em `lib/ai/tools/definitions.ts` para garantir que ela passe o contexto acadêmico correto e solicite fontes detalhadas.
- [ ] Garantir que a ferramenta `saveResearch` receba o conteúdo formatado conforme o novo padrão.

### Fase 3: Integração IA Context e Artefatos
- [ ] Definir um padrão de metadados no conteúdo do artefato (ex: `# CONTEXT_TAGS: research, science`) para facilitar a integração.
- [ ] Validar se o componente de visualização de artefatos no frontend renderiza corretamente os novos links e tabelas.

## 3. Atribuições dos Agentes

- **Feature Developer**: Responsável pelas alterações em `config.ts` e `definitions.ts`.
- **Architect Specialist**: Validar se o formato do artefato atende aos requisitos de persistência no Supabase e indexação futura.

## 4. Pontos de Documentação
- Atualizar `AGENTS.md` para refletir as novas capacidades do Odonto Research.
- Criar um breve guia em `.context/docs/research-agent-specs.md` detalhando o novo formato de saída.

## 5. Critérios de Sucesso
- O agente responde usando o modelo Perplexity Sonar.
- A resposta contém uma lista de artigos com links reais.
- Cada artigo possui um resumo de 3 linhas.
- Um artefato é salvo no banco de dados e pode ser visualizado na aba "Biblioteca" ou "Artefatos".
- O sistema de IA Context consegue ler os dados salvos sem erros.

## Plano de Rollback
### Gatilhos
- Erro 500 constante na API do OpenRouter para o modelo Sonar.
- Falha na persistência de artefatos no Supabase.

### Procedimento
- Reverter as alterações nos arquivos `lib/ai/agents/config.ts` e `lib/ai/tools/definitions.ts` para os commits anteriores.
- Voltar o modelo de pesquisa para `perplexity/sonar-reasoning` (estável).
