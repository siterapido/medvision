---
status: active
generated: 2026-01-22
priority: high
agents:
  - type: "backend-specialist"
    role: "Implementar API endpoints e integração Supabase"
  - type: "frontend-specialist"
    role: "Desenvolver componentes de UI e integração com chat"
  - type: "database-specialist"
    role: "Criar schema e migrations do Supabase"
  - type: "feature-developer"
    role: "Implementar funcionalidades CRUD completas"
  - type: "test-writer"
    role: "Criar testes para API e componentes"
---

# Integração Completa do Sistema de Artefatos

## Objetivo

Implementar um sistema completo de gerenciamento de artefatos gerados pelo Vercel Chat SDK, incluindo persistência no Supabase, API CRUD, visualização detalhada com contexto de IA, e integração bidirecional com o componente de chat.

## Escopo

### Incluído
- Schema de banco de dados `artifacts` no Supabase com suporte a múltiplos tipos
- API endpoints REST para operações CRUD de artefatos
- Integração com `onArtifactCreated` no componente OdontoAIChat
- Modal de visualização detalhada com renderização específica por tipo
- Sistema de paginação e busca avançada
- Ações de menu (Visualizar, Baixar, Excluir)
- Rastreamento de contexto de IA (modelo, agente, parâmetros)
- Sincronização em tempo real via Supabase Realtime

### Excluído
- Sistema de versionamento de artefatos
- Compartilhamento público de artefatos
- Exportação em massa
- Análise de uso e métricas

## Fases de Implementação

### Fase 1: Preparação e Design (P - Plan)

**Objetivo**: Definir estrutura de dados, arquitetura da API e fluxo de integração.

**Passos**:

1. **Definir Schema do Banco de Dados**
   - Criar tabela `artifacts` com campos:
     - `id` (uuid, PK)
     - `user_id` (uuid, FK para auth.users)
     - `title` (text)
     - `description` (text)
     - `type` (enum: 'chat', 'document', 'code', 'image', 'other')
     - `content` (jsonb) - armazena conteúdo estruturado
     - `metadata` (jsonb) - dados adicionais flexíveis
     - `ai_context` (jsonb) - modelo, agente, parâmetros
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)
   - Criar índices para `user_id`, `type`, `created_at`
   - Configurar RLS policies para acesso por usuário

2. **Projetar Estrutura da API**
   - `GET /api/artifacts` - listar com paginação e filtros
   - `GET /api/artifacts/[id]` - buscar por ID
   - `POST /api/artifacts` - criar novo artefato
   - `PATCH /api/artifacts/[id]` - atualizar artefato
   - `DELETE /api/artifacts/[id]` - excluir artefato
   - Definir tipos TypeScript para requests/responses

3. **Mapear Fluxo de Integração com Chat**
   - Identificar onde adicionar `onArtifactCreated` no OdontoAIChat
   - Definir estrutura de dados do artefato vindo do Vercel SDK
   - Planejar transformação de dados SDK → Schema DB

**Agente Responsável**: `architect-specialist`, `database-specialist`

**Saídas**:
- Migration SQL para tabela `artifacts`
- Arquivo de tipos TypeScript `lib/types/artifacts.ts`
- Diagrama de fluxo de dados (opcional)

---

### Fase 2: Implementação do Backend (E - Execute)

**Objetivo**: Criar infraestrutura de persistência e API funcional.

**Passos**:

1. **Criar Migration do Supabase**
   ```bash
   # Arquivo: supabase/migrations/YYYYMMDDHHMMSS_create_artifacts_table.sql
   ```
   - Executar migration localmente
   - Testar RLS policies
   - Validar índices

2. **Implementar Tipos TypeScript**
   - Criar `lib/types/artifacts.ts`:
     ```typescript
     export type ArtifactType = 'chat' | 'document' | 'code' | 'image' | 'other'
     
     export interface AIContext {
       model: string
       agent: string
       temperature?: number
       maxTokens?: number
       systemPrompt?: string
     }
     
     export interface Artifact {
       id: string
       userId: string
       title: string
       description: string
       type: ArtifactType
       content: any
       metadata?: Record<string, any>
       aiContext: AIContext
       createdAt: string
       updatedAt: string
     }
     
     export interface CreateArtifactInput {
       title: string
       description: string
       type: ArtifactType
       content: any
       metadata?: Record<string, any>
       aiContext: AIContext
     }
     ```

