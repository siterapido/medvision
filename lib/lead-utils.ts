// Lead utility functions (non-server actions)

// New conversion-focused stages (replaced SPIM)
export type LeadStatus = "novo_lead" | "contato_realizado" | "interessado" | "aguardando_cadastro" | "convertido" | "descartado"

// Legacy SPIM stages for backwards compatibility
export type LegacyLeadStatus = "situacao" | "problema" | "implicacao" | "motivacao" | "nao_convertido"

// Map legacy stages to new stages
export function mapLegacyStage(stage: string): LeadStatus {
  const legacyMap: Record<string, LeadStatus> = {
    "situacao": "contato_realizado",
    "problema": "interessado",
    "implicacao": "interessado",
    "motivacao": "aguardando_cadastro",
    "nao_convertido": "descartado"
  }
  return legacyMap[stage] || (stage as LeadStatus)
}

// Valid lead statuses for validation
export const VALID_LEAD_STATUSES: LeadStatus[] = [
  "novo_lead",
  "contato_realizado",
  "interessado",
  "aguardando_cadastro",
  "convertido",
  "descartado"
]
