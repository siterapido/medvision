/**
 * Executa uma vez antes da suíte Odonto Vision (projeto chromium-odonto).
 * Grava sessão em tests-e2e/.auth/user.json (gitignored).
 */
import path from 'node:path'
import { mkdirSync } from 'node:fs'
import { test as setup } from '@playwright/test'
import { loginAsTestUser, getE2ECredentials } from './helpers/e2e-auth'

const authFile = path.join(process.cwd(), 'tests-e2e/.auth/user.json')

setup('autenticar E2E', async ({ page }) => {
  if (!getE2ECredentials()) {
    throw new Error(
      'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD (ex.: .env.local) para o setup de autenticação.'
    )
  }
  await loginAsTestUser(page)
  mkdirSync(path.dirname(authFile), { recursive: true })
  await page.context().storageState({ path: authFile })
})