3. **Criar API Endpoints**
   
   **a) `app/api/artifacts/route.ts`** (GET, POST)
   ```typescript
   // GET: Listar com paginação
   // - Query params: page, limit, type, search
   // - Retornar: { data: Artifact[], total: number, page: number }
   
   // POST: Criar artefato
   // - Body: CreateArtifactInput
   // - Validar com Zod
   // - Retornar: Artifact
   ```
   
   **b) `app/api/artifacts/[id]/route.ts`** (GET, PATCH, DELETE)
   ```typescript
   // GET: Buscar por ID
   // PATCH: Atualizar campos permitidos
   // DELETE: Soft delete ou hard delete
   ```

4. **Implementar Lógica de Negócio**
   - Criar `lib/services/artifacts.ts` com funções:
     - `listArtifacts(userId, filters)`
     - `getArtifact(id, userId)`
     - `createArtifact(data, userId)`
     - `updateArtifact(id, data, userId)`
     - `deleteArtifact(id, userId)`
   - Adicionar validação de permissões
   - Implementar tratamento de erros

**Agente Responsável**: `backend-specialist`, `database-specialist`

**Saídas**:
- Migration aplicada no Supabase
- Endpoints de API funcionais
- Tipos TypeScript completos

---

### Fase 3: Integração com Frontend (E - Execute)

**Objetivo**: Conectar UI da biblioteca com a API e integrar salvamento no chat.

**Passos**:

1. **Criar Hooks Customizados**
   
   **a) `lib/hooks/use-artifacts.ts`**
   ```typescript
   export function useArtifacts(filters?: ArtifactFilters) {
     // Usar SWR ou React Query para cache
     // Implementar paginação
     // Retornar: { data, isLoading, error, mutate }
   }
   
   export function useArtifact(id: string) {
     // Buscar artefato específico
   }
   
   export function useCreateArtifact() {
     // Hook para criar artefato
     // Retornar: { create, isCreating, error }
   }
   
   export function useDeleteArtifact() {
     // Hook para excluir artefato
   }
   ```

2. **Atualizar Página da Biblioteca**
   - Substituir mock data por `useArtifacts()`
   - Implementar paginação com botão "Carregar mais"
   - Adicionar loading states e error handling
   - Implementar busca com debounce

3. **Integrar com OdontoAIChat**
   
   **Modificar** `components/newdashboard/odonto-ai-chat.tsx`:
   ```typescript
   const { create: createArtifact } = useCreateArtifact()
   
   const handleArtifactCreated = async (artifact: any) => {
     try {
       await createArtifact({
         title: artifact.title || 'Artefato sem título',
         description: artifact.description || '',
         type: detectArtifactType(artifact),
         content: artifact.content,
         metadata: artifact.metadata,
         aiContext: {
           model: selectedAgent.model,
           agent: selectedAgent.name,
           temperature: selectedAgent.temperature,
         }
       })
       toast.success('Artefato salvo na biblioteca!')
     } catch (error) {
       toast.error('Erro ao salvar artefato')
     }
   }
   
   // Adicionar ao useChat:
   const { messages, ... } = useChat({
     ...config,
     onArtifactCreated: handleArtifactCreated
   })
   ```

4. **Criar Modal de Visualização**
   
   **Novo componente**: `components/artifacts/artifact-viewer-modal.tsx`
   - Renderizar conteúdo baseado no tipo:
     - `chat`: Exibir mensagens formatadas
     - `document`: Renderizar markdown/texto
     - `code`: Syntax highlighting com Shiki
     - `image`: Exibir imagem com zoom
   - Mostrar metadados e contexto de IA
   - Botões de ação (Baixar, Editar, Excluir)

**Agente Responsável**: `frontend-specialist`, `feature-developer`

