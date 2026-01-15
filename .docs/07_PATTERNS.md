# Common Patterns

## Meta
**File**: `.docs/07_PATTERNS.md`
**Section**: 7 of 10
**Tags**: #patterns #typescript #examples
**Related**: `02_ARCHITECTURE.md`, `05_AUTHORIZATION.md`

## Pattern Categories

1. **Data Access Patterns** - Server Components, Server Actions, API Routes
2. **Authentication Patterns** - User detection, role checking, route protection
3. **Database Patterns** - Queries with RLS, admin operations, migrations
4. **AI Integration Patterns** - Streaming responses, image analysis, session management
5. **Component Patterns** - Server vs Client, composition, hooks
6. **Error Handling Patterns** - Validation, error responses, logging

---

## 1. Data Access Patterns

### Pattern 1.1: Server Component with Direct Database Access

**When to use**: Fetching data in Server Components

```typescript
// app/dashboard/courses/page.tsx
import { createClient } from '@/lib/supabase/server'
import { CourseList } from '@/components/courses/course-list'

export default async function CoursesPage() {
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('*, modules(id, title)')
    .eq('published', true)
    .order('created_at', { ascending: false })

  return <CourseList courses={courses} />
}
```

**Key points**:
- Server Components can access database directly
- No need for API routes
- RLS automatically applied
- Data fetched at build time or request time

### Pattern 1.2: Server Action for Data Mutation

**When to use**: Form submissions, data updates

```typescript
// app/actions/courses.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { courseSchema } from '@/lib/schemas'

export async function createCourse(data: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  // 1. Validate input
  const parsed = courseSchema.safeParse(Object.fromEntries(data))
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors
    }
  }

  // 2. Check authorization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // 3. Insert data
  const { data, error } = await supabase
    .from('courses')
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      user_id: user.id
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // 4. Revalidate cache
  revalidatePath('/dashboard/courses')
  revalidatePath('/admin/courses')

  return { success: true, data }
}
```

**Key points**:
- Always validate with Zod schema
- Check authentication
- Return consistent `ActionResult` type
- Revalidate affected paths

### Pattern 1.3: API Route for Client-Side Fetching

**When to use**: Client components need data, external webhooks

```typescript
// app/api/courses/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('q')

  let query = supabase
    .from('courses')
    .select('*, modules(count)')
    .eq('published', true)

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}
```

**Key points**:
- Use for client-side data fetching
- Handle query parameters
- Return proper HTTP status codes
- Error handling is critical

---

## 2. Authentication Patterns

### Pattern 2.1: Get Current User in Server Component

```typescript
import { createClient } from '@/lib/supabase/server'
import { resolveUserRole } from '@/lib/auth/roles'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const role = resolveUserRole(undefined, user)

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <p>Role: {role}</p>
    </div>
  )
}
```

### Pattern 2.2: Role-Based Rendering

```typescript
import { isAdmin, isVendedor, isCliente } from '@/lib/auth/roles'

function DashboardNav({ role }: { role: Role }) {
  return (
    <nav>
      <Link href="/dashboard">Home</Link>

      {isAdmin(role) && (
        <Link href="/admin">Admin Panel</Link>
      )}

      {isVendedor(role) && (
        <Link href="/dashboard/leads">Leads</Link>
      )}

      {isCliente(role) && (
        <Link href="/dashboard/courses">My Courses</Link>
      )}
    </nav>
  )
}
```

### Pattern 2.3: Protected Server Action

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/roles'

export async function adminAction(params: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Check authentication
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Check authorization
  const role = resolveUserRole(undefined, user)
  if (!isAdmin(role)) {
    return { success: false, error: 'Forbidden: Admin only' }
  }

  // 3. Perform admin operation
  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from('users')
    .select('*')

  return { success: true, data }
}
```

---

## 3. Database Patterns

### Pattern 3.1: Query with RLS (User's Data Only)

```typescript
const supabase = await createClient()

