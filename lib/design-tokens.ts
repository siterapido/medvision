/**
 * Design Tokens - MedVision Design System
 *
 * Este arquivo mapeia os tokens do design system (.interface-design/system.md)
 * para classes Tailwind CSS consistentes.
 *
 * NUNCA use valores hardcoded como bg-[#020617] - sempre use estes tokens.
 */

export const tokens = {
  // ===== CANVAS & SURFACES =====
  canvas: 'bg-background',
  surface100: 'bg-card/50',      // Slightly lighter than canvas
  surface200: 'bg-card',          // Standard cards
  surface300: 'bg-popover',       // Elevated elements

  // ===== BORDERS =====
  borderDefault: 'border-border',
  borderSubtle: 'border-border/50',
  borderStrong: 'border-border/80',
  borderOverlay: 'border-popover',

  // ===== TEXT HIERARCHY =====
  textPrimary: 'text-foreground',
  textSecondary: 'text-muted-foreground',
  textTertiary: 'text-muted-foreground/70',
  textMuted: 'text-muted-foreground/50',

  // ===== BRAND (Cyan signature) =====
  brand: 'text-primary',
  brandBg: 'bg-primary',
  brandBorder: 'border-primary',
  brandMuted: 'text-primary/80',
  brandGlow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]',
  brandGlowIntense: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]',

  // ===== SEMANTIC COLORS =====
  success: 'text-green-400',
  successBg: 'bg-green-400/10',
  successBorder: 'border-green-400',

  warning: 'text-amber-400',
  warningBg: 'bg-amber-400/10',
  warningBorder: 'border-amber-400',

  destructive: 'text-destructive',
  destructiveBg: 'bg-destructive/10',
  destructiveBorder: 'border-destructive',

  // ===== SPACING (base unit = 4px) =====
  space1: 'p-1',    // 4px
  space2: 'p-2',    // 8px
  space3: 'p-3',    // 12px
  space4: 'p-4',    // 16px
  space5: 'p-5',    // 20px
  space6: 'p-6',    // 24px
  space8: 'p-8',    // 32px
  space10: 'p-10',  // 40px

  // ===== BORDER RADIUS =====
  radiusSm: 'rounded-sm',   // 6px - buttons, inputs
  radiusMd: 'rounded-md',   // 8px - chips
  radiusLg: 'rounded-lg',   // 12px - cards
  radiusXl: 'rounded-xl',   // 16px - modals

  // ===== DEPTH STRATEGY =====
  // Borders-first approach (no heavy shadows in dark mode)
  cardBase: 'bg-card border border-border rounded-lg',
  cardHover: 'hover:border-border/80',
  cardActive: 'border-primary shadow-[0_0_20px_rgba(6,182,212,0.15)]',

  // Dropdown/Overlay
  dropdown: 'bg-popover border border-popover',

  // ===== ANIMATIONS =====
  transitionFast: 'transition-all duration-150',
  transitionNormal: 'transition-all duration-200',
  easingOut: 'ease-out',

  // ===== STATES =====
  hoverSurface: 'hover:bg-card/80',
  focusRing: 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
  disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',

  // ===== SCROLL BEHAVIOR =====
  scrollViewport: 'scroll-viewport',
  scrollRegion: 'scroll-region',
  scrollbarStyled: 'scrollbar-styled',
  scrollbarHidden: 'scrollbar-hidden',
  scrollSafeBottom: 'scroll-safe-bottom',
  scrollDynamicPipeline: 'scroll-dynamic-pipeline',
} as const

/**
 * Helper function to combine multiple token classes
 *
 * @example
 * cn(tokens.cardBase, tokens.cardHover, tokens.transitionNormal)
 */
export function combineTokens(...tokenClasses: string[]): string {
  return tokenClasses.filter(Boolean).join(' ')
}

/**
 * Preset combinations for common patterns
 */
export const presets = {
  // Standard card
  card: combineTokens(
    tokens.cardBase,
    tokens.cardHover,
    tokens.transitionNormal
  ),

  // Active/focused card (e.g., selected item)
  cardActive: combineTokens(
    tokens.cardBase,
    tokens.cardActive,
    tokens.transitionNormal
  ),

  // Modal/Dialog
  modal: combineTokens(
    tokens.surface300,
    'border border-popover',
    tokens.radiusXl
  ),

  // Input field
  input: combineTokens(
    tokens.surface100,
    tokens.borderDefault,
    tokens.radiusSm,
    'px-3 py-2',
    tokens.focusRing,
    tokens.transitionFast
  ),

  // Button primary
  buttonPrimary: combineTokens(
    tokens.brandBg,
    'text-primary-foreground',
    tokens.radiusSm,
    'px-4 py-2',
    'hover:opacity-90',
    tokens.transitionFast,
    tokens.disabled
  ),

  // Button secondary
  buttonSecondary: combineTokens(
    tokens.surface200,
    tokens.textSecondary,
    tokens.radiusSm,
    'px-4 py-2',
    tokens.hoverSurface,
    tokens.transitionFast,
    tokens.disabled
  ),

  // Nav item (sidebar)
  navItem: combineTokens(
    tokens.textTertiary,
    'px-3 py-2',
    tokens.radiusSm,
    tokens.hoverSurface,
    tokens.transitionNormal
  ),

  // Nav item active
  navItemActive: combineTokens(
    tokens.textPrimary,
    'bg-primary/10',
    'border-l-2',
    tokens.brandBorder,
    'px-3 py-2',
    tokens.radiusSm
  ),
} as const

/**
 * Pipeline Stage Colors - SPIM Model
 * Maps each stage to consistent border and background colors
 */
export const stageColors = {
  novo_usuario: { border: 'border-t-slate-400', bg: 'bg-slate-400/10' },
  situacao: { border: 'border-t-cyan-400', bg: 'bg-cyan-400/10' },
  problema: { border: 'border-t-sky-400', bg: 'bg-sky-400/10' },
  implicacao: { border: 'border-t-violet-400', bg: 'bg-violet-400/10' },
  motivacao: { border: 'border-t-fuchsia-400', bg: 'bg-fuchsia-400/10' },
  convertido: { border: 'border-t-green-400', bg: 'bg-green-400/10' },
  nao_convertido: { border: 'border-t-red-400', bg: 'bg-red-400/10' },
} as const

/**
 * Urgency Level Colors
 * Based on days remaining in trial period
 */
export const urgencyColors = {
  critical: 'border-l-red-500',      // 0-2 days
  high: 'border-l-amber-500',        // 3-4 days
  medium: 'border-l-cyan-500',       // 5-6 days
  low: 'border-l-slate-600',         // 7+ days
} as const
