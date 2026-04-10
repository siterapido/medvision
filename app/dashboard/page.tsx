import { redirect } from "next/navigation"

/**
 * Início do dashboard: produto focado em Med Vision (radiografias e tomografias) — redireciona para a ferramenta.
 */
export default function DashboardPage() {
  redirect("/dashboard/odonto-vision")
}
