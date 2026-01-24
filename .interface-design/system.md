# Odonto GPT Design System

## Direction

**Feel:** Dark, tech-forward, premium — like Vercel or Linear. A sophisticated AI-powered dental learning platform. The interface should feel like a high-end developer tool, not a clinical application.

**Who:** Brazilian dentists learning and researching. They open this at night after clinic hours, on weekends for study, between patients for quick consultations. They're professionals who appreciate precision and efficiency.

**What they do:** Chat with an AI tutor, watch courses, access materials, track progress. The primary action is conversation — asking questions, getting answers, learning.

**Signature:** Dark surfaces with subtle cyan glow. Cards that feel like they're floating in space. The AI chat as the hero — not buried in a dashboard, but front and center as the primary experience.

---

## Palette

### Dark Mode (Primary)

```css
/* Canvas — the deepest layer */
--canvas: #020617;           /* slate-950, near black */

/* Surfaces — cards, panels, containers */
--surface-100: #0a0f1f;      /* 3% lighter than canvas */
--surface-200: #0f172a;      /* slate-900, for cards */
--surface-300: #131d37;      /* for elevated elements, dropdowns */

/* Borders — whisper-light separation */
--border-default: rgba(148, 163, 184, 0.08);   /* barely there */
--border-subtle: rgba(148, 163, 184, 0.05);    /* even softer */
--border-strong: rgba(148, 163, 184, 0.12);    /* hover, focus */
--border-overlay: rgba(148, 163, 184, 0.15);   /* dropdowns, modals */

/* Text hierarchy */
--text-primary: #f8fafc;     /* slate-50, high contrast */
--text-secondary: #cbd5e1;   /* slate-300 */
--text-tertiary: #94a3b8;    /* slate-400 */
--text-muted: #64748b;       /* slate-500, disabled */

/* Brand — Cyan as the signature */
--brand: #06b6d4;            /* cyan-500 */
--brand-muted: #0891b2;      /* cyan-600, less vibrant */
--brand-glow: rgba(6, 182, 212, 0.15);  /* subtle glow effect */

/* Semantic */
--success: #34d399;          /* emerald-400 */
--warning: #fbbf24;          /* amber-400 */
--destructive: #f87171;      /* red-400 */
```

### Light Mode (Secondary)

```css
--canvas: #f8fafc;           /* slate-50 */
--surface-100: #ffffff;      /* pure white cards */
--surface-200: #f1f5f9;      /* slate-100, inset areas */

--border-default: rgba(15, 23, 42, 0.06);
--border-subtle: rgba(15, 23, 42, 0.04);
--border-strong: rgba(15, 23, 42, 0.10);

--text-primary: #0f172a;     /* slate-900 */
--text-secondary: #334155;   /* slate-700 */
--text-tertiary: #64748b;    /* slate-500 */

--brand: #0891b2;            /* cyan-600, slightly darker for light bg */
```

---

## Depth Strategy

**Approach:** Borders-first with subtle glow for brand elements.

Shadows are minimal in dark mode — they don't lift well against dark backgrounds. Instead:

- **Cards:** 1px border at `--border-default`, no shadow
- **Elevated elements (dropdowns, modals):** Slightly stronger border + subtle background shift
- **Brand emphasis:** Cyan glow (`box-shadow: 0 0 20px var(--brand-glow)`) for active/focused states
- **Hover states:** Border transitions from `--border-default` to `--border-strong`

```css
/* Card base */
.card {
  background: var(--surface-200);
  border: 1px solid var(--border-default);
  border-radius: 12px;
}

/* Card hover */
.card:hover {
  border-color: var(--border-strong);
}

/* Active/focused with brand glow */
.card-active {
  border-color: var(--brand);
  box-shadow: 0 0 0 1px var(--brand), 0 0 20px var(--brand-glow);
}

/* Dropdown/overlay */
.dropdown {
  background: var(--surface-300);
  border: 1px solid var(--border-overlay);
}
```

