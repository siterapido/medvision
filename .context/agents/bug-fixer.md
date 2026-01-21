---
name: Bug Fixer
description: Analyze bug reports and error messages
status: active
generated: 2026-01-21
---

# Bug Fixer Agent Playbook

## Mission
The Bug Fixer agent is the first line of defense against regressions and reported issues. Its mission is to rapidly reproduce, diagnose, and resolve defects while preserving the integrity of the existing system. Engage this agent when a bug report is filed or a CI/CD pipeline fails.

## Responsibilities
- Analyze bug reports, stack traces, and error messages.
- Identify root causes by tracing data flow and state changes.
- Implement targeted fixes with minimal side effects (defensive coding).
- Test fixes thoroughly (reproduction case + regression test) before deployment.
- Verify fixes against the original report.

## Best Practices
- **Reproduction First**: Never fix a bug you haven't reproduced. Create a minimal reproduction script or test case.
- **Root Cause Analysis**: Ask "why" 5 times. Don't just patch the symptom.
- **Regression Testing**: Add a test case that fails without the fix and passes with it.
- **Atomic Commits**: Isolate the fix from unrelated refactoring.

## Key Project Resources
- Documentation index: [docs/README.md](../docs/README.md)
- Agent handbook: [agents/README.md](./README.md)
- Agent knowledge base: [AGENTS.md](../../AGENTS.md)
- Contributor guide: [CONTRIBUTING.md](../../CONTRIBUTING.md)

## Repository Starting Points
- `app/` — Route handlers and pages. Common source of routing and hydration errors.
- `components/` — UI Components. Check here for visual bugs or interaction issues.
- `lib/` — Business logic. Check here for calculation errors, data transformation bugs, or auth issues.
- `tests/` — Existing test suites. Use these as a template for reproduction cases.
- `scripts/` — Utility scripts. Useful for database maintenance or manual testing.
- `supabase/functions/` — Edge functions. Check here for backend logic errors specific to Supabase.

## Key Files
**Entry Points:**
- [`lib/supabase/server.ts`](../../lib/supabase/server.ts) — Check for auth/session issues.
- [`app/api/chat/route.ts`](../../app/api/chat/route.ts) — Check for chat stream interruptions or payload errors.
- [`components/ui/toaster.tsx`](../../components/ui/toaster.tsx) — Check for error notification display issues.
- [`sentry.config.ts`](../../sentry.config.ts) — Error tracking configuration.

**Pattern Implementations:**
- **Validation**: Zod schemas in `lib/validations/`.
- **Error Handling**: `try/catch` blocks in API routes.

## Architecture Context

### Config
Configuration and constants
- **Directories**: `.`

### Controllers
Request handling and routing
- **Symbols**: 131 total

### Components
UI components and views
- **Symbols**: 681 total

### Utils
Shared utilities and helpers
- **Symbols**: 2465 total

### Services
Business logic and orchestration
- **Symbols**: 20292 total

### Models
Data structures and domain objects
- **Symbols**: 78 total

### Repositories
Data access and persistence
- **Symbols**: 207 total

## Key Symbols for This Agent
- [`MockDb`](scripts/test_perplexity_research.py#L46) (class)
- [`NotificationTemplate`](lib/notifications.ts#L5) (interface)
- [`ChatMessage`](lib/agno.ts#L113) (interface)

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
