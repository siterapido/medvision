# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Odonto GPT UI is a Next.js 16 SaaS platform for dental professionals, featuring AI-powered tools, online courses, and lead management. The platform includes a Python-based AI agent service powered by Agno framework for intelligent dental Q&A and image analysis. The project was created using v0.app and syncs with deployments automatically.

## Quick Start

### First Time Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd v0-odonto-gpt-ui
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   npm run validate:env  # Verify configuration
   ```

3. **Set up the database:**
   ```bash
   npm run db:push  # Apply migrations
   npm run db:status  # Verify migration status
   ```

4. **Start the development server:**
   ```bash
   npm run dev  # Next.js frontend at http://localhost:3000
   ```

5. **Start the Agno AI service (optional, for AI features):**
   ```bash
   cd odonto-gpt-agno-service
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with OPENROUTER_API_KEY and other configs
   python -m uvicorn app.main:app --reload
   # Service starts at http://localhost:8000
   ```

See [`odonto-gpt-agno-service/QUICKSTART.md`](odonto-gpt-agno-service/QUICKSTART.md) for detailed Agno service setup.

## Development Commands

### Build & Run
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # ESLint checking
```

### Database (Supabase)
```bash
npm run db:status    # Check migration status
npm run db:push      # Push database changes
npm run db:diff      # Generate migration diff
npm run db:reset     # Reset database
```

### Testing & Validation
```bash
npm run test              # Run test suite
npm run validate:env      # Validate environment variables
npm run test:bunny        # Test Bunny CDN configuration
```

### Agno AI Service (Python)
```bash
npm run agno:install      # Install Python dependencies
npm run agno:dev          # Start Agno service development server
cd odonto-gpt-agno-service && python -m uvicorn app.main:app --reload
```

The Agno service runs on port 8000 and provides:
- `/api/v1/qa/chat` - Dental Q&A chat endpoint (streaming)
- `/api/v1/image/analyze` - Image analysis endpoint
- `/api/v1/chat` - Unified chat with automatic agent routing
- `/health` - Health check endpoint

### Agno Playground (Development & Testing)

The service provides several playground scripts for interactive testing:

```bash
cd odonto-gpt-agno-service
source venv/bin/activate  # or activate your virtual environment

# Playground options:
python playground.py           # Main playground with all features
python playground_no_db.py     # Start playground without database
python playground_simple.py    # Start simple playground
python playground_agentos.py   # Start agents-specific playground
python chat.py                 # Interactive chat interface
```

**Playground Features:**
- Interactive web UI at `http://localhost:8000` for testing agents
- Real-time agent response streaming
- Image upload and analysis testing
- Session history tracking
- Debug mode for troubleshooting

See [`odonto-gpt-agno-service/PLAYGROUND_GUIDE.md`](odonto-gpt-agno-service/PLAYGROUND_GUIDE.md) for detailed usage instructions.

### AgentUI Dashboard

AgentUI is a web-based dashboard for monitoring and interacting with Agno agents in real-time:

```bash
cd odonto-gpt-agno-service
./start_agentui.sh  # Start AgentUI dashboard
```

**Features:**
- Real-time agent conversation monitoring
- Interactive chat interface with agents
- Session history and replay
- Performance metrics and logs
- Tool execution tracking

The dashboard runs at `http://localhost:8000/ui` by default. See [`odonto-gpt-agno-service/AGENTOS_GUIDE.md`](odonto-gpt-agno-service/AGENTOS_GUIDE.md) for details.

## Architecture & Tech Stack

### Core Technologies
- **Next.js 16** with App Router and React Server Components
- **React 19** and TypeScript
- **Supabase** for database, authentication, and storage
- **Tailwind CSS 4** with shadcn/ui components
- **Server Actions** for data mutations
- **Agno (Python)** - AI agent framework for multi-agent orchestration
- **FastAPI** - Python async web framework for AI service
- **OpenRouter** - Unified API access to multiple LLM providers
- **OpenAI AI SDK** for AI-powered features

### Key External Services
- **Cakto** - Brazilian payment gateway for subscriptions
- **Bunny CDN** - Content delivery for videos and materials
- **Z-API** - WhatsApp integration for notifications and customer support
- **Resend** - Email delivery
- **Vercel** - Hosting and deployment
- **Sentry** - Error monitoring and performance tracking
- **OpenRouter** - Unified LLM API gateway for AI models

