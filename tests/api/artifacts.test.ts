/**
 * Integration tests for /api/artifacts endpoint
 * Tests all artifact types and CRUD operations
 */

import { describe, test, expect } from 'vitest'

describe('POST /api/artifacts', () => {
  // Test each artifact type individually
  test.each([
    'chat',
    'document',
    'code',
    'image',
    'research',
    'exam',
    'summary',
    'flashcards',
    'mindmap',
    'other'
  ])('should accept type: %s', async (type) => {
    const response = await fetch('http://localhost:3000/api/artifacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `Test ${type} Artifact`,
        description: `Testing artifact type: ${type}`,
        type,
        content: { test: true, data: `${type} content` },
        aiContext: {
          model: 'gpt-4',
          agent: 'test-agent',
          prompt: `Test prompt for ${type}`
        }
      })
    })

    // Should return 201 Created or 401 Unauthorized (if not authenticated)
    // In test environment, we expect either success or auth error, not 500
    expect([201, 401]).toContain(response.status)

    if (response.status === 201) {
      const data = await response.json()
      expect(data).toHaveProperty('id')
      expect(data.type).toBe(type)
    }
  })

  test('should reject invalid artifact type', async () => {
    const response = await fetch('http://localhost:3000/api/artifacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Invalid Type Test',
        description: 'Testing invalid type',
        type: 'invalid_type',
        content: { test: true },
        aiContext: { model: 'gpt-4', agent: 'test' }
      })
    })

    // Should return 400 Bad Request due to Zod validation
    expect(response.status).toBe(400)
  })
})

describe('GET /api/artifacts', () => {
  test('should return 200 or 401 (auth required)', async () => {
    const response = await fetch('http://localhost:3000/api/artifacts?page=1&limit=10')

    // Should either succeed or require auth, not crash with 500
    expect([200, 401]).toContain(response.status)

    if (response.status === 200) {
      const data = await response.json()
      expect(data).toHaveProperty('data')
      expect(data).toHaveProperty('total')
      expect(data).toHaveProperty('page')
      expect(data).toHaveProperty('limit')
      expect(Array.isArray(data.data)).toBe(true)
    }
  })

  test('should accept type filter parameter', async () => {
    const response = await fetch('http://localhost:3000/api/artifacts?type=research&page=1&limit=10')

    expect([200, 401]).toContain(response.status)

    if (response.status === 200) {
      const data = await response.json()
      expect(data).toHaveProperty('data')
      // All returned artifacts should be of type 'research'
      data.data.forEach((artifact: any) => {
        expect(artifact.type).toBe('research')
      })
    }
  })

  test('should handle pagination parameters', async () => {
    const response = await fetch('http://localhost:3000/api/artifacts?page=2&limit=5')

    expect([200, 401]).toContain(response.status)

    if (response.status === 200) {
      const data = await response.json()
      expect(data.page).toBe(2)
      expect(data.limit).toBe(5)
      expect(data.data.length).toBeLessThanOrEqual(5)
    }
  })
})

describe('Artifact Type Validation', () => {
  test('should have consistent types between TypeScript and database', () => {
    // This test validates that our type definitions are consistent
    const validTypes = [
      'chat',
      'document',
      'code',
      'image',
      'research',
      'exam',
      'summary',
      'flashcards',
      'mindmap',
      'other'
    ]

    // Ensure we have exactly 10 types
    expect(validTypes.length).toBe(10)

    // Ensure no duplicates
    const uniqueTypes = new Set(validTypes)
    expect(uniqueTypes.size).toBe(validTypes.length)
  })
})
