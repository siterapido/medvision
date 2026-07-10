# MedVision UI Simplify Laudo-first — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand authenticated MedVision to light laudo-first clinical UI, cut unused nav (user legacy + admin cursos/materiais), without deleting legacy code or changing analysis APIs.

**Architecture:** Token-first in `app/globals.css` → map shadcn/sidebar vars → restyle shell/login → align Med Vision / Laudos / perfil surfaces → admin nav cut → 404 copy. Prefer existing `components/vision/med-vision/*`. Do not rewrite analysis logic in `odonto-vision/page.tsx`.

**Tech Stack:** Next.js App Router, Tailwind v4 + CSS vars, shadcn/ui, existing Med Vision wizard components.

**Spec:** `docs/superpowers/specs/2026-07-10-medvision-ui-simplify-laudo-first-design.md`

---

## File map

| Area | Files |
|------|--------|
| Tokens | `app/globals.css`, optionally `components/ui/design-tokens.ts` |
| Nav | `lib/constants/navigation.ts` |
| Shell | `components/sidebar/*`, `components/dashboard/mobile-nav.tsx`, `components/dashboard/new-sidebar.tsx` / `unified-sidebar.tsx` as used |
| Auth | `components/auth/login-form.tsx`, `app/login/*` |
| Med Vision | `components/vision/med-vision/*`, light touch `app/dashboard/odonto-vision/page.tsx` only if needed for layout classes |
| Laudos | `app/dashboard/laudos/page.tsx`, related list components |
| 404 | `components/unavailable-page.tsx`, legacy dashboard pages that should render it |
| Admin | `lib/constants/navigation.ts` (`ADMIN_NAV_ITEMS`) |
| System doc | `.interface-design/system.md` |

---

### Task 1: Design tokens (light laudo-first)

**Files:**
- Modify: `app/globals.css`
- Modify (if present): `components/ui/design-tokens.ts`
- Modify: `.interface-design/system.md` (replace Odonto GPT dark/cyan narrative with MedVision laudo-first)

- [ ] **Step 1:** In `:root`, add product tokens `--paper`, `--surface`, `--surface-raised`, `--ink`, `--ink-muted`, `--rule`, `--signal`, `--clinical-ok`, `--clinical-warn`, `--clinical-alert` using OKLCH from spec §5.
- [ ] **Step 2:** Remap `--background` → paper, `--foreground` → ink, `--primary`/`--ring` → signal (not emerald), `--border` → rule, `--card`/`--muted` → surface family.
- [ ] **Step 3:** Remap `--sidebar*` to light canvas family (same as paper/surface), active via signal tint — **not** slate-950 + emerald.
- [ ] **Step 4:** Neutralize decorative glass/glow: set `.glass` to solid surface+border (no meaningful blur), kill or neutralize `.input-glow` / `pulse-glow` emerald signatures used in auth shell; remove orange `--typography-heading` from product surfaces (use ink).
- [ ] **Step 5:** Keep `.dark` block intact but do not invest — light-first only. Do not break Tailwind `@theme` mappings; update `--color-*` aliases that point at primary/sidebar.
- [ ] **Step 6:** Update `.interface-design/system.md` summary to MedVision laudo-first.
- [ ] **Step 7:** Commit: `style(tokens): laudo-first light palette, kill emerald glass defaults`

---

### Task 2: Shell + login (no glass, light sidebar)

**Files:**
- Modify: `components/sidebar/sidebar-nav.tsx`, `sidebar-header.tsx`, `sidebar-user.tsx`, `unified-sidebar.tsx` / `new-sidebar.tsx` as applicable
- Modify: `components/dashboard/mobile-nav.tsx`
- Modify: `components/auth/login-form.tsx`, login page wrappers
- Modify: `components/ui/button.tsx`, `card.tsx`, `skeleton.tsx` only if they hardcode emerald/glass

