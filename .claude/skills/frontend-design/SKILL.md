---
name: frontend-design
description: Standardized UI/UX, branding, and design system for Odonto GPT. Contains rules for colors, typography, components, and animations.
phases: [P, R, E, V, C]
---

# Odonto GPT Design System Skill

This skill defines the visual language and user experience patterns for Odonto GPT.
All frontend implementation MUST follow these rules to ensure consistency with the brand identity.

## 1. Core Identity & Branding

**Odonto GPT** follows a "medical professional" aesthetic with a modern, tech-forward feel.
-   **Theme**: Predominantly **Dark Theme** (`#0F192F`) for premium feel.
-   **Accents**: Teal/Cyan (`#0891b2` -> `#06b6d4`) representing technology and trust.
-   **Vibe**: Reliable, Scientific, Innovative, Modern.

## 2. Color Palette (Tailwind & CSS Variables)

### Primary Colors
-   **Primary**: `#0891b2` (Buttons, Links, Active States)
-   **Primary Hover**: `#0e7490`
-   **Accent**: `#06b6d4` (Highlights, Badges)
-   **Glow/Tech**: `#2399B4` (AI Effects)

### Backgrounds (Dark Mode)
-   **Dark Base**: `#0F192F` (Main background)
-   **Dark Mid**: `#131D37` (Secondary sections)
-   **Dark Card**: `#16243F` (Cards, Panels)
-   **Dark Accent**: `#1A2847`

### Text Colors
-   **Headings**: `#ffffff` (White)
-   **Body**: `#e2e8f0` (Slate 200)
-   **Muted**: `#cbd5e1` (Slate 300)

### Status
-   **Success**: `#10b981`
-   **Error/Destructive**: `#ef4444`
-   **Warning**: `#f59e0b`

## 3. Typography

**Fonts**:
-   Sans: `"Inter", sans-serif`
-   Mono: `"Geist Mono", monospace`
-   Serif: `"Source Serif 4", serif`

**Hierarchy (Desktop/Mobile)**:
-   `h1`: `text-7xl` / `text-4xl`
-   `h2`: `text-4xl` / `text-2xl`
-   `h3`: `text-2xl`
-   `body`: `text-base` (16px)

**Weights**:
-   Regular: 400
-   Medium: 500
-   SemiBold: 600
-   Bold: 700

## 4. Components & UI Patterns

### Buttons
**Primary CTA**:
-   Background: `bg-gradient-to-br from-[#0891b2] to-[#06b6d4]`
-   Hover: `from-[#0e7490] to-[#0891b2]`
-   Shadow: `shadow-lg shadow-cyan-500/20`
-   Rounded: `rounded-lg` (or `rounded-full` for specialized CTAs)
-   Text: `font-semibold text-white`

**Outline**:
-   Border: `border-2 border-[#0891b2]/50`
-   Text: `text-white`
-   Hover: `bg-[#0891b2]/10 border-[#0891b2]`

### Cards
-   **Default**: `bg-[#16243F] border border-[#24324F] rounded-xl`
-   **Interactive**: Add `hover:-translate-y-1 hover:shadow-cyan-500/10 transition-all duration-300`
-   **Glass/Blur**: `backdrop-blur-md bg-[#0F192F]/80` (for sticky headers/overlays)

### Inputs & Forms
-   Background: `#131D37`
-   Border: `#24324F`
-   Text: `white`
-   Focus: `ring-2 ring-[#0891b2] border-transparent`
-   Placeholder: `text-slate-400`

### Badges
-   **Default**: `bg-[#0891b2]/10 text-[#2399B4] border border-[#0891b2]/40 rounded-full px-3 py-1 text-xs font-semibold uppercase`

## 5. Gradients & Effects

### Background Gradients
-   **Hero**: `radial-gradient(ellipse at top, #1A2847 0%, transparent 60%), linear-gradient(135deg, #0F192F 0%, #131D37 35%, #1A2847 65%, #131D37 100%)`
-   **Blue Panel**: `linear-gradient(135deg, #0f3a63 0%, #124a78 100%)`

### Glow Effects
-   Use `::before` pseudo-elements with `radial-gradient` for ambient glows.
-   Color: `rgba(8, 145, 178, 0.15)`
-   Blur: `blur-3xl`

### AI Textures
-   Use `::after` with `mask-image` for subtle grid/data patterns.
-   Opacity: `0.3` to `0.5`
-   Never interfere with text legibility.

## 6. Layout & Spacing (Tailwind)

-   **Container**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
-   **Section Padding**: `py-16` (Mobile) / `py-32` (Desktop)
-   **Gaps**: `gap-4` (Mobile) / `gap-8` (Desktop)
-   **Border Radius**: `rounded-lg` (Small components) / `rounded-xl` (Cards) / `rounded-2xl` (Large containers)

## 7. Animations

-   **Float**: `animate-float` (6s ease-in-out infinite)
-   **Pulse**: `animate-pulse-scale` (soft scale up/down)
-   **Transitions**: Always use `duration-300 ease-in-out` for hover states.
-   **Reduced Motion**: Respect `prefers-reduced-motion` by disabling complex background animations.

## 8. Dashboard Specifics

-   **Sidebar**: Dark (`#0F192F`) with border-r (`#24324F`). Active item uses clear accent color or subtle background highlight.
-   **Top Bar**: `backdrop-blur-md` sticky.
-   **Charts**: Use brand colors (`#0891b2`, `#06b6d4`) for data series. Grid lines should be subtle (`#24324F`).
-   **Live Events**: Use green (`#10b981`) for "Live Now" indicators with pulsing effect.

## 9. Implementation Checklist

When creating a new component:
1.  [ ] Check standard padding/margins (multiples of 4).
2.  [ ] Ensure text contrast meets WCAG AAA.
3.  [ ] Add hover/focus states (`focus-visible:ring`).
4.  [ ] Use semantic HTML (`<button>`, `<nav>`, `<h1>`).
5.  [ ] Verify responsiveness (mobile-first approach).