import type { VisionPdfSigner } from '@/lib/utils/generate-vision-pdf'

type ProfileSelfResponse = {
  name?: string | null
  cro?: string | null
  full_name?: string | null
}

/** Busca nome + CRM do perfil autenticado para assinatura do PDF. */
export async function fetchVisionPdfSigner(): Promise<VisionPdfSigner> {
  try {
    const res = await fetch('/api/profile/self', { credentials: 'include' })
    if (!res.ok) return {}
    const data = (await res.json()) as ProfileSelfResponse
    return {
      name: data.name || data.full_name || null,
      crm: data.cro || null,
    }
  } catch {
    return {}
  }
}
