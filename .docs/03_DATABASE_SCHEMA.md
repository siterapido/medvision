# Database Schema

## Meta
**File**: `.docs/03_DATABASE_SCHEMA.md`
**Section**: 3 of 10
**Tags**: #database #supabase #schema
**Related**: `02_ARCHITECTURE.md`, `10_TROUBLESHOOTING.md`

## Database Overview

**Provider**: Supabase (PostgreSQL 15+)
**Security**: Row Level Security (RLS) enabled on all tables
**Primary Keys**: UUID (auto-generated)
**Audit**: `created_at` and `updated_at` on all tables
**Extensions**: pgvector (optional, for embeddings)

## Table Categories

### 1. User Management
- `auth.users` - Supabase managed authentication
- `profiles` - Extended user profiles with roles

### 2. Content
- `courses` - Course catalog
- `modules` - Course modules
- `lessons` - Individual lessons
- `materials` - Lesson materials and attachments

### 3. Commerce
- `subscriptions` - User subscriptions
- `transactions` - Payment transactions

### 4. AI & Chat
- `agent_sessions` - AI agent conversation sessions
- `agent_messages` - Messages within sessions
- `chat_threads` - Legacy chat storage (deprecated)

### 5. Sales
- `leads` - Potential customers
- `pipeline` - Sales pipeline stages

### 6. General
- `notifications` - User notifications
- `live_events` - Live streaming events

---

## Schema Details

### auth.users (Supabase Managed)

**Managed by**: Supabase Auth
**Direct Access**: No (use Supabase Auth API)

```sql
-- Key columns
id UUID PRIMARY KEY
email TEXT UNIQUE
encrypted_password TEXT
email_confirmed_at TIMESTAMPTZ
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
raw_user_meta_data JSONB
raw_app_meta_data JSONB
```

**Usage**:
```typescript
const { data: { user } } = await supabase.auth.getUser()
console.log(user.id, user.email)
```

---

### profiles

**Purpose**: Extended user information with role-based access
**Relation**: One-to-one with `auth.users`

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id),
  full_name TEXT,
  role TEXT DEFAULT 'cliente',
  subscription_tier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  ENABLE ROW LEVEL SECURITY
);

-- RLS Policies
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

**Roles**: `admin`, `cliente`, `vendedor`

**Usage**:
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', user.id)
  .single()
```

---

### courses

**Purpose**: Course catalog

```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  published BOOLEAN DEFAULT false,
  price DECIMAL(10,2),
  specialty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  ENABLE ROW LEVEL SECURITY
);

-- Indexes
CREATE INDEX idx_courses_published ON courses(published);
CREATE INDEX idx_courses_specialty ON courses(specialty);
CREATE INDEX idx_courses_created ON courses(created_at DESC);
```

**Usage**:
```typescript
// Get published courses
const { data: courses } = await supabase
  .from('courses')
  .select('*')
  .eq('published', true)
```

---

### modules

**Purpose**: Course modules (sections)

```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  ENABLE ROW LEVEL SECURITY
);

-- Indexes
CREATE INDEX idx_modules_course ON modules(course_id);
CREATE INDEX idx_modules_order ON modules(course_id, "order");
```

---

### lessons

**Purpose**: Individual lessons within modules

```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,  -- Bunny CDN URL
  duration INTEGER,  -- Seconds
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  ENABLE ROW LEVEL SECURITY
);

-- Indexes
CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_lessons_order ON lessons(module_id, "order");
```

**Usage**:
```typescript
// Get course with modules and lessons
const { data: course } = await supabase
  .from('courses')
  .select('*, modules(id, title, lessons(id, title, video_url))')
  .eq('id', courseId)
  .single()
