# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **📖 New Documentation System**: This project now uses an LLM-optimized modular documentation system. See [`.docs/INDEX.md`](.docs/INDEX.md) for the complete documentation index.

## Quick Start

### 📚 Documentation Navigation

For detailed information, see the modular documentation in `.docs/`:

- **[`.docs/INDEX.md`](.docs/INDEX.md)** - Documentation index and overview
- **[`.docs/01_PROJECT_OVERVIEW.md`](.docs/01_PROJECT_OVERVIEW.md)** - Project identity, tech stack, setup
- **[`.docs/02_ARCHITECTURE.md`](.docs/02_ARCHITECTURE.md)** - System architecture and patterns
- **[`.docs/03_DATABASE_SCHEMA.md`](.docs/03_DATABASE_SCHEMA.md)** - Database tables and migrations
- **[`.docs/04_AI_AGENTS.md`](.docs/04_AI_AGENTS.md)** - Agno AI service details
- **[`.docs/05_AUTHORIZATION.md`](.docs/05_AUTHORIZATION.md)** - Auth and authorization
- **[`.docs/06_API_ENDPOINTS.md`](.docs/06_API_ENDPOINTS.md)** - API routes and webhooks
- **[`.docs/07_PATTERNS.md`](.docs/07_PATTERNS.md)** - Common code patterns (READ THIS!)
- **[`.docs/08_INTEGRATIONS.md`](.docs/08_INTEGRATIONS.md)** - External services
- **[`.docs/09_DEPLOYMENT.md`](.docs/09_DEPLOYMENT.md)** - Production deployment
- **[`.docs/10_TROUBLESHOOTING.md`](.docs/10_TROUBLESHOOTING.md)** - Common issues

### 🚀 5-Minute Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your configuration
npm run validate:env

# 3. Setup database
npm run db:push
npm run db:status

# 4. Start development
npm run dev  # Frontend at http://localhost:3000

# 5. Start AI service (optional)
cd odonto-gpt-agno-service
pip install -r requirements.txt
cp .env.example .env
# Edit .env with OPENROUTER_API_KEY
python -m uvicorn app.main:app --reload
# AI service at http://localhost:8000
```

## Project Overview

**Odonto GPT UI** is a Next.js 16 SaaS platform for dental professionals featuring:
- AI-powered dental Q&A with multi-agent system (Agno framework)
- Dental image analysis (X-rays, intraoral photos)
- Online courses with video delivery
- Lead management and subscription system

### Tech Stack

**Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
**Backend**: Supabase (PostgreSQL + Auth + Storage)
**AI**: Agno (Python), FastAPI, OpenRouter
**Hosting**: Vercel (frontend), Railway/Render (AI service)
**Integrations**: Cakto (payments), Bunny CDN (media), Z-API (WhatsApp)

## Key Commands

```bash
# Development
npm run dev              # Start frontend
npm run build           # Build for production
npm run lint            # ESLint check

# Database
npm run db:push         # Apply migrations
npm run db:status       # Check migration status
npm run db:diff         # Generate migration diff

# AI Service
npm run agno:install    # Install Python dependencies
npm run agno:dev        # Start Agno service

# Testing & Validation
npm run validate:env    # Validate environment variables
npm run test:bunny      # Test Bunny CDN
npm run test            # Run test suite
```

## Architecture Highlights

### Frontend (Next.js 16)
- **App Router** with Server Components and Server Actions
- **Streaming responses** for AI chat
- **Middleware** for route protection and session refresh
- **Mobile-first** responsive design

### AI Service (Python/Agno)
- **Multi-agent system**: QA Agent, Image Agent, Team Coordinator
- **Streaming endpoints** for real-time responses
- **Tool calling**: Web search, WhatsApp, database query, RAG
- **Session persistence** in Supabase

### Database (Supabase)
- **Row Level Security (RLS)** on all tables
- **UUID primary keys** with audit timestamps
- **agent_sessions** and **agent_messages** for chat history
- **profiles, courses, subscriptions, leads** for business logic

## Common Patterns

### Reading Current User

```typescript
import { createClient } from "@/lib/supabase/server"
import { resolveUserRole } from "@/lib/auth/roles"

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
const role = user ? resolveUserRole(undefined, user) : undefined
```

### Server Action Pattern

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function someAction(params: Params): Promise<ActionResult> {
  const supabase = await createClient()

  // Validation
  const parsed = schema.safeParse(params)
  if (!parsed.success) {
    return { success: false, error: "Validation failed" }
  }

  // Database operation
  const { data, error } = await supabase.from("table").insert(parsed.data)

  // Revalidate
  revalidatePath("/some-path")

  return { success: true, data }
}
```

### Role-Based Rendering

```typescript
import { isAdmin, isVendedor } from "@/lib/auth/roles"

{isAdmin(role) && <AdminOnlyComponent />}
{isVendedor(role) && <SalesComponent />}
```

### Database Queries with RLS

```typescript
// Regular queries respect RLS for current user
const { data } = await supabase
  .from("courses")
  .select("*")
  .eq("published", true)

// For admin operations bypassing RLS
import { createAdminClient } from "@/lib/supabase/admin"
const adminSupabase = createAdminClient()
const { data } = await adminSupabase.from("users").select("*")
```

### AI Chat Integration

```typescript
// Client-side streaming chat
import { useChat } from 'ai/react'

const { messages, input, handleSubmit } = useChat({
  api: '/api/chat',
  body: {
    sessionId: 'session-123',
    imageUrl: uploadedImage?.url
  }
})
```

## Important Files

