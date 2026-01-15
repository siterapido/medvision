# Project Overview

## Meta
**File**: `.docs/01_PROJECT_OVERVIEW.md`
**Section**: 1 of 10
**Tags**: #overview #quickstart #tech-stack
**Related**: `02_ARCHITECTURE.md`, `09_DEPLOYMENT.md`

## Project Identity

**Name**: Odonto GPT UI
**Type**: SaaS Platform for Dental Professionals
**Tech Stack**: Next.js 16 + Python (Agno) + Supabase
**Created with**: v0.app
**Language**: TypeScript (frontend), Python (AI service)

## One-Line Summary

AI-powered dental education platform with multi-agent system for Q&A and image analysis, built on Next.js 16 with Supabase backend and Agno framework for intelligent agents.

## Target Users

- **Dental Professionals** - Dentists seeking education and AI assistance
- **Dental Students** - Learning platform with AI tutors
- **Sales Team** - Lead management and customer conversion
- **Administrators** - Platform management and analytics

## Core Features

### 1. AI-Powered Dental Q&A
- Multi-agent system with QA, Image Analysis, and Team coordination
- Streaming responses for real-time interaction
- RAG knowledge base integration with course materials
- Specialty-specific responses (periodontia, endodontia, etc.)

**Tech**: Agno framework, OpenRouter, FastAPI

### 2. Image Analysis
- Upload dental X-rays and intraoral photos
- AI-powered radiologist agent analysis
- Follow-up questions supported
- Integration with Bunny CDN for image storage

**Tech**: OpenAI GPT-4o Vision, Bunny CDN

### 3. Online Courses
- Hierarchical structure: courses → modules → lessons
- Video delivery via Bunny CDN
- Progress tracking and completion
- Material attachments and downloads

**Tech**: Supabase, Bunny CDN, Next.js Video

### 4. Lead Management
- Pipeline tracking for sales team
- WhatsApp integration for customer support
- Subscription management via Cakto gateway
- Automated notifications and follow-ups

**Tech**: Cakto, Z-API, Supabase

## Tech Stack Deep Dive

### Frontend Layer
```
Next.js 16 (App Router)
├── React 19 (Server Components)
├── TypeScript 5
├── Tailwind CSS 4
└── shadcn/ui (Radix UI)
```

**Key Features**:
- React Server Components by default
- Server Actions for mutations
- Streaming responses for AI chat
- Mobile-first responsive design

### Backend Layer
```
Supabase
├── PostgreSQL 15+ with RLS
├── Supabase Auth (email/password)
├── Supabase Storage (Bunny CDN integration)
└── Real-time subscriptions (optional)
```

**Key Features**:
- Row Level Security (RLS) on all tables
- UUID primary keys
- Audit timestamps (created_at, updated_at)
- Service role for admin operations

### AI Service Layer
```
Agno (Python Microservice)
├── FastAPI (async web framework)
├── OpenRouter (multi-provider LLM gateway)
├── Supabase Python client
└── pgvector for embeddings
```

**Key Features**:
- Multi-agent orchestration
- Streaming responses
- Tool calling (web search, WhatsApp, DB query)
- Session persistence

### External Services
```
Integrations
├── Cakto (payment gateway - Brazil)
├── Bunny CDN (media delivery)
├── Z-API (WhatsApp)
├── Resend (email)
├── Vercel (hosting)
└── Sentry (error tracking)
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Supabase account
- OpenRouter API key

### 5-Minute Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd v0-odonto-gpt-ui
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your keys
npm run validate:env

# 3. Setup database
npm run db:push
npm run db:status

# 4. Start frontend
npm run dev
# → http://localhost:3000

# 5. Start AI service (optional)
cd odonto-gpt-agno-service
pip install -r requirements.txt
cp .env.example .env
# Edit .env with OPENROUTER_API_KEY
python -m uvicorn app.main:app --reload
# → http://localhost:8000
```

### Verify Installation

```bash
# Check frontend
curl http://localhost:3000

# Check AI service
curl http://localhost:8000/health
# Expected: {"status": "healthy"}

# Check database
npm run db:status
```

## Development Workflow

### Frontend Development

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run lint         # ESLint check
npm run test         # Run tests
```

### Database Development

```bash
npm run db:push      # Apply migrations
npm run db:diff      # Generate migration diff
npm run db:reset     # Reset database (dev only)
npm run db:status    # Check migration status
```

### AI Service Development

```bash
npm run agno:install # Install Python deps
npm run agno:dev     # Start Agno service
cd odonto-gpt-agno-service

