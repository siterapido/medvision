**Visão Geral**
- Objetivo: receber webhooks da KiWiFi para criar/atualizar logins e acompanhar ciclo de vida de assinaturas (criação, renovação, cancelamento, inadimplência).
- Arquitetura: KiWiFi → endpoint HTTP do app (`/api/kiwifi/webhook`) → validação/segurança → processamento → persistência no Supabase → logs/observabilidade.

**Pré‑requisitos**
- URL pública acessível por HTTPS (em desenvolvimento, use `ngrok`/`cloudflared` para tunelar `npm run dev`).
- Chave de assinatura do webhook da KiWiFi (confirme no painel: normalmente algo como um “webhook secret”).
- Variáveis em `.env.local`:
  - `KIWIFI_WEBHOOK_SECRET="..."` (segredo para verificação de assinatura).
  - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (já exigidas pelo projeto).
- Supabase configurado conforme `SUPABASE_SETUP.md` (tabelas `profiles`/`subscriptions` ou equivalentes). Ajuste os mapeamentos abaixo para o seu schema real.

**Eventos Suportados (confirme no painel KiWiFi)**
- Os nomes exatos dos eventos e o formato do payload podem variar. Abaixo, um conjunto típico para billing/ISP:
  - `customer.created` / `customer.updated`: criação/atualização do assinante (nome, email, documento, endereço).
  - `subscription.created` / `subscription.updated` / `subscription.canceled`: status da assinatura (ativa, suspensa, cancelada), datas e plano.
  - `invoice.paid` / `invoice.payment_failed`: faturas pagas e falhas de pagamento.
- Caso os nomes sejam diferentes na KiWiFi, mantenha a mesma lógica de roteamento e ajuste o switch de eventos.

**Segurança**
- Assinatura HMAC: preferencial para garantir integridade. A KiWiFi costuma enviar um header com a assinatura (ex.: `X-Kiwifi-Signature`).
  - Estratégia: compute `HMAC-SHA256` do corpo bruto (`rawBody`) com `KIWIFI_WEBHOOK_SECRET` e compare com o header.
- Alternativas/defesas adicionais:
  - Allowlist de IPs da KiWiFi (se disponível) em nível de proxy/WAF.
  - Idempotência via `event.id` para ignorar reentregas.
  - Timeout de 5–10s e resposta 2xx somente após persistir com sucesso.

**Rota Next.js (App Router)**
- Crie a rota em `app/api/kiwifi/webhook/route.ts` e leia o corpo como texto para verificar assinatura.
- Exemplo (ajuste nomes de campos conforme o payload real da KiWiFi):

```ts
// app/api/kiwifi/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

function verifySignature(rawBody: string, secret: string, signature: string | null) {
  if (!signature) return false
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(rawBody, 'utf8')
  const expected = hmac.digest('hex')
  // compare timing-safe
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.KIWIFI_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 })

  const rawBody = await req.text()
  const signature = req.headers.get('x-kiwifi-signature') // confirme o nome exato do header

  if (!verifySignature(rawBody, secret, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Idempotência: se a KiWiFi enviar um event.id, use-o
  const eventId = event?.id

  // Supabase (use service role se necessário para writes server-side)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    switch (event?.type) {
      case 'customer.created':
      case 'customer.updated': {
        const customer = event.data
        // Exemplo de mapeamento: ajuste para o seu schema
        const profile = {
          id: customer.id, // se houver ID estável na KiWiFi; caso contrário, gere um UUID local
          email: customer.email,
          full_name: customer.name,
          document: customer.document,
          phone: customer.phone,
          address: customer.address?.line1,
          city: customer.address?.city,
          state: customer.address?.state,
          zip: customer.address?.zip,
          updated_at: new Date().toISOString(),
        }
        const { error } = await supabase
          .from('profiles')
          .upsert(profile, { onConflict: 'id' })
        if (error) throw error
        break
      }

      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.canceled': {
        const sub = event.data
        const status = sub.status // ex.: active, suspended, canceled
        const record = {
          id: sub.id,
          customer_id: sub.customer_id,
          plan_id: sub.plan_id,
          status,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          canceled_at: sub.canceled_at ?? null,
          updated_at: new Date().toISOString(),
        }
        const { error } = await supabase
          .from('subscriptions')
          .upsert(record, { onConflict: 'id' })
        if (error) throw error
        break
      }

      case 'invoice.paid': {
        // opcional: registrar pagamento/recibos
        break
      }
      case 'invoice.payment_failed': {
        // opcional: marcar tentativa falha e acionar comunicação
        break
      }
      default: {
        // Desconhecido → apenas logar
        break
      }
    }

    return NextResponse.json({ received: true, id: eventId }, { status: 200 })
  } catch (e: any) {
    // Retorne 500 para permitir reentrega do webhook
    return NextResponse.json({ error: e?.message || 'Unhandled error' }, { status: 500 })
  }
}
```

