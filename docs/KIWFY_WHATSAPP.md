# Integração Kiwfy → Supabase → WhatsApp (Z-API)

Este guia detalha como funciona e como testar o fluxo automático que cria/atualiza usuários após uma compra na Kiwfy e envia o link de acesso via WhatsApp usando a Z-API.

## Visão Geral do Fluxo

1. A Kiwfy dispara um webhook `POST https://seu-dominio.com/api/kiwfy/webhook` quando o pagamento muda de status.
2. A API valida a assinatura HMAC (`x-kiwfy-signature` + `KIWFY_WEBHOOK_SECRET`).
3. Se o status estiver em `paid`, `approved` ou `active`, o backend:
   - Cria o usuário no Supabase (ou reaproveita o existente) com `role = cliente`;
   - Atualiza os campos `kiwfy_*` e `whatsapp_*` da tabela `profiles`;
   - Registra um log em `kiwfy_webhook_events`;
   - Gera um magic link (`APP_URL/login`) e envia a URL pelo WhatsApp (Z-API).

## Passo a Passo de Configuração

### 1. Banco de Dados / Supabase

1. Rode todas as migrations existentes, incluindo `supabase/migrations/008_kiwfy_webhook_and_whatsapp.sql`.
2. Confirme que a tabela `public.profiles` possui as colunas `kiwfy_purchase_id`, `kiwfy_plan`, `kiwfy_status`, `whatsapp_phone`, `whatsapp_opt_in`, `whatsapp_last_message_at`.
3. A tabela `public.kiwfy_webhook_events` deve existir e estar vazia antes do primeiro teste.

### 2. Variáveis de Ambiente (.env.local)

```env
SUPABASE_SERVICE_ROLE_KEY=...
APP_URL=https://app.odonto-gpt.com
KIWFY_WEBHOOK_SECRET=segredo-definido-na-kiwfy
KIWFY_SIGNATURE_HEADER=x-kiwfy-signature
KIWFY_PROVISION_STATUSES=paid,approved,active
WHATSAPP_DEFAULT_COUNTRY_CODE=55
ZAPI_BASE_URL=https://api.z-api.io
ZAPI_INSTANCE_ID=instances-xxxx
ZAPI_TOKEN=token-gerado-no-painel
ZAPI_SENDER_NAME=Odonto GPT Concierge
```

> **Importante:** nunca exponha `SUPABASE_SERVICE_ROLE_KEY`, `KIWFY_WEBHOOK_SECRET` ou o token da Z-API no frontend.

### 3. Painel da Kiwfy

1. Em **Integrações > Webhooks**, crie um webhook para o evento "Compra confirmada" (ou equivalente) e direcione para `https://seu-dominio.com/api/kiwfy/webhook`.
2. Defina o mesmo segredo salvo como `KIWFY_WEBHOOK_SECRET`.
3. Confirme se o cabeçalho enviado pela Kiwfy é `x-kiwfy-signature` (HMAC SHA-256). Se utilizarem outro header, ajuste `KIWFY_SIGNATURE_HEADER`.
4. Certifique-se de incluir no payload: `purchase_id`, `status`, dados do plano e ao menos `customer.email` + `customer.phone`.

### 4. Endpoint Next.js (App Router)

- Implementado em `app/api/kiwfy/webhook/route.ts`.
- A validação do payload usa Zod (`lib/kiwfy/webhook.ts`), evitando que formatos inesperados quebrem o fluxo.
- Eventos duplicados (`purchase_id + status`) são ignorados para manter idempotência.
- Todos os resultados (sucesso/falha) são persistidos em `kiwfy_webhook_events` para auditoria.

### 5. Z-API (WhatsApp)

1. Crie/seleciona uma instância no painel da Z-API e copie `instance_id` e `token`.
2. A instância precisa estar conectada a um número oficial do WhatsApp Business.
3. Opcional: configure `ZAPI_SENDER_NAME` para personalizar a assinatura no texto.
4. O número enviado deve estar sanitizado (apenas dígitos). O helper `normalizePhone` adiciona `+55` por padrão e `sendMagicLinkViaWhatsApp` converte para o formato esperado (`5511999999999`).

### 6. Teste Rápido com cURL

```bash
curl -X POST https://localhost:3000/api/kiwfy/webhook \
  -H "Content-Type: application/json" \
  -H "x-kiwfy-signature: $(echo -n '<payload>' | openssl dgst -sha256 -hmac $KIWFY_WEBHOOK_SECRET | cut -d' ' -f2)" \
  -d '{
    "event": "purchase.updated",
    "data": {
      "purchase_id": "kiwfy-123",
      "status": "paid",
      "plan": { "slug": "premium-anual", "name": "Premium Anual" },
      "customer": { "name": "Dra. Ana", "email": "ana@example.com", "phone": "(11) 98888-7777" }
    }
  }'
```

Em ambiente local, você pode pular a validação HMAC setando `KIWFY_WEBHOOK_SECRET` com um valor conhecido e gerando a assinatura com o mesmo valor.

## Payload Esperado

```json
{
  "event": "purchase.updated",
  "data": {
    "purchase_id": "kiwfy-123",
    "status": "paid",
    "plan": { "slug": "premium-anual", "name": "Premium Anual" },
    "customer": {
      "name": "Dr. João",
      "email": "joao@exemplo.com",
      "phone": "11999998888",
      "whatsapp_opt_in": true
    },
    "metadata": {
      "origin": "kiwfy-checkout"
    }
  }
}
```

## Resolução de Problemas

- **401 Assinatura inválida:** confira se o header está correto (`KIWFY_SIGNATURE_HEADER`) e se o segredo bate com `KIWFY_WEBHOOK_SECRET`.
- **500 Falha ao processar webhook:** verifique a tabela `kiwfy_webhook_events.error` para entender se faltou algum campo ou se a Z-API rejeitou o disparo.
- **WhatsApp não recebeu mensagem:** confirme se `whatsapp_opt_in` veio como `true`, se o telefone possui DDD/DDI válidos e se a Z-API está conectada.
- **Usuário não foi criado:** valide se `SUPABASE_SERVICE_ROLE_KEY` está configurada e se as migrations estão aplicadas (sem essa chave o backend não consegue chamar a Admin API).

Com esses passos o onboarding fica 100% automatizado: compra aprovada → usuário habilitado → link entregue direto no WhatsApp.