```

---

### materials

**Purpose**: Lesson materials and attachments

```sql
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT,  -- 'pdf', 'video', 'image', 'link'
  url TEXT,   -- Bunny CDN URL or external link
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  ENABLE ROW LEVEL SECURITY
);
```

---

### subscriptions

**Purpose**: User subscriptions

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',  -- 'active', 'cancelled', 'expired'
  plan TEXT NOT NULL,
  cakto_subscription_id TEXT UNIQUE,
  cakto_plan_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  ENABLE ROW LEVEL SECURITY
);

-- Indexes
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_cakto ON subscriptions(cakto_subscription_id);
```

**Usage**:
```typescript
// Get active subscription
const { data: subscription } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .single()
```

---

### transactions

**Purpose**: Payment transactions

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id),
  status TEXT NOT NULL,  -- 'pending', 'completed', 'failed'
  amount DECIMAL(10,2),
  cakto_transaction_id TEXT UNIQUE,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  ENABLE ROW LEVEL SECURITY
);
```

---

### agent_sessions

**Purpose**: AI agent conversation sessions

```sql
CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,  -- 'qa', 'image-analysis', 'team'
  status TEXT DEFAULT 'active',  -- 'active', 'archived', 'deleted'
  title TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  ENABLE ROW LEVEL SECURITY
);

-- Indexes
CREATE INDEX idx_agent_sessions_user ON agent_sessions(user_id, updated_at DESC);
CREATE INDEX idx_agent_sessions_type ON agent_sessions(agent_type);
CREATE INDEX idx_agent_sessions_status ON agent_sessions(status);
```

**Agent Types**:
- `qa` - Dental Q&A conversations
- `image-analysis` - Image analysis sessions
- `team` - Multi-agent coordinated conversations

**Usage**:
```typescript
// Create session
const { data: session } = await supabase
  .from('agent_sessions')
  .insert({
    user_id: user.id,
    agent_type: 'qa',
    title: 'Question about root canals'
  })
  .select()
  .single()

// Get user sessions
const { data: sessions } = await supabase
  .from('agent_sessions')
  .select('*')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .order('updated_at', { ascending: false })
```

---

### agent_messages

**Purpose**: Messages within agent sessions

```sql
CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES agent_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,  -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  ENABLE ROW LEVEL SECURITY
);

-- Indexes
CREATE INDEX idx_agent_messages_session ON agent_messages(session_id, created_at);
CREATE INDEX idx_agent_messages_role ON agent_messages(role);
```

**Role Types**:
- `user` - Human user messages
- `assistant` - AI agent responses
- `system` - System messages (hidden from UI)

**Metadata Structure**:
```json
{
  "imageUrl": "https://cdn.bunny.net/...",
  "model": "gpt-4o-mini",
  "tools": ["web_search", "knowledge_base"],
  "agentType": "qa"
}
```

**Usage**:
```typescript
// Save message
await supabase.from('agent_messages').insert({
  session_id: sessionId,
  role: 'user',
  content: 'What is a root canal?',
  metadata: {}
})

// Get session messages
const { data: messages } = await supabase
  .from('agent_messages')
  .select('*')
  .eq('session_id', sessionId)
  .order('created_at', { ascending: true })
```

---

### leads

**Purpose**: Potential customers (sales)

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'new',  -- 'new', 'contacted', 'qualified', 'converted', 'lost'
  source TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  ENABLE ROW LEVEL SECURITY
);
```

---

### pipeline

**Purpose**: Sales pipeline stages

```sql
CREATE TABLE pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,  -- 'prospecting', 'qualification', 'proposal', 'negotiation', 'closed'
  probability INTEGER DEFAULT 50,  -- 0-100
  notes TEXT,
  expected_close_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  ENABLE ROW LEVEL SECURITY
);
```

---

### notifications

