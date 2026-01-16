# Repository Guidelines

## Project Structure & Module Organization
Next.js 16 App Router project: `app/page.tsx` handles the marketing landing, while `app/dashboard`, `app/admin`, `app/login`, and `app/register` cover authenticated flows. Shared UI lives in `components/` (shadcn kit) and helpers in `lib/`. Assets stay in `public/`, and global tokens live in `app/globals.css` plus `styles/`. Supabase SQL resides in `supabase/migrations`—follow `SUPABASE_SETUP.md` before touching data models. Keep `docs/` and `UI_UX_GUIDE.md` updated whenever navigation or copy changes.

## Build, Test, and Development Commands
- `npm run dev` – Next dev server with hot reload for day-to-day work.
- `npm run build` – production compile; catches type and bundler errors.
- `npm run start` – runs the built output for smoke testing Vercel parity.
- `npm run lint` – ESLint over the repo; keep it passing before pushing.

## Coding Style & Naming Conventions
Favor server components and add `'use client'` only when the browser is required. TypeScript, two-space indents, and ordered imports (external → `@/` → relative) keep diffs focused. Use `PascalCase` for components/hooks, `kebab-case` for route folders, and Tailwind tokens from `globals.css`, combining classes with `clsx` or `class-variance-authority`. Forms should mirror `app/login`—`react-hook-form` plus Zod validation.

## Testing Guidelines
Linting plus manual walkthroughs of the login → dashboard → admin flows are currently required before a PR. When you add automation, colocate `*.test.tsx` files beside the source, use Vitest + React Testing Library, and mock Supabase via the factories in `lib/` so tests stay hermetic.

## Commit & Pull Request Guidelines
Use the conventional format seen in history (`feat(auth): …`, `fix(chat): …`). PRs must explain the user-facing impact, call out touched routes/components, and mention new files under `supabase/migrations`. Attach screenshots for UI changes, link the relevant doc or issue, and run `npm run lint && npm run build` before requesting review.

## Supabase & Configuration Tips
Store `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (never commit secrets). Evolve schemas with the Supabase CLI (`supabase db diff` / `supabase db push`) and commit the generated SQL under `supabase/migrations`, updating `SUPABASE_SETUP.md` if prerequisites change.

## Orientação de Idioma
Todas as respostas automatizadas e comunicações nos PRs devem ser redigidas em português brasileiro, mantendo tom profissional e direto.
## AI Context References
- Documentation index: `.context/docs/README.md`
- Agent playbooks: `.context/agents/README.md`

