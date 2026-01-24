---
type: doc
name: architecture
description: Architectural overview and system boundaries.
category: architecture
generated: 2026-01-24
status: filled
---

# Architecture Notes

## System Structure
The project follows a modular Next.js App Router architecture.

- **`app/`**: Contains all routes and layouts. Uses Next.js Server Components by default.
- **`components/`**: Reusable UI components, organized by domain (auth, chat, dashboard, odontoflix, etc.).
- **`lib/`**: Business logic, utility functions, and service clients (Supabase, AI, Cakto, etc.).
- **`supabase/`**: Database migrations, functions, and configuration.
- **`scripts/`**: Maintenance and utility scripts for environment management and data import.

## Key Design Patterns
- **Server Actions**: Used for form submissions and server-side state mutations.
- **Hooks-based State**: Client-side state management using SWR and custom hooks in `hooks/`.
- **Zod Validation**: Unified validation schema for APIs and forms.
- **Service Layer**: abstraction in `lib/services` and `lib/` to isolate external dependencies.

## External Boundaries
- **Supabase**: Primary database and authentication provider.
- **AI Models**: Connected via OpenRouter or direct AI providers through the Vercel AI SDK.
- **Payment Gateway**: Integration with Cakto via webhooks.
- **Video Delivery**: Bunny CDN for optimized video content.
