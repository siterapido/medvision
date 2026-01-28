# Project Rules and Guidelines

> Auto-generated from .context/docs on 2026-01-24T18:00:00.000Z (Manual Sync)

## README

# Documentation Index

Welcome to the repository knowledge base. Start with the project overview, then dive into specific guides as needed.

## Core Guides
- [Project Overview](./project-overview.md)
- [Architecture Notes](./architecture.md)
- [Development Workflow](./development-workflow.md)
- [Testing Strategy](./testing-strategy.md)
- [Glossary & Domain Concepts](./glossary.md)
- [Security & Compliance Notes](./security.md)
- [Tooling & Productivity Guide](./tooling.md)

## Repository Snapshot
- `_archived/`
- `AGENTS.md/`
- `app/`
- `CLAUDE.md/`
- `components/`
- `components.json/`
- `COURSE_REFACTOR_SUMMARY.md/`
- `DEPLOY.md/`
- `docs/` — Living documentation produced by this tool.
- `DOCUMENTATION_INDEX.md/`
- `eslint.config.mjs/`
- `EXECUTE_THIS_IN_SUPABASE.sql/`
- `FIX_RLS_POLICIES.sql/`
- `IMPLEMENTATION_CHECKLIST.md/`
- `IMPROVEMENT_PLAN_SUMMARY.md/`
- `iniciar-odontogpt/`
- `instrumentation-client.ts/`
- `instrumentation.ts/`
- `lib/`
- `LOCAL_DEVELOPMENT_GUIDE.md/`
- `MASTER_IMPROVEMENT_PLAN.md/`
- `middleware.ts/`
- `next-env.d.ts/`
- `next.config.mjs/`
- `ODONTO_GPT_CONVERSATIONAL_PLAN.md/`
- `package-lock.json/`
- `package.json/`
- `PLANO_MELHORIAS_2026.md/`
- `PLANO_MELHORIAS_README.md/`
- `playwright-report/`
- `playwright.config.ts/`
- `postcss.config.mjs/`
- `PROXIMOS_PASSOS_BUNNY.md/`
- `public/`
- `QUICK_FIX_VENDEDOR.md/`
- `README.md/`
- `ROADMAP_VISUAL.md/`
- `run_backend.sh.bak/`
- `scripts/`
- `sentry.client.config.ts/`
- `sentry.edge.config.ts/`
- `sentry.server.config.ts/`
- `SIMPLE_MIGRATION.sql/`
- `styles/`
- `supabase/`
- `SUPABASE_SETUP.md/`
- `test-results/`
- `test-webhook-cakto.sh/`
- `tests/` — Automated tests and fixtures.
- `tests-e2e/`
- `tmp/`
- `tsconfig.json/`
- `tsconfig.test.json/`
- `tsconfig.test.paths.json/`
- `tsconfig.tsbuildinfo/`
- `UI_UX_GUIDE.md/`
- `v0-odonto-gpt-ui/`
- `vercel.json/`
- `WARP.md/`
- `WEBHOOK_INSTRUCTIONS.md/`

## Document Map
| Guide | File | Primary Inputs |
| --- | --- | --- |
| Project Overview | `project-overview.md` | Roadmap, README, stakeholder notes |
| Architecture Notes | `architecture.md` | ADRs, service boundaries, dependency graphs |
| Development Workflow | `development-workflow.md` | Branching rules, CI config, contributing guide |
| Testing Strategy | `testing-strategy.md` | Test configs, CI gates, known flaky suites |
| Glossary & Domain Concepts | `glossary.md` | Business terminology, user personas, domain rules |
| Security & Compliance Notes | `security.md` | Auth model, secrets management, compliance requirements |
| Tooling & Productivity Guide | `tooling.md` | CLI scripts, IDE configs, automation workflows |

---

# 📚 Descobertas & Aprendizado

> Área de aprendizado: descobertas arquiteturais, padrões, e insights do projeto
> Última atualização: 2026-01-28

## 🎯 Visão Geral do Projeto

**Odonto GPT** é uma plataforma SaaS educacional full-stack para profissionais de odontologia, com integração avançada de IA (OpenAI, Perplexity Sonar) e sistema de vendas comportamental sofisticado.

### Versão Atual
- **v0.1.4** | Next.js 16.0.10 | React 19.2.3 | TypeScript 5
- **Deployment:** Vercel (production-ready)
- **Database:** Supabase (PostgreSQL + 60+ migrations)

---

## 🏗️ Arquitetura Principal

