---
status: planning
generated: 2026-01-22
priority: high
agents:
  - type: "feature-developer"
    role: "Implementar sistema de chat conversacional pedagógico"
  - type: "architect-specialist"
    role: "Redesenhar arquitetura para foco em conversação fluida"
  - type: "frontend-specialist"
    role: "Otimizar interface para experiência conversacional"
  - type: "documentation-writer"
    role: "Documentar técnicas pedagógicas e padrões de conversação"
---

# Odonto GPT - Chat de Ensino Conversacional

## Visão Geral

Transformar o **Odonto GPT** em um sistema de chat focado exclusivamente em **ensino conversacional de odontologia**, utilizando técnicas pedagógicas avançadas (Scaffolding, Método Socrático, Zona de Desenvolvimento Proximal) e consulta a bases de conhecimento especializadas.

### Objetivos Principais

1. **Eliminar Especialistas**: Remover sistema de múltiplos agentes (Odonto Research, Odonto Vision, etc.)
2. **Eliminar Artefatos**: Remover geração de resumos, flashcards, mapas mentais, simulados
3. **Foco na Conversação**: Priorizar diálogo fluido e natural para ensino
4. **Técnicas Pedagógicas**: Implementar scaffolding, método socrático, e ZPD
5. **Bases de Conhecimento**: Integrar consulta a PubMed, Perplexity e outras fontes odontológicas
6. **Memória Contextual**: Manter histórico de aprendizado do usuário

### Escopo

**Incluído:**
- Chat conversacional único (Odonto GPT)
- Sistema de perguntas guiadas (Método Socrático)
- Consulta a bases de conhecimento em tempo real
- Perfil de usuário (semestre, universidade, especialidade)
- Histórico de conversas e progresso
- Interface otimizada para conversação

**Excluído:**
- Sistema de múltiplos agentes especializados
- Geração de artefatos (resumos, flashcards, mapas mentais, simulados)
- Análise de imagens radiográficas
- Produção de textos acadêmicos
- Biblioteca de artefatos salvos

## Fases de Implementação

### Fase 1: Planejamento e Arquitetura (P - Plan)

**Objetivo**: Definir arquitetura e estratégia de implementação

**Agente Responsável**: `architect-specialist`

**Passos**:

1. **Análise da Arquitetura Atual**
   - Revisar `lib/ai/agents/config.ts` e identificar agentes a remover
   - Mapear ferramentas (tools) a serem eliminadas vs mantidas
   - Analisar dependências de artefatos no código

2. **Design da Nova Arquitetura**
   - Definir estrutura do agente único `odonto-gpt`
   - Especificar ferramentas pedagógicas necessárias
   - Planejar integração com bases de conhecimento
   - Desenhar sistema de memória contextual

3. **Definir Técnicas Pedagógicas**
   - Documentar implementação do Método Socrático
   - Especificar scaffolding progressivo
   - Definir estratégias de ZPD (Zona de Desenvolvimento Proximal)
   - Criar padrões de feedback imediato

4. **Planejar Integração com Bases de Conhecimento**
   - Manter `askPerplexity` para pesquisas gerais
   - Manter `searchPubMed` para artigos científicos
   - Definir quando e como consultar cada base
   - Especificar formato de apresentação de evidências

**Entregáveis**:
- Documento de arquitetura atualizado
- Diagrama de fluxo conversacional
- Especificação de técnicas pedagógicas
- Plano de integração com bases de conhecimento

---

### Fase 2: Refatoração do Backend (R - Review & Refactor)

**Objetivo**: Simplificar backend removendo agentes e artefatos desnecessários

**Agente Responsável**: `refactoring-specialist`

**Passos**:

1. **Atualizar Configuração de Agentes**
   - Arquivo: `lib/ai/agents/config.ts`
   - Remover agentes: `odonto-research`, `odonto-summary`, `odonto-practice`, `odonto-vision`, `odonto-write`
   - Manter apenas `odonto-gpt`
   - Atualizar `AGENT_CONFIGS` para exportar apenas o agente principal

