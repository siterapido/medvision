import { redirect } from "next/navigation"

/** Alias de rota para compatibilidade com favoritos /dashboard/med-vision */
export default function MedVisionAliasPage() {
  redirect("/dashboard/odonto-vision")
}