**Saídas**:
- Hooks funcionais com cache
- Biblioteca conectada à API
- Chat salvando artefatos automaticamente
- Modal de visualização completo

---

### Fase 4: Funcionalidades Avançadas (E - Execute)

**Objetivo**: Implementar ações de menu e melhorias de UX.

**Passos**:

1. **Implementar Ação "Visualizar"**
   - Abrir modal com `ArtifactViewerModal`
   - Carregar dados completos do artefato
   - Adicionar navegação entre artefatos (anterior/próximo)

2. **Implementar Ação "Baixar"**
   - Criar função `downloadArtifact(artifact)`
   - Gerar arquivo baseado no tipo:
     - `document`: .md ou .txt
     - `code`: .js, .ts, .py, etc.
     - `image`: .png, .jpg
     - `chat`: .json ou .txt
   - Usar `FileSaver.js` ou API nativa do browser

3. **Implementar Ação "Excluir"**
   - Adicionar dialog de confirmação
   - Chamar `useDeleteArtifact()`
   - Atualizar lista após exclusão
   - Mostrar toast de sucesso/erro

4. **Adicionar Paginação**
   - Implementar "infinite scroll" ou botão "Carregar mais"
   - Mostrar indicador de loading durante carregamento
   - Manter estado de scroll ao voltar da visualização

5. **Melhorar Busca e Filtros**
   - Adicionar filtros avançados (data, modelo, agente)
   - Implementar ordenação (mais recente, mais antigo, A-Z)
   - Salvar preferências de filtro no localStorage

**Agente Responsável**: `frontend-specialist`, `feature-developer`

**Saídas**:
- Todas as ações de menu funcionais
- Paginação implementada
- Filtros avançados operacionais

---

### Fase 5: Testes e Validação (V - Verify)

**Objetivo**: Garantir qualidade e confiabilidade do sistema.

**Passos**:

1. **Testes de API**
   - Criar `tests/api/artifacts.test.ts`
   - Testar todos os endpoints (GET, POST, PATCH, DELETE)
   - Validar autenticação e autorização
   - Testar edge cases (dados inválidos, IDs inexistentes)

2. **Testes de Componentes**
   - Testar `BibliotecaPage` com dados mockados
   - Testar `ArtifactViewerModal` para cada tipo
   - Testar hooks customizados

3. **Testes de Integração**
   - Testar fluxo completo: Chat → Salvar → Visualizar → Excluir
   - Validar sincronização em tempo real (se implementado)
   - Testar paginação e filtros

4. **Testes Manuais**
   - Criar artefatos de diferentes tipos no chat
   - Verificar salvamento correto na biblioteca
   - Testar todas as ações de menu
   - Validar responsividade mobile

**Agente Responsável**: `test-writer`, `code-reviewer`

**Saídas**:
- Suite de testes com cobertura >80%
- Relatório de bugs encontrados e corrigidos
- Documentação de casos de teste

---

### Fase 6: Documentação e Deploy (C - Complete)

**Objetivo**: Documentar sistema e preparar para produção.

**Passos**:

1. **Documentar API**
   - Criar `docs/api/artifacts.md` com:
     - Descrição de cada endpoint
     - Exemplos de request/response
     - Códigos de erro possíveis
     - Rate limits (se aplicável)

2. **Documentar Componentes**
   - Adicionar JSDoc aos componentes principais
   - Criar exemplos de uso no Storybook (opcional)

3. **Atualizar README**
   - Adicionar seção sobre sistema de artefatos
   - Documentar variáveis de ambiente necessárias
   - Incluir screenshots da biblioteca

4. **Preparar Deploy**
   - Aplicar migrations no Supabase de produção
   - Validar RLS policies em produção
   - Configurar monitoramento de erros (Sentry)
   - Criar backup do banco antes do deploy

5. **Deploy e Monitoramento**
   - Deploy via Vercel
   - Monitorar logs por 24h
   - Validar métricas de performance
   - Coletar feedback inicial de usuários

**Agente Responsável**: `documentation-writer`, `devops-specialist`

**Saídas**:
- Documentação completa
- Sistema em produção
- Monitoramento ativo

---

## Dependências