### Frontend
- `middleware.ts` - Route protection and auth
- `lib/auth/roles.ts` - Role resolution and helpers
- `lib/supabase/server.ts` - Supabase client for Server Components
- `lib/supabase/admin.ts` - Admin client (bypasses RLS)
- `app/api/chat/route.ts` - Chat API endpoint
- `app/actions/` - Server actions for mutations

### AI Service (Python)
- `odonto-gpt-agno-service/app/main.py` - FastAPI app entry
- `odonto-gpt-agno-service/app/agents/` - Agent definitions
- `odonto-gpt-agno-service/app/tools/` - Agent tools
- `odonto-gpt-agno-service/app/api.py` - API routes

### Database
- `supabase/migrations/` - Database migrations
- Latest migration: `20260113000000_add_agent_sessions.sql`

## User Roles

- **admin** - Full system access, user management
- **cliente** - Regular customer (default)
- **vendedor** - Sales representative, lead management

## Environment Variables

### Required (Frontend)
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000

BUNNY_STORAGE_ZONE=your-zone
BUNNY_STORAGE_API_KEY=your-key
BUNNY_CDN_BASE_URL=https://your-cdn.b-cdn.net
```

### Required (AI Service)
```bash
# odonto-gpt-agno-service/.env
OPENROUTER_API_KEY=sk-or-...
SUPABASE_DB_URL=postgresql://...
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000
```

### Optional
```bash
CAKTO_WEBHOOK_SECRET=...   # Payment webhooks
ZAPI_SECRET=...             # WhatsApp integration
RESEND_API_KEY=...          # Email delivery
NEXT_PUBLIC_SENTRY_DSN=...  # Error tracking
```

## Troubleshooting

### Frontend Issues
- **Missing env vars**: Run `npm run validate:env`
- **Build fails**: Check env vars, run `npm run build` locally first
- **Auth not working**: Check middleware, verify Supabase URL/keys

### AI Service Issues
- **Service won't start**: Check Python 3.9+, install dependencies
- **Agent errors**: Verify `OPENROUTER_API_KEY` in service `.env`
- **Connection refused**: Ensure service running on port 8000

### Database Issues
- **RLS blocking**: Check policies in Supabase dashboard
- **Migration stuck**: Use `npm run db:reset` (dev only)
- **Connection errors**: Verify Supabase project is active

## Documentation System

This project uses an LLM-optimized modular documentation system. See [`.docs/INDEX.md`](.docs/INDEX.md) for the complete index.

### Key Documentation Files
- [`.docs/01_PROJECT_OVERVIEW.md`](.docs/01_PROJECT_OVERVIEW.md) - Start here for complete overview
- [`.docs/07_PATTERNS.md`](.docs/07_PATTERNS.md) - Code patterns and examples
- [`.docs/10_TROUBLESHOOTING.md`](.docs/10_TROUBLESHOOTING.md) - Common issues

### Agno Service Documentation
- `odonto-gpt-agno-service/README.md` - Service overview
- `odonto-gpt-agno-service/QUICKSTART.md` - Setup guide
- `odonto-gpt-agno-service/PLAYGROUND_GUIDE.md` - Testing guide
- `odonto-gpt-agno-service/AGENTOS_GUIDE.md` - Monitoring dashboard

## Best Practices

### Security
- Never commit API keys or secrets
- Always use service role key sparingly in server contexts
- Validate inputs with Zod schemas
- Check RLS policies after schema changes

### Performance
- Use Server Components by default
- Only use `'use client'` when necessary
- Lazy load heavy components with `next/dynamic`
- Use `next/image` for all images

### Code Style
- Use TypeScript strict mode
- Follow existing file structure
- Keep Server Actions in `app/actions/`
- Use Zod for validation schemas

## External Integrations

### Cakto (Payment Gateway)
- Webhook: `app/api/webhooks/cakto/route.ts`
- Handles subscriptions and payments
- Configure `CAKTO_WEBHOOK_SECRET`

### Bunny CDN (Media Storage)
- Utilities in `lib/bunny/`
- Test with `npm run test:bunny`
- Used for videos and images

### Z-API (WhatsApp)
- Notifications and customer support
- Configure `ZAPI_SECRET`
- See `docs/WHATSAPP_SETUP_GUIDE.md`

### OpenRouter (AI Models)
- Multi-provider LLM gateway
- Used by Agno service
- Configure `OPENROUTER_API_KEY`

## Deployment

### Frontend (Vercel)
```bash
npm run build
npx vercel deploy --prod
```

### AI Service (Railway/Render)
```bash
cd odonto-gpt-agno-service
# Deploy to Railway, Render, or Fly.io
# Set environment variables in platform dashboard
```

## Related Docs

- **Deployment**: [`.docs/09_DEPLOYMENT.md`](.docs/09_DEPLOYMENT.md)
- **Patterns**: [`.docs/07_PATTERNS.md`](.docs/07_PATTERNS.md)
- **Troubleshooting**: [`.docs/10_TROUBLESHOOTING.md`](.docs/10_TROUBLESHOOTING.md)
- **Complete Index**: [`.docs/INDEX.md`](.docs/INDEX.md)

## Workflow & Automatização

### Envio para GitHub
- **Auto-Push**: Após concluir com sucesso uma implementação ou correção solicitada pelo usuário, realize sempre o commit e o push para o branch `main`.
- **Mensagens de Commit**: Devem ser descritivas e em Português (PT-BR).
- **Verificação**: Antes de finalizar, certifique-se de que o código passa por lint (se aplicável) e que o ambiente está estável.

---

**Last Updated**: 2026-01-23
**Documentation System**: v1.0 (LLM-Optimized)
