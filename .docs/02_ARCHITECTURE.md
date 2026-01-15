# System Architecture

## Meta
**File**: `.docs/02_ARCHITECTURE.md`
**Section**: 2 of 10
**Tags**: #architecture #structure #patterns
**Related**: `01_PROJECT_OVERVIEW.md`, `07_PATTERNS.md`

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  (Browser, Mobile)                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 16 Frontend                       │
│  (Vercel Deployment)                                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  App Router (Server Components + Client Components)  │  │
│  │  - Route handlers (/app/api/)                        │  │
│  │  - Server actions (/app/actions/)                    │  │
│  │  - Pages (/app/dashboard/, /app/admin/)              │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────┴──────────────────────────────────┐  │
│  │  Middleware (middleware.ts)                          │  │
│  │  - Session refresh                                   │  │
│  │  - Route protection                                  │  │
│  │  - Role-based redirect                               │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Agno AI Service (Python/FastAPI)              │
│  (Railway/Render/Fly.io Deployment)                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Layer (FastAPI)                                 │  │
│  │  - /api/v1/qa/chat                                   │  │
│  │  - /api/v1/image/analyze                             │  │
│  │  - /api/v1/chat (unified)                            │  │
│  │  - /api/v1/sessions                                  │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────┴──────────────────────────────────┐  │
│  │  Agent Layer (Agno)                                  │  │
│  │  - QA Agent (dental education)                      │  │
│  │  - Image Agent (radiology analysis)                 │  │
│  │  - Team Coordinator (multi-agent orchestration)     │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────┴──────────────────────────────────┐  │
│  │  Tools Layer                                         │  │
│  │  - Knowledge search (RAG)                           │  │
│  │  - Web search                                       │  │
│  │  - WhatsApp integration                             │  │
│  │  - Database query                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Backend                          │
│  (Cloud-hosted PostgreSQL)                                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Database (PostgreSQL 15+)                           │  │
│  │  - Tables with RLS policies                         │  │
│  │  - UUID primary keys                                │  │
│  │  - Audit timestamps                                 │  │
│  │  - pgvector extension (optional)                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Supabase Services                                   │  │
│  │  - Auth (email/password)                            │  │
│  │  - Storage ( Bunny CDN integration)                 │  │
│  │  - Real-time (optional)                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Directory Structure

```
app/
├── (auth)/                    # Auth route group
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── register/
│   │   └── page.tsx          # Register page
│   └── layout.tsx            # Auth layout
│
├── (marketing)/              # Public pages
│   ├── page.tsx              # Landing page
│   └── layout.tsx            # Marketing layout
│
├── dashboard/                # Protected dashboard
│   ├── page.tsx              # Dashboard home
│   ├── chat/
│   │   ├── page.tsx          # Chat interface
│   │   └── history/
│   │       └── page.tsx      # Chat history
│   ├── courses/
│   │   ├── page.tsx          # Course list
│   │   └── [id]/
│   │       └── page.tsx      # Course detail
│   └── layout.tsx            # Dashboard layout
│
├── admin/                    # Admin panel
│   ├── page.tsx              # Admin dashboard
│   ├── users/
│   └── courses/
│   └── layout.tsx            # Admin layout
│
├── actions/                  # Server actions
│   ├── auth.ts               # Auth actions
│   ├── courses.ts            # Course actions
│   ├── subscriptions.ts      # Subscription actions
│   └── ...
│
├── api/                      # API routes
│   ├── chat/
│   │   └── route.ts          # Chat endpoint
│   ├── sessions/
│   │   ├── route.ts          # Session CRUD
│   │   └── [id]/
│   │       └── route.ts      # Single session
│   ├── webhooks/
│   │   ├── cakto/
│   │   │   └── route.ts      # Cakto webhook
│   │   └── zapi/
│   │       └── route.ts      # Z-API webhook
│   └── ...
│
├── layout.tsx                # Root layout
├── page.tsx                  # Root page (redirects)
└── middleware.ts             # Route middleware
```

### Component Architecture

```
components/
├── ui/                       # shadcn/ui base components
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── tabs.tsx
│   └── ... (all auto-generated)
│
├── auth/                     # Auth components
│   ├── login-form.tsx        # Login form
│   ├── register-form.tsx     # Register form
│   └── auth-provider.tsx     # Auth context
│
├── chat/                     # Chat components
│   ├── chat-interface.tsx    # Main chat UI
│   ├── chat-message.tsx      # Message component
│   ├── image-upload.tsx      # Image upload
│   └── floating-chat.tsx     # Floating widget
│
├── ai-elements/              # AI-powered components
│   ├── streaming-text.tsx    # Streaming text
│   ├── thinking-indicator.tsx # AI thinking state
│   └── artifact-display.tsx  # Artifact renderer
│
├── layout/                   # Layout components
│   ├── header.tsx            # Header
│   ├── sidebar.tsx           # Sidebar navigation
│   ├── shell.tsx             # Page shell
│   └── footer.tsx            # Footer
│
└── ...
```