### Técnicas
- Supabase configurado e acessível
- Vercel Chat SDK atualizado com suporte a `onArtifactCreated`
- Autenticação de usuários funcionando

### Humanas
- Aprovação do schema de banco de dados
- Revisão de código antes de merge
- Testes de aceitação do usuário

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Vercel SDK não suportar `onArtifactCreated` | Média | Alto | Implementar polling ou webhook alternativo |
| Performance ruim com muitos artefatos | Média | Médio | Implementar paginação eficiente e índices |
| Problemas de RLS no Supabase | Baixa | Alto | Testar exaustivamente policies antes de produção |
| Artefatos muito grandes (>1MB) | Média | Médio | Implementar limite de tamanho e compressão |
| Conflitos de merge durante desenvolvimento | Alta | Baixo | Usar feature branches e PRs pequenos |

---

## Cronograma Estimado

| Fase | Duração Estimada | Dependências |
|------|------------------|--------------|
| Fase 1: Preparação | 4-6 horas | Nenhuma |
| Fase 2: Backend | 8-12 horas | Fase 1 completa |
| Fase 3: Frontend | 10-14 horas | Fase 2 completa |
| Fase 4: Funcionalidades | 6-8 horas | Fase 3 completa |
| Fase 5: Testes | 6-10 horas | Fases 2-4 completas |
| Fase 6: Documentação | 4-6 horas | Fase 5 completa |
| **Total** | **38-56 horas** | - |

---

## Rollback Plan

### Rollback Triggers
- Erros críticos na API afetando >10% das requisições
- Perda de dados de artefatos
- Performance degradada (tempo de resposta >5s)
- Falhas de autenticação/autorização

### Rollback Procedures

#### Fase 2-3 Rollback (Backend/Frontend)
- **Ação**: Reverter commits via `git revert`, fazer rollback do deploy no Vercel
- **Data Impact**: Artefatos criados após deploy serão perdidos (avisar usuários)
- **Estimated Time**: 30-60 minutos

#### Fase 4-6 Rollback (Funcionalidades Avançadas)
- **Ação**: Desabilitar features via feature flags, reverter apenas commits problemáticos
- **Data Impact**: Mínimo (dados preservados)
- **Estimated Time**: 15-30 minutos

### Post-Rollback Actions
1. Criar incident report no GitHub Issues
2. Notificar equipe via Slack/Discord
3. Agendar post-mortem em 24-48h
4. Atualizar plano com lições aprendidas

---

## Evidence & Follow-up

### Artefatos a Coletar
- [ ] Migration SQL aplicada
- [ ] Screenshots da biblioteca funcionando
- [ ] Logs de testes (unit + integration)
- [ ] PR links de cada fase
- [ ] Métricas de performance (tempo de resposta da API)
- [ ] Feedback de usuários beta

### Follow-up Actions
- [ ] Implementar versionamento de artefatos (Fase 2)
- [ ] Adicionar compartilhamento público (Fase 3)
- [ ] Criar dashboard de analytics de uso
- [ ] Implementar exportação em massa
- [ ] Adicionar suporte a mais tipos de artefatos (vídeo, áudio)

---

## Critérios de Sucesso

✅ **Técnicos**:
- [ ] Todos os endpoints de API retornam status 2xx para casos válidos
- [ ] Cobertura de testes >80%
- [ ] Tempo de resposta da API <500ms (p95)
- [ ] Zero erros de RLS em produção
- [ ] Chat salva artefatos automaticamente sem erros

✅ **Funcionais**:
- [ ] Usuário consegue visualizar todos os artefatos salvos
- [ ] Busca retorna resultados relevantes em <1s
- [ ] Download funciona para todos os tipos de artefatos
- [ ] Exclusão remove artefato permanentemente
- [ ] Modal de visualização renderiza corretamente cada tipo

✅ **UX**:
- [ ] Interface responsiva em mobile/tablet/desktop
- [ ] Loading states claros durante operações
- [ ] Mensagens de erro amigáveis
- [ ] Navegação intuitiva entre artefatos
- [ ] Feedback visual para ações (toasts, confirmações)
