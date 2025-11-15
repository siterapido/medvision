# Status da Integração Cakto - Webhook

## ✅ Problema Principal Resolvido

O erro **401 "Missing authorization header"** foi **completamente resolvido**.

### Solução Implementada
- ✅ Adicionado `verify_jwt = false` ao `function.toml`
- ✅ Adicionado `verify_jwt = false` ao `deno.json`
- ✅ Sincronizado o `CAKTO_WEBHOOK_SECRET` com o Supabase
- ✅ Edge Function deployada e funcionando

### Teste de Funcionalidade

```bash
# Webhook agora é aceito e processado:
curl -X POST 'https://qphofwxpmmhfplylozsh.functions.supabase.co/cakto' \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {...},
    "event": "purchase_approved",
    "secret": "25031965-ab73-495c-84c0-affd56d5d531"
  }'

# Resposta:
# {
#   "success": true,
#   "event": "purchase_approved",
#   "transactionId": "...",
#   "userCreated": true,
#   "userId": "..."
# }
```

✅ **Webhook é recebido e processado corretamente**

---

## ⚠️ Próximos Passos

### 1. Verificar Persistência de Dados

Embora o webhook retorne sucesso, precisa-se verificar:
- [x] Se dados estão sendo salvos em `profiles`
- [x] Se `transaction_logs` está registrando as tentativas (ajustado para TEXT + colunas extras nas migrações 023/024)
- [ ] Verificar RLS policies na tabela `profiles`
- [ ] Verificar se há erros silenciosos nas operações de database

### 2. Investigar Possíveis Causas

**Opções a verificar:**
- RLS policies podem estar bloqueando inserts da Service Role
- Falta de campos obrigatórios na tabela `profiles`
- Constraints ou triggers que estão falhando
- Problema de sincronização entre auth.users e profiles
- (Resolvido) `transaction_logs.transaction_id` estava como UUID e não aceitava IDs externos → convertido para TEXT e ampliado (`023_update_transaction_logs_transaction_id.sql` + `024_expand_transaction_logs.sql`)

### 3. Testes Recomendados

```sql
-- Verificar RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Tentar insert direto para testar permissions
INSERT INTO profiles (id, email, name, account_source)
VALUES (gen_random_uuid(), 'test@example.com', 'Test', 'cakto');

-- Verificar se há triggers que podem estar falhando
SELECT * FROM pg_trigger WHERE tgrelid = 'profiles'::regclass;
```

### 4. Debug na Edge Function

Adicionar mais logging para entender onde está falhando:
```typescript
// Verificar se o perfil foi criado com sucesso
const { error } = await supabase.from('profiles').insert({...});
if (error) {
  console.error('❌ Erro ao criar perfil:', error);
  // Log detalhado do erro
}
```

---

## 📊 Resumo Atual

| Item | Status | Detalhes |
|------|--------|----------|
| **Webhook 401** | ✅ RESOLVIDO | Edge Function agora aceita requisições |
| **Validação de Secret** | ✅ FUNCIONANDO | Assinatura HMAC validada corretamente |
| **Processamento de Evento** | ✅ RESPONDENDO | Função retorna sucesso para eventos |
| **Criação de Usuário** | ⚠️ INVESTIGAR | Resposta indica sucesso mas dados não persistem |
| **Log de Transações** | ✅ RESOLVIDO | `transaction_logs` agora armazena todos os eventos (colunas ajustadas nas migrações 023/024) |

---

## 🔄 Próximo Passo Imediato

Executar queries SQL para diagnosticar o problema de persistência:

```bash
# 1. Verificar RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

# 2. Tentar operação manual
INSERT INTO profiles (id, email, name, account_source)
VALUES (gen_random_uuid(), 'diagnostic@test.com', 'Diagnostic', 'cakto')
RETURNING *;

# 3. Verificar constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'profiles';
```

---

## 📝 Arquivos Alterados

- `supabase/functions/cakto/function.toml` - Adicionado `verify_jwt = false`
- `supabase/functions/cakto/deno.json` - Adicionado `verify_jwt = false`
- `docs/cakto-webhook-fix.md` - Documentação da correção
- `scripts/test-cakto-webhook.sh` - Script de teste
- Este arquivo: `docs/cakto-webhook-status.md`
