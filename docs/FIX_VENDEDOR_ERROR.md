# Correção: Erro ao Criar Vendedor

## 🎯 Resumo Executivo

**Problema:** Erro 400 ao tentar criar vendedor no painel administrativo

**Causa:** `SUPABASE_SERVICE_ROLE_KEY` apontando para projeto Supabase incorreto

**Solução:** Atualizar a chave no `.env.local` com a chave do projeto correto

---

## 🔍 Diagnóstico

### Erro Observado

```
Console do navegador:
❌ Failed to load resource: the server responded with a status of 400 (Bad Request)
❌ Não foi possível criar o vendedor.

Terminal do servidor:
TypeError: Headers.append: "Bearer eyJ..." is an invalid header value.
```

### Causa Raiz

A variável `SUPABASE_SERVICE_ROLE_KEY` no arquivo `.env.local` está configurada com a chave de um projeto antigo (`fjoaliipjfcnokermkhy`), mas o `NEXT_PUBLIC_SUPABASE_URL` aponta para o projeto atual (`qphofwxpmmhfplylozsh`).

**Configuração atual:**
```env
✅ NEXT_PUBLIC_SUPABASE_URL=https://qphofwxpmmhfplylozsh.supabase.co
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (projeto: qphofwxpmmhfplylozsh)
❌ SUPABASE_SERVICE_ROLE_KEY=eyJ... (projeto: fjoaliipjfcnokermkhy) ← INCORRETA!
```

---

## ✅ Solução Passo a Passo

### 1. Validar o Problema

Execute o script de validação:

```bash
npm run validate:env
```

Você verá uma mensagem assim:

```
❌ ref da service key (fjoaliipjfcnokermkhy) NÃO bate com a URL (qphofwxpmmhfplylozsh)
   → Você está usando uma chave de outro projeto!
```

### 2. Obter a Chave Correta

1. **Acesse o Dashboard do Supabase:**
   ```
   https://supabase.com/dashboard/project/qphofwxpmmhfplylozsh/settings/api
   ```

2. **Na seção "Project API keys"**, localize:
   - **service_role** `secret`
   - Esta chave deve começar com `eyJhbGciOiJIUzI1NiIs...`

3. **Copie a chave** clicando no ícone de copiar

### 3. Atualizar o `.env.local`

1. **Abra o arquivo:**
   ```bash
   # Use seu editor preferido
   code .env.local
   # ou
   nano .env.local
   ```

2. **Localize a linha:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqb2FsaWlwamZjbm9rZXJta2h5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQyMzgwNSwiZXhwIjoyMDc1OTk5ODA1fQ.nJjAUvhvOXQjweS-NWk5EjBxvNIyUzSY3mOxI40aw
   ```

3. **Substitua pela nova chave:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=<COLE_AQUI_A_CHAVE_COPIADA>
   ```

   ⚠️ **IMPORTANTE:**
   - A chave deve estar em **UMA ÚNICA LINHA**
   - Sem espaços no início ou fim
   - Sem aspas ao redor (a menos que seu setup exija)

4. **Salve o arquivo**

### 4. Reiniciar o Servidor

```bash
# No terminal onde o servidor está rodando:
# 1. Pare o servidor (Ctrl+C)

# 2. Inicie novamente
npm run dev
```

### 5. Validar a Correção

```bash
npm run validate:env
```

Você deve ver:

```
✅ SUPABASE_SERVICE_ROLE_KEY válida
✅ ref da service key bate com a URL (qphofwxpmmhfplylozsh)
```

### 6. Testar a Criação de Vendedor

1. Acesse o painel administrativo
2. Vá em **Usuários** → **Criar Vendedor**
3. Preencha os dados:
   - Nome: `Teste Vendedor`
   - Email: `vendedor@teste.com`
   - Senha: `Senha123!@#`
4. Clique em **Criar Vendedor**

✅ **Resultado esperado:** Vendedor criado com sucesso!

---

## 🛠️ Ferramentas de Diagnóstico

### Script de Validação

Execute a qualquer momento para verificar suas variáveis:

```bash
npm run validate:env
```

Este script verifica:
- ✅ Se todas as variáveis obrigatórias estão definidas
- ✅ Se as chaves JWT são válidas
- ✅ Se os refs das chaves batem com a URL
- ✅ Se a conexão com Supabase funciona
- ⚠️  Variáveis opcionais faltando

### Decodificar JWT Manualmente

Para verificar qual projeto uma chave pertence:

1. Acesse: https://jwt.io
2. Cole a chave JWT
3. Verifique o campo `"ref"` no payload:
   ```json
   {
     "iss": "supabase",
     "ref": "qphofwxpmmhfplylozsh",  ← Deve bater com a URL
     "role": "service_role",
     ...
   }
   ```

---

## 📚 Documentação Adicional

- **Troubleshooting completo:** `docs/TROUBLESHOOTING_ENV.md`
- **Setup do Supabase:** `SUPABASE_SETUP.md`
- **Deploy em produção:** `docs/DEPLOY_PRODUCTION.md`

---

## ⚠️ Segurança

**NUNCA:**
- Commite o arquivo `.env.local` no git
- Compartilhe a `SUPABASE_SERVICE_ROLE_KEY` publicamente
- Use a service role key no frontend

**SEMPRE:**
- Mantenha as chaves no `.env.local` (desenvolvimento)
- Use environment variables secretas na Vercel/Netlify (produção)
- Rotacione chaves se houver suspeita de vazamento

---

## ✨ Após a Correção

Com a configuração correta, você poderá:

- ✅ Criar vendedores no painel admin
- ✅ Criar administradores
- ✅ Gerenciar permissões de usuários
- ✅ Todas as funcionalidades que requerem service role key

---

## 🆘 Suporte

Se o problema persistir após seguir este guia:

1. **Verifique os logs do servidor** em busca de outros erros
2. **Confirme que o projeto Supabase está ativo**
3. **Teste a conexão** usando o SQL Editor do Supabase
4. **Execute** `npm run validate:env` para diagnóstico completo
5. **Consulte** `docs/TROUBLESHOOTING_ENV.md` para outros problemas

---

**Atualizado em:** Dezembro 2025  
**Versão:** 1.0