### Tech Stack Crítico
- **Frontend:** Next.js App Router + React 19 + Tailwind CSS 4
- **UI Components:** Radix UI + Shadcn-style base components
- **AI Integration:** Vercel AI SDK (OpenAI + OpenRouter)
- **Backend:** Supabase (Auth, DB, Storage) + Server Actions (100MB body limit)
- **File Storage:** Bunny CDN (videos) + Vercel Blob
- **Monitoring:** Sentry 10.23.0 + Vercel Analytics
- **Testing:** Playwright E2E (Chrome + iPhone 12)

### Estrutura do Aplicativo (`/app`)

**Admin Panel** (`/admin`)
- Pipeline de vendas (8-stage behavioral funnel)
- Gerenciamento de usuários, cursos, certificados
- Sistema de notificações
- Atribuição de vendedor (multi-tenant)

**Dashboard do Usuário** (`/dashboard`)
- Chat com IA streaming
- OdontoVision (análise visual de imagens)
- Biblioteca de recursos (full-text search)
- OdontoFlix (streaming de vídeos)
- Histórico de conversas
- Certificados gerados

**APIs** (`/api`)
- Chat streaming, upload de arquivos
- Webhook do Cakto (pagamentos)
- Research agent (Perplexity)
- Health checks
- Cron jobs (notificações diárias às 9h)

### Estrutura Compartilhada (`/lib`)
- **AI utilities:** Message handling, streaming
- **Database queries:** Helpers otimizados
- **Auth:** Role-based access control (admin, vendedor, user)
- **Hooks:** Custom React hooks
- **Services:** Integrações externas
- **Types & Validations:** Zod schemas

---

## 🔑 Features Principais

### Core Features
1. **Chat com IA** - Streaming bidirecional via Vercel AI SDK
2. **OdontoVision** - Análise visual por IA (upload de imagens)
3. **Research Agent** - Busca de informações via Perplexity Sonar
4. **OdontoFlix** - Streaming de vídeos com Bunny CDN
5. **Biblioteca** - Busca full-text em recursos
6. **Geração de Certificados** - jsPDF + custom templates
7. **Sistema de Trial** - Conversão Trial → Pro (behavioral funnel)
8. **Pipeline de Vendas** - 8 estágios: cadastro → convertido → risco_churn → perdido
9. **Dashboard Admin** - Gestão completa de usuários/cursos/materiais
10. **Notificações** - Sistema em tempo real (cron diário)

### Features Avançadas (Em Desenvolvimento)
- Semantic Caching - Otimização de respostas IA
- Shared Memory - Preservação de contexto cross-session
- Knowledge Documents - Base de conhecimento estruturada
- Memory Embeddings - Busca por similaridade vetorial
- Artifact Versioning - Rastreamento de histórico de artefatos
- Soft Delete - Conformidade GDPR

---

## 💾 Database Schema (PostgreSQL via Supabase)

**60+ migrations** em `/supabase/migrations/`

### Tabelas Principais
| Tabela | Propósito |
| --- | --- |
| `profiles` | Dados do usuário + roles (admin, vendedor, user) |
| `courses` | Catálogo de cursos + metadados |
| `lessons` | Conteúdo individual de aulas |
| `chat_messages` | Histórico de conversas (retenção 30 dias) |
| `chat_threads` | Agrupamento de conversas |
| `agent_sessions` | Rastreamento de sessões IA |
| `artifacts` | Código/documentos gerados + versioning |
| `materials` | Recursos de aprendizado |
| `live_events` | Agendamento de webinars |
| `subscriptions` | Planos (trial, pro) |
| `pipeline` | Rastreamento de funil de vendas |
| `cold_leads` | Captura de leads |
| `notifications` | Notificações do usuário |
| `knowledge_documents` | Base de conhecimento |
| `shared_memory` | Contexto cross-session |

### Storage Buckets
- `lives-assets` - Conteúdo de eventos ao vivo
- `profile-avatars` - Avatares de usuários
- `course-materials` - Materiais do curso
- `artifact-files` - Arquivos de artefatos

---

## 🔐 Autenticação & Autorização

### Auth Flow
1. Supabase Auth (email/password + OAuth)
2. JWT token armazenado em sessão
3. Middleware refresh em cada request
4. Role-based access control (RBAC)

### Rotas Protegidas
- `/dashboard/*` - Requer autenticação de usuário
- `/admin/*` - Requer role=admin
- `/settings`, `/profile` - Requer autenticação

### Papéis
- **admin** - Acesso total ao painel administrativo
- **vendedor** - Gerenciamento de pipeline de vendas
- **user** - Usuário comum do dashboard

---

## ⚡ Performance & Otimizações

### Image Optimization
- Formatos dinâmicos (AVIF, WebP)
- Redimensionamento automático
- Lazy loading

### Code & Data
- Tree-shaking ativado
- Dynamic imports para lazy loading
- SWR 2.3.8 para data fetching com caching
- Full-text search no PostgreSQL
- Índices otimizados

