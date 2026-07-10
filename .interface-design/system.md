# MedVision Design System

## Direction

**Feel:** Light, clinical, premium — like a high-end diagnostic workstation. A restrained medical instrument for reviewing findings and exporting reports. The interface should feel like a folha de laudo, not an AI SaaS demo.

**Who:** Physicians and radiologists (~45) working in bright consultório environments, morning and afternoon. They need legibility for 5+ minutes without fatigue.

**What they do:** Upload diagnostic images, review AI-assisted findings, edit the report, export PDF. The primary action is laudo — image → achados → export.

**Signature:** Laudo paper surface — report typography beside the image. AI stays backstage as discrete status, never hero badges or glow effects.

---

## Palette

### Light Mode (Primary)

```css
/* Canvas — folha de laudo */
--paper: oklch(0.985 0.004 250);

/* Surfaces — panels, cards */
--surface: oklch(0.97 0.006 250);
--surface-raised: oklch(1 0.003 250);

/* Ink — text hierarchy */
--ink: oklch(0.22 0.02 255);
--ink-muted: oklch(0.45 0.015 255);

/* Structure */
--rule: oklch(0.88 0.01 250);

/* Accent — cold signal (≤10% of UI) */
--signal: oklch(0.42 0.06 255);

/* Clinical semantics */
--clinical-ok: oklch(0.55 0.08 145);
--clinical-warn: oklch(0.65 0.12 75);
--clinical-alert: oklch(0.55 0.14 25);
```

### Dark Mode

Out of scope for current phase. `.dark` tokens remain for compatibility but are not invested.

---

## Depth Strategy

**Approach:** Borders-only. No glass, no decorative blur, no gradient text.

- **Cards:** 1px `--rule` border, `--surface-raised` background, no shadow
- **Elevated elements:** Slightly stronger border or `--surface-raised`
- **Active/focused:** `--signal` border + subtle ring (no emerald/cyan glow)
- **Hover states:** Border darkens within rule family

```css
.card {
  background: var(--surface-raised);
  border: 1px solid var(--rule);
  border-radius: 12px;
}

.card-active {
  border-color: var(--signal);
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--signal) 10%, transparent);
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

**Padding rule:** Symmetrical. Cards use `16px` or `20px` all around.

---

## Typography

**Font:** Plus Jakarta Sans (body), Outfit (headings) — or Geist if migrated

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

**Color:** Headings use `--ink`, never orange or gradient. Muted text uses `--ink-muted`.

**Letter-spacing:**
- Headlines: `-0.02em`
- Body: `0`
- Uppercase labels: `0.05em`

---

## Border Radius

**Scale:**
- `--radius-sm`: 6px — buttons, inputs, badges
- `--radius-md`: 8px — small cards, chips
- `--radius-lg`: 12px — cards, panels
- `--radius-xl`: 16px — modals, large containers

---

## Component Patterns

### Navigation (Sidebar)

- Same background as canvas (`--paper`) — not contrasting dark
- Items: subtle hover, no background by default
- Active item: signal tint background + `--ink` text (no side-stripe >1px, no glow)
- Separation via `--rule` border

```css
.sidebar {
  background: var(--paper);
  border-right: 1px solid var(--rule);
}

.nav-item-active {
  color: var(--ink);
  background: color-mix(in oklch, var(--signal) 8%, var(--surface));
}
```

### Cards

- Background: `--surface-raised`
- Border: 1px `--rule`
- Radius: 12px
- Padding: 16px or 20px
- No shadow, no blur

### Inputs

- Background: `--surface-raised`
- Border: 1px `--rule`
- Focus: `--signal` border + subtle ring
- No emerald glow, no glass blur

### Buttons

- Primary: `--signal` background, `--surface-raised` text
- Secondary: `--surface` background, `--ink` text
- Ghost: transparent, `--ink-muted`, hover shows subtle surface

### Laudo Review (Med Vision)

The laudo is the hero:

- Split layout: image | report text
- Report reads like a clinical document
- Advanced tools collapsed by default
- Export PDF as primary action
- AI status: typographic, discrete

---

## Animations

- Duration: 150ms for micro-interactions, 200ms for transitions
- Easing: `ease-out` or `cubic-bezier(0.4, 0, 0.2, 1)`
- No spring/bounce, no pulse-glow as brand signature
- Border/color transitions for hover states

---

## Anti-Patterns

Avoid:
- Dark sidebar with emerald glow
- Glassmorphism and backdrop blur on product surfaces
- Gradient text (`bg-clip-text`)
- Orange headings in authenticated product
- Side-stripe >1px for active nav
- Sparkles / "IA" badges as hero elements
- SaaS metric card grids
- Pure `#fff` / `#000` (use paper/ink OKLCH family)

---

## Reference

Inspired by: clinical workstations, DICOM viewers, premium medical instruments.

Unique to MedVision: Laudo-first layout, light consultório palette, cold signal accent, Brazilian Portuguese UI copy.
