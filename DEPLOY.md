# Guia de Deploy - Odonto GPT

Este guia passo a passo ajudará você a colocar seu projeto **Odonto GPT** em produção utilizando **Railway** (para o backend Python) e **Vercel** (para o frontend Next.js).

## 1. Backend (Railway)

O serviço backend está localizado na pasta `odonto-gpt-agno-service`.

### Passo 1: Configurar Projeto no Railway
1. Acesse [railway.app](https://railway.app/) e faça login.
2. Clique em **+ New Project** > **Deploy from GitHub repo**.
3. Selecione o repositório do seu projeto.
4. **IMPORTANTE**: Após selecionar o repo, clique em **Add Variables** (ou configure as variáveis mais tarde, mas antes do deploy final funcionar).

### Passo 2: Configurar Diretório Raiz (Root Directory)
Como o backend está em uma subpasta, você precisa dizer ao Railway onde procurar:
1. No dashboard do seu projeto no Railway, clique no cartão do serviço.
2. Vá em **Settings** > **Build**.
3. Em **Root Directory**, insira:
   ```text
   odonto-gpt-agno-service
   ```
4. O Railway deve detectar automaticamente o `Dockerfile` atualizado que preparamos.

### Passo 3: Variáveis de Ambiente (Railway)
Vá na aba **Variables** e adicione as seguintes chaves (copie do seu `.env` local):

| Variável | Valor Exemplo / Descrição |
|----------|---------------------------|
| `OPENAI_API_KEY` | `sk-...` (Sua chave da OpenAI) |
| `ANTHROPIC_API_KEY` | `sk-ant...` (Se estiver usando Claude) |
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_KEY` | `eyJ...` (Sua Service Role Key ou Anon Key com permissões adequadas) |
| `PORT` | O Railway define isso automaticamente (não precisa adicionar, mas o código já suporta) |
| `ALLOWED_ORIGINS` | `https://seu-projeto-vercel.app` (Adicione isso APÓS fazer deploy do frontend) |

### Passo 4: Deploy
O Railway deve iniciar o deploy automaticamente após você configurar o Root Directory.
- Vá na aba **Deployments** e acompanhe o log.
- Se ficar verde ("Active"), seu backend está no ar!
- Copie a URL pública gerada (ex: `https://odonto-backend-production.up.railway.app`).

---

## 2. Frontend (Vercel)

O frontend está na raiz do repositório.

### Passo 1: Importar no Vercel
1. Acesse [vercel.com](https://vercel.com/) e faça login.
2. Clique em **Add New...** > **Project**.
3. Importe o mesmo repositório do GitHub.

### Passo 2: Configurações de Build
O Vercel deve detectar automaticamente que é um projeto Next.js.
- **Framework Preset**: Next.js
- **Root Directory**: `./` (padrão)

### Passo 3: Variáveis de Ambiente (Vercel)
Antes de clicar em "Deploy", expanda a seção **Environment Variables** e adicione:

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_AGNO_SERVICE_URL` | **Cole a URL do seu Backend no Railway AQUI** (sem a barra final, ex: `https://odonto-...app/api/v1`) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (Sua chave pública do Supabase) |

> **Atenção**: Se a URL do Railway for `...railway.app`, lembre-se que seu código espera o prefixo `/api/v1` se não estiver incluído na URL base.
> - Se o backend responde em `/docs`, a API está provavelmente em `/api/v1`.
> - Recomendo configurar `NEXT_PUBLIC_AGNO_SERVICE_URL` como `https://...railway.app/api/v1`.

### Passo 4: Deploy
1. Clique em **Deploy**.
2. Aguarde o processo de build.
3. Se tudo der certo, você verá a tela de "Congratulations!".

---

## 3. Finalização

1. **Atualize o CORS no Backend**:
   - Pegue a URL do seu frontend (ex: `https://odonto-gpt.vercel.app`).
   - Volte no Railway > Variables.
   - Adicione ou atualize `ALLOWED_ORIGINS` com essa URL.
   - O Railway fará um redeploy rápido.

2. **Teste**:
   - Abra seu site no Vercel.
   - Tente enviar uma mensagem no chat.
   - Se responder, parabéns! Seu sistema está em produção.
