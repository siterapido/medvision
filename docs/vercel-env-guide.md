# Guia de Uso - Gerenciador de Variáveis de Ambiente da Vercel

Este script facilita o gerenciamento das variáveis de ambiente na Vercel diretamente da linha de comando, sem precisar acessar o dashboard.

## 📋 Pré-requisitos

1. **CLI da Vercel instalada:**
   ```bash
   npm install -g vercel
   ```

2. **Autenticado na Vercel:**
   ```bash
   vercel login
   ```

3. **Dentro do projeto:**
   ```bash
   cd v0-odonto-gpt-ui
   ```

## 🚀 Comandos Disponíveis

### 1. Listar Variáveis

Lista todas as variáveis de ambiente configuradas na Vercel.

```bash
# Listar variáveis de produção (default)
npm run vercel:env

# Listar variáveis de preview
tsx scripts/update-vercel-env.ts --env preview

# Listar variáveis de desenvolvimento
tsx scripts/update-vercel-env.ts --env development
```

**Saída exemplo:**
```
📋 Variáveis de ambiente na Vercel (production):

  PRODUCTION:
    • NEXT_PUBLIC_SUPABASE_URL
    • NEXT_PUBLIC_SUPABASE_ANON_KEY
    • SUPABASE_SERVICE_ROLE_KEY
    • BUNNY_STORAGE_API_KEY

  Total: 4 variável(is)
```

### 2. Sincronizar Variáveis

Sincroniza todas as variáveis de um arquivo `.env` local para a Vercel.

```bash
# Sincronizar .env.local para produção
npm run vercel:env:sync

# Sincronizar .env.production para preview
tsx scripts/update-vercel-env.ts --sync --file .env.production --env preview

# Sincronizar .env.development para ambiente de desenvolvimento
tsx scripts/update-vercel-env.ts --sync --file .env.development --env development
```

**O que acontece:**
- Lê todas as variáveis do arquivo especificado
- Adiciona ou atualiza cada variável na Vercel
- Variáveis públicas (NEXT_PUBLIC_*) são adicionadas automaticamente para todos os ambientes
- Mostra progresso e estatísticas

### 3. Adicionar Variável Individual

Adiciona ou atualiza uma única variável de ambiente.

```bash
# Adicionar para produção
npm run vercel:env:add NEXT_PUBLIC_API_URL "https://api.example.com"

# Adicionar para preview
tsx scripts/update-vercel-env.ts --add MY_SECRET_KEY "sk-123" --env preview

# Adicionar para development
tsx scripts/update-vercel-env.ts --add DEBUG_MODE "true" --env development
```

**Exemplos práticos:**
```bash
# Atualizar URL do Supabase
npm run vercel:env:add NEXT_PUBLIC_SUPABASE_URL "https://xxx.supabase.co"

# Atualizar API key do Bunny
npm run vercel:env:add BUNNY_STORAGE_API_KEY "your-api-key-here"

# Adicionar nova integração
npm run vercel:env:add STRIPE_SECRET_KEY "sk_live_..."
```

### 4. Remover Variável

Remove uma variável de ambiente da Vercel.

```bash
# Remover de produção
npm run vercel:env:remove OLD_VARIABLE

# Remover de preview
tsx scripts/update-vercel-env.ts --remove UNUSED_VAR --env preview

# Remover de development
tsx scripts/update-vercel-env.ts --remove TEST_MODE --env development
```

**⚠️ Cuidado:** A remoção é irreversível!

## 📖 Opções Avançadas

### Especificar Ambiente

Use `--env` ou `-e` para escolher o ambiente:

```bash
--env production    # Produção (default)
--env preview       # Preview (branch deployments)
--env development   # Desenvolvimento
```

### Especificar Arquivo .env

Use `--file` ou `-f` para escolher o arquivo de origem:

```bash
--file .env.local       # Arquivo local (default)
--file .env.production  # Ambiente de produção
--file .env.preview     # Ambiente de preview
--file .env.development # Ambiente de desenvolvimento
```

### Comandos Diretos

```bash
--list, -l              # Listar variáveis (default)
--sync, -s              # Sincronizar do arquivo
--add, -a NOME VALOR    # Adicionar variável
--remove, -r NOME       # Remover variável
--help, -h              # Mostrar ajuda
```

## 🔄 Fluxo de Trabalho Recomendado

### 1. Configuração Inicial

```bash
# 1. Faça login na Vercel
vercel login

# 2. Liste as variáveis atuais
npm run vercel:env

# 3. Sincronize variáveis locais
npm run vercel:env:sync
```

