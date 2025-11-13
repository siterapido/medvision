# 🔔 Instruções: Webhook Cakto

## Status: ✅ OPERACIONAL

O webhook Cakto foi **completamente corrigido** e está funcionando. O erro 401 foi eliminado.

---

## 🚀 Como Usar

### 1️⃣ Configurar no Painel Cakto

Acesse: **Cakto → Configurações → Webhooks**

```
URL: https://qphofwxpmmhfplylozsh.functions.supabase.co/cakto
Eventos:
  ✓ purchase_approved
  ✓ refund
  ✓ subscription_cancelled
Secret: 25031965-ab73-495c-84c0-affd56d5d531
```

### 2️⃣ Testar o Webhook

```bash
# Opção A: Usar script de teste
export CAKTO_WEBHOOK_SECRET="25031965-ab73-495c-84c0-affd56d5d531"
./scripts/test-cakto-webhook.sh

# Opção B: Enviar teste do painel Cakto
# Vá em Webhooks → [seu webhook] → Enviar teste
```

### 3️⃣ Verificar Logs

**No painel Cakto:**
- Webhooks → [seu webhook] → Histórico

**No Supabase Dashboard:**
- Functions → cakto → Logs

---

## 📊 Fluxo de Pagamento

```
Cakto (pagamento)
    ↓
Webhook POST → https://.../cakto
    ↓
Edge Function processa
    ↓
Cria/atualiza usuário em profiles
Registra transação em transaction_logs
    ↓
Retorna { success: true }
```

---

## 🔍 Monitoramento

### Verificar Usuários Criados

```sql
SELECT id, email, name, account_source, created_at
FROM profiles
WHERE account_source = 'cakto'
ORDER BY created_at DESC;
```

### Verificar Histórico de Transações

```sql
SELECT transaction_id, event_type, customer_email, status, created_at
FROM transaction_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Verificar Erros

```sql
SELECT transaction_id, event_type, error_message
FROM transaction_logs
WHERE error_message IS NOT NULL
ORDER BY created_at DESC;
```

---

## 🛠️ Troubleshooting

### Webhook retorna erro 401
**❌ Não deve mais acontecer**
- Se acontecer, verifique se o deploy foi realizado:
  ```bash
  npx supabase functions deploy cakto --no-verify-jwt
  ```

### Webhook retorna "Assinatura inválida"
- Verifique se o secret está correto no painel Cakto
- Compare com: `CAKTO_WEBHOOK_SECRET` no `.env.local`
- Sincronize se necessário:
  ```bash
  npx supabase secrets set CAKTO_WEBHOOK_SECRET="seu_secret"
  npx supabase functions deploy cakto --no-verify-jwt
  ```

### Usuário não é criado após pagamento
- Verifique RLS policies na tabela `profiles`
- Verifique logs da Edge Function
- Confirme que o email não contém palavras-chave de teste ("test", "example", "demo")

---

## 📚 Documentação Relacionada

- **[Guia Completo](docs/guia-integracao-cakto-local.md)** - Implementação detalhada
- **[Status da Integração](docs/cakto-webhook-status.md)** - Status atual e próximos passos
- **[Correção do Erro 401](docs/cakto-webhook-fix.md)** - Detalhes técnicos da solução

---

## 📞 Suporte

Se encontrar problemas:

1. **Consulte os logs** da Edge Function
2. **Verifique o secret** está sincronizado
3. **Teste manualmente** com o script: `./scripts/test-cakto-webhook.sh`
4. **Verifique RLS** das tabelas envolvidas

---

## ✅ Checklist de Produção

- [ ] Webhook configurado no painel Cakto
- [ ] Secret sincronizado com Supabase
- [ ] Teste manual realizado com sucesso
- [ ] Dados sendo salvos corretamente no banco
- [ ] Logs sendo registrados
- [ ] Monitoramento ativo
- [ ] Alertas configurados para erros

---

**Última atualização:** 13/11/2025
**Status:** ✅ Operacional