## Agno AI Service

The Odonto GPT Agno Service ([`odonto-gpt-agno-service/`](odonto-gpt-agno-service/)) is a Python-based microservice that provides intelligent AI agents for dental education and image analysis.

### Architecture

The service uses **Agno** (formerly Phidata) framework for multi-agent orchestration:

- **QA Agent** ([`app/agents/qa_agent.py`](odonto-gpt-agno-service/app/agents/qa_agent.py)) - Dental education assistant for answering questions about dental procedures, techniques, and theory
- **Image Agent** ([`app/agents/image_agent.py`](odonto-gpt-agno-service/app/agents/image_agent.py)) - Dental radiologist for analyzing X-rays, intraoral photos, and clinical images
- **Team Coordinator** ([`app/agents/team.py`](odonto-gpt-agno-service/app/agents/team.py)) - Orchestrates multi-agent workflows when both analysis and Q&A are needed

### Research Tools

The agents have access to specialized research tools ([`app/tools/research.py`](odonto-gpt-agno-service/app/tools/research.py)):
- **Web Search** - Search the web for current dental research and guidelines
- **WhatsApp Integration** - Send and receive WhatsApp messages for customer support
- **Database Query** - Query Supabase database for patient data and course information

See [`odonto-gpt-agno-service/RESEARCH_TOOLS_GUIDE.md`](odonto-gpt-agno-service/RESEARCH_TOOLS_GUIDE.md) for details.

### Knowledge Base Integration

The agents can access course materials through vector similarity search ([`app/tools/knowledge.py`](odonto-gpt-agno-service/app/tools/knowledge.py)):
- Uses pgvector for semantic search across courses and lessons
- Falls back to PostgreSQL full-text search if vector embeddings unavailable
- Supports specialty filtering (periodontia, endodontia, etc.)

### API Endpoints

**Base URL:** `http://localhost:8000/api/v1` (development)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/qa/chat` | POST | Streaming dental Q&A (uses `QARequest` schema) |
| `/image/analyze` | POST | Analyze dental images (uses `ImageAnalysisRequest`) |
| `/chat` | POST | Unified chat with auto-routing (uses `ChatRequest`) |
| `/sessions` | POST | Create a new agent session |
| `/sessions/{id}` | GET | Get session with messages |
| `/sessions/{id}` | DELETE | Delete a session |
| `/health` | GET | Service health check |

### Directory Structure

```
odonto-gpt-agno-service/
├── app/
│   ├── agents/
│   │   ├── qa_agent.py       # Q&A agent definition
│   │   ├── image_agent.py    # Image analysis agent
│   │   └── team.py           # Multi-agent coordination
│   ├── tools/
│   │   ├── knowledge.py      # RAG knowledge base search
│   │   ├── vision.py         # Image processing utilities
│   │   ├── research.py       # Web search and WhatsApp tools
│   │   ├── whatsapp.py       # WhatsApp integration
│   │   └── database/
│   │       └── supabase.py   # Supabase connection helpers
│   ├── models/
│   │   └── schemas.py        # Pydantic request/response models
│   ├── api.py                # API routes
│   └── main.py               # FastAPI application entry
├── agent-ui/                 # AgentUI dashboard for monitoring
├── data/                     # Knowledge base and training data
├── scripts/                  # Utility scripts
├── requirements.txt          # Python dependencies
├── .env.example             # Environment variables template
├── README.md                # Service documentation
├── QUICKSTART.md            # Quick start guide
├── PLAYGROUND_GUIDE.md      # Playground usage guide
├── AGENTOS_GUIDE.md         # AgentUI monitoring guide
├── RAG_GUIDE.md             # RAG implementation guide
├── RESEARCH_TOOLS_GUIDE.md  # Research tools documentation
├── SETUP_CHECKLIST.md       # Setup verification checklist
└── IMPLEMENTATION_SUMMARY.md # Architecture overview
```

### Development Workflow

1. **Install dependencies:**
   ```bash
   npm run agno:install
   # or
   cd odonto-gpt-agno-service && pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cd odonto-gpt-agno-service
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Run development server:**
   ```bash
   npm run agno:dev
   # Service starts at http://localhost:8000
   ```

4. **Test health endpoint:**
   ```bash
   curl http://localhost:8000/health
   ```