### Data Flow Patterns

#### Pattern 1: Server Component + Server Action

```typescript
// app/dashboard/courses/page.tsx (Server Component)
import { getCourses } from '@/app/actions/courses'
import { CourseList } from '@/components/courses/course-list'

export default async function CoursesPage() {
  const courses = await getCourses()

  return <CourseList courses={courses} />
}
```

#### Pattern 2: Client Component + API Route

```typescript
// components/chat/chat-interface.tsx (Client Component)
'use client'

import { useChat } from 'ai/react'

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
    body: {
      sessionId: 'xxx',
      specialty: 'periodontia'
    }
  })

  return (
    <form onSubmit={handleSubmit}>
      <input value={input} onChange={handleInputChange} />
      <button type="submit">Send</button>
    </form>
  )
}
```

#### Pattern 3: Streaming Response

```typescript
// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages, sessionId } = await req.json()

  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
    onChunk: async (chunk) => {
      // Save to database as chunks arrive
      await saveChunk(sessionId, chunk)
    }
  })

  return result.toAIStreamResponse()
}
```

## AI Service Architecture

### Directory Structure

```
odonto-gpt-agno-service/
├── app/
│   ├── agents/               # Agent definitions
│   │   ├── qa_agent.py       # Q&A agent
│   │   ├── image_agent.py    # Image analysis agent
│   │   └── team.py           # Multi-agent coordinator
│   │
│   ├── tools/                # Agent tools
│   │   ├── knowledge.py      # RAG knowledge search
│   │   ├── vision.py         # Image processing
│   │   ├── research.py       # Web search
│   │   ├── whatsapp.py       # WhatsApp integration
│   │   └── database/
│   │       └── supabase.py   # Supabase client
│   │
│   ├── models/
│   │   └── schemas.py        # Pydantic models
│   │
│   ├── api.py                # FastAPI routes
│   └── main.py               # App entry point
│
├── agent-ui/                 # AgentUI dashboard
├── data/                     # Knowledge base
├── scripts/                  # Utility scripts
├── requirements.txt          # Python dependencies
└── .env.example              # Environment template
```

### Agent Architecture

```python
# Agent Definition Pattern
from agno import Agent
from app.tools.knowledge import search_knowledge_base
from app.tools.research import web_search

qa_agent = Agent(
    name="Dental QA Assistant",
    role="Dental education specialist",
    instructions=[
        "You are a dental education assistant",
        "Access course materials for accurate information",
        "Provide clear, educational responses"
    ],
    tools=[
        search_knowledge_base,
        web_search
    ],
    model="openai/gpt-4o-mini",
    description="Answers questions about dental procedures and theory"
)
```

### API Layer Pattern

```python
# FastAPI Route Pattern
from fastapi import APIRouter, HTTPException
from app.models.schemas import QARequest
from app.agents.qa_agent import qa_agent

router = APIRouter(prefix="/api/v1/qa", tags=["qa"])

@router.post("/chat")
async def qa_chat(request: QARequest):
    """Streaming dental Q&A endpoint"""
    try:
        # Run agent with streaming
        response = qa_agent.run(
            question=request.question,
            user_id=request.userId,
            session_id=request.sessionId,
            stream=True
        )

        # Stream response
        return StreamingResponse(
            response,
            media_type="text/event-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Database Architecture

### Schema Design Pattern

```sql
-- Table Pattern: UUID + RLS + Timestamps
CREATE TABLE table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    -- Business columns
    title TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',

    -- Audit columns
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Enable RLS
    ENABLE ROW LEVEL SECURITY
);

-- RLS Policy Pattern
CREATE POLICY "Users can view own records"
ON table_name
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records"
ON table_name
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index Pattern
CREATE INDEX idx_table_name_user_id
ON table_name(user_id);
CREATE INDEX idx_table_name_created_at
ON table_name(created_at DESC);
```

### Key Tables

```sql
-- User Management
profiles (id, user_id, role, full_name, ...)
auth.users (Supabase managed)

-- Content
courses (id, title, description, published, ...)
modules (id, course_id, title, order, ...)
lessons (id, module_id, title, content, order, ...)
materials (id, lesson_id, type, url, ...)

-- Commerce
subscriptions (id, user_id, status, plan, ...)
transactions (id, subscription_id, status, amount, ...)

-- AI & Chat
agent_sessions (id, user_id, agent_type, status, ...)
agent_messages (id, session_id, role, content, metadata)

-- Sales
leads (id, name, email, phone, status, ...)
pipeline (id, lead_id, stage, probability, ...)
```

## Security Architecture

### Authentication Flow

```
1. User submits login form
   ↓
