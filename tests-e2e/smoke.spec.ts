import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('deve carregar a página de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/MedVision|Odonto|Login/i);
    // Verifica se existe algum input de email
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('deve redirecionar para login ao tentar acessar dashboard sem autenticação', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });
});
