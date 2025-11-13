# Guia Rápido: Integração Cakto em Ambiente Local

> Plano desenhado para rodar tudo localmente via **Supabase Edge Function** (nome `cakto`), usando o produto **`3263gsd_647430`** e o secret de webhook **(fornecido)**.

## 1. Pré-requisitos

- Node.js 18+ e npm atualizados.
- Supabase já configurado conforme `SUPABASE_SETUP.md`.
- Acesso ao painel Cakto (produto e webhooks).
- ngrok (ou túnel similar) para receber webhooks no ambiente local.

## 2. Estrutura e Organização

```
root/
├── supabase/
│   ├── functions/
│   │   └── cakto/         # Edge Function (Deno) que processa os webhooks
│   └── migrations/        # scripts SQL (veja 6)
├── app/                   # Next.js (App Router)
└── docs/…                 # documentação (este arquivo)
```

> **Importante:** o webhook roda dentro da Edge Function `cakto` e, por isso, o código fica em `supabase/functions/cakto/index.ts` — não há um servidor Express separado.

## 3. Variáveis de Ambiente (local)

Arquivo `supabase/.env` (ou um `.env` usado apenas para funções) deve conter:

```env
SUPABASE_URL=<sua_url_supabase>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
CAKTO_PRODUCT_ID=3263gsd_647430
CAKTO_WEBHOOK_SECRET=<seu_secret_fornecido>
PORT=54322
```

Arquivo `.env.local` do Next.js deve conter ao menos:

```env
NEXT_PUBLIC_SUPABASE_URL=<sua_url_supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
NEXT_PUBLIC_CAKTO_PRODUCT_ID=3263gsd_647430
```

## 4. Dependências e execução da Edge Function

O código fica em `supabase/functions/cakto`. Use o Supabase CLI para gerar o esqueleto da função e rodar localmente:

```bash
supabase functions new cakto
```

O código segue a estilização Deno (`index.ts`). Você pode executar a função local com:

```bash
supabase functions serve cakto --port 54322
```

> Não há `package.json`, use apenas importações Deno e `@supabase/supabase-js` via `npm:` quando necessário.

## 5. Implementação do Webhook

1. **`supabase/functions/cakto/index.ts`**
   - Use `serve` (da std lib Deno) para tratar apenas `POST`.
   - Leia `req.text()` para manter a string original e computar o HMAC (via Web Crypto `crypto.subtle`), comparando com os headers `x-cakto-signature` / `x-signature`.
   - Caso a assinatura falhe, permita fallback pelo campo `secret` do payload.
   - Execute os três handlers principais (`purchase_approved`, `refund`, `subscription_cancelled`) já atualizando `profiles` e inserindo em `payment_history`, com logging mínimo.
   - Reveja utilitários auxiliares como `findUser`, `updateProfile` e `upsertPaymentHistory` para reutilização.
   - Opcionalmente, gere a URL de checkout via `https://pay.cakto.com.br/3263gsd_647430?email=<email>` dentro de uma API separada (a lógica pode residir neste mesmo arquivo ou numa rota Next).

## 6. Supabase ("só adicionar os planos")

Como o foco é apenas na gestão de planos, garanta que a tabela `profiles` possui os campos:

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);
```

Para histórico simples ligado aos planos:

```sql
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id TEXT UNIQUE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50),
  webhook_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

> Execute as migrations correspondentes em `supabase/migrations/` e mantenha RLS atualizado.

## 7. Configuração no Painel Cakto

1. Localize o produto já existente com URL `https://pay.cakto.com.br/3263gsd_647430` e confirme que o ID (`3263gsd_647430`) está ativo.
2. Em **Configurações → Webhooks**:
  - URL: `https://<seu-ngrok>.ngrok-free.app/` (ou domínio real onde a função `cakto` esteja disponível).
   - Eventos: habilite `purchase_approved`, `refund`, `subscription_cancelled`.
  - Secret: use o secret fornecido e mantenha-o apenas em variáveis de ambiente.
3. Salve e utilize o botão de “Enviar teste” para validar o endpoint local.

## 8. Fluxo de Checkout

- No dashboard Next.js, exponha um CTA **“Assinar Plano Premium”** que chama uma Server Action ou API route para gerar a URL via `generateCheckoutUrl`.
- Redirecione o usuário autenticado para `https://pay.cakto.com.br/3263gsd_647430?email=<email>&plan=premium`.
- Após o pagamento, o webhook atualiza o plano e o front pode consultar `/api/me/subscription` (rota interna) para refletir o novo status.

## 9. Testes Locais

1. Inicie a função localmente: `supabase functions serve cakto --port 54322`.
2. Exponha a porta com ngrok: `ngrok http 54322` e copie a URL HTTPS.
3. Atualize o webhook no painel com essa URL.
4. Envie um webhook de teste (payload padrão do Cakto). Logs esperados:

```
🔔 Webhook Cakto recebido...
✅ Assinatura validada (secret local)
💳 processPaymentApproved -> usuário atualizado para premium
```

5. Confirme no Supabase que `profiles.plan_type = 'premium'` e que existe registro em `payment_history`.

- ## 10. Checklist Rápido

- [ ] Edge Function `cakto` criada em `supabase/functions/cakto`.
- [ ] `.env` preenchido com secret/product exatos.
- [ ] Migrations de planos aplicadas e RLS revisada.
- [ ] Webhook configurado no painel Cakto (URL ngrok + secret).
- [ ] Fluxo de checkout do front apontando para o produto `3263gsd_647430`.
- [ ] Teste manual concluído (webhook de teste + atualização no banco).

Com esses passos o ambiente local replica fielmente o fluxo de assinatura Cakto, permitindo validar planos antes do deploy em produção.
