---
id: fix-chat-history
title: Fix Chat History Persistence
status: in_progress
type: bugfix
owner: user
created: 2026-01-30
updated: 2026-01-30
context:
  problem: "Chat history messages are not being persisted or retrieved for users."
  impact: "Users lose context of their conversations upon refresh or navigation."
  root_cause: "Missing Row Level Security (RLS) policies on `agent_sessions` and `agent_messages` tables."
goals:
  - "Enable secure persistence of chat sessions and messages."
  - "Allow users to retrieve their own history."
  - "Verify privacy so users cannot access others' data."
phases:
  - name: "Diagnosis"
    status: completed
    steps:
      - "Analyze `app/api/chat/route.ts` and `lib/chat/hooks/use-history.ts`."
      - "Inspect database schema for `agent_sessions` and `agent_messages`."
      - "Identify that RLS is enabled but policies are missing."
  - name: "Implementation"
    status: completed
    steps:
      - "Create SQL migration to add RLS policies."
      - "Apply migration using Supabase MCP."
      - "Verify policies exist in `pg_policies`."
  - name: "Verification"
    status: pending
    steps:
      - "Manual test: Create new chat and verify persistence."
      - "Manual test: Refresh history page and verify listing."
      - "Security check: Ensure cross-user access is denied (implicit via RLS)."
agents:
  - type: backend-specialist
    role: "Database Security & API"
    focus: "Supabase RLS policies and API endpoints."
  - type: qa
    role: "Verification"
    focus: "Manual testing of chat history workflow."
docs:
  - "docs/security.md": "Update with RLS policy documentation for chat tables."
  - "docs/architecture.md": "Note the chat persistence layer."
---

# Fix Chat History Persistence

## diagnosis
The application was unable to save or retrieve chat history because the `public.agent_sessions` and `public.agent_messages` tables had Row Level Security (RLS) enabled, but no policies were defined. In PostgreSQL, RLS enabled without policies denies all access by default for non-superusers.

## Implementation Details
Applied the following RLS policies:
- **`agent_sessions`**: Users can `SELECT`, `INSERT`, `UPDATE`, `DELETE` rows where `user_id` matches their auth UID.
- **`agent_messages`**: Users can `SELECT`, `INSERT` rows where the associated session belongs to them.

## Verification Plan
1. **Chat Creation**: Start a new chat, send a message, ensuring no errors in console.
2. **Persistence**: Reload page, ensure messages persist.
3. **History List**: Visit `/dashboard/historico` and confirm the chat appears.
