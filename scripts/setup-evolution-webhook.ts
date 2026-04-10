/**
 * Script para configurar o webhook da Evolution API
 *
 * Uso:
 *   npx tsx scripts/setup-evolution-webhook.ts
 *   npx tsx scripts/setup-evolution-webhook.ts --status
 *
 * Variáveis de ambiente necessárias:
 *   EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE, APP_URL
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-production-027f.up.railway.app'
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'sixsaude2026'
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'sixsaude-test'
const APP_URL = process.env.APP_URL || 'http://localhost:3000'

const WEBHOOK_URL = `${APP_URL}/api/webhooks/evolution`

async function fetchEvolution(path: string, options: RequestInit = {}) {
  const url = `${EVOLUTION_API_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
      ...options.headers,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('Error:', data)
    process.exit(1)
  }

  return data
}

async function getStatus() {
  console.log('📊 Verificando status...\n')

  // Instâncias
  const instances = await fetchEvolution('/instance/fetchInstances')
  console.log('🔌 Instâncias:')
  for (const inst of instances) {
    const status = inst.connectionStatus === 'open' ? '🟢' : '🔴'
    console.log(`  ${status} ${inst.name} — ${inst.connectionStatus}`)
  }

  // Webhook atual
  console.log('\n📡 Webhook atual:')
  const webhook = await fetchEvolution(`/webhook/find/${EVOLUTION_INSTANCE}`)
  console.log(`  URL: ${webhook.url}`)
  console.log(`  Enabled: ${webhook.enabled}`)
  console.log(`  Events: ${webhook.events?.join(', ')}`)
}

async function setupWebhook() {
  console.log(`🔧 Configurando webhook para ${WEBHOOK_URL}...\n`)

  const result = await fetchEvolution(`/webhook/set/${EVOLUTION_INSTANCE}`, {
    method: 'POST',
    body: JSON.stringify({
      webhook: {
        url: WEBHOOK_URL,
        enabled: true,
        webhookByEvents: false,
        webhookBase64: false,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
      },
    }),
  })

  console.log('✅ Webhook configurado com sucesso!')
  console.log(`  URL: ${result.url}`)
  console.log(`  Events: ${result.events?.join(', ')}`)
}

const args = process.argv.slice(2)

if (args.includes('--status')) {
  getStatus().catch(console.error)
} else {
  setupWebhook().catch(console.error)
}