5. **Run playground for interactive testing:**
   ```bash
   cd odonto-gpt-agno-service
   python playground.py
   # Access at http://localhost:8000
   ```

6. **Start AgentUI dashboard:**
   ```bash
   ./start_agentui.sh
   # Access at http://localhost:8000/ui
   ```

**Development Tips:**
- Use the playground for quick agent testing without frontend
- Monitor agent behavior in real-time with AgentUI
- Check logs in `odonto-gpt-agno-service/agno.log` for debugging
- Run tests with `pytest` (if configured)
- See `odonto-gpt-agno-service/SETUP_CHECKLIST.md` for verification steps

## Database Schema

The database uses PostgreSQL with Row Level Security (RLS). Key tables include:

- **profiles** - User profiles linked to auth.users with role-based access
- **courses, modules, lessons** - Hierarchical course structure
- **materials** - Learning materials and attachments
- **subscriptions, transactions** - Payment and subscription management
- **pipeline, leads** - Lead management system for sales
- **chat_threads** - AI chat conversation history
- **notifications** - User notifications
- **live_events** - Live streaming events
- **agent_sessions** - Agno AI agent session storage for conversation history
  - Stores session metadata (agent_type, status, created_at, updated_at)
  - Links to user who created the session
  - Tracks session type: 'qa', 'image-analysis', or 'team'
- **agent_messages** - Individual messages within agent sessions
  - Links to parent session
  - Stores role (user/assistant) and content
  - Includes metadata like images, tool calls, and tokens used
- **knowledge_base** - Vector embeddings for RAG (optional, requires pgvector)

All tables use UUID primary keys and include audit timestamps (created_at, updated_at).

**Recent Migrations:**
- `20260113000000_add_agent_sessions.sql` - Adds agent_sessions and agent_messages tables for conversation persistence

## Chat & Image Upload Features

### Image Upload with Bunny CDN

The platform supports uploading dental images for AI analysis through Bunny CDN integration:

**Components:**
- `components/chat/image-upload.tsx` - React-dropzone based upload component
- `lib/bunny/upload.ts` - Upload utilities for Bunny CDN
- `components/chat/chat-interface.tsx` - Updated chat UI with image support

**Features:**
- Drag-and-drop image upload
- Real-time upload progress
- Image preview before and during upload
- Automatic file validation (type, size)
- Support for JPEG, PNG, GIF, WebP (max 10MB)
- One-year cache on CDN for performance

**Usage Example:**
```typescript
import { ImageUpload, type UploadedImage } from "@/components/chat/image-upload"

function MyComponent() {
  const [images, setImages] = useState<UploadedImage[]>([])

  return (
    <ImageUpload
      images={images}
      onImagesChange={setImages}
      maxFiles={3}
      userId={user.id}
      disabled={isLoading}
    />
  )
}
```

### Session Management

Agent sessions are persisted in the database and accessible via API:

**Database Tables:**
- `agent_sessions` - Stores session metadata (agent_type, status, created_at, etc.)
- `agent_messages` - Stores individual messages within sessions

**Session API Endpoints:**
- `GET /api/sessions` - List all sessions for current user
- `POST /api/sessions` - Create a new session
- `GET /api/sessions/{id}` - Get session with messages
- `DELETE /api/sessions/{id}` - Delete a session
- `PATCH /api/sessions/{id}` - Update session status/metadata

**Session Cache:**
Client-side caching via `lib/ai/session-cache.ts`:
- `fetchSessions()` - Fetch with cache support
- `getCachedSessions()` - Get from localStorage
- `updateCachedSession()` - Add/update cache entry
- `deleteSession()` - Delete via API and update cache

**Session History Page:**
`app/dashboard/chat/history/page.tsx` - View and manage past conversations

### Chat Flow with Images

1. **User uploads image** → Bunny CDN via `uploadChatImage()`
2. **User sends message** → `/api/chat` with `imageUrl`
3. **API routes to Agno** → Determines agent type (image-analysis vs qa)
4. **Agno processes** → Image agent analyzes image, returns response
5. **Response streamed** → Frontend displays analysis

**Example:**
```typescript
// In chat-interface.tsx
const { images } = useChat({
  api: "/api/chat",
  body: {
    imageUrl: uploadedImages[0]?.url,
    sessionId: sessionId
  }
})
```

### AI Features Overview

