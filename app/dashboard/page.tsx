import { redirect } from "next/navigation"

/**
 * Início do dashboard: produto focado em Odonto Vision — redireciona para a ferramenta.
 */
export default function DashboardPage() {
  redirect("/dashboard/odonto-vision")
}
