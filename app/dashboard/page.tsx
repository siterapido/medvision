import { redirect } from "next/navigation"

/** Home do dashboard: laudo-first → Med Vision. */
export default function DashboardPage() {
  redirect("/dashboard/med-vision")
}
