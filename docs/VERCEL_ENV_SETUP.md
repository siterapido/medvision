# Configuração de Variáveis de Ambiente na Vercel

## 📋 Variáveis Necessárias para o Bunny CDN

Acesse o painel da Vercel: https://vercel.com/[seu-projeto]/settings/environment-variables

### Variáveis do Bunny (Storage e CDN)

```bash
# Storage Zone
BUNNY_STORAGE_ZONE=odontogptstorage

# Access Key (obtenha no dashboard do Bunny.net)
BUNNY_STORAGE_API_KEY=sua-access-key-aqui

# Hostname da região (padrão ou específico)
BUNNY_STORAGE_HOST=storage.bunnycdn.com

# URL do Pull Zone (CDN público)
BUNNY_CDN_BASE_URL=https://odonto-gpt.b-cdn.net/

# Limite de upload (1500 MB = 1.5 GB)
NEXT_PUBLIC_MAX_ATTACHMENT_MB=1500
```

## 🔧 Como Adicionar na Vercel

### Via Interface Web

1. Acesse seu projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Para cada variável acima:
   - Clique em **Add New**
   - Digite o **Key** (nome da variável)
   - Digite o **Value** (valor da variável)
   - Selecione os ambientes: ☑️ Production, ☑️ Preview, ☑️ Development
   - Clique em **Save**

### Via Vercel CLI (Alternativo)

```bash
# Instalar CLI (se ainda não tiver)
npm i -g vercel

# Fazer login
vercel login

# Adicionar variáveis (uma por vez)
vercel env add BUNNY_STORAGE_ZONE production
vercel env add BUNNY_STORAGE_API_KEY production
vercel env add BUNNY_STORAGE_HOST production
vercel env add BUNNY_CDN_BASE_URL production
vercel env add NEXT_PUBLIC_MAX_ATTACHMENT_MB production
```

## 📝 Outras Variáveis Importantes

### Supabase (obrigatório)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### Cakto (pagamentos - se usar)

```bash
CAKTO_API_KEY=sua-cakto-api-key
CAKTO_WEBHOOK_SECRET=seu-webhook-secret
```

### Email (se configurado)

```bash
SMTP_HOST=smtp.exemplo.com
SMTP_PORT=587
SMTP_USER=seu-usuario
SMTP_PASS=sua-senha
FROM_EMAIL=noreply@exemplo.com
```

### Sentry (monitoramento - opcional)

```bash
SENTRY_DSN=sua-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=sua-sentry-dsn
SENTRY_AUTH_TOKEN=seu-auth-token
```

## ✅ Após Adicionar as Variáveis

1. **Fazer novo deploy:**
   - Vá em **Deployments**
   - Clique em **Redeploy** no último deploy
   - Ou faça `git push` para triggerar novo deploy

2. **Verificar logs:**
   - Durante o build, verifique se não há erros relacionados às variáveis
   - Após deploy, teste upload de arquivo no admin

3. **Testar funcionalidade:**
   - Acesse o admin em produção
   - Tente fazer upload de um arquivo pequeno
   - Verifique se a URL gerada usa `odonto-gpt.b-cdn.net`
   - Acesse a URL para confirmar que o arquivo está disponível

## 🔍 Verificação de Variáveis

### Ver variáveis configuradas (via CLI)

```bash
# Listar variáveis de production
vercel env ls production

# Puxar variáveis para .env.local (cuidado!)
vercel env pull .env.local
```

### Verificar no código (em produção)

Adicione temporariamente em uma página:

```typescript
// app/api/test-env/route.ts
export async function GET() {
  return Response.json({
    bunny_zone: !!process.env.BUNNY_STORAGE_ZONE,
    bunny_key: !!process.env.BUNNY_STORAGE_API_KEY,
    bunny_cdn: !!process.env.BUNNY_CDN_BASE_URL,
    max_size: process.env.NEXT_PUBLIC_MAX_ATTACHMENT_MB,
  })
}
```

Acesse: `https://seu-dominio.vercel.app/api/test-env`

## ⚠️ Segurança

### Variáveis Públicas (NEXT_PUBLIC_*)

- Expostas no bundle JavaScript do cliente
- Visíveis no código fonte do navegador
- Usar apenas para dados não sensíveis

**Exemplo:** `NEXT_PUBLIC_MAX_ATTACHMENT_MB=1500` ✅ (seguro)

### Variáveis Privadas (sem prefixo)

- Apenas disponíveis no servidor
- Não expostas ao cliente
- Usar para chaves secretas

**Exemplo:** `BUNNY_STORAGE_API_KEY=...` ✅ (seguro)
**Exemplo:** `NEXT_PUBLIC_BUNNY_API_KEY=...` ❌ (NUNCA faça isso!)

## 🚀 Atalho Rápido

Copie e cole este comando para adicionar todas as variáveis do Bunny via CLI:

```bash
# Cole a access key correta antes de executar
echo "BUNNY_STORAGE_ZONE=odontogptstorage" | vercel env add production
echo "BUNNY_STORAGE_API_KEY=SUA_KEY_AQUI" | vercel env add production
echo "BUNNY_STORAGE_HOST=storage.bunnycdn.com" | vercel env add production
echo "BUNNY_CDN_BASE_URL=https://odonto-gpt.b-cdn.net/" | vercel env add production
echo "NEXT_PUBLIC_MAX_ATTACHMENT_MB=1500" | vercel env add production
```

## 📞 Precisa de Ajuda?

- Documentação Vercel: https://vercel.com/docs/concepts/projects/environment-variables
- Documentação Next.js: https://nextjs.org/docs/basic-features/environment-variables