### Server
- Body limit: 100MB (Server Actions)
- Standalone output mode (Vercel)
- Source maps desabilitados em produção
- Sentry tree-shaking

---

## 🧪 Testing Strategy

### Unit Tests
```bash
npm run test
```
- Validação de attachments & MIME types
- Integração com chat
- Helpers de curso
- Callbacks de autenticação
- Sincronização de materiais
- Webhook do Cakto

### E2E Tests (Playwright)
```bash
npm run test:e2e
```
- Desktop Chrome + Mobile (iPhone 12)
- Workflows do dashboard
- Player de curso
- Shell de layout
- Conclusão de aulas
- Retry automático + trace recording

---

## 📋 Configuração Crítica

### `next.config.mjs`
- Output: standalone (containerização)
- Body limit: 100MB (memory optimization)
- Integração Sentry com Vercel Cron Monitors

### `vercel.json`
```json
{
  "crons": [
    { "path": "/api/cron/notifications", "schedule": "0 9 * * *" }
  ]
}
```

### `tsconfig.json`
- Strict mode habilitado
- Target: ES6
- Module: ESNext
- Path alias: `@/*`

---

## 🚀 Scripts Principais

```bash
# Desenvolvimento
npm run dev                    # Dev server
npm run build                  # Build production
npm run start                  # Start server
npm run lint                   # ESLint check

# Testes
npm run test                   # Unit tests
npm run test:e2e              # Playwright E2E
npm run test:bunny            # Validação Bunny CDN
npm run validate:env          # Validação de env vars

# Database
npm run db:push               # Push schema
npm run db:diff               # Mostrar diff
npm run db:reset              # Reset local
npm run db:status             # Status migração

# Vercel
npm run vercel:env:*          # Gerenciar env vars
```

---

## 📝 Padrões Encontrados

### Server Actions
- Localizadas em `/app/actions/*.ts`
- Tipagem TypeScript com type-safe inputs
- Usado em `/app/actions/pipeline.ts` para funnel behavioral

### Form Handling
- React Hook Form + Zod schema validation
- @hookform/resolvers para integração
- Padrão consistent em admin e dashboard

### API Routes
- Rotas modulares por feature (`/api/courses/*`, `/api/chat/*`, etc)
- Webhook handling para integrações externas
- Health checks e cron jobs integrados

### Components
- Radix UI base + customizações Tailwind
- Pattern de "compound components" (Dialog, Tabs, etc)
- Lazy loading com React.lazy + Suspense

### Data Fetching
- SWR para client-side com caching automático
- Server Actions para mutations
- Supabase client para queries diretas

---

## 🔗 Integrações Externas

| Serviço | Uso | Key |
| --- | --- | --- |
| OpenAI | Chat, análise, geração | `OPENAI_API_KEY` |
| OpenRouter | Fallback LLM | `OPENROUTER_API_KEY` |
| Perplexity | Research agent | `PERPLEXITY_API_KEY` |
| Supabase | Database, Auth, Storage | `NEXT_PUBLIC_SUPABASE_URL` |
| Bunny CDN | Video streaming | `BUNNY_ACCESS_KEY` |
| Vercel Blob | File storage | `BLOB_READ_WRITE_TOKEN` |
| Cakto | Payment processing | Webhook setup |
| Sentry | Error tracking | `SENTRY_DSN` |
| Resend | Email delivery | `RESEND_API_KEY` |

---

## ⚠️ Considerações Críticas

### Memory & Performance
- Body limit 100MB em Server Actions (reduzido de 2GB)
- Standalone output mode para Vercel
- Monitoramento Sentry ativo em produção

### Authentication
- JWT expiration padrão do Supabase
- Middleware refresh em cada request
- Role checking antes de operações admin

### Database
- Retenção 30 dias de chat_messages
- Full-text search habilitado
- Índices otimizados para queries comuns
- Soft delete para GDPR compliance

### File Uploads
- Validação de MIME types
- Storage em Bunny CDN + Vercel Blob
- Limite de tamanho configurável

---

## 🎓 Aprendizados Arquiteturais

1. **Behavioral Funnel** - Pipeline de vendas com 8 estágios, não apenas conversão linear
2. **Multi-tenant Admin** - Sistema de atribuição de vendedor para escalabilidade
3. **Hybrid Storage** - Bunny CDN para vídeos + Vercel Blob para arquivos genéricos
4. **Semantic Caching** - Preparação para otimização avançada com IA
5. **Trial System** - Tracking de dias, conversão para Pro, identificação de risco de churn
6. **GDPR Ready** - Soft delete, retenção limitada de dados, compliance pensado
7. **Streaming First** - AI SDK streaming em vez de polling
8. **TypeScript Strict** - Type safety desde o início do projeto

