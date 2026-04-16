import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config()

/** URL do app sob teste (local ou deploy). Ex.: https://medvision-ten.vercel.app */
const baseURL =
  process.env.E2E_BASE_URL?.replace(/\/$/, '') ||
  process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:3000'

const useLocalServer =
  baseURL.includes('localhost') ||
  baseURL.includes('127.0.0.1')

export default defineConfig({
  testDir: './tests-e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : useLocalServer ? 0 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    navigationTimeout: useLocalServer ? 30_000 : 60_000,
    actionTimeout: useLocalServer ? 15_000 : 30_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
      timeout: 120_000,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/auth.setup.ts', '**/odonto-vision.spec.ts'],
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'] },
      testIgnore: ['**/auth.setup.ts', '**/odonto-vision.spec.ts'],
    },
    {
      name: 'chromium-odonto',
      testMatch: '**/odonto-vision.spec.ts',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(process.cwd(), 'tests-e2e/.auth/user.json'),
      },
    },
  ],
  ...(useLocalServer
    ? {
        webServer: {
          command: 'npm run start',
          url: 'http://localhost:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
      }
    : {}),
})
