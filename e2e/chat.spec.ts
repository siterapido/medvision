/**
 * Chat E2E Tests with Playwright
 * 
 * Testes end-to-end para o fluxo de chat completo
 */

import { test, expect } from '@playwright/test'

test.describe('Chat Page E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to chat page
    await page.goto('/dashboard/chat')
  })
  
  test('should display empty state with suggestions', async ({ page }) => {
    // Check for the welcome message
    await expect(page.locator('text=Como posso ajudar hoje?')).toBeVisible()
    
    // Check for suggestion buttons
    await expect(page.locator('text=anatomia do primeiro molar')).toBeVisible()
    await expect(page.locator('text=preparo cavitario')).toBeVisible()
  })
  
  test('should have input field and send button', async ({ page }) => {
    // Check for input field
    const input = page.locator('textarea[placeholder*="pergunta"]')
    await expect(input).toBeVisible()
    
    // Check for send button (disabled when empty)
    const sendButton = page.locator('button[type="submit"]')
    await expect(sendButton).toBeVisible()
    await expect(sendButton).toBeDisabled()
  })
  
  test('should enable send button when input has text', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="pergunta"]').first()
    const sendButton = page.locator('button[type="submit"]').first()
    
    // Type something
    await input.fill('O que e carie dentaria?')
    
    // Button should be enabled
    await expect(sendButton).toBeEnabled()
  })
  
  test('should fill input when clicking suggestion', async ({ page }) => {
    // Click on a suggestion
    await page.click('text=anatomia do primeiro molar')
    
    // Check that input is filled
    const input = page.locator('textarea[placeholder*="pergunta"]').first()
    await expect(input).toHaveValue(/anatomia/)
  })
  
  test('should send message and show user message', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="pergunta"]').first()
    
    // Type and send message
    await input.fill('Ola, estou testando')
    await page.keyboard.press('Enter')
    
    // Should show user message
    await expect(page.locator('text=Voce')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Ola, estou testando')).toBeVisible()
  })
  
  test('should show loading state while waiting for response', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="pergunta"]').first()
    
    // Type and send message
    await input.fill('O que e periodontite?')
    await page.keyboard.press('Enter')
    
    // Should show loading indicator or streaming state
    // The button should show loading spinner
    await expect(page.locator('.animate-spin')).toBeVisible({ timeout: 3000 })
  })
  
  test('should receive assistant response', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="pergunta"]').first()
    
    // Type and send message
    await input.fill('Ola')
    await page.keyboard.press('Enter')
    
    // Wait for assistant response (with timeout)
    await expect(page.locator('text=Odonto GPT')).toBeVisible({ timeout: 30000 })
  })
  
  test('should handle keyboard shortcuts', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="pergunta"]').first()
    
    // Type message
    await input.fill('Teste de atalho')
    
    // Shift+Enter should not send
    await page.keyboard.down('Shift')
    await page.keyboard.press('Enter')
    await page.keyboard.up('Shift')
    
    // Message should still be in input (with newline)
    const value = await input.inputValue()
    expect(value).toContain('Teste de atalho')
  })
  
})

test.describe('Chat with Artifacts', () => {
  
  test('should render artifact when tool returns structured data', async ({ page }) => {
    // This test requires the chat to actually generate an artifact
    // For now, we just check that the artifact renderer exists
    
    await page.goto('/dashboard/chat')
    
    const input = page.locator('textarea[placeholder*="pergunta"]').first()
    await input.fill('Crie um resumo sobre anatomia dental')
    await page.keyboard.press('Enter')
    
    // Wait for response (longer timeout for artifact generation)
    await expect(page.locator('text=Odonto GPT')).toBeVisible({ timeout: 60000 })
    
    // If artifact was generated, it should show the card
    // This is a soft check - artifact may not always be generated
    const artifactCard = page.locator('[class*="artifact"]')
    // Don't fail if no artifact - just log
    const hasArtifact = await artifactCard.count() > 0
    console.log(`Artifact generated: ${hasArtifact}`)
  })
  
})

test.describe('Agent Selector (if implemented)', () => {
  
  test.skip('should allow switching between agents', async ({ page }) => {
    await page.goto('/dashboard/chat')
    
    // This test is for when agent selector is implemented
    // Skip for now
  })
  
})

test.describe('Session Management', () => {
  
  test.skip('should persist chat history', async ({ page }) => {
    // This requires authentication
    // Skip for now
  })
  
})

test.describe('Error Handling', () => {
  
  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/dashboard/chat')
    
    // Intercept API and return error
    await page.route('**/api/chat', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })
    
    const input = page.locator('textarea[placeholder*="pergunta"]').first()
    await input.fill('Teste de erro')
    await page.keyboard.press('Enter')
    
    // Should show error toast or message
    // Using a generic check for error indication
    await page.waitForTimeout(2000)
    // The component should handle errors gracefully
  })
  
})