2. **Refatorar Ferramentas (Tools)**
   - Arquivo: `lib/ai/tools/definitions.ts`
   - **Manter**:
     - `askPerplexity` - Pesquisas gerais e contextuais
     - `searchPubMed` - Artigos científicos
     - `updateUserProfile` - Perfil do estudante
   - **Remover**:
     - `saveSummary`
     - `saveFlashcards`
     - `saveMindMap`
     - `savePracticeExam`
     - `saveResearch`
     - `saveImageAnalysis`

3. **Atualizar System Prompt do Odonto GPT**
   - Reescrever prompt focando em:
     - Conversação fluida e natural
     - Perguntas guiadas (não dar respostas prontas)
     - Uso de bases de conhecimento para fundamentar respostas
     - Adaptação ao nível do estudante (ZPD)
     - Feedback imediato e encorajador
   - Remover menções a artefatos e especialistas
   - Adicionar instruções para consulta proativa de bases

4. **Simplificar API de Chat**
   - Arquivo: `app/api/newchat/route.ts`
   - Remover lógica de seleção de agentes (sempre usar `odonto-gpt`)
   - Simplificar parâmetros de requisição
   - Otimizar para conversação contínua

**Entregáveis**:
- `config.ts` atualizado com agente único
- `definitions.ts` com ferramentas simplificadas
- System prompt pedagógico otimizado
- API de chat simplificada

---

### Fase 3: Otimização do Frontend (E - Execute)

**Objetivo**: Adaptar interface para experiência conversacional otimizada

**Agente Responsável**: `frontend-specialist`

**Passos**:

1. **Remover Seletor de Agentes**
   - Arquivo: `components/dashboard/odonto-ai-chat.tsx`
   - Remover componente `AgentSelector`
   - Remover estado `selectedAgent`
   - Simplificar header do chat

2. **Otimizar Interface de Conversação**
   - Melhorar área de mensagens para leitura fluida
   - Adicionar indicadores de "pensando" mais naturais
   - Implementar typing indicators
   - Melhorar feedback visual de consulta a bases de conhecimento

3. **Atualizar Sugestões Iniciais**
   - Revisar `suggestions` para refletir abordagem conversacional
   - Exemplos:
     - "Me ajude a entender a anatomia do primeiro molar superior"
     - "Quais são os princípios básicos de preparo cavitário?"
     - "Explique como funciona a anestesia local"
     - "Tire minhas dúvidas sobre tratamento endodôntico"

4. **Implementar Indicadores de Fonte**
   - Quando o GPT consultar PubMed ou Perplexity, mostrar badge
   - Exibir referências de forma não intrusiva
   - Permitir expandir para ver detalhes da fonte

5. **Remover Funcionalidades de Artefatos**
   - Remover botões de "Criar Resumo", "Gerar Flashcards", etc.
   - Limpar callbacks relacionados a artefatos
   - Remover prop `onArtifactCreated`

**Entregáveis**:
- Interface de chat simplificada e otimizada
- Indicadores visuais de consulta a bases
- Experiência conversacional fluida
- Remoção completa de UI de artefatos

---

### Fase 4: Implementação de Técnicas Pedagógicas (V - Verify)

**Objetivo**: Implementar e validar técnicas de ensino no system prompt

**Agente Responsável**: `feature-developer`

**Passos**:

1. **Implementar Método Socrático**
   - Adicionar instruções no system prompt para:
     - Fazer perguntas guiadas antes de dar respostas
     - Estimular raciocínio crítico
     - Validar compreensão antes de avançar
   - Exemplo de padrão:
     ```
     Aluno: "Como fazer uma restauração classe II?"
     GPT: "Ótima pergunta! Antes de explicar o passo a passo, 
           você consegue me dizer qual é a principal característica 
           de uma cavidade classe II?"
     ```

2. **Implementar Scaffolding Progressivo**
   - Instruir o GPT a:
     - Começar com conceitos fundamentais
     - Aumentar complexidade gradualmente
     - Verificar compreensão antes de avançar
     - Retornar a fundamentos se necessário