The platform provides three main AI-powered features:

**1. Dental Q&A Chat (`qa` agent)**
- Ask questions about dental procedures, techniques, and theory
- Access course materials through RAG knowledge base
- Specialty-specific responses (periodontia, endodontia, etc.)
- See `app/agents/qa_agent.py` for implementation

**2. Image Analysis (`image-analysis` agent)**
- Upload dental X-rays, intraoral photos, and clinical images
- AI-powered radiologist analysis
- Supports follow-up questions about the image
- See `app/agents/image_agent.py` for implementation

**3. Multi-Agent Workflows (`team` coordinator)**
- Combines QA and Image agents when needed
- Orchestrates complex multi-step conversations
- Automatic agent routing based on user input
- See `app/agents/team.py` for implementation

**Configuration:**
- Set agent type in API request or let auto-routing decide
- Configure models via environment variables in Agno service
- Custom prompts and behaviors per agent type
- Session persistence across all agent types

## Authentication & Authorization

### User Roles
- **admin** - Full system access
- **cliente** - Regular customer access (default)
- **vendedor** - Sales representative access

### Auth Flow
- Email/password authentication via Supabase Auth
- Role determination via `lib/auth/roles.ts` (checks profile table, then app_metadata/user_metadata)
- Middleware protection for protected routes (`/dashboard`, `/admin`, `/settings`, `/profile`)
- Auto-redirect: authenticated users from `/login`/`/register` → appropriate panel based on role

### Important Patterns
- Always use `createClient()` from `lib/supabase/server.ts` in Server Components/Actions
- Use `createAdminClient()` from `lib/supabase/admin.ts` for operations bypassing RLS
- Never cache Supabase clients in global variables (especially for Fluid compute)
- Middleware (`middleware.ts`) handles session refresh and route protection

## Server Actions Pattern

Server actions are in `app/actions/` and follow this pattern:

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function someAction(params: Params): Promise<ActionResult> {
  const supabase = await createClient()

  // Validation with Zod schemas
  const parsed = schema.safeParse(params)
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: ... }
  }

  // Database operations
  const { data, error } = await supabase.from("table").select("*")

  // Revalidate affected paths
  revalidatePath("/some-path")

  return { success: true, data }
}
```

All actions return `ActionResult<T>` type with `{ success: boolean, data?: T, error?: string }`.

## Component Structure

### Directories
- **app/** - Next.js App Router pages and layouts
- **app/actions/** - Server actions for data operations
- **app/api/** - API routes (webhooks, external integrations)
  - **app/api/sessions/** - Agent session management endpoints
- **app/dashboard/chat/history/** - Chat session history page
- **components/ui/** - shadcn/ui base components
- **components/auth/** - Authentication forms and flows
- **components/ai-elements/** - AI-powered components
- **components/chat/** - Chat interface components with image upload support
- **components/layout/** - Layout components (Header, Shell, Sidebar)
- **lib/** - Utility functions and configurations
  - **lib/ai/** - AI service integrations and session caching
  - **lib/bunny/** - Bunny CDN upload utilities
- **lib/supabase/** - Supabase client configurations
- **lib/auth/** - Authentication utilities
- **odonto-gpt-agno-service/** - Python microservice for AI agents (Agno framework)
- **supabase/migrations/** - Database migration files

### UI Components
- Uses shadcn/ui with Radix UI primitives
- All components in `components/ui/` are auto-generated from shadcn
- Custom components extend base UI components
- **Tabs component** (`components/ui/tabs.tsx`) - For tabbed interfaces in chat and settings
- Follow mobile-first responsive design (see `docs/mobile-first-guidelines.md`)

**Key UI Patterns:**
- Floating chat widget (`components/chat/floating-chat.tsx`) - AI assistant accessible from any page
- Image upload with drag-and-drop (`components/chat/image-upload.tsx`)
- Session history with tabs for different conversation types
- Mobile-responsive sidebar with overlay pattern on small screens

## Mobile-First Design

All pages must follow mobile-first responsive patterns:
- Start with stacked layouts for mobile (320px+)
- Use Tailwind classes in progressive enhancement: `<base> md:<tablet> lg:<desktop> xl:<large>`
- Breakpoints: sm (480px), md (768px), lg (1024px), xl (1280px)
- Sidebar uses overlay pattern on mobile, docked on desktop
- Test on iPhone SE, Pixel 5, iPad mini, and desktop

See `docs/mobile-first-guidelines.md` for detailed guidelines.

## Environment Variables

### Required (Public)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_SITE_URL` - Production site URL

