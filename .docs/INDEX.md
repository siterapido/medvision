# Odonto GPT UI - Documentation Index

## Meta Information
- **Project**: Odonto GPT UI
- **Type**: Next.js 16 SaaS Platform
- **Framework**: App Router + React Server Components
- **AI**: Agno (Python) + OpenRouter
- **Database**: Supabase (PostgreSQL + RLS)
- **Created**: 2025
- **Last Updated**: 2025-01-15

## Documentation Structure

### Core Documentation
| File | Purpose | Tags |
|------|---------|------|
| `01_PROJECT_OVERVIEW.md` | Project summary, quick start, tech stack | #overview #quickstart |
| `02_ARCHITECTURE.md` | System architecture, components, patterns | #architecture #structure |
| `03_DATABASE_SCHEMA.md` | Database tables, migrations, RLS | #database #supabase |
| `04_AI_AGENTS.md` | Agno service, agents, endpoints | #ai #python #agno |
| `05_AUTHORIZATION.md` | Auth flow, roles, permissions | #auth #security |
| `06_API_ENDPOINTS.md` | API routes, webhooks, integrations | #api #routes |
| `07_PATTERNS.md` | Common patterns, code examples | #patterns #typescript |
| `08_INTEGRATIONS.md` | External services, configuration | #integrations #config |
| `09_DEPLOYMENT.md` | Production deployment, checklist | #deployment #production |
| `10_TROUBLESHOOTING.md` | Common issues and solutions | #troubleshooting #debug |

### Quick Reference

**For AI Agents (Claude, GPT, etc):**
- Read `01_PROJECT_OVERVIEW.md` first for context
- Check `02_ARCHITECTURE.md` for codebase structure
- Reference `07_PATTERNS.md` for code examples
- See `04_AI_AGENTS.md` for AI service specifics

**For Developers:**
- Start with `01_PROJECT_OVERVIEW.md` → Quick Start section
- Review `02_ARCHITECTURE.md` → Component Structure
- Study `07_PATTERNS.md` for implementation patterns
- Check `10_TROUBLESHOOTING.md` when stuck

**For DevOps:**
- Read `09_DEPLOYMENT.md` for deployment procedures
- Check `08_INTEGRATIONS.md` for service configuration
- Reference `03_DATABASE_SCHEMA.md` for database setup

## Key Concepts

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 16 Frontend                       │
│  (App Router, Server Components, Server Actions)            │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Agno AI Service (Python/FastAPI)               │
│  (QA Agent, Image Agent, Team Coordinator)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Backend                          │
│  (PostgreSQL, Auth, Storage, RLS)                          │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack Matrix

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16, React 19, TypeScript | UI, Server Components |
| Styling | Tailwind CSS 4, shadcn/ui | Component library |
| AI | Agno, FastAPI, OpenRouter | Multi-agent AI system |
| Database | Supabase (PostgreSQL) | Data, auth, storage |
| Hosting | Vercel | Frontend deployment |
| Payment | Cakto | Brazilian subscriptions |
| CDN | Bunny CDN | Video/image delivery |
| Messaging | Z-API | WhatsApp integration |

## Search by Tag

```
#overview - Project information
#architecture - System design and structure
#database - Schema, migrations, queries
#ai - AI agents and machine learning
#auth - Authentication and authorization
#api - REST endpoints and routes
#patterns - Code patterns and examples
#integrations - Third-party services
#deployment - Production setup
#troubleshooting - Debugging and fixes
```

## File Organization

```
v0-odonto-gpt-ui/
├── .docs/                    # This documentation system
│   ├── INDEX.md             # This file
│   └── *.md                 # Modular documentation files
├── app/                     # Next.js App Router
│   ├── actions/            # Server actions
│   ├── api/                # API routes
│   └── dashboard/          # Protected pages
├── components/             # React components
│   ├── ui/                # shadcn/ui base
│   ├── auth/              # Auth flows
│   ├── chat/              # Chat interface
│   └── layout/            # Layout components
├── lib/                    # Utilities and config
│   ├── ai/                # AI service integration
│   ├── auth/              # Auth utilities
│   ├── bunny/             # CDN utilities
│   └── supabase/          # Database client
├── odonto-gpt-agno-service/  # Python AI service
│   ├── app/
│   │   ├── agents/        # Agent definitions
│   │   ├── tools/         # Agent tools
│   │   └── models/        # Pydantic schemas
│   └── requirements.txt   # Python dependencies
└── supabase/
    └── migrations/        # Database migrations
```

## Critical Files for LLM Context

When processing this codebase, prioritize reading:

1. **`.docs/01_PROJECT_OVERVIEW.md`** - Quick context on project purpose
2. **`.docs/07_PATTERNS.md`** - Code patterns and conventions
3. **`app/api/chat/route.ts`** - Main chat API (if exists)
4. **`lib/auth/roles.ts`** - Authorization logic
5. **`middleware.ts`** - Route protection
6. **`odonto-gpt-agno-service/app/agents/`** - AI agent definitions
7. **`supabase/migrations/`** - Latest schema changes

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-15 | Initial documentation system |
| 1.1 | 2025-01-15 | Added AI agents section |
| 1.2 | 2025-01-15 | Added WhatsApp integration |

## Contributing to Documentation

When making changes to the codebase:
1. Update relevant `.docs/*.md` files
2. Keep examples current with actual code
3. Add cross-references between files
4. Update this INDEX.md if adding new sections
5. Tag changes with appropriate tags

## Navigation

**← Previous**: None (this is the index)
**Next**: `01_PROJECT_OVERVIEW.md` - Start here for project overview

---

**Last Updated**: 2025-01-15
**Maintained By**: Development Team
**Documentation Standard**: LLM-Optimized Markdown v1.0
