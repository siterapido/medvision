/**
 * Cria um usuário de teste via API pública do Neon Auth (sign-up email).
 *
 * Uso:
 *   NEON_AUTH_BASE_URL="https://ep-xxx.neonauth....../neondb/auth" \
 *   ORIGIN="http://localhost:3000" \
 *   npx tsx scripts/seed-neon-auth-test-user.ts
 *
 * Opcional: TEST_EMAIL, TEST_PASSWORD, TEST_NAME
 */
const base = process.env.NEON_AUTH_BASE_URL?.replace(/\/$/, "")
const requestOrigin =
  process.env.ORIGIN ??
  process.env.NEXT_PUBLIC_APP_ORIGIN ??
  "http://localhost:3000"

async function main() {
  if (!base) {
    console.error("Defina NEON_AUTH_BASE_URL (URL de Auth no console Neon → Auth → Configuration).")
    process.exit(1)
  }

  const email =
    process.env.TEST_EMAIL ?? "teste.medvision@example.com"
  const password = process.env.TEST_PASSWORD ?? "TesteMedVision2026!"
  const name = process.env.TEST_NAME ?? "Usuário Teste MedVision"

  const url = `${base}/sign-up/email`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: requestOrigin,
    },
    body: JSON.stringify({ email, password, name }),
  })

  const text = await res.text()
  if (!res.ok) {
    console.error(res.status, text)
    process.exit(1)
  }

  try {
    const data = JSON.parse(text) as { user?: { id: string; email: string } }
    console.log("Usuário criado:", data.user?.email ?? email, data.user?.id ?? "")
  } catch {
    console.log(text)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
