import type { Page } from '@playwright/test'

/**
 * Credenciais: TEST_USER_EMAIL / TEST_USER_PASSWORD (ex.: .env.local — não commitar).
 */
export function getE2ECredentials(): { email: string; password: string } | null {
  const email = (process.env.TEST_USER_EMAIL ?? process.env.E2E_USER_EMAIL ?? '').trim()
  const password = process.env.TEST_USER_PASSWORD ?? process.env.E2E_USER_PASSWORD ?? ''
  if (!email || !password) return null
  return { email, password }
}

/** Contas admin vão para /admin; demais para /dashboard */
export async function loginAsTestUser(page: Page): Promise<void> {
  const creds = getE2ECredentials()
  if (!creds) {
    throw new Error('Defina TEST_USER_EMAIL e TEST_USER_PASSWORD')
  }
  await page.goto('/login', {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  })
  await page.locator('input[type="email"]').fill(creds.email)
  await page.locator('input[type="password"]').fill(creds.password)
  await page
    .getByRole('button', { name: /Entrar na plataforma/i })
    .click({ force: true, timeout: 60_000 })
  try {
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 90_000 })
  } catch {
    const alertText = await page
      .locator('[role="alert"]')
      .first()
      .textContent()
      .catch(() => null)
    throw new Error(
      alertText?.trim() ||
        'Login falhou: URL não redirecionou. Use credenciais válidas no mesmo ambiente que E2E_BASE_URL (ex.: produção vs. local).'
    )
  }
}
