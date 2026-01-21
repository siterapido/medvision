---
name: Feature Developer
description: Implement new features according to specifications
status: active
generated: 2026-01-21
---

# Feature Developer Agent Playbook

## Mission
The Feature Developer agent is responsible for implementing new functionality across the full stack (Next.js frontend + Supabase backend), ensuring code quality, testability, and adherence to project patterns. Engage this agent when a clear requirement or user story is ready for implementation.

## Responsibilities
- Implement new features according to specifications.
- Design clean, maintainable code architecture following the project's layered approach (UI -> Lib -> API -> DB).
- Integrate features with existing codebase (Auth, Dashboard, Chat).
- Write comprehensive tests for new functionality (Unit + Integration).

## Best Practices
- **Favor Server Components**: Use 'use client' only when interaction/state is needed.
- **Strict Typing**: No `any`; define interfaces in `types.ts` files collocated with components or in `lib/`.
- **Validation**: Use Zod for all API inputs and form handling.
- **Error Handling**: Use `try/catch` in API routes and return structured error responses.

## Key Project Resources
- Documentation index: [docs/README.md](../docs/README.md)
- Agent handbook: [agents/README.md](./README.md)
- Agent knowledge base: [AGENTS.md](../../AGENTS.md)
- Contributor guide: [CONTRIBUTING.md](../../CONTRIBUTING.md)

## Repository Starting Points
- `app/` — Next.js App Router pages and API routes. Structure follows the URL path.
- `components/` — Reusable UI components. `ui/` for Shadcn, others grouped by feature (e.g., `dashboard/`, `chat/`).
- `docs/` — Project documentation, including architecture and workflows.
- `lib/` — Shared utilities, business logic, hooks, and service integrations (Supabase, AI, Payment).
- `public/` — Static assets served from root.
- `scripts/` — Helper scripts for maintenance, testing, and automation.
- `styles/` — Global CSS and Tailwind configuration.
- `supabase/` — Database migrations (`migrations/`) and Edge Functions (`functions/`).
- `tests/` — Test suites (Vitest/Playwright).

## Key Files
**Entry Points:**
- [`lib/supabase/server.ts`](../../lib/supabase/server.ts) — Supabase Server Client instantiation.
- [`components/research/index.ts`](../../components/research/index.ts) — Main Research UI.
- [`components/dashboard/index.ts`](../../components/dashboard/index.ts) — Main Dashboard Layout.
- [`components/chat/index.ts`](../../components/chat/index.ts) — Chat Interface Entry.
- [`app/api/chat/route.ts`](../../app/api/chat/route.ts) — Main Chat API Endpoint.

**Pattern Implementations:**
- **Factory**: `createCodeArtifact` in `components/artifacts/types.ts`.
- **Service**: `streamAgnoChat` in `lib/ai/agno-service.ts`.
- **Utils**: `cn` (Tailwind merge) in `lib/utils.ts`.

## Architecture Context

### Config
Configuration and constants
- **Directories**: `.`

### Controllers
Request handling and routing (Next.js App Router)
- **Directories**: `app/api/`, `app/auth/`
- **Key exports**: `GET`, `POST`, `DELETE`, `PATCH` handlers in `app/api/**/route.ts`.

### Components
UI components and views
- **Directories**: `components/`, `app/` (pages)
- **Key exports**: `DashboardProfile`, `ChatMessage`, `ArtifactResult`.

### Utils
Shared utilities and helpers
- **Directories**: `lib/`
- **Key exports**: `cn`, `sendEmail`, `checkUserSubscription`.

### Services
Business logic and orchestration
- **Directories**: `lib/ai`, `lib/supabase`
- **Key exports**: `streamAgnoChat`, `fetchAgents`.

### Models
Data structures and domain objects
- **Directories**: `types/` (if any), interfaces in `lib/`.
- **Key exports**: `AgentDetails`, `ToolCall`, `ChatMessage`.

## Documentation Touchpoints
- [Documentation Index](../docs/README.md)
- [Project Overview](../docs/project-overview.md)
- [Architecture Notes](../docs/architecture.md)
- [Development Workflow](../docs/development-workflow.md)
- [Testing Strategy](../docs/testing-strategy.md)
- [Glossary & Domain Concepts](../docs/glossary.md)

## Collaboration Checklist
1. Confirm assumptions with issue reporters or maintainers.
2. Review open pull requests affecting this area.
3. Update the relevant doc section listed above.
4. Capture learnings back in [docs/README.md](../docs/README.md).

## Hand-off Notes
Summarize outcomes, remaining risks, and suggested follow-up actions after the agent completes its work.
