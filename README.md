# Odonto GPT UI

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/insightfy/v0-odonto-gpt-ui)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/sahgokuYUIU)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deploy

Guia completo de produção (Vercel + Supabase):

- docs/DEPLOY_PRODUCTION.md

Projeto em produção:

**[https://vercel.com/insightfy/v0-odonto-gpt-ui](https://vercel.com/insightfy/v0-odonto-gpt-ui)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/sahgokuYUIU](https://v0.app/chat/sahgokuYUIU)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Integração Kiwfy + WhatsApp (Z-API)

- Adicionamos o endpoint `POST /api/kiwfy/webhook`, que valida o HMAC recebido da Kiwfy (`x-kiwfy-signature`) e provisiona automaticamente o usuário no Supabase.
- Após confirmar status `paid/approved/active`, o sistema gera um magic link (`APP_URL` como base), atualiza os campos `kiwfy_*` na tabela `profiles` e registra auditoria em `kiwfy_webhook_events`.
- Se `ZAPI_INSTANCE_ID`/`ZAPI_TOKEN` estiverem configurados, o link de acesso é enviado automaticamente pelo WhatsApp utilizando a Z-API.
- Configure os novos envs em `.env.local` (`KIWFY_WEBHOOK_SECRET`, `ZAPI_*`, `WHATSAPP_DEFAULT_COUNTRY_CODE`) e aplique a migration `008_kiwfy_webhook_and_whatsapp.sql` no Supabase antes de testar.