**Purpose**: User notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- 'subscription', 'payment', 'course', 'system'
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  ENABLE ROW LEVEL SECURITY
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
```

---

### live_events

**Purpose**: Live streaming events

```sql
CREATE TABLE live_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  stream_url TEXT,
  thumbnail_url TEXT,
  scheduled_at TIMESTAMPTZ,
  duration INTEGER,
  status TEXT DEFAULT 'upcoming',  -- 'upcoming', 'live', 'ended', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  ENABLE ROW LEVEL SECURITY
);
```

---

### knowledge_base (Optional)

**Purpose**: Vector embeddings for RAG knowledge base

**Requires**: pgvector extension

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(1536),  -- OpenAI embedding dimension
  metadata JSONB DEFAULT '{}',
  course_id UUID REFERENCES courses(id),
  lesson_id UUID REFERENCES lessons(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  ENABLE ROW LEVEL SECURITY
);

-- Vector similarity search index
CREATE INDEX idx_knowledge_embedding
ON knowledge_base
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Usage** (from Python service):
```python
# Similarity search
from pgvector.sqlalchemy import Vector

results = session.query(KnowledgeBase).order_by(
    KnowledgeBase.embedding.cosine_distance(query_embedding)
).limit(5).all()
```

---

## Migration Commands

### Create Migration

```bash
# Using Supabase CLI
npx supabase migration new add_new_table

# This creates: supabase/migrations/<timestamp>_add_new_table.sql
```

### Apply Migrations

```bash
# Local development
npm run db:push

# Check status
npm run db:status
```

### Migration Pattern

```sql
-- Migration: <timestamp>_<description>.sql

-- 1. Create table
CREATE TABLE example (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  ENABLE ROW LEVEL SECURITY
);

-- 2. Create indexes
CREATE INDEX idx_example_user ON example(user_id);
CREATE INDEX idx_example_created ON example(created_at DESC);

-- 3. Create RLS policies
CREATE POLICY "Users can view own data"
ON example FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
ON example FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
ON example FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can do anything"
ON example FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Grant access (if needed)
GRANT ALL ON example TO authenticated;
GRANT SELECT ON example TO anon;
```

---

## Common Queries

### Get Course with All Content

```typescript
const { data: course } = await supabase
  .from('courses')
  .select(`
    *,
    modules (
      *,
      lessons (*)
    )
  `)
  .eq('id', courseId)
  .single()
```

### Get User Session with Messages

```typescript
const { data: session } = await supabase
  .from('agent_sessions')
  .select(`
    *,
    agent_messages (*)
  `)
  .eq('id', sessionId)
  .eq('user_id', user.id)
  .single()
```

### Get Active Subscription

```typescript
const { data: subscription } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .gte('current_period_end', new Date().toISOString())
  .single()
```

### Search Courses

```typescript
const { data: courses } = await supabase
  .from('courses')
  .select('*')
  .eq('published', true)
  .ilike('title', `%${searchTerm}%`)
  .order('created_at', { ascending: false })
```

### Paginate Results

```typescript
const page = 1
const limit = 10
const from = (page - 1) * limit
const to = from + limit - 1

const { data, count } = await supabase
  .from('courses')
  .select('*', { count: 'exact' })
  .range(from, to)
```

---

## RLS Policy Patterns

### User Isolation

```sql
-- Users can only access their own data
CREATE POLICY "User isolation"
ON table_name FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Admin Override

```sql
-- Admins can bypass user isolation
CREATE POLICY "Admin override"
ON table_name FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### Published Content (Public)

```sql
-- Anyone can view published content
CREATE POLICY "Public published content"
ON courses FOR SELECT
USING (published = true);
```

---

## Database Maintenance

### Check RLS Policies

```sql
-- View all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Analyze Table Performance

```sql
-- Get table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Index Usage

```sql
-- Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

---

## Next Steps

- Read `02_ARCHITECTURE.md` for database architecture
- Read `07_PATTERNS.md` for query patterns
- Read `10_TROUBLESHOOTING.md` for database issues

## References

- **Previous**: `02_ARCHITECTURE.md`
- **Next**: `04_AI_AGENTS.md`
- **Related**: `07_PATTERNS.md`

---

**Last Updated**: 2025-01-15
