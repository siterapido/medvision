# Configuração do Sentry

Este documento descreve como completar a configuração do Sentry para o projeto Odonto GPT.

## O que foi feito

✅ Instalação do pacote `@sentry/nextjs`
✅ Configuração do `next.config.mjs` com `withSentryConfig`
✅ Criação dos arquivos de configuração:
  - `sentry.client.config.ts` - Configuração do lado do cliente
  - `sentry.server.config.ts` - Configuração do lado do servidor
  - `sentry.edge.config.ts` - Configuração para Edge Runtime
✅ Integração com `app/layout.tsx`
✅ Build testado e funcionando

## O que você precisa fazer

### 1. Obter as credenciais do Sentry

1. Acesse [https://insightfy-dr.sentry.io](https://insightfy-dr.sentry.io)
2. Vá para o projeto "odontogpt"
3. Vá em **Settings → Client Keys (DSN)**
4. Copie o DSN para o cliente

### 2. Gerar um Auth Token

1. Vá em **Settings → Auth Tokens** (ou acesse [https://insightfy-dr.sentry.io/settings/auth-tokens/](https://insightfy-dr.sentry.io/settings/auth-tokens/))
2. Clique em **Create New Token**
3. Certifique-se de que os seguintes escopos estão marcados:
   - `project:releases`
   - `org:read`
   - `project:read`
4. Copie o token gerado

### 3. Configurar as variáveis de ambiente

Adicione ao seu arquivo `.env.local`:

```env
# Sentry DSNs
NEXT_PUBLIC_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/123456
SENTRY_DSN=https://exampleSecretKey@o0.ingest.sentry.io/123456

# Sentry Auth Token (para upload de source maps)
SENTRY_AUTH_TOKEN=seu_token_aqui
```

**Nota**: O `NEXT_PUBLIC_SENTRY_DSN` é público e será exposto no cliente. O `SENTRY_DSN` deve ser mantido em `.env.local`.

### 4. Remover a linha de configuração desatualizada

Se você ainda tiver o arquivo `sentry.config.ts`, você pode removê-lo:

```bash
rm sentry.config.ts
```

Ele já está integrado no `next.config.mjs`.

## Funcionalidades ativadas

### Cliente (Browser)
- Rastreamento de erros
- Performance monitoring (10% das sessões em produção)
- Session Replay (10% das sessões, 100% dos erros)
- Masking de texto e bloqueio de mídia por privacidade

### Servidor
- Rastreamento de erros do servidor
- Performance monitoring
- Rastreamento de requisições

## Testando a integração

Para testar se o Sentry está funcionando, você pode:

### 1. Criar um erro no cliente (Next.js 14+)

```typescript
// app/test/page.tsx
'use client'

export default function TestPage() {
  const handleError = () => {
    throw new Error('Test error from client')
  }

  return (
    <button onClick={handleError}>
      Trigger Sentry Error
    </button>
  )
}
```

### 2. Criar um erro no servidor

```typescript
// app/api/test/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  throw new Error('Test error from server')
}
```

### 3. Executar o build e verificar em produção

```bash
npm run build
npm run start
```

## Documentação adicional

- [Documentação do Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Performance Monitoring](https://docs.sentry.io/platforms/javascript/performance/)
- [Session Replay](https://docs.sentry.io/platforms/javascript/session-replay/)

## Troubleshooting

### Os erros não aparecem no Sentry

1. Verifique se as variáveis de ambiente estão corretas
2. Abra o console do navegador (F12) e procure por erros
3. Certifique-se de que o Sentry está inicializado em `app/layout.tsx`

### Source maps não estão sendo enviados

Isso é normal se você não tiver um `SENTRY_AUTH_TOKEN`. Os source maps serão enviados quando você configurar o token.

### Build está falhando

Certifique-se de que:
1. O `patch-package` está instalado
2. Todas as dependências estão atualizadas: `npm install`
3. A sintaxe do `next.config.mjs` está correta