### Required (Server-only)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (bypasses RLS)
- `BUNNY_STORAGE_ZONE` - Bunny CDN storage zone name
- `BUNNY_STORAGE_API_KEY` - Bunny CDN access key
- `BUNNY_CDN_BASE_URL` - Bunny CDN pull zone URL
- `BUNNY_STORAGE_HOST` - (optional) Bunny storage host (default: storage.bunnycdn.com)

### Agno Service Environment Variables (odonto-gpt-agno-service/.env)
- `OPENROUTER_API_KEY` - OpenRouter API key for LLM access (required)
- `OPENROUTER_MODEL_QA` - Model for Q&A agent (default: `openai/gpt-4o-mini`)
- `OPENROUTER_MODEL_IMAGE` - Model for image analysis (default: `openai/gpt-4o`)
- `OPENROUTER_MODEL_EMBEDDING` - Model for embeddings (default: `openai/text-embedding-3-small`)
- `SUPABASE_DB_URL` - PostgreSQL connection string for agent session storage
- `PORT` - Service port (default: 8000)
- `ENVIRONMENT` - Environment mode (development/production)
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated)

### Optional (Server-only)
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `CAKTO_WEBHOOK_SECRET` - Cakto payment webhook secret
- `ZAPI_SECRET` - Z-API WhatsApp integration secret
- `RESEND_API_KEY` - Resend email API key
- `N8N_WEBHOOK_URL` - N8N automation webhook URL
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry error tracking
- `SENTRY_AUTH_TOKEN` - Sentry authentication token

**Important**: Use `npm run validate:env` to verify environment configuration.

## Key Integrations

### Cakto Payment Gateway
- Webhook endpoint: `app/api/webhooks/cakto/route.ts`
- Handles subscription creation, payment updates, and cancellations
- Must configure `CAKTO_WEBHOOK_SECRET` for webhook verification
- See `docs/guia-integracao-cakto-local.md` for local testing

### Bunny CDN
- Used for video and material storage
- Configuration in `lib/bunny/` (check for existence)
- Test configuration: `npm run test:bunny`
- See `docs/bunny-cdn-setup.md` for setup instructions

### WhatsApp (Z-API)
- Used for customer notifications
- Configuration in environment with `ZAPI_SECRET`

### Email (Resend)
- Transactional emails for notifications
- Configure `RESEND_API_KEY`

### OpenRouter (AI Models)
- Unified API access to multiple LLM providers (OpenAI, Anthropic, etc.)
- Used by Agno service for all AI agent operations
- Configure `OPENROUTER_API_KEY` in `odonto-gpt-agno-service/.env`
- Supports model selection via environment variables:
  - `OPENROUTER_MODEL_QA` - Model for Q&A agent (default: `openai/gpt-4o-mini`)
  - `OPENROUTER_MODEL_IMAGE` - Model for image analysis (default: `openai/gpt-4o`)
  - `OPENROUTER_MODEL_EMBEDDING` - Model for embeddings (default: `openai/text-embedding-3-small`)

### WhatsApp Integration (Z-API)
The platform integrates with Z-API for WhatsApp notifications and customer communication:

**Features:**
- Send notifications about subscriptions, payments, and updates
- Customer support via WhatsApp
- Webhook handling for incoming messages (optional)

**Configuration:**
- Set `ZAPI_SECRET` in environment variables
- Configure Z-API webhook URL in Z-API dashboard
- See `docs/WHATSAPP_SETUP_GUIDE.md` for complete setup instructions
- See `docs/whatsapp-agno-integration.md` for integration with Agno AI service

**API Usage:**
```typescript
// Sending WhatsApp message
import { sendWhatsAppMessage } from '@/lib/integrations/zapi'

await sendWhatsAppMessage({
  phone: '5511999999999',
  message: 'Sua assinatura foi confirmada!'
})
```

## Deployment

### Production Deployment
- Deployed on Vercel: https://vercel.com/insightfy/v0-odonto-gpt-ui
- See `docs/DEPLOY_PRODUCTION.md` for complete deployment guide
- Use Vercel CLI: `npx vercel deploy --prod`
- Set environment variables in Vercel dashboard (not in `.env.local` for production)