# Interactive testing
python playground.py           # Full playground
python playground_simple.py    # Simple playground
python chat.py                 # Chat interface

# Monitoring dashboard
./start_agentui.sh             # AgentUI at localhost:8000/ui
```

## Project Structure

```
v0-odonto-gpt-ui/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes (login, register)
│   ├── (marketing)/         # Landing page
│   ├── dashboard/           # Protected dashboard
│   ├── admin/               # Admin panel
│   ├── actions/             # Server actions
│   ├── api/                 # API routes
│   └── layout.tsx           # Root layout
│
├── components/              # React components
│   ├── ui/                 # shadcn/ui base
│   ├── auth/               # Auth forms
│   ├── chat/               # Chat interface
│   ├── ai-elements/        # AI-powered components
│   └── layout/             # Layout components
│
├── lib/                     # Utilities
│   ├── ai/                 # AI service integration
│   ├── auth/               # Auth utilities
│   ├── bunny/              # CDN utilities
│   └── supabase/           # Database client
│
├── odonto-gpt-agno-service/ # Python AI service
│   ├── app/
│   │   ├── agents/         # Agent definitions
│   │   ├── tools/          # Agent tools
│   │   ├── models/         # Pydantic schemas
│   │   ├── api.py          # API routes
│   │   └── main.py         # FastAPI app
│   ├── requirements.txt
│   └── .env.example
│
└── supabase/
    └── migrations/         # Database migrations
```

## User Roles

### Admin
- Full system access
- Manage users, courses, subscriptions
- View analytics and reports
- Access admin panel at `/admin`

### Cliente (Customer)
- Access purchased courses
- Chat with AI agents
- View progress and certificates
- Manage subscription

### Vendedor (Sales)
- Manage leads and pipeline
- View customer interactions
- Track subscriptions
- Access sales dashboard

## Key Features by Role

| Feature | Admin | Cliente | Vendedor |
|---------|-------|---------|----------|
| AI Chat | ✅ | ✅ | ✅ |
| Image Analysis | ✅ | ✅ | ✅ |
| Courses | ✅ | ✅ | ❌ |
| Lead Management | ✅ | ❌ | ✅ |
| User Management | ✅ | ❌ | ❌ |
| Analytics | ✅ | ❌ | ❌ |

## Environment Variables

### Required for Frontend

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Bunny CDN (required)
BUNNY_STORAGE_ZONE=your-zone
BUNNY_STORAGE_API_KEY=your-key
BUNNY_CDN_BASE_URL=https://your-cdn.b-cdn.net

# Site URL (required)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Required for AI Service

```bash
# odonto-gpt-agno-service/.env
OPENROUTER_API_KEY=sk-or-xxx...
SUPABASE_DB_URL=postgresql://...
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000
```

### Optional

```bash
# Payment
CAKTO_WEBHOOK_SECRET=your-secret

# WhatsApp
ZAPI_SECRET=your-secret

# Email
RESEND_API_KEY=re_xxx...

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
```

## Common Commands

```bash
# Development
npm run dev              # Start frontend
npm run agno:dev         # Start AI service

# Database
npm run db:push          # Apply migrations
npm run db:status        # Check status

# Validation
npm run validate:env     # Check env vars
npm run test:bunny       # Test CDN
npm run test             # Run tests

# Deployment
npm run build            # Build for production
vercel --prod            # Deploy to Vercel
```

## Troubleshooting Quick Reference

### Frontend won't start
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache
rm -rf .next node_modules
npm install

# Check env vars
npm run validate:env
```

### AI service won't start
```bash
# Check Python version
python --version  # Should be 3.9+

# Install dependencies
cd odonto-gpt-agno-service
pip install -r requirements.txt

# Check env vars
cat .env
```

### Database issues
```bash
# Check migrations
npm run db:status

# Reset (dev only)
npm run db:reset
```

## Next Steps

After reading this file:
1. Read `02_ARCHITECTURE.md` for system architecture
2. Read `07_PATTERNS.md` for code patterns
3. Explore `odonto-gpt-agno-service/` for AI service details

## References

- **Next**: `02_ARCHITECTURE.md` - System architecture
- **Related**: `04_AI_AGENTS.md` - AI service details
- **Deploy**: `09_DEPLOYMENT.md` - Production deployment

---

**Last Updated**: 2025-01-15
**See Also**: `.docs/INDEX.md`
