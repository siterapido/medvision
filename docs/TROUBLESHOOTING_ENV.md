# Troubleshooting - Variáveis de Ambiente

## 🚨 Erro ao Criar Vendedor (400 Bad Request)

### Sintomas
- Ao tentar criar um vendedor no painel admin, aparece o erro: "Não foi possível criar o vendedor"
- No console do navegador: `Failed to load resource: the server responded with a status of 400`
- No terminal do servidor:
  ```
  TypeError: Headers.append: "Bearer eyJ..." is an invalid header value.
  ```

### Causa
A variável `SUPABASE_SERVICE_ROLE_KEY` no arquivo `.env.local` está:
- Apontando para um projeto Supabase antigo/incorreto
- Com quebras de linha ou caracteres inválidos
- Truncada ou corrompida

### Solução

1. **Acesse o Dashboard do Supabase**
   ```
   https://supabase.com/dashboard/project/qphofwxpmmhfplylozsh
   ```

2. **Navegue até as configurações de API**
   - No menu lateral: **Settings** (⚙️) → **API**

3. **Localize a Service Role Key**
   - Na seção "Project API keys"
   - Procure por: **service_role** (secret)
   - ⚠️ **ATENÇÃO**: Esta chave tem acesso total ao banco de dados!

4. **Copie a chave correta**
   - Clique no ícone de copiar ao lado da chave
   - A chave deve começar com `eyJhbGciOiJIUzI1NiIs...`

5. **Atualize o `.env.local`**
   ```bash
   # Abra o arquivo
   nano .env.local
   # ou
   code .env.local
   ```

   Substitua a linha:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=<chave_antiga>
   ```
   
   Por:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=<chave_nova_copiada>
   ```
   
   **IMPORTANTE**: 
   - A chave deve estar em UMA ÚNICA LINHA
   - Sem espaços no início ou fim
   - Sem aspas ao redor (a menos que seja necessário pelo seu setup)

6. **Salve e reinicie o servidor**
   ```bash
   # Pare o servidor (Ctrl+C no terminal onde está rodando)
   # Inicie novamente
   npm run dev
   ```

7. **Teste novamente**
   - Acesse o painel admin
   - Vá em "Usuários" → "Criar Vendedor"
   - Preencha os dados e tente criar

### Verificação Rápida

Para verificar se suas variáveis estão corretas, execute:

```bash
# Verificar se as URLs batem
grep -E "SUPABASE_URL|SUPABASE.*KEY" .env.local
```

O **ref** (referência do projeto) deve ser o mesmo em ambas:
- `NEXT_PUBLIC_SUPABASE_URL`: `https://[REF].supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: JWT com `"ref":"[REF]"` no payload

No seu caso, o `[REF]` correto é: **qphofwxpmmhfplylozsh**

---

## 📋 Outras Variáveis Importantes

### Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=https://qphofwxpmmhfplylozsh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (chave pública)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (chave privada - SECRETA!)
```

### Site Configuration
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
APP_URL=http://localhost:3000
```

### Bunny CDN (Armazenamento de Vídeos/Arquivos)
```env
BUNNY_STORAGE_ZONE=odontogptstorage
BUNNY_STORAGE_API_KEY=<sua_chave_bunny>
BUNNY_CDN_BASE_URL=https://odonto-gpt.b-cdn.net/
BUNNY_STORAGE_HOST=storage.bunnycdn.com
NEXT_PUBLIC_MAX_ATTACHMENT_MB=1500
```

### WhatsApp (Z-API)
```env
Z_API_INSTANCE_ID="..."
Z_API_TOKEN="..."
Z_API_CLIENT_TOKEN="..."
```

### Opcionais
```env
OPENAI_API_KEY=sk-... (para funcionalidades de IA)
SENTRY_DSN=https://... (para monitoramento de erros)
CAKTO_API_KEY=... (para integração de pagamentos)
N8N_WEBHOOK_URL=... (para automações)
```

---

## 🔍 Decodificando JWTs do Supabase

Para verificar qual projeto está associado a uma chave JWT:

1. **Use um decodificador online**: https://jwt.io
2. Cole o valor da `SUPABASE_SERVICE_ROLE_KEY`
3. Verifique o campo `"ref"` no payload
4. Compare com o ref da URL do Supabase

Exemplo de payload:
```json
{
  "iss": "supabase",
  "ref": "qphofwxpmmhfplylozsh",  ← Este deve bater com a URL
  "role": "service_role",
  "iat": 1762323793,
  "exp": 2077899793
}
```

---

## ⚠️ Segurança

**NUNCA comita ou compartilhe:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `BUNNY_STORAGE_API_KEY`
- `Z_API_TOKEN`
- `OPENAI_API_KEY`
- Qualquer outra chave secreta

**Sempre mantenha** essas variáveis:
- No `.env.local` (ignorado pelo git)
- No Vercel/Netlify como "Environment Variables" secretas
- Em gerenciadores de segredos (AWS Secrets Manager, etc.)

---

## 📞 Suporte

Se o problema persistir após seguir este guia:

1. Verifique os logs do servidor em busca de erros específicos
2. Confirme que o projeto Supabase está ativo
3. Teste a conexão com o Supabase usando o SQL Editor
4. Revise as permissões e políticas RLS no banco de dados