### Pre-deployment Checklist
1. All migrations applied: `npm run db:status`
2. Environment variables validated: `npm run validate:env`
3. Build succeeds: `npm run build`
4. Test Bunny CDN: `npm run test:bunny`
5. Check RLS policies on Supabase
6. Verify auth redirects work correctly
7. **For AI features:** Deploy Agno service (see deployment guide)

### Deploying Agno Service in Production

The Agno service should be deployed separately from the Next.js frontend:

**Deployment Options:**
1. **Railway, Render, or Fly.io** - Recommended for Python/FastAPI services
2. **Docker container** - For Kubernetes or container orchestration
3. **AWS EC2/ECS** - For AWS-based deployments
4. **Vercel Serverless** - With adaptation for serverless functions

**Production Configuration:**
```bash
# In odonto-gpt-agno-service/.env
ENVIRONMENT=production
OPENROUTER_API_KEY=sk-...
SUPABASE_DB_URL=postgresql://...
ALLOWED_ORIGINS=https://your-domain.com
PORT=8000
```

**Health Check:**
- The `/health` endpoint should return `{"status": "healthy"}`
- Configure load balancer health checks to this endpoint
- Monitor service logs for errors and performance issues

See `docs/DEPLOY_PRODUCTION.md` for complete deployment instructions.

## v0.app Integration

This project was created using v0.app and syncs automatically:
- Changes made in v0.app are pushed to this repository
- Manual code changes should NOT be made to files that v0.app manages
- The project is linked to: https://v0.app/chat/sahgokuYUIU

## Common Patterns

### Reading Current User
```typescript
// In Server Component
import { createClient } from "@/lib/supabase/server"
import { resolveUserRole } from "@/lib/auth/roles"

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
const role = user ? resolveUserRole(undefined, user) : undefined
```

### Role-Based Rendering
```typescript
import { isAdmin, isVendedor } from "@/lib/auth/roles"

{isAdmin(role) && <AdminOnlyComponent />}
{isVendedor(role) && <SalesComponent />}
```

### Protected API Routes
```typescript
// In API route
import { createClient } from "@/lib/supabase/server"
import { resolveUserRole } from "@/lib/auth/roles"

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

const role = resolveUserRole(undefined, user)
if (!isAdmin(role)) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}
```

### Database Queries with RLS
```typescript
// Regular queries respect RLS for current user
const { data, error } = await supabase
  .from("courses")
  .select("*")
  .eq("published", true)

// For admin operations bypassing RLS
import { createAdminClient } from "@/lib/supabase/admin"
const adminSupabase = createAdminClient()
const { data } = await adminSupabase.from("users").select("*")
```

### Calling Agno AI Service
```typescript
// Streaming response from Q&A agent
async function streamQAQuestion(question: string, sessionId?: string) {
  const response = await fetch('http://localhost:8000/api/v1/qa/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      userId: user.id,
      sessionId,
      specialty: 'periodontia' // optional
    })
  })

  // Read streaming response
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader!.read()
    if (done) break
    console.log(decoder.decode(value))
  }
}

// Image analysis
async function analyzeDentalImage(imageUrl: string, question?: string) {
  const response = await fetch('http://localhost:8000/api/v1/image/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageUrl,
      question: question || "Analyze this dental image",
      userId: user.id
    })
  })

  const { analysis, metadata } = await response.json()
  return { analysis, metadata }
}
```

## Important Notes

### Security
- Never commit API keys or secrets to the repository
- Always use service role key sparingly and only in server contexts
- Validate all user inputs with Zod schemas
- Check RLS policies after schema changes with Supabase Advisors: `npm run db:status` then check advisors in Supabase dashboard

### Performance
- Use Server Components by default
- Only mark components as `'use client'` when necessary (interactivity, browser APIs)
- Lazy load heavy components with `next/dynamic`
- Use `next/image` for all images
- Leverage Next.js Image optimization for Bunny CDN assets

### Error Handling
- Sentry is configured for error tracking (`@sentry/nextjs`)
- Server actions return `ActionResult` type with success/error states
- Check browser console and Sentry dashboard for runtime errors
- Use `console.error` with context for debugging server actions

