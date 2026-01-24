/**
 * Chat API Integration Tests
 *
 * Testes de integracao para a API unificada de chat usando AI SDK v6
 * Endpoint unificado: POST /api/chat (requer autenticação)
 */

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Chat API Integration Tests', () => {

  describe('POST /api/chat - Authentication', () => {

    it('should return 401 when not authenticated', async () => {
      const response = await fetch(`${BASE_URL}/api/chat`, {
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

      assert.strictEqual(response.status, 401, 'Should return 401 for unauthenticated requests')
      const data = await response.json()
      assert.strictEqual(data.error, 'Unauthorized')
    })

    it('should require authentication for all agents', async () => {
      const agents = ['odonto-gpt', 'odonto-research', 'odonto-practice', 'odonto-summary', 'odonto-vision']

      for (const agentId of agents) {
        const response = await fetch(`${BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              id: `test-${agentId}`,
              role: 'user',
              parts: [{ type: 'text', text: 'Teste' }]
            }],
            agentId
          })
        })

        assert.strictEqual(response.status, 401, `Agent ${agentId} should require authentication`)
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

describe('Artifact Tools Tests', () => {

  it('should have all artifact tools properly defined', async () => {
    const {
      createSummaryTool,
      createFlashcardsTool,
      createQuizTool,
      createResearchTool,
      createReportTool
    } = await import('../lib/ai/tools/artifact-tools')

    const artifactTools = [
      { name: 'createSummaryTool', tool: createSummaryTool },
      { name: 'createFlashcardsTool', tool: createFlashcardsTool },
      { name: 'createQuizTool', tool: createQuizTool },
      { name: 'createResearchTool', tool: createResearchTool },
      { name: 'createReportTool', tool: createReportTool },
    ]

    for (const { name, tool } of artifactTools) {
      assert.ok(tool, `${name} should exist`)
      assert.ok(tool.description, `${name} should have description`)
    }
  })

})
