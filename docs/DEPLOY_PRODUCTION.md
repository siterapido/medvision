# Deploy em Produção (Vercel + Supabase)

Este guia descreve o passo a passo para publicar o projeto em produção na Vercel e conectar ao Supabase (produção).

## 1) Preparar o projeto

- Node 18+ (recomendado Node 20/22)
- Variáveis do `.env.local` revisadas no ambiente local
- Banco (Supabase) com migrações aplicadas

## 2) Criar projeto na Vercel (ou usar o existente)

Opção A — Importar via Git:
- Conecte seu repositório (GitHub/GitLab/Bitbucket) na Vercel
- Framework: Next.js (detecta automaticamente)
- Build Command: `next build`
- Output: `.next`

Opção B — CLI (já existe pasta `.vercel` no repo):
```bash
npx vercel link
```

## 3) Variáveis de ambiente (Vercel)

Adicione no projeto Vercel (Project Settings → Environment Variables):

Públicas (Available in: All/Production/Preview):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (ex.: `https://seu-dominio.com`)

Somente servidor (Environment: Production/Preview, Type: Encrypted):
- `APP_URL` (ex.: `https://seu-dominio.com`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `BUNNY_STORAGE_ZONE` - Nome da Storage Zone do Bunny.net
- `BUNNY_STORAGE_API_KEY` - Access Key da Storage Zone
- `BUNNY_CDN_BASE_URL` - URL do Pull Zone (ex.: `https://seu-pull-zone.b-cdn.net`)
- (Opcional) `BUNNY_STORAGE_HOST` - Host da Storage Zone (padrão: `storage.bunnycdn.com`)
- (Opcional) `N8N_WEBHOOK_URL` (sem espaços no valor)

Dica (CLI):
```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
# repita para as demais
```

## 4) Supabase (produção)

1. Crie um projeto novo no Supabase (produção) ou use um existente
2. Em Settings → API, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
3. Em Authentication:
   - Providers → Email: habilite e configure confirmação de email (produção)
   - URL Configuration:
     - `Site URL`: `https://seu-dominio.com`
     - `Redirect URLs`: `https://seu-dominio.com/auth/callback`
4. Banco de Dados:
   - Aplique as migrações em `supabase/migrations` (via SQL Editor ou CLI)
   - Verifique RLS e policies para `profiles` e demais tabelas

## 5) Deploy de Produção

Via Vercel UI:
- Clique em Deploy (Production)

Via CLI:
```bash
npx vercel deploy --prod
```

Observação: o build usa `next/font` para hospedar a fonte Inter. Em ambientes sem internet, o build local pode falhar ao baixar a fonte. Na Vercel, o build tem acesso à rede e conclui normalmente.

## 6) Domínio e URLs

- Adicione seu domínio em Vercel (Project → Domains)
- Atualize DNS (A/ALIAS/CNAME) conforme instruções da Vercel
- Ajuste `NEXT_PUBLIC_SITE_URL` e `APP_URL` para o domínio definitivo

## 7) Checklist pós‑deploy

- Login e registro: `/login` e `/register`
- Redirecionamentos protegidos: tente acessar `/dashboard` deslogado (deve ir para `/login`)
- Sessão e refresh (navegação entre páginas)
- Analytics da Vercel carregam sem erros

## 8) Notas e futuras melhorias

- Aviso Next 16: `middleware` está deprecado em favor de `proxy`. O projeto ainda funciona, mas migrar depois reduz warnings de build.
- Se desejar evitar download de fontes no build, migre para `next/font/local` com arquivos de fonte versionados no repo.

## 9) Configuração do Bunny CDN

Para configurar o Bunny CDN (Storage Zone e Pull Zone), consulte o guia completo:

- **docs/bunny-cdn-setup.md** - Instruções detalhadas de configuração

### Teste rápido da configuração

Após configurar as variáveis de ambiente, teste a configuração:

```bash
npm run test:bunny
```

## 10) Troubleshooting

- Build falhou por `next/font`/Google Fonts:
  - Confirme que o build da Vercel tem acesso à rede (normalmente sim)
  - Alternativa: usar `next/font/local`
- 401/403 no Supabase:
  - Revise `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` e policies RLS
- Erro ao fazer upload no Bunny:
  - Verifique `BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_API_KEY` e `BUNNY_CDN_BASE_URL`
  - Execute `npm run test:bunny` para diagnosticar problemas
  - Consulte `docs/bunny-cdn-setup.md` para troubleshooting detalhado
- Webhook inválido:
  - Revise `N8N_WEBHOOK_URL` e verifique se o payload está no formato esperado pelo N8N
