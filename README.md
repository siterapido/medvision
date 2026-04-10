# MedVision

Cópia de desenvolvimento independente do stack OdontoGPT Web, voltada a um novo projeto com **banco de dados e autenticação próprios** (Supabase ou outro backend que você configurar).

## Repositório

- **Este projeto:** [github.com/siterapido/medvision](https://github.com/siterapido/medvision)
- **Origem (referência):** [github.com/siterapido/odontogptweb](https://github.com/siterapido/odontogptweb)

## Primeiros passos

1. Crie um projeto no [Supabase](https://supabase.com) (ou o provedor escolhido) e **não** reutilize as credenciais do OdontoGPT.
2. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL`, chaves anon/service role, `NEXT_PUBLIC_SITE_URL`, `APP_URL`, e demais integrações (Bunny, Z-API, IA, etc.).
3. Aplique migrações: `pnpm db:push` ou `supabase db push` conforme o guia em `docs/` e `supabase/README.md`.
4. Configure URLs de redirect no painel de Auth (Site URL e redirect URLs apontando para o seu domínio ou `http://localhost:3000`).

Documentação de deploy em produção:

- `docs/DEPLOY_PRODUCTION.md`

## Scripts

- `pnpm dev` — desenvolvimento
- `pnpm build` / `pnpm start` — build e produção local
- `pnpm validate:env` — checagem de variáveis de ambiente
