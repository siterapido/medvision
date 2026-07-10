# MedVision Landing + Login Auth Shell — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or implement directly. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shared light clinical auth shell for `/` (minimal hero + Entrar) and `/login` (same composition + form).

**Architecture:** `AuthShell` split layout + `LandingHero` left copy; right slot = CTA or `LoginForm`. Neon Auth logic unchanged; strip dark variant and debug fetches.

**Tech Stack:** Next.js App Router, Tailwind tokens (`--paper`/`--ink`/`--signal`), existing Logo + LoginForm.

**Spec:** `docs/superpowers/specs/2026-07-10-medvision-landing-login-auth-shell-design.md`

---

### Task 1: Auth shell + hero

**Files:**
- Create: `components/marketing/auth-shell.tsx`
- Create: `components/marketing/landing-hero.tsx`

- [x] AuthShell: min-h-screen paper, subtle slate atmosphere, split 55/45, children = right slot
- [x] LandingHero: MedVision logo hero + headline + phrase from spec

### Task 2: Pages

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/login/page.tsx`

- [x] `/` — AuthShell + LandingHero + Entrar link to `/login`
- [x] `/login` — AuthShell + LandingHero + LoginForm (title Acesso)

### Task 3: LoginForm rebuild

**Files:**
- Modify: `components/auth/login-form.tsx`

- [x] Light-only; remove variant dark
- [x] Remove debug `127.0.0.1` fetches and noisy console
- [x] Copy: button "Entrar"; keep forgot-password; clinical inputs

### Task 4: Smoke

- [x] Lint touched files; visual class review vs aceite
