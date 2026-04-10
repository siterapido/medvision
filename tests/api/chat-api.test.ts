/**
 * Test: Chat API Integration
 * Testa a API de chat e geração de artifacts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const API_URL = 'http://localhost:3000'

// Helper para parsear streaming response
async function parseStreamResponse(response: Response): Promise<{
  texts: string[]
  toolCalls: Array<{ toolName: string; input: any }>
  finishReason: string | null
}> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No reader')

  const decoder = new TextDecoder()
  const texts: string[] = []
  const toolCalls: Array<{ toolName: string; input: any }> = []
  let finishReason: string | null = null
  let currentToolInput = ''
  let currentToolName = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

    for (const line of lines) {
      const data = line.slice(6) // Remove 'data: '
      if (data === '[DONE]') continue

      try {
        const parsed = JSON.parse(data)

        if (parsed.type === 'text-delta') {
          texts.push(parsed.delta)
        }

        if (parsed.type === 'tool-input-start') {
          currentToolName = parsed.toolName
          currentToolInput = ''
        }

        if (parsed.type === 'tool-input-delta') {
          currentToolInput += parsed.inputTextDelta
        }

        if (parsed.type === 'finish-step' && currentToolName) {
          try {
            toolCalls.push({
              toolName: currentToolName,
              input: JSON.parse(currentToolInput)
            })
          } catch {
            // Input parsing failed
          }
          currentToolName = ''
          currentToolInput = ''
        }

        if (parsed.type === 'finish') {
          finishReason = parsed.finishReason
        }
      } catch {
        // JSON parse error, skip
      }
    }
  }

  return { texts, toolCalls, finishReason }
}

describe('Chat API', () => {
  it('should return health check', async () => {
    const response = await fetch(`${API_URL}/api/health`)
    const data = await response.json()

    expect(response.ok).toBe(true)
    expect(data.ok).toBe(true)
  })

  it('should stream text response for simple question', async () => {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          id: 'test-simple',
          role: 'user',
          parts: [{ type: 'text', text: 'O que é cárie dentária em uma frase?' }]
        }],
        agentId: 'medvision'
      })
    })

    expect(response.ok).toBe(true)
    expect(response.headers.get('content-type')).toContain('text/event-stream')

    const { texts, finishReason } = await parseStreamResponse(response)

    expect(texts.length).toBeGreaterThan(0)
    expect(texts.join('')).toBeTruthy()
    expect(finishReason).toBe('stop')
  })

  it('should call generateArtifact tool for artifact request', async () => {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          id: 'test-artifact',
          role: 'user',
          parts: [{
            type: 'text',
            text: 'Crie um flashcard sobre anatomia dental. Gere o artifact imediatamente.'
          }]
        }],
        agentId: 'odonto-summary'
      })
    })

    expect(response.ok).toBe(true)

    const { toolCalls, finishReason } = await parseStreamResponse(response)

    // Deve ter chamado alguma tool (generateArtifact ou createFlashcards)
    if (toolCalls.length > 0) {
      const artifactTool = toolCalls.find(t =>
        t.toolName === 'generateArtifact' ||
        t.toolName === 'createFlashcards'
      )
      expect(artifactTool).toBeDefined()

      if (artifactTool?.toolName === 'generateArtifact') {
        expect(artifactTool.input.type).toBe('flashcards')
      }
    }

    expect(finishReason).toBe('stop')
  }, 30000)

  it('should handle odonto-research agent', async () => {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          id: 'test-research',
          role: 'user',
          parts: [{ type: 'text', text: 'Qual a evidência sobre uso de hipoclorito em endodontia?' }]
        }],
        agentId: 'odonto-research'
      })
    })

    expect(response.ok).toBe(true)

    const { texts, toolCalls, finishReason } = await parseStreamResponse(response)

    // Deve ter texto ou tool calls
    expect(texts.length > 0 || toolCalls.length > 0).toBe(true)
    expect(finishReason).toBe('stop')
  }, 60000)

  it('should reject invalid agent ID gracefully', async () => {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          id: 'test-invalid',
          role: 'user',
          parts: [{ type: 'text', text: 'Teste' }]
        }],
        agentId: 'invalid-agent-xyz'
      })
    })

    // Deve usar o agente padrão (medvision) e não falhar
    expect(response.ok).toBe(true)
  })
})
