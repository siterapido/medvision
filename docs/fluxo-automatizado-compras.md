# Fluxo Automatizado de Compras - Integração Cakto + Supabase

## Visão Geral

Este documento descreve o fluxo completo de compras implementado que automatiza a criação de contas, ativação de planos e envio de e-mails de boas-vindas quando um produto é adquirido via Cakto.

## Arquitetura

```
[Cakto Checkout]
    ↓ (Webhook purchase_approved)
[Supabase Edge Function: cakto]
    ↓
[1. Log de Transação]
    ↓
[2. Busca/Criação de Usuário]
    ↓
[3. Ativação de Plano Premium]
    ↓
[4. Registro de Pagamento]
    ↓
[5. Envio de E-mail de Boas-vindas]
```

## Componentes

### 1. Edge Function: `/supabase/functions/cakto/index.ts`

**Localização**: `supabase/functions/cakto/index.ts`

**Responsabilidades**:
- Receber webhooks do Cakto
- Validar assinaturas HMAC
- Processar eventos de compra, reembolso e cancelamento
- Criar usuários automaticamente
- Ativar planos premium
- Enviar e-mails de boas-vindas
- Registrar logs de auditoria

### 2. Tabelas do Banco de Dados

#### `profiles`
Armazena informações dos usuários e seus planos:
- `id` (uuid): ID do usuário (referência a auth.users)
- `email` (text): E-mail do usuário
- `name` (text): Nome completo
- `phone` (text): Telefone
- `cpf` (text): CPF
- `plan_type` (text): Tipo de plano (free, premium)
- `subscription_status` (text): Status da assinatura (active, canceled, refunded)
- `expires_at` (timestamptz): Data de expiração do plano
- `last_payment_date` (timestamptz): Data do último pagamento
- `payment_method` (text): Método de pagamento usado
- `account_source` (text): Origem da conta (manual, cakto)

#### `payment_history`
Registra histórico de pagamentos:
- `id` (uuid): ID único do registro
- `user_id` (uuid): ID do usuário
- `transaction_id` (text): ID da transação (único)
- `amount` (numeric): Valor pago
- `currency` (text): Moeda (BRL)
- `status` (text): Status do pagamento
- `payment_method` (text): Método de pagamento
- `webhook_data` (jsonb): Dados completos do webhook
- `created_at` (timestamptz): Data de criação

#### `transaction_logs`
Logs de auditoria detalhados:
- `id` (uuid): ID único do log
- `transaction_id` (text): ID da transação
- `event_type` (text): Tipo de evento
- `user_id` (uuid): ID do usuário (nullable)
- `customer_email` (text): E-mail do cliente
- `customer_name` (text): Nome do cliente
- `customer_cpf` (text): CPF do cliente
- `amount` (numeric): Valor
- `status` (text): Status do processamento
- `error_message` (text): Mensagem de erro (se houver)
- `webhook_payload` (jsonb): Payload completo do webhook
- `created_at` (timestamptz): Data/hora do log

## Fluxo Detalhado

### Evento: purchase_approved

1. **Recepção do Webhook**
   - Cakto envia webhook com dados da compra
   - Edge Function valida assinatura HMAC
   - Extrai dados do cliente: email, nome, telefone, CPF

2. **Log Inicial**
   ```typescript
   await logTransaction({
     transactionId,
     eventType: 'purchase_approved',
     customerEmail,
     customerName,
     amount,
     status: 'processing'
   });
   ```

3. **Busca/Criação de Usuário**
   - Busca usuário existente por e-mail
   - Se não existir E não for e-mail de teste:
     - Cria usuário no Supabase Auth com senha segura aleatória
     - Cria perfil na tabela `profiles`
     - Gera link mágico para primeiro acesso
     - Registra log de criação de usuário

4. **Ativação do Plano Premium**
   - Atualiza perfil com:
     - `plan_type`: 'premium'
     - `subscription_status`: 'active'
     - `expires_at`: +1 ano
     - `last_payment_date`: data atual
     - `payment_method`: método usado
     - `account_source`: 'cakto'

5. **Registro de Pagamento**
   - Insere registro na tabela `payment_history`
   - Armazena dados completos do webhook

6. **Envio de E-mail de Boas-vindas**
   - Envia e-mail via Resend API
   - E-mail inclui:
     - Instruções de primeiro acesso
     - Lista de benefícios do plano premium
     - Link para a plataforma
   - Registra sucesso/falha no log

### Outros Eventos

#### refund
- Busca usuário por e-mail
- Reverte plano para 'free'
- Define status como 'refunded'
- Remove data de expiração
- Registra no histórico de pagamentos

#### subscription_cancelled
- Busca usuário por e-mail
- Reverte plano para 'free'
- Define status como 'canceled'
- Remove data de expiração
- Registra no histórico de pagamentos

## Segurança

### Validação de Webhook
```typescript
// 1. Valida assinatura HMAC SHA-256
const expected = await computeHmac(rawBody);
const valid = safeCompareHex(expected, signatureHeader);

// 2. Fallback: valida secret no payload
if (!valid && payload?.secret === CAKTO_WEBHOOK_SECRET) {
  valid = true;
}
```