3. **Implementar Zona de Desenvolvimento Proximal (ZPD)**
   - Usar `updateUserProfile` para rastrear:
     - Semestre atual
     - Tópicos já estudados
     - Nível de conhecimento
   - Adaptar explicações ao nível do estudante
   - Desafiar sem frustrar

4. **Implementar Consulta Proativa a Bases**
   - Instruir o GPT a:
     - Usar `askPerplexity` para contexto geral e atualizações
     - Usar `searchPubMed` para evidências científicas
     - Citar fontes de forma natural na conversa
     - Apresentar evidências sem quebrar o fluxo

5. **Implementar Feedback Imediato**
   - Validar respostas do aluno
   - Corrigir com gentileza
   - Reforçar acertos
   - Explicar o "porquê" dos erros

**Entregáveis**:
- System prompt com técnicas pedagógicas implementadas
- Padrões de conversação documentados
- Exemplos de interações pedagógicas
- Testes de validação das técnicas

---

### Fase 5: Testes e Refinamento (C - Complete)

**Objetivo**: Validar experiência conversacional e ajustar

**Agente Responsável**: `test-writer` + `code-reviewer`

**Passos**:

1. **Testes de Conversação**
   - Criar cenários de teste:
     - Estudante iniciante (1º-2º semestre)
     - Estudante intermediário (3º-5º semestre)
     - Estudante avançado (6º-8º semestre)
     - Residente/Especialista
   - Validar adaptação do GPT a cada nível

2. **Testes de Técnicas Pedagógicas**
   - Verificar uso do Método Socrático
   - Validar scaffolding progressivo
   - Testar adaptação ZPD
   - Avaliar qualidade do feedback

3. **Testes de Integração com Bases**
   - Verificar consultas a Perplexity
   - Validar buscas no PubMed
   - Testar apresentação de fontes
   - Avaliar relevância das consultas

4. **Testes de Performance**
   - Tempo de resposta
   - Latência de consultas externas
   - Experiência de streaming
   - Uso de tokens

5. **Refinamento Baseado em Feedback**
   - Ajustar system prompt conforme necessário
   - Otimizar timing de consultas
   - Melhorar apresentação de informações
   - Refinar tom e estilo conversacional

**Entregáveis**:
- Suite de testes de conversação
- Relatório de validação pedagógica
- Métricas de performance
- System prompt refinado e otimizado

---

## Arquitetura Técnica

### Stack Atual (Mantido)
- **Frontend**: Next.js 15, React, TypeScript
- **AI SDK**: Vercel AI SDK (`@ai-sdk/react`)
- **LLM Provider**: OpenRouter
- **Modelo**: Configurável via `OPENROUTER_MODEL_CHAT`
- **Runtime**: Edge Runtime

### Componentes Principais

```
app/api/newchat/route.ts          → API de chat simplificada
lib/ai/agents/config.ts            → Configuração do agente único
lib/ai/tools/definitions.ts        → Ferramentas pedagógicas
lib/ai/prompts.ts                  → System prompts
components/dashboard/odonto-ai-chat.tsx → Interface de chat
```

### Ferramentas Mantidas

1. **askPerplexity**
   - Uso: Pesquisas gerais, contexto atualizado
   - Quando: Dúvidas sobre protocolos, técnicas, atualizações

2. **searchPubMed**
   - Uso: Artigos científicos, evidências
   - Quando: Questões clínicas, evidências, pesquisa

3. **updateUserProfile**
   - Uso: Salvar perfil do estudante
   - Dados: semestre, universidade, especialidade, histórico

### Fluxo de Conversação

```
1. Usuário envia mensagem
   ↓
2. GPT analisa contexto e perfil do usuário
   ↓
3. GPT decide estratégia pedagógica:
   - Pergunta guiada (Socrático)
   - Explicação direta (conceito novo)
   - Consulta a base de conhecimento
   ↓
4. Se necessário, consulta Perplexity/PubMed
   ↓
5. GPT formula resposta pedagógica
   ↓
6. Streaming da resposta para o usuário
   ↓
7. GPT aguarda feedback/próxima pergunta
```

---

