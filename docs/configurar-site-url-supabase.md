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
4. Confirme que o link contém o caminho `/auth/callback?next=/dashboard` (ou outro `next` permitido)
5. Abra o link e valide se você é redirecionado para a dashboard autenticada

### Checklist rápido antes do deploy

- [ ] Variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` presentes no `.env.local`
- [ ] Rota `app/auth/callback/route.ts` publicada (rodar `npm run build` localmente ajuda a detectar faltas)
- [ ] URLs de redirect atualizadas no painel do Supabase conforme lista acima
- [ ] Flow manual de login com Magic Link validado após cada mudança crítica no auth

## Status Atual

- ✅ `APP_URL` configurado na Edge Function: `https://odontogpt.vercel.app`
- ⏳ **PENDENTE**: Configurar Site URL no Supabase Dashboard (acesse o link acima)