2. POST /api/auth/callback (NextAuth or Supabase)
   ↓
3. Supabase Auth validates credentials
   ↓
4. Returns JWT token (stored in httpOnly cookie)
   ↓
5. Middleware validates token on each request
   ↓
6. Server Components access user via createClient()
```

### Authorization Flow

```typescript
// lib/auth/roles.ts
export function resolveUserRole(profile?: Profile, user?: User): Role {
  // 1. Check profile table
  if (profile?.role) return profile.role

  // 2. Fallback to user_metadata
  if (user?.user_metadata?.role) return user.user_metadata.role

  // 3. Default to cliente
  return 'cliente'
}

// Middleware protection
export function middleware(request: NextRequest) {
  const user = await getUser(request)
  const role = resolveUserRole(undefined, user)

  // Route protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!isAdmin(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
}
```

### RLS Policy Pattern

```sql
-- Admin bypass
CREATE POLICY "Admins can do anything"
ON all_tables
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- User isolation
CREATE POLICY "Users can manage own data"
ON sensitive_table
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

## State Management

### Client State

```typescript
// React Context + hooks pattern
interface ChatState {
  messages: Message[]
  sessionId: string
  agentType: 'qa' | 'image-analysis' | 'team'
}

// Zustand or Context API
const ChatContext = createContext<ChatState>({})
```

### Server State

```typescript
// Server Actions (mutations)
"use server"
export async function updateProfile(data: ProfileData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('user_id', user.id)

  revalidatePath('/profile')
  return { success: !error }
}
```

### Cache Strategy

```typescript
// lib/ai/session-cache.ts
export async function fetchSessions(): Promise<Session[]> {
  // 1. Check cache
  const cached = getCachedSessions()
  if (cached) return cached

  // 2. Fetch from API
  const response = await fetch('/api/sessions')
  const sessions = await response.json()

  // 3. Update cache
  updateCachedSessions(sessions)

  return sessions
}
```

## Integration Patterns

### Webhook Pattern

```typescript
// app/api/webhooks/cakto/route.ts
import { verifySignature } from '@/lib/webhooks'

export async function POST(req: Request) {
  // 1. Verify signature
  const signature = req.headers.get('x-cakto-signature')
  if (!verifySignature(await req.text(), signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // 2. Parse webhook
  const event = await req.json()

  // 3. Process event
  switch (event.type) {
    case 'subscription.created':
      await handleSubscriptionCreated(event.data)
      break
    case 'payment.succeeded':
      await handlePaymentSucceeded(event.data)
      break
  }

  return NextResponse.json({ received: true })
}
```

### External API Pattern

```typescript
// lib/integrations/bunny.ts
export async function uploadToBunny(
  file: File,
  userId: string
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(
    `${BUNNY_STORAGE_HOST}/${userId}/${file.name}`,
    {
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_STORAGE_API_KEY
      },
      body: formData
    }
  )

  if (!response.ok) {
    throw new Error('Upload failed')
  }

  return `${BUNNY_CDN_BASE_URL}/${userId}/${file.name}`
}
```

## Performance Optimization

### Next.js Optimizations

```typescript
// 1. Dynamic imports (lazy loading)
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />
})

// 2. Server Components by default
export default async function Page() {
  const data = await fetchData() // Runs on server
  return <View data={data} />
}

// 3. Streaming
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SlowComponent />
    </Suspense>
  )
}
```

### Database Optimizations

```sql
-- 1. Indexes
CREATE INDEX idx_sessions_user_created
ON agent_sessions(user_id, created_at DESC);

-- 2. Partial indexes
CREATE INDEX idx_active_subscriptions
ON subscriptions(user_id)
WHERE status = 'active';

-- 3. Covering indexes
CREATE INDEX idx_messages_session_covering
ON agent_messages(session_id, created_at)
INCLUDE (role, content);
```

## Scalability Considerations

### Frontend Scaling
- **Vercel**: Automatic scaling with Edge Network
- **CDN**: Bunny CDN for media delivery
- **Caching**: React Server Components cache data fetches

### AI Service Scaling
- **Stateless**: FastAPI workers can be horizontally scaled
- **Connection pooling**: Supabase connection pool
- **Load balancing**: Railway/Render load balancers

### Database Scaling
- **Supabase**: Auto-scaling PostgreSQL
- **Read replicas**: Available on higher tiers
- **Connection pooling**: PgBouncer built-in

## Next Steps

- Read `03_DATABASE_SCHEMA.md` for database details
- Read `04_AI_AGENTS.md` for AI service architecture
- Read `07_PATTERNS.md` for code patterns

## References

- **Previous**: `01_PROJECT_OVERVIEW.md`
- **Next**: `03_DATABASE_SCHEMA.md`
- **Related**: `07_PATTERNS.md`

---

**Last Updated**: 2025-01-15
