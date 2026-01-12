# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Odonto GPT UI is a Next.js 16 SaaS platform for dental professionals, featuring AI-powered tools, online courses, and lead management. The project was created using v0.app and syncs with deployments automatically.

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

## Architecture & Tech Stack

### Core Technologies
- **Next.js 16** with App Router and React Server Components
- **React 19** and TypeScript
- **Supabase** for database, authentication, and storage
- **Tailwind CSS 4** with shadcn/ui components
- **Server Actions** for data mutations
- **OpenAI AI SDK** for AI-powered features

### Key External Services
- **Cakto** - Brazilian payment gateway for subscriptions
- **Bunny CDN** - Content delivery for videos and materials
- **Z-API** - WhatsApp integration
- **Resend** - Email delivery
- **Vercel** - Hosting and deployment
- **Sentry** - Error monitoring and performance tracking

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

All tables use UUID primary keys and include audit timestamps (created_at, updated_at).

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
- **components/ui/** - shadcn/ui base components
- **components/auth/** - Authentication forms and flows
- **components/ai-elements/** - AI-powered components
- **components/layout/** - Layout components (Header, Shell, Sidebar)
- **lib/** - Utility functions and configurations
- **lib/supabase/** - Supabase client configurations
- **lib/auth/** - Authentication utilities
- **supabase/migrations/** - Database migration files

### UI Components
- Uses shadcn/ui with Radix UI primitives
- All components in `components/ui/` are auto-generated from shadcn
- Custom components extend base UI components
- Follow mobile-first responsive design (see `docs/mobile-first-guidelines.md`)

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

## Documentation

- `docs/DEPLOY_PRODUCTION.md` - Complete production deployment guide
- `docs/mobile-first-guidelines.md` - Mobile-first design patterns
- `docs/bunny-cdn-setup.md` - Bunny CDN configuration
- `docs/guia-integracao-cakto-local.md` - Local Cakto webhook testing
- `docs/` - Additional integration and troubleshooting guides