// RLS automatically filters to user's data
const { data } = await supabase
  .from('agent_sessions')
  .select('*')
  .eq('user_id', user.id)  // Redundant due to RLS, but explicit

// RLS policy ensures users only see their own sessions
```

### Pattern 3.2: Admin Query (Bypass RLS)

```typescript
import { createAdminClient } from '@/lib/supabase/admin'

// Use ONLY in server contexts for admin operations
const adminSupabase = createAdminClient()

const { data } = await adminSupabase
  .from('users')
  .select('*')
  .order('created_at', { ascending: false })

// WARNING: Never expose admin client to client-side
```

### Pattern 3.3: Transaction with Multiple Tables

```typescript
'use server'

export async function createSubscription(
  userId: string,
  planId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  // Start transaction manually
  const { data: subscription } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan: planId,
      status: 'active'
    })
    .select()
    .single()

  if (subscription) {
    // Update user role if needed
    await supabase
      .from('profiles')
      .update({ subscription_tier: 'premium' })
      .eq('user_id', userId)
  }

  revalidatePath('/dashboard')
  return { success: true, data: subscription }
}
```

### Pattern 3.4: Pagination

```typescript
async function getCourses(page: number = 1, limit: number = 10) {
  const supabase = await createClient()

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('courses')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  return {
    courses: data,
    totalCount: count,
    totalPages: Math.ceil((count || 0) / limit)
  }
}
```

---

## 4. AI Integration Patterns

### Pattern 4.1: Streaming Chat Response

```typescript
// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages, sessionId, agentType } = await req.json()

  // Route to appropriate agent
  const agentUrl = agentType === 'image-analysis'
    ? 'http://localhost:8000/api/v1/image/analyze'
    : 'http://localhost:8000/api/v1/qa/chat'

  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
    onFinish: async (completion) => {
      // Save final message to database
      await saveMessage(sessionId, {
        role: 'assistant',
        content: completion.text
      })
    }
  })

  return result.toAIStreamResponse()
}
```

### Pattern 4.2: Client-Side Chat Hook

```typescript
// components/chat/chat-interface.tsx
'use client'

import { useChat } from 'ai/react'
import { useState } from 'react'

export function ChatInterface() {
  const [uploadedImage, setUploadedImage] = useState<string>()

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      sessionId: 'session-123',
      imageUrl: uploadedImage,
      agentType: uploadedImage ? 'image-analysis' : 'qa'
    },
    onFinish: async (message) => {
      // Clear image after analysis
      if (uploadedImage) {
        setUploadedImage(undefined)
      }
    }
  })

  return (
    <form onSubmit={handleSubmit}>
      {messages.map(m => (
        <div key={m.id}>{m.role}: {m.content}</div>
      ))}
      <input value={input} onChange={handleInputChange} />
      <button disabled={isLoading}>Send</button>
    </form>
  )
}
```

### Pattern 4.3: Image Upload and Analysis

```typescript
// components/chat/image-upload.tsx
'use client'

import { useState } from 'react'
import { uploadChatImage } from '@/lib/bunny/upload'

export function ImageUpload({ onImageUpload }: Props) {
  const [uploading, setUploading] = useState(false)

  async function handleUpload(file: File) {
    setUploading(true)

    try {
      const url = await uploadChatImage(file, user.id)
      onImageUpload(url)
    } catch (error) {
      console.error('Upload failed', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <input
      type="file"
      accept="image/*"
      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      disabled={uploading}
    />
  )
}
```

### Pattern 4.4: Session Management

```typescript
// lib/ai/session-cache.ts
export async function fetchSessions(): Promise<Session[]> {
  // 1. Check cache
  const cached = getCachedSessions()
  if (cached && !isCacheStale(cached)) {
    return cached
  }

  // 2. Fetch from API
  const response = await fetch('/api/sessions')
  const sessions = await response.json()

  // 3. Update cache
  updateCachedSessions(sessions)

  return sessions
}

export async function createSession(agentType: string): Promise<Session> {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentType })
  })

  const session = await response.json()

  // Update cache
  updateCachedSession(session)

  return session
}
```

---

## 5. Component Patterns

### Pattern 5.1: Server Component (Default)

```typescript
// components/courses/course-card.tsx
// No 'use client' directive needed