## System Prompt Atualizado

### Estrutura do Novo Prompt

```markdown
# IDENTIDADE
Você é o Odonto GPT, um Tutor Inteligente de Odontologia.
Você NÃO é um chatbot que apenas responde perguntas.
Você é um PROFESSOR EXPERIENTE que guia o aprendizado.

# MISSÃO
Ensinar odontologia através de conversas fluidas e naturais,
usando técnicas pedagógicas comprovadas.

# TÉCNICAS PEDAGÓGICAS

## 1. Método Socrático
- Faça perguntas guiadas antes de dar respostas
- Estimule o raciocínio crítico
- Valide a compreensão progressivamente

## 2. Scaffolding
- Comece com fundamentos
- Aumente complexidade gradualmente
- Retorne a conceitos básicos se necessário

## 3. Zona de Desenvolvimento Proximal (ZPD)
- Adapte ao nível do estudante
- Desafie sem frustrar
- Use o perfil do usuário para calibrar

## 4. Feedback Imediato
- Valide respostas do aluno
- Corrija com gentileza
- Explique o "porquê"
- Reforce acertos

# BASES DE CONHECIMENTO

## Quando Consultar
- Use askPerplexity para: contexto geral, protocolos, atualizações
- Use searchPubMed para: evidências científicas, estudos clínicos

## Como Apresentar
- Cite fontes naturalmente na conversa
- Não quebre o fluxo conversacional
- Exemplo: "Segundo estudos recentes (PubMed, 2024)..."

# PERFIL DO USUÁRIO
- Pergunte casualmente: semestre, universidade, especialidade
- Use updateUserProfile para salvar
- Adapte linguagem e profundidade ao nível

# TOM E ESTILO
- Encorajador e paciente
- Bem-humorado (moderadamente)
- Empático com as dificuldades
- Use emojis com moderação 🦷✨
- Sempre em Português do Brasil

# O QUE VOCÊ NÃO FAZ
- NÃO gera resumos, flashcards, mapas mentais
- NÃO cria simulados ou questões
- NÃO analisa imagens radiográficas
- NÃO escreve textos acadêmicos
- NÃO redireciona para "especialistas"

# O QUE VOCÊ FAZ
- Conversa fluida e natural
- Ensina através de perguntas
- Consulta bases de conhecimento
- Adapta ao nível do estudante
- Tira dúvidas de forma pedagógica
```

---

## Critérios de Sucesso

### Métricas Técnicas
- ✅ Apenas 1 agente ativo (`odonto-gpt`)
- ✅ Apenas 3 ferramentas ativas (askPerplexity, searchPubMed, updateUserProfile)
- ✅ 0 funcionalidades de artefatos
- ✅ Tempo de resposta < 3s (sem consultas externas)
- ✅ Tempo de resposta < 10s (com consultas externas)

### Métricas Pedagógicas
- ✅ 80%+ das respostas usam perguntas guiadas (Método Socrático)
- ✅ Adaptação clara ao nível do estudante (ZPD)
- ✅ Feedback imediato em 100% das interações
- ✅ Consulta a bases de conhecimento quando apropriado

### Métricas de Experiência
- ✅ Interface limpa e focada em conversação
- ✅ Indicadores claros de consulta a bases
- ✅ Fluxo conversacional sem interrupções
- ✅ Tom encorajador e empático

---

## Riscos e Mitigações

### Risco 1: Perda de Funcionalidades Valiosas
**Descrição**: Usuários podem sentir falta de artefatos (resumos, flashcards)

**Mitigação**:
- Comunicar claramente a nova proposta de valor
- Focar na qualidade da conversação pedagógica
- Considerar reintrodução seletiva no futuro se houver demanda

### Risco 2: Qualidade das Consultas Externas
**Descrição**: Perplexity/PubMed podem retornar resultados irrelevantes

**Mitigação**:
- Treinar o GPT para formular queries precisas
- Implementar validação de relevância
- Ter fallback para respostas sem consulta

### Risco 3: Adaptação ao Nível do Estudante
**Descrição**: GPT pode não calibrar corretamente a dificuldade