- [ ] **Step 1:** Sidebar: background = paper/surface; active item = subtle signal tint + ink text; remove glow/stripe >1px.
- [ ] **Step 2:** Mobile nav: remove `backdrop-blur` glass pill; solid border surface.
- [ ] **Step 3:** Login: paper background, dark logo (fix white-on-white), CTA uses primary/signal, no glass card.
- [ ] **Step 4:** Smoke: open `/login` and `/dashboard` mentally via class review — no emerald glow classes left on shell.
- [ ] **Step 5:** Commit: `style(shell): light clinical sidebar and login`

---

### Task 3: Med Vision surfaces (upload / configure / review)

**Files:**
- Modify: `components/vision/med-vision/*` (upload, configure, review, result, badge, disclaimer, step-indicator)
- Touch `app/dashboard/odonto-vision/page.tsx` **only** for layout/class wiring if steps already mounted — do not rewrite analysis pipeline

- [ ] **Step 1:** Align step UIs to paper/surface/rule; dropzone clear; shadcn selects already preferred.
- [ ] **Step 2:** Review/result: default split image | laudo; advanced tools collapsed.
- [ ] **Step 3:** `med-vision-ai-badge`: demote to discrete status (no Sparkles hero).
- [ ] **Step 4:** Clinical disclaimer always visible, muted typography.
- [ ] **Step 5:** Commit: `style(med-vision): laudo-first wizard surfaces`

---

### Task 4: Laudos + perfil/config

**Files:**
- Modify: `app/dashboard/laudos/**`, related list UI
- Modify: `app/dashboard/perfil/**`, `app/dashboard/configuracoes/**` as needed

- [ ] **Step 1:** Laudos list dense (date, type, status, one-line preview) — not metric card grid.
- [ ] **Step 2:** Empty state: one sentence + CTA to `MED_VISION_HREF`.
- [ ] **Step 3:** Perfil/config: simple sections with `--rule`, no stacked decorative cards.
- [ ] **Step 4:** Commit: `style(laudos): dense clinical list and settings`

---

### Task 5: Legacy 404 + admin nav cut

**Files:**
- Modify: `components/unavailable-page.tsx`
- Modify: legacy pages under `app/dashboard/{chat,biblioteca,odontoflix,certificados,studio,historico}/**` to use clean 404 messaging if not already
- Modify: `lib/constants/navigation.ts` — remove Cursos + Materiais from `ADMIN_NAV_ITEMS`

- [ ] **Step 1:** Rewrite `UnavailablePage` copy to **“Página não encontrada”** + short line + link Med Vision (not “em manutenção / em breve”).
- [ ] **Step 2:** Ensure legacy dashboard entry pages render `UnavailablePage` (or `not-found`) — do not delete route files.
- [ ] **Step 3:** `ADMIN_NAV_ITEMS`: keep Visão Geral, Usuários, Agentes IA; remove Cursos, Materiais.
- [ ] **Step 4:** Commit: `fix(nav): clean legacy 404 and drop admin cursos/materiais`

---

### Task 6: Copy cleanup + acceptance pass

**Files:**
- Grep/fix user-facing “Odonto GPT”, orange headings, emerald marketing copy on scoped routes
- Verify acceptance checklist from spec §7

- [ ] **Step 1:** Replace remaining Odonto-facing copy on login, shell, Med Vision, Laudos, perfil with MedVision clinical tone.
- [ ] **Step 2:** Grep scoped paths for `backdrop-blur`, `animate-pulse-glow`, `bg-clip-text`, emerald `#10b981` hardcodes in shell/med-vision — fix stragglers.
- [ ] **Step 3:** Note any intentional leftovers outside scope (landing, admin pages body).
- [ ] **Step 4:** Commit: `chore(copy): MedVision clinical wording on scoped routes`

---

## Out of scope (do not do)

- Delete legacy route files or admin cursos code
- Landing / assinar / trial redesign
- Full admin visual redesign
- Dark mode investment
- Analysis API / model changes
- Large refactor of `odonto-vision/page.tsx` analysis logic