Notas importantes:
- Se a KiWiFi exigir outro algoritmo/encoding de assinatura, ajuste `verifySignature`.
- Para writes seguros no Supabase no contexto de API routes, prefira uma Service Role Key via variável de ambiente não exposta ao cliente. Se usar, renomeie a env para `SUPABASE_SERVICE_ROLE_KEY` e instancie o client com ela somente no servidor.

**Mapeamento de Login (Autenticação)**
- Caso o login do hotspot/PPPoe/RADIUS dependa de credenciais da KiWiFi:
  - Guarde no `profiles` campos de integração (`kiwifi_customer_id`, `kiwifi_username`).
  - Gere contas locais de acesso (se preciso) ao receber `customer.created`.
  - Se o login web do app deve espelhar a base KiWiFi, sincronize email e status da assinatura. Usuários com assinatura ativa recebem acesso ao dashboard; suspensos/cancelados exibem aviso/CTA para regularização.

**Estados de Assinatura (recomendado)**
- `active`: acesso liberado ao app e recursos.
- `past_due`/`payment_failed`: acesso limitado; exibir aviso e link de pagamento.
- `suspended`/`paused`: bloquear funcionalidades principais; manter suporte/contato.
- `canceled`: revogar acesso após data efetiva.

**Configuração no Painel KiWiFi**
- Informe a URL do endpoint: `https://SEU-DOMINIO.com/api/kiwifi/webhook`.
- Selecione os eventos desejados (clientes, assinaturas, faturas).
- Copie o segredo do webhook e preencha `KIWIFI_WEBHOOK_SECRET` em `.env.local`.
- Habilite reentrega automática em caso de falhas (se disponível).

**Testes Locais**
- Tunelamento: `ngrok http 3000` e use a URL gerada no painel KiWiFi.
- Simulação com cURL (substitua assinatura, header e payload):

```bash
curl -X POST \
  https://SEU-DOMINIO.com/api/kiwifi/webhook \
  -H 'Content-Type: application/json' \
  -H 'X-Kiwifi-Signature: <assinatura-hmac-hex>' \
  -d '{
    "id": "evt_123",
    "type": "subscription.updated",
    "data": {
      "id": "sub_123",
      "customer_id": "cust_123",
      "plan_id": "plan_10m",
      "status": "active",
      "current_period_start": "2025-01-01T00:00:00Z",
      "current_period_end": "2025-02-01T00:00:00Z"
    }
  }'
```

Para gerar a assinatura localmente em Node:

```js
const crypto = require('crypto')
const secret = process.env.KIWIFI_WEBHOOK_SECRET
const rawBody = '{"id":"evt_123","type":"subscription.updated","data":{}}' // use o JSON exato
const sig = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
console.log(sig)
```

**Observabilidade**
- Logar `event.id`, `type`, status do processamento e erros.
- Se possível, persistir um histórico mínimo em tabela `webhook_events` (idempotência e auditoria).

**Checklist de Implantação**
- `.env.local` com `KIWIFI_WEBHOOK_SECRET` preenchido.
- Rota ativa em produção: `/api/kiwifi/webhook`.
- Mapeamentos testados com payloads reais da KiWiFi.
- Permissões de escrita no Supabase revisadas (RLS/Policies) para a API route.
- Painel KiWiFi configurado com URL/segredo corretos e eventos habilitados.

**Próximos Passos**
- Confirmar nomes de headers/eventos com a documentação oficial KiWiFi.
- Ajustar mapeamentos de campos ao schema real (`profiles`, `subscriptions`).
- Opcional: implementar fila (ex.: retriable) caso a lógica de negócio cresça.