**Mitigação**:
- Implementar sistema robusto de perfil de usuário
- Incluir exemplos claros no system prompt
- Testar extensivamente com diferentes níveis

### Risco 4: Performance de Consultas
**Descrição**: Consultas externas podem aumentar latência

**Mitigação**:
- Otimizar timing de consultas (paralelas quando possível)
- Implementar cache de consultas frequentes
- Mostrar indicadores de progresso ao usuário

---

## Plano de Rollback

### Triggers de Rollback
- Feedback negativo massivo dos usuários
- Problemas técnicos críticos
- Performance inaceitável
- Perda significativa de engajamento

### Procedimento de Rollback

#### Fase 1: Rollback Parcial
1. Reativar seletor de agentes
2. Manter apenas `odonto-gpt` e `odonto-research`
3. Manter artefatos desabilitados
4. Avaliar feedback

#### Fase 2: Rollback Completo
1. Restaurar todos os agentes
2. Restaurar todas as ferramentas de artefatos
3. Restaurar interface completa
4. Reverter para commit anterior à refatoração

### Dados de Rollback
- Backup do código antes da refatoração
- Backup do banco de dados (se aplicável)
- Documentação do estado anterior

---

## Cronograma Estimado

| Fase | Duração | Agente Principal |
|------|---------|------------------|
| Fase 1: Planejamento | 2-3 dias | architect-specialist |
| Fase 2: Backend | 3-4 dias | refactoring-specialist |
| Fase 3: Frontend | 2-3 dias | frontend-specialist |
| Fase 4: Pedagógico | 3-4 dias | feature-developer |
| Fase 5: Testes | 2-3 dias | test-writer |
| **Total** | **12-17 dias** | - |

---

## Próximos Passos Imediatos

1. ✅ **Revisar e aprovar este plano**
2. 🔄 **Iniciar Fase 1**: Análise detalhada da arquitetura atual
3. 🔄 **Criar branch**: `feature/conversational-teaching`
4. 🔄 **Documentar decisões**: Criar ADR (Architecture Decision Record)
5. 🔄 **Preparar ambiente de testes**: Configurar cenários de teste

---

## Referências e Recursos

### Técnicas Pedagógicas
- Zona de Desenvolvimento Proximal (Vygotsky)
- Método Socrático (Filosofia Educacional)
- Scaffolding (Wood, Bruner, Ross, 1976)
- Active Recall e Spaced Repetition

### Bases de Conhecimento
- **PubMed**: https://pubmed.ncbi.nlm.nih.gov/
- **Perplexity AI**: https://www.perplexity.ai/
- **Cochrane Library**: https://www.cochranelibrary.com/

### Documentação Técnica
- Vercel AI SDK: https://sdk.vercel.ai/docs
- OpenRouter: https://openrouter.ai/docs
- Next.js 15: https://nextjs.org/docs

---

## Notas de Implementação

### Considerações Importantes

1. **Preservar Histórico de Conversas**
   - Manter sistema de persistência de chats
   - Garantir continuidade entre sessões
   - Usar histórico para adaptar ensino

2. **Otimizar Uso de Tokens**
   - System prompt conciso mas completo
   - Limitar histórico de contexto
   - Usar streaming eficiente

3. **Monitoramento e Analytics**
   - Rastrear uso de ferramentas (Perplexity, PubMed)
   - Medir tempo de resposta
   - Coletar feedback qualitativo

4. **Acessibilidade**
   - Manter interface acessível
   - Suportar leitores de tela
   - Garantir contraste adequado

---

## Conclusão

Este plano transforma o Odonto GPT de um sistema multi-agente com geração de artefatos em um **tutor conversacional focado em ensino pedagógico**. A mudança prioriza:

- **Conversação fluida** sobre geração de conteúdo
- **Perguntas guiadas** sobre respostas prontas
- **Adaptação ao estudante** sobre abordagem única
- **Bases de conhecimento** sobre conhecimento estático

O sucesso será medido pela qualidade da experiência de aprendizado, não pela quantidade de artefatos gerados.