import Link from 'next/link'

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link href={`/dashboard/courses/${course.id}`}>
      <article>
        <h3>{course.title}</h3>
        <p>{course.description}</p>
      </article>
    </Link>
  )
}
```

### Pattern 5.2: Client Component with Interactivity

```typescript
// components/chat/chat-input.tsx
'use client'

import { useState } from 'react'

export function ChatInput() {
  const [value, setValue] = useState('')

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}
```

### Pattern 5.3: Composition Pattern

```typescript
// components/layout/shell.tsx
import { Header } from './header'
import { Sidebar } from './sidebar'

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <main>{children}</main>
      </div>
    </div>
  )
}

// Usage
export default function Layout({ children }) {
  return <Shell>{children}</Shell>
}
```

---

## 6. Error Handling Patterns

### Pattern 6.1: Server Action Error Response

```typescript
'use server'

export async function action(params: Params): Promise<ActionResult> {
  try {
    // Validate
    const parsed = schema.safeParse(params)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: parsed.error.flatten().fieldErrors
      }
    }

    // Execute
    const result = await performAction(parsed.data)

    return { success: true, data: result }
  } catch (error) {
    console.error('Action failed:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

### Pattern 6.2: Client-Side Error Handling

```typescript
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createCourse } from '@/app/actions/courses'

const initialState = {
  success: false,
  error: '',
  fieldErrors: {}
}

export function CourseForm() {
  const [state, formAction] = useFormState(createCourse, initialState)
  const { pending } = useFormStatus()

  return (
    <form action={formAction}>
      {state.error && (
        <div className="error">{state.error}</div>
      )}

      <input name="title" />
      {state.fieldErrors?.title && (
        <span className="error">{state.fieldErrors.title}</span>
      )}

      <button disabled={pending}>
        {pending ? 'Creating...' : 'Create'}
      </button>
    </form>
  )
}
```

### Pattern 6.3: API Route Error Handling

```typescript
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validate
    const parsed = schema.parse(body)

    // Execute
    const result = await operation(parsed)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('API error:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 7. Validation Patterns

### Pattern 7.1: Zod Schema Validation

```typescript
// lib/schemas/course.ts
import { z } from 'zod'

export const courseSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  published: z.boolean().default(false),
  price: z.number().positive().optional()
})

export type CourseInput = z.infer<typeof courseSchema>
```

### Pattern 7.2: File Upload Validation

```typescript
// lib/validations/upload.ts
export function validateImageUpload(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' }
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File too large (max 10MB)' }
  }

  return { valid: true }
}
```

---

## 8. Utility Patterns

### Pattern 8.1: Retry Logic

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }

  throw new Error('Max retries exceeded')
}
```

### Pattern 8.2: Debounce

```typescript
import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
```

### Pattern 8.3: Format Utility

```typescript
// lib/utils/format.ts
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
```

---

## Quick Reference

| Pattern | File Location | When to Use |
|---------|--------------|-------------|
| Server Component | `app/**/*.tsx` | Data fetching, static content |
| Server Action | `app/actions/*.ts` | Form submissions, mutations |
| API Route | `app/api/**/*.ts` | Client-side fetching, webhooks |
| Auth Check | Any server file | Protected operations |
| RLS Query | Server files | User-specific data |
| Admin Query | `app/actions/admin/*.ts` | Bypass RLS |
| Streaming | `app/api/chat/route.ts` | AI responses |

## Next Steps

- Read `02_ARCHITECTURE.md` for system architecture
- Read `05_AUTHORIZATION.md` for auth patterns
- Read `04_AI_AGENTS.md` for AI integration

## References

- **Previous**: `02_ARCHITECTURE.md`
- **Next**: `08_INTEGRATIONS.md`
- **Related**: `05_AUTHORIZATION.md`

---

**Last Updated**: 2025-01-15
