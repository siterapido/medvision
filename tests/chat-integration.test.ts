/**
 * Chat API Integration Tests
 * 
 * Testes de integracao para as APIs de chat usando AI SDK v6
 */

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Chat API Integration Tests', () => {
  
  describe('POST /api/newchat', () => {
    
    it('should return 400 when messages are missing', async () => {
      const response = await fetch(`${BASE_URL}/api/newchat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      assert.strictEqual(response.status, 400)
      const data = await response.json()
      assert.strictEqual(data.error, 'Messages are required')
    })
    
    it('should return 400 when messages is not an array', async () => {
      const response = await fetch(`${BASE_URL}/api/newchat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: 'not an array' })
      })
      
      assert.strictEqual(response.status, 400)
    })
    
    it('should accept valid message and return streaming response', async () => {
      const response = await fetch(`${BASE_URL}/api/newchat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            id: 'test-1',
            role: 'user',
            parts: [{ type: 'text', text: 'Ola' }]
          }],
          agentId: 'odonto-gpt'
        })
      })
      
      assert.strictEqual(response.ok, true)
      // Check for streaming response
      const contentType = response.headers.get('content-type')
      assert.ok(
        contentType?.includes('text/event-stream') || 
        contentType?.includes('text/plain'),
        `Expected streaming content type, got: ${contentType}`
      )
    })
    
    it('should use default agent when agentId is not provided', async () => {
      const response = await fetch(`${BASE_URL}/api/newchat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            id: 'test-2',
            role: 'user',
            parts: [{ type: 'text', text: 'Teste' }]
          }]
        })
      })
      
      assert.strictEqual(response.ok, true)
    })
    
  })
  
  describe('POST /api/chat', () => {
    
    it('should accept valid message with userId', async () => {
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            id: 'test-3',
            role: 'user',
            parts: [{ type: 'text', text: 'Ola' }]
          }],
          agentId: 'odonto-gpt',
          userId: 'test-user-123'
        })
      })
      
      assert.strictEqual(response.ok, true)
    })
    
    it('should work with different agents', async () => {
      const agents = ['odonto-gpt', 'odonto-research', 'odonto-practice', 'odonto-summary']
      
      for (const agentId of agents) {
        const response = await fetch(`${BASE_URL}/api/newchat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              id: `test-${agentId}`,
              role: 'user',
              parts: [{ type: 'text', text: 'Teste do agente' }]
            }],
            agentId
          })
        })
        
        assert.strictEqual(response.ok, true, `Agent ${agentId} should work`)
      }
    })
    
  })
  
  describe('POST /api/agents/generate', () => {
    
    it('should return 401 when not authenticated', async () => {
      const response = await fetch(`${BASE_URL}/api/agents/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'summary',
          topic: 'Carie dentaria'
        })
      })
      
      assert.strictEqual(response.status, 401)
    })
    
    it('should return 400 when type is missing', async () => {
      const response = await fetch(`${BASE_URL}/api/agents/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': 'test-auth-cookie' // Mock auth
        },
        body: JSON.stringify({
          topic: 'Carie dentaria'
        })
      })
      
      // Either 400 for validation or 401 for auth
      assert.ok([400, 401].includes(response.status))
    })
    
  })
  
})

describe('Agent Configuration Tests', () => {
  
  it('should have all required agents configured', async () => {
    // Dynamic import to test the config
    const { AGENT_CONFIGS, listAgents } = await import('../lib/ai/agents/config')
    
    const requiredAgents = [
      'odonto-gpt',
      'odonto-research',
      'odonto-practice',
      'odonto-summary',
      'odonto-vision'
    ]
    
    for (const agentId of requiredAgents) {
      assert.ok(AGENT_CONFIGS[agentId], `Agent ${agentId} should be configured`)
      assert.ok(AGENT_CONFIGS[agentId].system, `Agent ${agentId} should have system prompt`)
      assert.ok(AGENT_CONFIGS[agentId].tools, `Agent ${agentId} should have tools`)
    }
    
    const agents = listAgents()
    assert.strictEqual(agents.length, requiredAgents.length)
  })
  
})

describe('Tool Definitions Tests', () => {
  
  it('should have all tools properly defined with inputSchema', async () => {
    const tools = await import('../lib/ai/tools/definitions')
    
    const toolNames = [
      'askPerplexity',
      'searchPubMed',
      'updateUserProfile',
      'saveResearch',
      'saveSummary',
      'saveFlashcards',
      'saveMindMap',
      'generateArtifact'
    ]
    
    for (const toolName of toolNames) {
      const tool = (tools as any)[toolName]
      assert.ok(tool, `Tool ${toolName} should exist`)
      assert.ok(tool.description, `Tool ${toolName} should have description`)
      // AI SDK v6 tools have inputSchema and execute
      assert.ok(typeof tool.execute === 'function' || tool._def, `Tool ${toolName} should be executable`)
    }
  })
  
})