### Testing Database Changes
1. Create migration: `supabase migration new <name>`
2. Apply locally: `npm run db:push`
3. Test in development
4. Review RLS policies in Supabase dashboard
5. Run security advisors: Get advisors in Supabase → Database → Advisors
6. Deploy: Migration applies automatically in production via Supabase

## Troubleshooting

### Build Issues
- **Missing environment variables**: Check `npm run validate:env`
- **Font download failures**: Next.js uses Google Fonts, requires network access during build
- **Type errors**: Run `tsc --noEmit` to see detailed type errors

### Auth Issues
- **Session not refreshing**: Check middleware configuration
- **401 errors**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Role detection failing**: Check `profiles` table has role column, fallback to app_metadata

### Database Issues
- **RLS policies blocking queries**: Check policies in Supabase dashboard, test with service role
- **Migration stuck**: Use `npm run db:reset` (development only)
- **Connection errors**: Verify Supabase project is active

### Payment/Webhook Issues
- **Cakto webhook failing**: Check `CAKTO_WEBHOOK_SECRET` matches Cakto dashboard
- **Missing notifications**: Verify webhook is receiving requests (check Supabase logs)
- See `docs/cakto-webhook-fix.md` and `docs/cakto-webhook-status.md`

### Bunny CDN Issues
- **Uploads failing**: Run `npm run test:bunny` to diagnose
- **Videos not loading**: Check `BUNNY_CDN_BASE_URL` and pull zone configuration
- See `docs/bunny-cdn-setup.md` and troubleshooting guides in `docs/`

### Agno Service Issues
- **Service not starting**: Check Python version (3.9+) and dependencies with `npm run agno:install`
- **Connection refused**: Ensure service is running on port 8000 with `npm run agno:dev`
- **Agent errors**: Verify `OPENROUTER_API_KEY` is set and valid in `odonto-gpt-agno-service/.env`
- **Database connection errors**: Check `SUPABASE_DB_URL` format and network access
- **CORS errors**: Verify `ALLOWED_ORIGINS` includes your frontend URL in service `.env`
- **Streaming not working**: Check that frontend is calling correct endpoint with proper headers

### WhatsApp Integration Issues
- **Messages not sending**: Verify `ZAPI_SECRET` is configured correctly
- **Webhook not receiving**: Check Z-API webhook URL configuration in dashboard
- **Authentication errors**: Validate Z-API instance ID and token
- **Rate limiting**: Z-API has rate limits, implement exponential backoff
- See `docs/WHATSAPP_SETUP_GUIDE.md` for troubleshooting steps

### Session Management Issues
- **Sessions not persisting**: Check migration `20260113000000_add_agent_sessions.sql` is applied
- **History not loading**: Verify RLS policies on agent_sessions and agent_messages tables
- **Cache inconsistency**: Clear localStorage or use `deleteSession()` to reset
- See `docs/chat-image-sessions-guide.md` for session management details

## Documentation

- `odonto-gpt-agno-service/README.md` - Agno AI service documentation
- `odonto-gpt-agno-service/AGENTOS_GUIDE.md` - Guide to using AgentUI for agent monitoring
- `odonto-gpt-agno-service/QUICKSTART.md` - Quick start guide for the Agno service
- `odonto-gpt-agno-service/PLAYGROUND_GUIDE.md` - Interactive playground for testing agents
- `odonto-gpt-agno-service/RAG_GUIDE.md` - RAG knowledge base implementation guide
- `odonto-gpt-agno-service/RESEARCH_TOOLS_GUIDE.md` - Research tools documentation
- `odonto-gpt-agno-service/SETUP_CHECKLIST.md` - Service setup and verification checklist
- `odonto-gpt-agno-service/IMPLEMENTATION_SUMMARY.md` - Architecture and implementation overview
- `docs/DEPLOY_PRODUCTION.md` - Complete production deployment guide
- `docs/mobile-first-guidelines.md` - Mobile-first design patterns
- `docs/bunny-cdn-setup.md` - Bunny CDN configuration
- `docs/WHATSAPP_SETUP_GUIDE.md` - WhatsApp integration setup
- `docs/whatsapp-agno-integration.md` - WhatsApp-Agno integration guide
- `docs/chat-image-sessions-guide.md` - Chat with images and session management
- `docs/guia-integracao-cakto-local.md` - Local Cakto webhook testing
- `docs/` - Additional integration and troubleshooting guides
