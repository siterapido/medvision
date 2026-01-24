---
status: active
generated: 2026-01-24
agents:
  - type: "feature-developer"
    role: "Implement new chat components and integrate AI SDK patterns"
  - type: "frontend-specialist"
    role: "Design and implement responsive UI components"
  - type: "refactoring-specialist"
    role: "Refactor existing code to match new architecture"
phases:
  - id: "phase-1"
    name: "Analise e Arquitetura"
    prevc: "P"
  - id: "phase-2"
    name: "Componentes Base"
    prevc: "E"
  - id: "phase-3"
    name: "Chat Core"
    prevc: "E"
  - id: "phase-4"
    name: "Features Avancadas"
    prevc: "E"
  - id: "phase-5"
    name: "Integracao e Validacao"
    prevc: "V"
---

# Refatoracao Completa do Chat baseado no Vercel AI Chatbot

> Refazer totalmente o chat (interface e backend) de /dashboard/chat com base no repositorio vercel/ai-chatbot, incluindo nova arquitetura de componentes, streaming otimizado, artifacts, e sidebar com historico.

## Task Snapshot

- **Primary goal:** Modernizar completamente a experiencia de chat do Odonto GPT, adotando os padroes e componentes do Vercel AI Chatbot oficial
- **Success signal:** Chat funcional com nova UI, streaming otimizado, sidebar com historico por data, artifacts renderizados inline, e suporte a multimodal input
- **Key references:**
  - [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot)
  - [AI SDK v6 Docs](https://sdk.vercel.ai/docs)
  - [shadcn/ui Components](https://ui.shadcn.com/)

## Analise do Estado Atual

### Arquivos Existentes

| Arquivo | Funcao | Acao |
| --- | --- | --- |
| `app/dashboard/chat/page.tsx` | Server Component que carrega sessao | Manter estrutura |
| `app/dashboard/chat/layout.tsx` | Layout com sidebar provider | Manter estrutura |
| `app/api/chat/route.ts` | API route com streaming | Refatorar |
| `components/dashboard/odonto-ai-chat.tsx` | Chat principal monolitico | Subdividir |
| `components/dashboard/modern-chat-input.tsx` | Input com agentes | Refatorar para multimodal |
| `components/chat/chat-sidebar.tsx` | Sidebar wrapper | Melhorar |

### Gaps Identificados

1. **Componentes nao modularizados** - Chat monolitico precisa ser dividido
2. **Mensagens sem acoes** - Falta copy, edit, regenerate
3. **Input limitado** - Sem drag-drop, sem paste image
4. **Artifacts inline** - Nao usa panel lateral como ai-chatbot
5. **Historico basico** - Sem agrupamento por data
6. **Sem tool approval** - Nao tem fluxo de aprovacao de tools

## Nova Arquitetura de Componentes

```
components/
  chat/
    chat.tsx                 # Container principal (orchestrator)
    chat-header.tsx          # Header com titulo e acoes
    messages.tsx             # Container de mensagens com scroll
    message.tsx              # Mensagem individual (user/assistant)
    message-content.tsx      # Renderizacao de conteudo/markdown
    message-actions.tsx      # Acoes (copy, edit, regenerate)
    message-editor.tsx       # Editor inline de mensagem
    multimodal-input.tsx     # Input com arquivos e modelo
    suggested-actions.tsx    # Sugestoes de acao
    greeting.tsx             # Tela de boas-vindas
    sidebar/
      chat-sidebar.tsx       # Wrapper da sidebar
      sidebar-history.tsx    # Lista de conversas agrupada por data
      sidebar-history-item.tsx # Item individual do historico
    artifacts/
      artifact-panel.tsx     # Panel lateral para artifacts
      artifact-actions.tsx   # Acoes de artifact
```

## Fases de Implementacao

### Phase 1 - Analise e Arquitetura (PLANNING) [COMPLETO]

**Objetivo:** Mapear completamente a estrutura do ai-chatbot e definir adaptacoes

**Steps:**
1. [x] Analisar estrutura atual do projeto
2. [x] Estudar arquitetura do vercel/ai-chatbot
3. [x] Identificar gaps e requisitos
4. [x] Definir nova estrutura de componentes
5. [x] Criar plano detalhado

**Outputs:**
- Este documento de plano
- Mapa de componentes novos vs existentes

---

### Phase 2 - Componentes Base (EXECUTION)

**Objetivo:** Criar componentes fundamentais reutilizaveis

**Step 2.1 - Message Components**

Criar `components/chat/message.tsx`:
- Renderizar mensagens user e assistant
- Suporte a parts (text, tool-invocation, tool-result)
- Animacoes de entrada com motion
- Icone sparkles para assistant

Criar `components/chat/message-content.tsx`:
- Wrapper para Markdown com styling
- Suporte a code blocks com syntax highlight
- Tratamento de links e imagens

Criar `components/chat/message-actions.tsx`:
- Botoes: Copy, Edit, Regenerate
- Visibilidade condicional (hover)
- Tooltips

**Step 2.2 - Greeting Component**

Criar `components/chat/greeting.tsx`:
- Logo/icone do agente selecionado
- Titulo de boas-vindas personalizado (com nome do usuario)
- Descricao do agente
- Sugestoes de perguntas clicaveis

**Step 2.3 - Messages Container**

Criar `components/chat/messages.tsx`:
- Scroll container com auto-scroll
- Estado vazio mostra Greeting
- Botao "scroll to bottom" flutuante
- Ref para scroll programatico

---

### Phase 3 - Chat Core (EXECUTION)

**Objetivo:** Implementar o componente principal de chat com nova arquitetura

**Step 3.1 - Multimodal Input**

Criar `components/chat/multimodal-input.tsx`:
- Textarea com auto-resize
- Drag-drop de arquivos
- Paste de imagens do clipboard
- Selector de modelo/agente
- Upload queue com preview
- Botao de envio com loading
- Stop button durante streaming
- LocalStorage para drafts

**Step 3.2 - Chat Container**

Criar `components/chat/chat.tsx`:
- useChat hook com transport customizado
- Estado: messages, status, error
- Callbacks: onFinish, onError
- Integracao com artifacts
- Sync com URL (chatId via searchParams)
- Tool approval handling

**Step 3.3 - Chat Header**

Criar `components/chat/chat-header.tsx`:
- Titulo da conversa (editavel)
- Seletor de agente (opcional)
- Botoes de acao (nova conversa, config)
- Breadcrumb (Dashboard > Chat)

---

### Phase 4 - Features Avancadas (EXECUTION)

**Objetivo:** Implementar features diferenciais do ai-chatbot

**Step 4.1 - Sidebar History Melhorada**

Refatorar `components/chat/sidebar/sidebar-history.tsx`:
- Paginacao infinita com SWR
- Agrupamento por data (Hoje, Ontem, 7 dias, 30 dias)
- Item com titulo truncado
- Delete com confirmacao
- Loading skeletons
- Empty state

Criar `components/chat/sidebar/sidebar-history-item.tsx`:
- Link para /dashboard/chat?id=xxx
- Highlight quando ativo
- Botao delete (hover)
- Titulo com truncate

**Step 4.2 - Artifact Panel**

Criar `components/chat/artifacts/artifact-panel.tsx`:
- Split view (desktop): sidebar esquerda, artifact direita
- Fullscreen (mobile)
- Tabs para multiplos artifacts
- Versionamento de documentos
- Animacoes de transicao

**Step 4.3 - Tool Approval Flow**

Dentro de `message.tsx`:
- Detectar tool-invocation com approval-requested
- Renderizar botoes Allow/Deny
- Callback para aprovar tool
- Estado output-denied/output-available

**Step 4.4 - Message Editor**

Criar `components/chat/message-editor.tsx`:
- Textarea inline no lugar da mensagem
- Botoes Save/Cancel
- Callback para editar e re-submeter

---

### Phase 5 - Integracao e Validacao (VALIDATION)

**Objetivo:** Integrar tudo e validar funcionamento completo

**Step 5.1 - Integracao**

- [ ] Conectar novos componentes no layout
- [ ] Migrar logica do OdontoAIChat atual
- [ ] Testar todas as rotas de API
- [ ] Verificar persistencia de sessoes
- [ ] Testar artifacts tools

**Step 5.2 - Testes Funcionais**

- [ ] Criar nova conversa
- [ ] Enviar mensagem de texto
- [ ] Enviar imagem
- [ ] Streaming de resposta
- [ ] Tool invocation
- [ ] Artifact rendering
- [ ] Historico de conversas
- [ ] Delete conversa
- [ ] Editar mensagem
- [ ] Regenerar resposta
- [ ] Mobile responsiveness

**Step 5.3 - Cleanup**

- [ ] Remover componentes antigos nao usados
- [ ] Atualizar imports
- [ ] Documentar novos componentes
- [ ] Atualizar CLAUDE.md se necessario

---

## Detalhes de Implementacao

### API Route (Manter com ajustes)

O `app/api/chat/route.ts` atual ja esta bem estruturado. Ajustes necessarios:

1. **Headers para session ID** - Ja implementado
2. **Tool approval** - Adicionar handling se necessario
3. **File upload endpoint** - Criar `/api/files/upload` se nao existir

### useChat Hook Configuration

```typescript
const { messages, sendMessage, status, error, reload, stop, setMessages } = useChat({
  id: chatId,
  messages: initialMessages,
  transport: new DefaultChatTransport({
    api: '/api/chat',
    prepareSendMessagesRequest: ({ id, messages }) => ({
      body: {
        id,
        messages,
        agentId: selectedAgent.id,
        sessionId: currentSessionId,
      }
    })
  }),
  onError: (error) => toast.error(error.message),
  onFinish: (message) => {
    // Extract artifacts from tool results
    // Update session title if first message
  }
})
```

### Estrutura de Arquivos Final

```
app/
  dashboard/
    chat/
      page.tsx              # Server Component (manter)
      layout.tsx            # Layout com sidebar (manter)
  api/
    chat/
      route.ts              # API streaming (ajustar)
    files/
      upload/
        route.ts            # Upload de arquivos (criar)
    history/
      route.ts              # Historico API (verificar)

components/
  chat/
    index.ts                # Exports
    chat.tsx                # NOVO
    chat-header.tsx         # NOVO
    messages.tsx            # NOVO
    message.tsx             # NOVO
    message-content.tsx     # NOVO
    message-actions.tsx     # NOVO
    message-editor.tsx      # NOVO
    multimodal-input.tsx    # NOVO (substituir modern-chat-input)
    greeting.tsx            # NOVO
    suggested-actions.tsx   # NOVO
    markdown.tsx            # EXISTE (manter)
    sidebar/
      chat-sidebar.tsx      # REFATORAR
      sidebar-history.tsx   # EXISTE (melhorar)
      sidebar-history-item.tsx # NOVO
    artifacts/
      artifact-panel.tsx    # NOVO
      artifact-actions.tsx  # NOVO

lib/
  ai/
    (manter estrutura atual)

hooks/
  use-scroll-to-bottom.ts   # NOVO
  use-artifact-selector.ts  # NOVO
```

## Risk Assessment

### Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigacao |
| --- | --- | --- | --- |
| Breaking changes no chat existente | Alta | Alto | Fazer em branch separada, testar extensivamente |
| Incompatibilidade AI SDK | Media | Alto | Manter versao atual do SDK, testar cada mudanca |
| Performance de re-renders | Media | Medio | Usar memo, useMemo, useCallback |

### Rollback Plan

Se houver problemas criticos:
1. Reverter para branch main
2. Manter componentes antigos ate corrigir
3. Fazer deploy incremental

## Prioridade de Features

**P0 (Must Have)**
- Chat basico funcionando
- Streaming de respostas
- Historico de conversas

**P1 (Should Have)**
- Multimodal input
- Message actions (copy, edit)
- Greeting personalizado

**P2 (Nice to Have)**
- Tool approval flow
- Artifact panel lateral
- Message reasoning display

## Decisoes de Design

- **Manter agents dropdown no input** - Diferente do ai-chatbot que usa model selector
- **Nao implementar auth.js** - Ja usamos Supabase Auth
- **Nao implementar Drizzle** - Ja usamos Supabase diretamente
- **Manter artifacts no sistema atual** - Apenas melhorar renderizacao

## Checklist Final

- [ ] Todos os componentes novos criados
- [ ] Chat funciona com texto
- [ ] Chat funciona com imagens
- [ ] Artifacts renderizam inline
- [ ] Sidebar mostra historico agrupado
- [ ] Mobile responsivo
- [ ] Sem erros no console
- [ ] Build passa sem warnings
- [ ] Performance aceitavel
