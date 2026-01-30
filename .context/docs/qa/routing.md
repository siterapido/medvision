---
slug: routing
category: architecture
generatedAt: 2026-01-30T11:15:47.030Z
relevantFiles:
  - app/api/admin
  - app/api/agents
  - app/api/artifacts
  - app/api/auth
  - app/api/cakto
  - app/api/certificates
  - app/api/chat
  - app/api/courses
  - app/api/cron
  - app/api/flashcards
---

# How does routing work?

## Routing

### Next.js App Router

Routes are defined by the folder structure in `app/`:

- `app/page.tsx` → `/`
- `app/about/page.tsx` → `/about`
- `app/blog/[slug]/page.tsx` → `/blog/:slug`

### Detected Route Files

- `../../../../lib/ai/commands/types.ts`
- `../../../../app/api/sentry-example-api/route.ts`
- `../../../../lib/ai/artifacts/handlers/types.ts`
- `../../../../lib/ai/artifacts/handlers/types.ts`
- `../../../../app/api/history/[id]/preview/route.ts`