---

## Spacing

**Base unit:** 4px

- `--space-1`: 4px (micro gaps)
- `--space-2`: 8px (tight element pairs)
- `--space-3`: 12px (within components)
- `--space-4`: 16px (standard padding)
- `--space-5`: 20px (comfortable padding)
- `--space-6`: 24px (section gaps)
- `--space-8`: 32px (major separation)
- `--space-10`: 40px (page-level spacing)

**Padding rule:** Symmetrical. Cards use `16px` or `20px` all around. Asymmetry only when content dictates (e.g., more horizontal room for wide text).

---

## Typography

**Font:** Geist (sans) for UI, Geist Mono for data/code

**Scale:**
- `--text-xs`: 12px — metadata, badges
- `--text-sm`: 14px — body text, labels
- `--text-base`: 16px — primary content
- `--text-lg`: 18px — section headers
- `--text-xl`: 20px — card titles
- `--text-2xl`: 24px — page titles

**Weight:**
- Regular (400) — body text
- Medium (500) — labels, nav items
- Semibold (600) — headings, emphasis

**Letter-spacing:**
- Headlines: `-0.02em` (tighter)
- Body: `0` (default)
- Uppercase labels: `0.05em` (looser)

---

## Border Radius

**Scale:**
- `--radius-sm`: 6px — buttons, inputs, badges
- `--radius-md`: 8px — small cards, chips
- `--radius-lg`: 12px — cards, panels
- `--radius-xl`: 16px — modals, large containers

**Rule:** Sharper on small elements, rounder on containers. Consistent within component families.

---

## Component Patterns

### Navigation (Sidebar)

- Same background as canvas (not contrasting)
- Items: subtle hover state, no background by default
- Active item: cyan left border or background tint
- Separation via subtle border, not color contrast

```css
.sidebar {
  background: var(--canvas);
  border-right: 1px solid var(--border-default);
}

.nav-item {
  color: var(--text-tertiary);
  padding: 8px 12px;
  border-radius: 6px;
}

.nav-item:hover {
  color: var(--text-secondary);
  background: var(--surface-100);
}

.nav-item-active {
  color: var(--text-primary);
  background: var(--brand-glow);
  border-left: 2px solid var(--brand);
}
```

### Cards

- Background: `--surface-200`
- Border: 1px `--border-default`
- Radius: 12px
- Padding: 16px or 20px
- No shadow in dark mode

### Inputs

- Background: `--surface-100` (inset feel)
- Border: 1px `--border-default`
- Focus: border-color transitions to `--brand`
- Padding: 10px 12px

### Buttons

- Primary: `--brand` background, `--text-primary` (dark) text
- Secondary: `--surface-200` background, `--text-secondary` text
- Ghost: transparent, `--text-tertiary`, hover shows subtle background

### Chat Interface

The chat is the hero. It should feel expansive and focused:

- Messages have minimal chrome
- User messages: right-aligned, cyan-tinted background
- AI messages: left-aligned, subtle surface background
- Input area: prominent, always visible, inviting

---

## Animations

- Duration: 150ms for micro-interactions, 200ms for transitions
- Easing: `ease-out` or `cubic-bezier(0.4, 0, 0.2, 1)`
- No spring/bounce effects
- Border/color transitions for hover states
- Subtle opacity transitions for appearing elements

---

## Anti-Patterns

Avoid:
- Dramatic shadows on dark backgrounds
- Multiple accent colors (cyan only)
- Harsh white text on pure black (use slate scale)
- Sidebar with contrasting background
- Gradients for decoration
- Thick borders
- Bouncy animations
- Generic card grids with identical layouts

---

## Reference

Inspired by: Vercel, Linear, Raycast — dark, technical, premium.

Unique to Odonto GPT: Cyan as signature (evokes clinical precision), chat-first experience, Brazilian Portuguese UI copy.
