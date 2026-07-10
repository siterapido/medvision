/**
 * Design Tokens — MedVision
 *
 * Documentação centralizada dos tokens de design usados no sistema.
 * Os tokens CSS equivalentes estão em app/globals.css.
 */

/** Paleta laudo-first (OKLCH) — fonte: app/globals.css :root */
export const colors = {
  /** Canvas — folha de laudo */
  paper: "var(--paper)",
  /** Painéis e áreas inset */
  surface: "var(--surface)",
  /** Elevação sutil (cards, popovers) */
  surfaceRaised: "var(--surface-raised)",
  /** Texto primário */
  ink: "var(--ink)",
  /** Texto secundário */
  inkMuted: "var(--ink-muted)",
  /** Bordas e divisores */
  rule: "var(--rule)",
  /** CTA, foco, item ativo — frio, não teal/emerald */
  signal: "var(--signal)",
  /** Achado ok / sucesso clínico */
  clinicalOk: "var(--clinical-ok)",
  /** Atenção */
  clinicalWarn: "var(--clinical-warn)",
  /** Alerta / destrutivo clínico */
  clinicalAlert: "var(--clinical-alert)",
} as const

/** Classes Tailwind equivalentes para tokens de cor */
export const colorClass: Record<keyof typeof colors, string> = {
  paper: "bg-paper text-ink",
  surface: "bg-surface text-ink",
  surfaceRaised: "bg-surface-raised text-ink",
  ink: "text-ink",
  inkMuted: "text-ink-muted",
  rule: "border-rule",
  signal: "bg-signal text-surface-raised",
  clinicalOk: "text-clinical-ok",
  clinicalWarn: "text-clinical-warn",
  clinicalAlert: "text-clinical-alert",
}

/** Escala de espaçamento (multiplica por 4px — base Tailwind) */
export const spacing = {
  /** 4px — micro-espaço (gap entre ícone e label) */
  1: "4px",
  /** 8px — compacto (padding de badges, gap interno) */
  2: "8px",
  /** 12px — reduzido (padding de inputs pequenos) */
  3: "12px",
  /** 16px — padrão (padding de cards, gap entre seções) */
  4: "16px",
  /** 24px — espaçoso (gap entre grupos de conteúdo) */
  6: "24px",
  /** 32px — amplo (padding de containers principais) */
  8: "32px",
  /** 48px — extra amplo (espaçamento entre seções grandes) */
  12: "48px",
} as const

/** Classes Tailwind equivalentes para cada token de espaçamento */
export const spacingClass: Record<keyof typeof spacing, string> = {
  1: "p-1 gap-1",
  2: "p-2 gap-2",
  3: "p-3 gap-3",
  4: "p-4 gap-4",
  6: "p-6 gap-6",
  8: "p-8 gap-8",
  12: "p-12 gap-12",
}

/**
 * Hierarquia de border-radius
 *
 * rounded-sm  — 4px  (elementos muito pequenos: badges, tags)
 * rounded-md  — 6px  (inputs, botões, dropdowns)
 * rounded-lg  — 8px  (elementos internos de card, popovers)
 * rounded-xl  — 12px (cards, containers principais) ← --radius padrão
 * rounded-2xl — 16px (containers externos, modais)
 */

/**
 * Hierarquia de sombras
 *
 * shadow-none   — elementos planos (texto, ícones)
 * shadow-sm     — elevação sutil (cards estáticos, inputs em repouso)
 * shadow-md     — elevação média (cards hover, dropdowns abertos)
 * shadow-lg     — elevação alta (modais, dialogs)
 * shadow-xl     — elevação máxima (overlays, sheets)
 */

export { spacing as default, colors }
