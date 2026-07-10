import Link from "next/link"

import { AuthShell } from "@/components/marketing/auth-shell"

export default function Home() {
  return (
    <AuthShell>
      <div className="flex flex-col items-start gap-4">
        <Link
          href="/login"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-signal px-8 text-sm font-semibold text-surface-raised transition-colors hover:bg-signal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/30"
        >
          Entrar
        </Link>
      </div>
    </AuthShell>
  )
}
