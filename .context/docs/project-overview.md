# Project Overview

## Summary
Odonto GPT is a web application designed to assist dental professionals with AI-driven tools. The project combines a modern frontend interface with specialized backend services for AI processing.

## Architecture
The application follows a full-stack architecture:

- **Frontend**: **Next.js** (App Router) with **TypeScript** and **Tailwind CSS**.
- **Backend Service**: `odonto-gpt-agno-service` (Python), handling AI logic and agent interactions.
- **Database & Auth**: **Supabase** (PostgreSQL, Authentication).
- **Styling**: Tailwind CSS with custom design tokens.

## Codebase Structure

### Frontend (`/`)
- `app/`: Next.js App Router pages and layouts.
- `components/`: Reusable React components (UI, Dashboard, Chat).
- `lib/`: Utilities, hooks (`useAgnoChat`), and shared logic.
- `public/`: Static assets.

### Backend (`odonto-gpt-agno-service/`)
- Contains the Python-based AI agent logic (Agno framework).
- Manages interactions with LLMs and specialized dental knowledge bases.

### Database (`supabase/`)
- `migrations/`: SQL migrations for schema changes.
- `config.toml`: Local Supabase configuration.

## Key Features
- **AI Chat Interface**: Interactive chat with specialized dental agents.
- **Dashboard**: Central hub for managing research, images, and other artifacts.
- **Artifact Management**: capability to save, view, and delete generated content (researches, images).

---
*Generated with AI Context*
