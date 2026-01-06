# 🚀 Próximos Passos - Bunny CDN

## ✅ O que já está pronto

1. ✅ API key atualizada no `.env.local` (mas pode estar incorreta)
2. ✅ Limite de upload aumentado para **1500MB (1.5GB)**
3. ✅ Scripts de configuração criados
4. ✅ Código de integração completo e funcional

## ⚠️ O que precisa fazer AGORA

### Passo 1: Obter Access Key Correta no Bunny.net

A Access Key fornecida retornou erro 401. Você precisa obter a correta:

```
🌐 Acesse: https://dash.bunny.net/
   ↓
📦 Clique em "Storage" no menu lateral
   ↓
📁 Clique em "odontogptstorage" (sua Storage Zone)
   ↓
⚙️ Clique em "FTP & HTTP API"
   ↓
🔑 Copie a "Access Key" completa
   (NÃO copie a FTP Password)
```

**Como identificar a Access Key correta:**
- ✅ Formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- ✅ Tamanho: ~80 caracteres
- ❌ NÃO é a FTP Password (muito mais curta)

### Passo 2: Atualizar no Projeto

**Opção A: Editar o script (recomendado)**

1. Abra o arquivo: `scripts/update-env-bunny.sh`
2. Encontre a linha (linha 37):
   ```bash
   update_or_add_var "BUNNY_STORAGE_API_KEY" "SUA_ACCESS_KEY_AQUI"
   ```
3. Substitua `SUA_ACCESS_KEY_AQUI` pela Access Key correta
4. Execute:
   ```bash
   bash scripts/update-env-bunny.sh
   ```

**Opção B: Editar manualmente**

1. Abra o arquivo: `.env.local`
2. Encontre a linha:
   ```bash
   BUNNY_STORAGE_API_KEY=...
   ```
3. Substitua com a Access Key correta
4. Salve o arquivo

### Passo 3: Testar Localmente

```bash
npm run test:bunny
```

**Resultado esperado:**
```
✓ Conexão com Bunny Storage funcionando
✓ Credenciais válidas - upload e delete testados com sucesso

✅ Configuração do Bunny CDN está correta!
```

### Passo 4: Configurar na Vercel (Produção)

1. Acesse: https://vercel.com/[seu-projeto]/settings/environment-variables

2. Adicione ou atualize estas variáveis:
   - `BUNNY_STORAGE_ZONE` → `odontogptstorage`
   - `BUNNY_STORAGE_API_KEY` → (Access Key correta)
   - `BUNNY_STORAGE_HOST` → `storage.bunnycdn.com`
   - `BUNNY_CDN_BASE_URL` → `https://odonto-gpt.b-cdn.net/`
   - `NEXT_PUBLIC_MAX_ATTACHMENT_MB` → `1500`

3. Selecione os ambientes: ☑️ Production, ☑️ Preview, ☑️ Development

4. Faça **Redeploy** do projeto

### Passo 5: Testar Upload

1. Acesse o admin: `https://seu-dominio.vercel.app/admin/cursos`
2. Crie ou edite uma aula
3. Teste upload de vídeo pequeno (~5-10MB primeiro)
4. Verifique se a URL gerada funciona

## 🎯 Resumo Rápido

| O que fazer | Status |
|-------------|--------|
| 1. Obter Access Key no Bunny.net | ⏳ Você precisa fazer |
| 2. Atualizar `.env.local` | ⏳ Você precisa fazer |
| 3. Testar com `npm run test:bunny` | ⏳ Você precisa fazer |
| 4. Configurar na Vercel | ⏳ Você precisa fazer |
| 5. Fazer redeploy | ⏳ Você precisa fazer |
| 6. Testar upload no admin | ⏳ Você precisa fazer |

## 📚 Documentação Detalhada

Se precisar de mais detalhes, consulte:

- 📖 `docs/CORRIGIR_BUNNY_API_KEY.md` - Guia passo a passo completo
- 📖 `docs/VERCEL_ENV_SETUP.md` - Como configurar na Vercel
- 📖 `docs/RESUMO_BUNNY_CONFIGURACAO.md` - Resumo do que foi feito
- 📖 `docs/bunny-integration-status.md` - Status completo da integração

## ❓ Perguntas Frequentes

### A Access Key que tenho está correta?

Teste manualmente com cURL:

```bash
# Substitua SUA_ACCESS_KEY pela sua key
curl -X PUT \
  -H "AccessKey: SUA_ACCESS_KEY" \
  -H "Content-Type: text/plain" \
  -d "test" \
  "https://storage.bunnycdn.com/odontogptstorage/test.txt"
```

- **201 Created** = Access Key correta ✅
- **401 Unauthorized** = Access Key incorreta ❌

### O que é Storage Zone vs Pull Zone?

- **Storage Zone**: Onde os arquivos são armazenados (odontogptstorage)
- **Pull Zone**: CDN que distribui os arquivos (odonto-gpt.b-cdn.net)
- Ambos já estão configurados, você só precisa da Access Key

### O que fazer se o teste falhar?

1. Verifique se copiou a Access Key completa (toda a string)
2. Certifique-se de que não tem espaços no início/fim
3. Confirme que é a Access Key (não FTP Password)
4. Verifique se a Storage Zone está ativa no dashboard

### Preciso configurar o Pull Zone?

Não, o Pull Zone já está configurado (`odonto-gpt.b-cdn.net`). Você só precisa da Access Key da Storage Zone.

## 🆘 Precisa de Ajuda?

Se depois de seguir todos os passos ainda tiver problemas:

1. Verifique os logs do teste: `npm run test:bunny`
2. Consulte a documentação do Bunny: https://docs.bunny.net/docs/storage-api
3. Verifique se a Storage Zone está ativa no dashboard
4. Tente criar uma nova Access Key no dashboard (se possível)

---

**Status atual:** Aguardando Access Key correta do Bunny.net  
**Tempo estimado:** 5-10 minutos após obter a Access Key correta




