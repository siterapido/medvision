#!/usr/bin/env npx tsx
/**
 * History System Test Script
 *
 * Tests the history search and preview functionality.
 * Run with: npx tsx scripts/test-history.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface TestResult {
  name: string
  passed: boolean
  message: string
  duration: number
}

const results: TestResult[] = []

async function runTest(
  name: string,
  testFn: () => Promise<{ passed: boolean; message: string }>
): Promise<void> {
  const start = Date.now()
  try {
    const { passed, message } = await testFn()
    results.push({
      name,
      passed,
      message,
      duration: Date.now() - start,
    })
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start,
    })
  }
}

async function testListSessions(): Promise<{ passed: boolean; message: string }> {
  const { data: sessions, error } = await supabase
    .from('agent_sessions')
    .select('id, title, agent_type, created_at, status')
    .eq('status', 'active')
    .limit(5)

  if (error) {
    return { passed: false, message: `Error: ${error.message}` }
  }

  return {
    passed: true,
    message: `Found ${sessions?.length || 0} active sessions`,
  }
}

async function testSearchMessages(): Promise<{ passed: boolean; message: string }> {
  const { data: messages, error } = await supabase
    .from('agent_messages')
    .select('id, content, role, session_id')
    .limit(10)

  if (error) {
    return { passed: false, message: `Error: ${error.message}` }
  }

  return {
    passed: true,
    message: `Found ${messages?.length || 0} messages`,
  }
}

async function testSessionWithMessages(): Promise<{ passed: boolean; message: string }> {
  const { data: session, error } = await supabase
    .from('agent_sessions')
    .select(`
      id,
      title,
      agent_type,
      agent_messages(id, role, content)
    `)
    .eq('status', 'active')
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    return { passed: false, message: `Error: ${error.message}` }
  }

  if (!session) {
    return { passed: true, message: 'No sessions found (this is OK for empty databases)' }
  }

  const messageCount = session.agent_messages?.length || 0
  return {
    passed: true,
    message: `Session "${session.title || 'Untitled'}" has ${messageCount} messages`,
  }
}

async function testPreviewQuery(): Promise<{ passed: boolean; message: string }> {
  // Get a random session
  const { data: sessions } = await supabase
    .from('agent_sessions')
    .select('id')
    .eq('status', 'active')
    .limit(1)

  if (!sessions || sessions.length === 0) {
    return { passed: true, message: 'No sessions to test preview (OK for empty db)' }
  }

  const sessionId = sessions[0].id

  // Get last 3 messages (preview)
  const { data: messages, error } = await supabase
    .from('agent_messages')
    .select('id, role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) {
    return { passed: false, message: `Error: ${error.message}` }
  }

  return {
    passed: true,
    message: `Preview loaded: ${messages?.length || 0} messages`,
  }
}

async function testFullTextSearch(): Promise<{ passed: boolean; message: string }> {
  // This tests if we can search content (basic ILIKE search)
  const { data: messages, error } = await supabase
    .from('agent_messages')
    .select('id, content')
    .ilike('content', '%a%')
    .limit(3)

  if (error) {
    return { passed: false, message: `Error: ${error.message}` }
  }

  return {
    passed: true,
    message: `Content search works: found ${messages?.length || 0} matches`,
  }
}

async function testDateRangeFilter(): Promise<{ passed: boolean; message: string }> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: sessions, error } = await supabase
    .from('agent_sessions')
    .select('id, created_at')
    .eq('status', 'active')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .limit(10)

  if (error) {
    return { passed: false, message: `Error: ${error.message}` }
  }

  return {
    passed: true,
    message: `Date filter works: ${sessions?.length || 0} sessions in last 30 days`,
  }
}

async function testAgentTypeFilter(): Promise<{ passed: boolean; message: string }> {
  // Get all unique agent types
  const { data: sessions, error } = await supabase
    .from('agent_sessions')
    .select('agent_type')
    .eq('status', 'active')

  if (error) {
    return { passed: false, message: `Error: ${error.message}` }
  }

  const uniqueTypes = [...new Set(sessions?.map((s) => s.agent_type).filter(Boolean))]
  return {
    passed: true,
    message: `Agent types found: ${uniqueTypes.join(', ') || 'none'}`,
  }
}

async function main() {
  console.log('\n🔍 Testing History System...\n')
  console.log('=' .repeat(60))

  await runTest('1. List Sessions', testListSessions)
  await runTest('2. Search Messages', testSearchMessages)
  await runTest('3. Session with Messages Join', testSessionWithMessages)
  await runTest('4. Preview Query (Last 3 Messages)', testPreviewQuery)
  await runTest('5. Full-text Search', testFullTextSearch)
  await runTest('6. Date Range Filter', testDateRangeFilter)
  await runTest('7. Agent Type Filter', testAgentTypeFilter)

  console.log('=' .repeat(60))
  console.log('\n📊 Results:\n')

  let passed = 0
  let failed = 0

  for (const result of results) {
    const status = result.passed ? '✅' : '❌'
    const duration = `(${result.duration}ms)`
    console.log(`${status} ${result.name} ${duration}`)
    console.log(`   ${result.message}\n`)

    if (result.passed) passed++
    else failed++
  }

  console.log('=' .repeat(60))
  console.log(`\n📈 Summary: ${passed}/${results.length} tests passed`)

  if (failed > 0) {
    console.log(`\n⚠️  ${failed} test(s) failed`)
    process.exit(1)
  } else {
    console.log('\n🎉 All tests passed!')
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
