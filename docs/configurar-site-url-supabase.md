# Configurar Site URL no Supabase

## Problema
O Magic Link está redirecionando para `localhost` em vez do domínio de produção.

## Solução

### 1. Acessar as Configurações de Autenticação

Acesse: https://supabase.com/dashboard/project/qphofwxpmmhfplylozsh/auth/url-configuration

### 2. Atualizar as URLs

Configure os seguintes valores:

**Site URL:**
```
https://odontogpt.vercel.app
```

**Redirect URLs (adicionar todas):**
```
https://odontogpt.vercel.app/auth/callback
https://odontogpt.vercel.app/dashboard
https://odontogpt.com/auth/callback
https://odontogpt.com/dashboard
http://localhost:3000/auth/callback
http://localhost:3000/dashboard
```

### 3. Salvar as alterações

Clique em **Save** no final da página.

### 4. Testar

Após salvar, o Magic Link será gerado com a URL correta:
```
https://odontogpt.vercel.app/auth/callback?token=...
```

## Verificação

Para verificar se está funcionando corretamente:

1. Faça um teste de compra via Cakto
2. Receba o email com Magic Link
3. Verifique se o link aponta para `https://odontogpt.vercel.app` em vez de `localhost`

## Status Atual

- ✅ `APP_URL` configurado na Edge Function: `https://odontogpt.vercel.app`
- ⏳ **PENDENTE**: Configurar Site URL no Supabase Dashboard (acesse o link acima)