### Geração de Senha
- Senha aleatória de 16 caracteres
- Inclui letras maiúsculas, minúsculas, números e símbolos
- Gerada com `crypto.getRandomValues()`
- Nunca é armazenada ou enviada por e-mail
- Usuário define nova senha via link mágico

### Proteção de Dados
- Senhas não são enviadas por e-mail
- Dados sensíveis armazenados com RLS ativado
- Logs de transação acessíveis apenas para admins
- Histórico de pagamento acessível apenas pelo próprio usuário

## Variáveis de Ambiente

Necessárias na Edge Function:

```bash
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
CAKTO_WEBHOOK_SECRET=seu-webhook-secret
CAKTO_PRODUCT_ID=3263gsd_647430
RESEND_API_KEY=sua-chave-resend
APP_URL=https://odontogpt.com
```

## E-mail de Boas-vindas

### Para Novos Usuários
**Assunto**: "Bem-vindo ao OdontoGPT - Sua conta premium foi ativada!"

**Conteúdo**:
- Mensagem de boas-vindas
- Instruções de primeiro acesso:
  1. Acessar o site
  2. Clicar em "Entrar"
  3. Usar "Esqueci minha senha"
  4. Criar nova senha
- Lista de benefícios premium
- Link para acesso

### Para Usuários Existentes
**Assunto**: "Sua assinatura premium foi ativada!"

**Conteúdo**:
- Confirmação de ativação
- Lista de benefícios premium
- Link para acesso

## Auditoria e Logs

Todos os eventos são registrados na tabela `transaction_logs`:

- `purchase_approved`: Início do processamento
- `user_created`: Usuário criado com sucesso
- `user_creation_failed`: Falha na criação do usuário
- `welcome_email_sent`: E-mail enviado com sucesso
- `welcome_email_failed`: Falha no envio do e-mail

### Consultando Logs

```sql
-- Ver todos os logs de uma transação
SELECT * FROM transaction_logs
WHERE transaction_id = 'transaction_id_aqui'
ORDER BY created_at;

-- Ver logs de criação de usuários
SELECT * FROM transaction_logs
WHERE event_type = 'user_created'
ORDER BY created_at DESC;

-- Ver falhas de processamento
SELECT * FROM transaction_logs
WHERE status = 'error'
ORDER BY created_at DESC;
```

## Tratamento de Erros

### Usuário Não Pode Ser Criado
- Erro é registrado em `transaction_logs`
- Webhook retorna erro 500
- Cakto tentará reenviar automaticamente

### E-mail Não Pode Ser Enviado
- Erro é registrado em `transaction_logs`
- Usuário e plano são criados normalmente
- Não bloqueia o fluxo principal

### Dados Incompletos no Webhook
- Validação de campos obrigatórios (email)
- Campos opcionais (nome, telefone, CPF) usam valores vazios
- Webhook retorna erro 400 se faltar campo obrigatório

## Testes

### Ambiente de Teste
E-mails contendo as seguintes palavras são considerados testes:
- test
- example.com
- demo
- fake

Para estes e-mails:
- Não cria usuário automaticamente
- Processa normalmente se usuário já existir
- Marca transação como `testMode: true`

### Testando o Fluxo Completo

1. **Criar transação de teste via Cakto**
2. **Verificar logs**:
   ```sql
   SELECT * FROM transaction_logs
   WHERE customer_email = 'email@teste.com'
   ORDER BY created_at;
   ```
3. **Verificar usuário criado**:
   ```sql
   SELECT * FROM profiles
   WHERE email = 'email@teste.com';
   ```
4. **Verificar pagamento registrado**:
   ```sql
   SELECT * FROM payment_history
   WHERE user_id = 'user_id_aqui';
   ```

## Deploy

```bash
# Deploy da Edge Function
npx supabase functions deploy cakto

# Aplicar migrations
npx supabase db push

# Gerar types TypeScript
npx supabase gen types typescript --local > types/database.types.ts
```

## Monitoramento

### Dashboard Supabase
- Edge Function Logs: `Dashboard > Edge Functions > cakto > Logs`
- Database Logs: `Dashboard > Database > Logs`

### Métricas Importantes
- Taxa de sucesso na criação de usuários
- Taxa de envio de e-mails
- Tempo médio de processamento
- Erros e falhas

### Alertas Recomendados
- Falhas consecutivas na criação de usuários
- Falhas no envio de e-mails
- Tempo de processamento acima do normal
- Webhooks com assinatura inválida

## Manutenção

### Limpeza de Logs Antigos
```sql
-- Manter apenas últimos 90 dias
DELETE FROM transaction_logs
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Análise de Performance
```sql
-- Tempo médio por tipo de evento
SELECT
  event_type,
  COUNT(*) as total,
  AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (PARTITION BY transaction_id ORDER BY created_at)))) as avg_seconds
FROM transaction_logs
GROUP BY event_type;
```

## Conformidade LGPD

- ✅ Dados sensíveis armazenados com segurança
- ✅ Acesso restrito via RLS
- ✅ Logs de auditoria completos
- ✅ Possibilidade de exclusão de dados
- ✅ Consentimento explícito no checkout
- ✅ Transparência no uso dos dados

## Próximos Passos

1. Implementar notificações de expiração do plano
2. Adicionar renovação automática de assinatura
3. Implementar dashboard de métricas
4. Adicionar testes automatizados
5. Implementar retry automático para e-mails falhados