### 2. Atualização de Variável Específica

```bash
# 1. Atualize no .env.local
echo 'NEW_VAR="value"' >> .env.local

# 2. Sincronize apenas essa variável
npm run vercel:env:add NEW_VAR "value"

# OU sincronize todo o arquivo
npm run vercel:env:sync
```

### 3. Deploy com Novas Variáveis

```bash
# 1. Sincronize variáveis
npm run vercel:env:sync

# 2. Faça deploy
vercel --prod

# 3. Verifique se as variáveis estão corretas
npm run vercel:env
```

## 🛡️ Boas Práticas

### Variáveis Públicas vs Privadas

**Variáveis Públicas (NEXT_PUBLIC_*):**
- Disponíveis no navegador
- Use para URLs, chaves públicas, etc.
- O script sincroniza automaticamente para todos os ambientes

**Variáveis Privadas:**
- Disponíveis apenas no servidor
- Use para secrets, API keys privadas, etc.
- Sincronize apenas para ambientes necessários

### Segurança

1. **Nunca faça commit** de arquivos `.env` com secrets reais
2. **Use arquivos de exemplo** (`.env.example`) com valores placeholders
3. **Sincronize individualmente** secrets sensíveis:
   ```bash
   npm run vercel:env:add SUPABASE_SERVICE_ROLE_KEY "your-secret-key"
   ```

### Arquivos por Ambiente

Mantenha arquivos separados para cada ambiente:

```bash
.env.local          # Desenvolvimento local (não commitar)
.env.example        # Template com valores de exemplo
.env.production     # Produção (opcional, para referência)
.env.preview        # Preview/PRs (opcional)
.env.development    # Development deployments (opcional)
```

## 🐛 Troubleshooting

### "Você não está autenticado na Vercel!"

```bash
vercel login
```

### "Arquivo .env.local não encontrado"

```bash
# Crie o arquivo
cp .env.example .env.local

# Edite com seus valores
nano .env.local
```

### "Erro ao adicionar variável"

Verifique:
1. Nome da variável não tem espaços
2. Valor está entre aspas se tiver espaços
3. Você tem permissão para modificar o projeto

### Variável não aparece no deploy

1. Verifique se sincronizou para o ambiente correto
2. Faça um novo deploy após sincronizar
3. Use `vercel env ls` para confirmar

## 📚 Referências

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel Env Commands](https://vercel.com/docs/cli/commands/env)

## 🎯 Exemplos Práticos do Projeto

### Configurar Bunny CDN

```bash
# Adicionar configurações do Bunny
npm run vercel:env:add BUNNY_STORAGE_ZONE "odontogptstorage"
npm run vercel:env:add BUNNY_STORAGE_API_KEY "your-api-key"
npm run vercel:env:add BUNNY_CDN_BASE_URL "https://odonto-gpt.b-cdn.net/"
```

### Configurar Supabase

```bash
# Variáveis públicas
npm run vercel:env:add NEXT_PUBLIC_SUPABASE_URL "https://xxx.supabase.co"
npm run vercel:env:add NEXT_PUBLIC_SUPABASE_ANON_KEY "your-anon-key"

# Variável privada (service role)
npm run vercel:env:add SUPABASE_SERVICE_ROLE_KEY "your-service-role-key"
```

### Configurar Integrações

```bash
# Cakto (pagamentos)
npm run vercel:env:add CAKTO_WEBHOOK_SECRET "your-webhook-secret"

# Z-API (WhatsApp)
npm run vercel:env:add Z_API_INSTANCE_ID "your-instance-id"
npm run vercel:env:add Z_API_TOKEN "your-token"
npm run vercel:env:add Z_API_WEBHOOK_SECRET "your-webhook-secret"

# Resend (email)
npm run vercel:env:add RESEND_API_KEY "your-api-key"
```

### Migrar de .env.local para Vercel

```bash
# 1. Verifique o que está em .env.local
cat .env.local

# 2. Sincronize tudo para produção
npm run vercel:env:sync

# 3. Liste para confirmar
npm run vercel:env

# 4. Faça deploy
vercel --prod
```

---

**Dica:** Adicione alias no seu `.zshrc` ou `.bashrc` para comandos mais rápidos:

```bash
alias venv='npm run vercel:env'
alias venv-sync='npm run vercel:env:sync'
alias venv-add='npm run vercel:env:add'
alias venv-rm='npm run vercel:env:remove'
```
