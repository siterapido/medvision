import { redirect } from "next/navigation"

import { isDevAuthBypass } from "@/lib/dev-auth"

/**
 * Atalho de desenvolvimento → MedVision (Odonto Vision).
 * Requer `DEV_BYPASS_AUTH=true` no `.env.local`; caso contrário, envia ao login.
 */
export default function DevMedvisionEntryPage() {
  if (!isDevAuthBypass()) {
    redirect("/login?redirectTo=/dashboard/odonto-vision")
  }
  redirect("/dashboard/odonto-vision")
}
