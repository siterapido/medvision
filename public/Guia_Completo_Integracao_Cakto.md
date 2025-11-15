# Guia Completo: Integração de Pagamentos Cakto em SaaS

> **📹 Guia para YouTube**: Documento completo para implementação sem erros da integração Cakto em projetos SaaS

## 📋 Índice

1. [Introdução e Pré-requisitos](#1-introdução-e-pré-requisitos)
2. [Configuração Inicial](#2-configuração-inicial)
3. [Estrutura do Banco de Dados](#3-estrutura-do-banco-de-dados)
4. [Implementação do Servidor](#4-implementação-do-servidor)
5. [Serviço Cakto Completo](#5-serviço-cakto-completo)
6. [Configuração no Cakto](#6-configuração-no-cakto)
7. [Testes e Validação](#7-testes-e-validação)
8. [Troubleshooting](#8-troubleshooting)
9. [Checklist Final](#9-checklist-final)

---

## 1. Introdução e Pré-requisitos

### O que é a Integração Cakto?

A integração Cakto permite processar pagamentos automaticamente em seu SaaS, atualizando usuários para premium quando o pagamento é aprovado, processando reembolsos e cancelamentos de assinatura.

### Tecnologias Necessárias

- **Node.js** (v18+)
- **Express.js** (servidor backend)
- **Supabase** (banco de dados e autenticação)
- **ngrok** (para testes locais)

### Estrutura de Projeto Esperada

```
projeto/
├── supabase/
│   ├── functions/
│   │   └── cakto/         # Edge Function (Deno) que processa os webhooks do Cakto
│   └── migrations/        # Scripts SQL versionados (aplicar via MCP)
├── app/                   # Frontend Next.js (App Router)
└── docs/…                 # Documentação (este arquivo)
```

---

## 2. Configuração Inicial

### 2.1 Variáveis de Ambiente

#### Edge Function (supabase/functions/cakto)

Use o `.env` (ou defina as variáveis direto no dashboard) com:

```env
SUPABASE_URL=<sua_url_do_supabase>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key_segura>
CAKTO_WEBHOOK_SECRET=<secret_gerado_pelo_cakto>
CAKTO_PRODUCT_ID=<product_id_do_cakto>
```

#### Front-end Next.js (app/.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=<sua_url_do_supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
NEXT_PUBLIC_CAKTO_PRODUCT_ID=<mesmo_product_id>
```

### 2.2 Edge Function e Execução Local

A função de webhook vive em `supabase/functions/cakto/index.ts` e é executada pelo Supabase Runtime (Deno). O manifesto `function.toml` define o entrypoint e não há `package.json` — qualquer dependência vem de `npm:` via importação direta no Deno.

Para testar localmente:

```bash
npm install -g supabase
supabase login
supabase link --project-ref <seu_project_ref>
supabase functions serve cakto --port 54322
```

Esse comando vai expor o webhook em `http://localhost:54322/`; use o mesmo endereço no ngrok quando estiver testando espanholmente.

---

## 3. Estrutura do Banco de Dados

### 3.1 Migration: Tabela de Perfis

Arquivo `supabase/migrations/001_profiles.sql`:

```sql
-- ⚠️ IMPORTANTE: Use a estrutura existente da tabela profiles
-- Se você já tem a tabela profiles, apenas adicione os campos necessários:

-- Adicionar campos de pagamento à tabela profiles existente
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cakto_customer_id VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_type ON profiles(plan_type);
CREATE INDEX IF NOT EXISTS idx_profiles_expires_at ON profiles(expires_at);

-- Se você NÃO tem a tabela profiles, crie assim:
/*
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
    subscription_status VARCHAR(20) DEFAULT 'free',
    current_level INTEGER DEFAULT 1,
    total_points INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    cakto_customer_id VARCHAR(100),
    last_payment_date TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem ver próprio perfil" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Permissões para roles
GRANT SELECT ON profiles TO anon;
GRANT ALL PRIVILEGES ON profiles TO authenticated;
*/
```

### 3.2 Migration: Histórico de Pagamentos

Arquivo `supabase/migrations/002_payment_history.sql`:

```sql
-- Tabela de histórico de pagamentos
CREATE TABLE payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    payment_method VARCHAR(100),
    cakto_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_transaction_id ON payment_history(transaction_id);
CREATE INDEX idx_payment_history_created_at ON payment_history(created_at DESC);

-- RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuários podem ver próprio histórico" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);

-- Permissões
GRANT SELECT ON payment_history TO anon;
GRANT ALL PRIVILEGES ON payment_history TO authenticated;

### 3.3 Aplicando pelo MCP do Supabase

Após revisar os arquivos em `supabase/migrations/`, abra o painel do Supabase (Database > Migrations) e use o Migration Control Panel (MCP) para aplicar cada migration na ordem. O MCP registra o histórico e impede duplicação de scripts, além de permitir rollback se algo falhar. Como alternativa, rode `supabase db push` na CLI depois de linkar o projeto com `supabase link --project-ref <ref>`.
```

---

## 4. Edge Function Cakto no Supabase

### 4.1 Visão geral

A função `cakto` fica em `supabase/functions/cakto/index.ts` e roda dentro do runtime Deno do Supabase. Ela atende apenas requisições `POST`, lê o corpo como texto (para preservar o payload original) e passa os eventos para handlers dedicados.

```ts
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';

serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get('x-cakto-signature') || req.headers.get('x-signature');
  let payload: Record<string, unknown> | null = null;

  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    console.error('Erro no parse do webhook:', error);
    return jsonResponse({ error: 'Payload inválido' }, 400);
  }

  // Validação e roteamento seguem abaixo (handlePurchaseApproved, handleRefund, handleCancellation)
});
```

O helper `jsonResponse` padroniza as respostas JSON e garante que o Cakto receba status, headers e corpo consistentes.

### 4.2 Validação de assinatura

Além de conferir `x-cakto-signature` com `crypto.subtle`, a função calcula o HMAC usando `CAKTO_WEBHOOK_SECRET` e compara com `safeCompareHex` para evitar timing attacks. Caso o header não esteja presente, habilitamos o fallback pelo `secret` enviado dentro do corpo. Se ainda assim o segredo estiver incorreto, retornamos 400 imediatamente.

### 4.3 Eventos processados

- `purchase_approved`: atualiza `profiles` para `plan_type = premium`, `subscription_status = active`, marca a data do último pagamento e registra o `payment_method`. Também insere/atualiza o registro em `payment_history` com os dados do payload. O ID da transação é usado como `transaction_id` para evitar duplicatas.
- `refund`: reseta o plano para `free`, altera `subscription_status` para `refunded`, limpa `payment_method` e registra o evento em `payment_history` com `status = 'refunded'`.
- `subscription_cancelled`: volta o usuário para `free`, seta `subscription_status = canceled` e loga o evento com `status = 'canceled'`.

Cada handler (`handlePurchaseApproved`, `handleRefund`, `handleCancellation`) usa o mesmo padrão de retorno e loga o `transactionId` para auditoria.

### 4.4 Helpers do Supabase

Os utilitários `findUser`, `updateProfile` e `upsertPaymentHistory` vivem no mesmo arquivo e usam o client criado com `SUPABASE_SERVICE_ROLE_KEY` (sem persistência de sessão). `findUser` primeiro tenta encontrar o perfil na tabela `profiles` e, se falhar, faz fallback para o `auth.users` via `supabase.auth.admin.getUserByEmail`, garantindo que mesmo usuários recém-criados sejam reconhecidos.

`updateProfile` aplica os campos fornecidos e atualiza `updated_at`, enquanto `upsertPaymentHistory` insere ou atualiza um registro com `created_at` atual e usa `onConflict: 'transaction_id'` para prevenir duplicação de webhooks.

### 4.5 Observações de segurança

A função usa constantes (`planTypes` e `subscriptionStatuses`) para evitar strings mágicas e o utilitário `isTestEmail` para identificar envios de teste e evitar erro crítico quando o usuário ainda não existe. Como a Edge Function exige o `service_role_key`, mantenha esse valor disponível apenas nas variáveis de ambiente do Supabase ou do seu pipeline de CI/CD.

## 5. Helpers públicos e rotas de checkout

Como não há servidor Express, os helpers de checkout, status e histórico podem viver em um arquivo server-only dentro de `app/` (por exemplo `app/lib/cakto.ts`) ou em API routes com acesso ao `service_role_key`.

### 5.1 Gerar URL de checkout

Use `NEXT_PUBLIC_CAKTO_PRODUCT_ID` para construir a URL do Cakto. Este helper pode ser chamado por uma Server Action, rota API ou até mesmo por um botão tradicional que abre a URL no browser.

```ts
const CAKTO_BASE_URL = `https://pay.cakto.com.br/${process.env.NEXT_PUBLIC_CAKTO_PRODUCT_ID}`;

export function generateCheckoutUrl(userEmail: string, customData: Record<string, string> = {}) {
  const params = new URLSearchParams({
    email: userEmail,
    ...customData
  });

  return `${CAKTO_BASE_URL}?${params.toString()}`;
}
```

Adicione `plan=premium` ou outros campos opcionais conforme necessário.

### 5.2 Verificar assinatura do usuário

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function checkUserSubscription(userEmail: string) {
  const normalizedEmail = userEmail.toLowerCase();
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, plan_type, subscription_status, expires_at')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (error || !data) {
    return { success: false, message: 'Usuário não encontrado' };
  }

  return {
    success: true,
    subscription: {
      email: data.email,
      plan: data.plan_type || 'free',
      status: data.subscription_status || 'free',
      expiresAt: data.expires_at
    }
  };
}
```

Esse helper pode ser exposto como rota API `GET /api/me/subscription` ou usado dentro de Server Actions que alimentam o dashboard.

### 5.3 Histórico de pagamentos

```ts
export async function getUserPaymentHistory(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('payment_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar histórico:', error);
    return { success: false, message: 'Erro ao buscar histórico' };
  }

  return { success: true, payments: data || [] };
}
```

Como a tabela `payment_history` já possui políticas de RLS, você também pode acessar o histórico diretamente do cliente autenticado se preferir (sem usar o service_role), desde que o usuário consiga executar o `SELECT` pelo próprio `auth.uid()`.

### 5.4 Rotas Next para o Cakto (`app/api/cakto`)

- `POST /api/cakto/checkout-url` (Server Action ou fetch frontrun) gera uma URL de checkout personalizada usando o e-mail do usuário autenticado e um objeto `customData` opcional. Retorna `{ url: string }` e valida o e-mail antes de montar o `https://pay.cakto.com.br/${PRODUCT_ID}`.
- `GET /api/cakto/subscription` responde o status do plano com base no e-mail fornecido (query string `?email=`) ou no usuário logado, reutilizando os helpers de `profiles`/`auth.users` e devolvendo `{ success, user }`.
- `GET /api/cakto/payment-history` expõe os registros da tabela `payment_history` para o mesmo e-mail, com o mesmo fallback de sessão. O endpoint retorna `{ success, payments: [...] }` ou `{ success: false, message }` em casos de erro.

Essas rotas são implementadas no Next.js (`app/api/cakto/…`) para manter o front-end isolado do service-role key e facilitar Server Actions que redirecionam o usuário diretamente para o checkout ou exibem o status do plano.

## 6. Configuração no Cakto

### 6.1 Configurar Webhook no Painel

1. **Acesse o painel do Cakto**
2. **Vá em Configurações > Webhooks**
3. **Adicione novo webhook:**
   - **URL**: `https://qphofwxpmmhfplylozsh.functions.supabase.co/cakto` (a URL oficial exposta pelo Supabase; só altere se estiver usando um proxy customizado ou domínio próprio)
   - **Eventos**: Selecione todos (`purchase_approved`, `refund`, `subscription_cancelled`)
   - **Secret**: `25031965-ab73-495c-84c0-affd56d5d531` (sincronize essa chave com `CAKTO_WEBHOOK_SECRET` na Edge Function ou no `.env` da CLI)

> Ao promover o fluxo para produção, garanta que a função `cakto` esteja implantada (`npx supabase functions deploy cakto --no-verify-jwt`) e verifique os logs da função no painel do Supabase. Um erro 404 ao enviar o teste indica que o webhook ainda aponta para outra URL ou que a função não foi implantada corretamente; atualize o webhook no Cakto para o link acima e confirme a resposta 200 antes de seguir.

### 6.2 Eventos Suportados

| Evento | Descrição | Ação |
|--------|-----------|------|
| `purchase_approved` | Pagamento aprovado | Atualiza usuário para premium |
| `refund` | Reembolso processado | Cancela assinatura (volta para free) |
| `subscription_cancelled` | Assinatura cancelada | Cancela assinatura |

### 6.3 Formato dos Dados

O Cakto envia dados neste formato:

```json
{
  "data": {
    "id": "transaction-id",
    "customer": {
      "name": "Nome do Cliente",
      "email": "cliente@email.com",
      "phone": "11999999999",
      "docNumber": "12345678909"
    },
    "amount": 90,
    "status": "waiting_payment",
    "paymentMethod": "credit_card",
    "product": {
      "id": "product-id",
      "name": "Nome do Produto"
    }
  },
  "event": "purchase_approved",
  "secret": "seu-webhook-secret"
}
```

---

## 7. Testes e Validação

### 7.1 Configurar ngrok para Testes

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta local (a função roda em 54322)
ngrok http 54322

# Copiar URL HTTPS gerada (ex: https://abc123.ngrok-free.app)
```

### 7.2 Testar Webhook

1. **Iniciar função localmente:**
   ```bash
   supabase functions serve cakto --port 54322
   ```

2. **Configurar URL no Cakto:**
   - URL: `https://sua-url-ngrok.ngrok-free.app/` (ou o endpoint do Supabase Functions se estiver em produção)

3. **Enviar teste do painel Cakto**

### 7.3 Logs Esperados (Sucesso)

```
🔔 Webhook Cakto recebido: 2024-10-16T18:36:28.000Z
📦 Convertendo Buffer para string...
📋 Dados do webhook parseados: { "data": {...}, "event": "purchase_approved" }
🔐 Header não encontrado, tentando validação por secret no JSON...
✅ Assinatura validada com sucesso (método: json_secret)
💳 Processando pagamento aprovado...
🔍 Buscando usuário com email: cliente@email.com
👤 Usuário encontrado na tabela profiles: {...}
✅ Perfil atualizado para premium
✅ Histórico de pagamento salvo
✅ Webhook processado com sucesso
```

### 7.4 Resposta Esperada (200 OK)

```json
{
  "success": true,
  "event": "purchase_approved",
  "result": {
    "success": true,
    "message": "Pagamento processado com sucesso",
    "transaction_id": "87956abe-940e-4e8b-8a27-82c482920f64",
    "amount": 90,
    "test_mode": false
  }
}
```

---

## 8. Troubleshooting

### 8.1 Problemas Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `400 - Assinatura inválida` | Secret incorreto | Verificar `CAKTO_WEBHOOK_SECRET` no `.env` |
| `500 - getUserByEmail is not a function` | Método Supabase incorreto | Usar busca robusta implementada |
| `404 - Usuário não encontrado` | Email não existe no banco | Verificar se usuário está cadastrado |
| `Buffer parsing error` | Body não parseado | Implementar conversão Buffer→String |

### 8.2 Debug Avançado

Adicionar logs extras no `supabase/functions/cakto/index.ts`:

```javascript
// Log completo do webhook
console.log('🔍 DEBUG - Headers completos:', JSON.stringify(req.headers, null, 2));
console.log('🔍 DEBUG - Body completo:', JSON.stringify(webhookData, null, 2));
console.log('🔍 DEBUG - Secret esperado:', process.env.CAKTO_WEBHOOK_SECRET);
console.log('🔍 DEBUG - Secret recebido:', webhookData.secret);
```

### 8.3 Validação Manual

Testar endpoints individualmente:

```bash
# Teste de webhook (simulado)
curl -X POST http://localhost:54322/ \
  -H "Content-Type: application/json" \
  -d '{"data":{"customer":{"email":"test@test.com"},"id":"test-123","amount":90},"event":"purchase_approved","secret":"seu-secret"}'
```

---

## 9. Checklist Final

### 9.1 Antes de Ir para Produção

- [ ] **Variáveis de ambiente configuradas**
  - [ ] `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `CAKTO_WEBHOOK_SECRET` e `CAKTO_PRODUCT_ID`
  - [ ] `PORT` definida

- [ ] **Banco de dados configurado**
  - [ ] Migrations executadas
  - [ ] Tabelas `profiles` e `payment_history` criadas
  - [ ] RLS e políticas configuradas

- [ ] **Servidor funcionando**
  - [ ] Dependências instaladas (`npm install`)
  - [ ] Servidor iniciando sem erros (`npm start`)
  - [ ] Endpoint de saúde respondendo (`/api/health`)

- [ ] **Webhook configurado**
  - [ ] URL configurada no painel Cakto
  - [ ] Eventos selecionados (purchase_approved, refund, subscription_cancelled)
  - [ ] Secret configurado corretamente

- [ ] **Testes realizados**
  - [ ] Webhook de teste enviado do Cakto
  - [ ] Status 200 retornado
  - [ ] Logs mostrando processamento correto
  - [ ] Usuário atualizado para premium no banco

### 9.2 Monitoramento em Produção

- [ ] **Logs estruturados** para monitoramento
- [ ] **Alertas** para webhooks falhando
- [ ] **Backup** do banco de dados
- [ ] **Rate limiting** se necessário
- [ ] **HTTPS** obrigatório em produção

### 9.3 Segurança

- [ ] **Variáveis de ambiente** não commitadas
- [ ] **Secret do webhook** seguro e único
- [ ] **Validação de assinatura** sempre ativa
- [ ] **RLS** habilitado no Supabase
- [ ] **CORS** configurado adequadamente

---

## 🎯 Conclusão

Este guia fornece uma implementação completa e testada da integração Cakto. Seguindo todos os passos, você terá:

- ✅ **Webhook funcionando** com validação robusta
- ✅ **Processamento automático** de pagamentos
- ✅ **Atualização de usuários** para premium
- ✅ **Histórico completo** de transações
- ✅ **Tratamento de erros** adequado
- ✅ **Logs detalhados** para debugging

**🚀 A integração está pronta para produção!**

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs** do servidor
2. **Confirme as variáveis** de ambiente
3. **Teste o webhook** manualmente
4. **Valide a configuração** no Cakto

**Boa sorte com sua integração! 🎉**
