# ✅ Configuração do Bunny CDN Atualizada

## O que foi feito

### 1. Variáveis de Ambiente Atualizadas Localmente ✅

As seguintes variáveis foram configuradas no seu `.env.local`:

```bash
BUNNY_STORAGE_ZONE=odontogptstorage
BUNNY_STORAGE_API_KEY=2335bbcf-ae76-4e71-88e0-9d80a694d60d6da73147-04bc-43fb-960a-68fa393572ed
BUNNY_STORAGE_HOST=storage.bunnycdn.com
BUNNY_CDN_BASE_URL=https://odonto-gpt.b-cdn.net/
NEXT_PUBLIC_MAX_ATTACHMENT_MB=1500
```

### 2. Limite de Upload Aumentado ✅

- Limite anterior: 10MB
- **Novo limite: 1500MB (1.5GB)**
- Permite upload de vídeos grandes

### 3. Script de Atualização Criado ✅

Arquivo `scripts/update-env-bunny.sh` permite atualizar facilmente as variáveis de ambiente.

### 4. Documentação Completa Criada ✅

- `docs/CORRIGIR_BUNNY_API_KEY.md` - Como obter a Access Key correta
- `docs/VERCEL_ENV_SETUP.md` - Como configurar na Vercel
- `docs/bunny-integration-status.md` - Status completo da integração

## ⚠️ Problema Identificado

**Erro 401 Unauthorized** ainda persiste ao testar a conexão.

### Possíveis causas:

1. **Access Key pode estar incorreta**
   - A key fornecida pode estar incompleta
   - Pode ser uma FTP Password em vez de Access Key

2. **Storage Zone pode estar inativa**
   - Verificar status no dashboard

3. **Região/Hostname pode estar incorreto**
   - Pode precisar usar hostname específico da região

## 🎯 Próximos Passos (IMPORTANTE)

### 1. Obter Access Key Correta

**Siga o guia completo:** `docs/CORRIGIR_BUNNY_API_KEY.md`

Resumo:
1. Acesse: https://dash.bunny.net/
2. Vá em **Storage** → clique em `odontogptstorage`
3. Vá em **FTP & HTTP API**
4. Copie a **Access Key** (formato: UUID-UUID, ~80 caracteres)
5. **NÃO copie a FTP Password** (muito mais curta)

### 2. Atualizar Localmente

Edite o arquivo `scripts/update-env-bunny.sh` na linha da `BUNNY_STORAGE_API_KEY`:

```bash
update_or_add_var "BUNNY_STORAGE_API_KEY" "SUA_ACCESS_KEY_CORRETA_AQUI"
```

Execute:
```bash
bash scripts/update-env-bunny.sh
npm run test:bunny
```

Você deve ver:
```
✓ Conexão com Bunny Storage funcionando
✓ Credenciais válidas
```

### 3. Configurar na Vercel (Produção)

**Siga o guia completo:** `docs/VERCEL_ENV_SETUP.md`

Resumo:
1. Acesse: https://vercel.com/[seu-projeto]/settings/environment-variables
2. Adicione/atualize cada variável:
   - `BUNNY_STORAGE_ZONE` = `odontogptstorage`
   - `BUNNY_STORAGE_API_KEY` = (access key correta)
   - `BUNNY_STORAGE_HOST` = `storage.bunnycdn.com`
   - `BUNNY_CDN_BASE_URL` = `https://odonto-gpt.b-cdn.net/`
   - `NEXT_PUBLIC_MAX_ATTACHMENT_MB` = `1500`
3. Selecione: Production, Preview, Development
4. Faça redeploy

### 4. Testar Upload

1. Acesse o admin em produção
2. Crie ou edite uma aula
3. Teste upload de vídeo (use arquivo pequeno primeiro ~5MB)
4. Verifique se a URL gerada funciona

## 📊 Status da Integração

| Componente | Status | Observação |
|------------|--------|------------|
| Código de integração | ✅ Completo | Biblioteca implementada |
| Endpoints de API | ✅ Completo | Upload/download funcionais |
| Interface do admin | ✅ Completo | Formulários prontos |
| Validação de tipos | ✅ Completo | MP4, WebM, MOV, MKV |
| Limite de tamanho | ✅ 1500MB | Configurado localmente |
| Credenciais | ⚠️ Verificar | Erro 401 - Access Key incorreta |
| Config na Vercel | ⏳ Pendente | Aguardando Access Key correta |

## 🔍 Teste Rápido (Após Corrigir Access Key)

Execute estes comandos em sequência:

```bash
# 1. Testar configuração local
npm run test:bunny

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Acessar admin
# http://localhost:3000/admin/cursos
```

## ❓ Se Precisar de Ajuda

### Verificar formato da Access Key

A Access Key correta deve ter este formato:
```
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

- Dois UUIDs conectados por hífen
- Aproximadamente 80 caracteres
- Apenas letras, números e hífens

### Teste manual com cURL

```bash
curl -X PUT \
  -H "AccessKey: SUA_ACCESS_KEY_AQUI" \
  -H "Content-Type: text/plain" \
  -d "test" \
  "https://storage.bunnycdn.com/odontogptstorage/test-$(date +%s).txt"
```

- Se retornar **201 Created**: Access Key está correta ✅
- Se retornar **401 Unauthorized**: Access Key está incorreta ❌
- Se retornar **404 Not Found**: Storage Zone name está incorreto ❌

## 📚 Documentação Adicional

- [Bunny Storage API Docs](https://docs.bunny.net/docs/storage-api)
- [Bunny CDN Docs](https://docs.bunny.net/docs/cdn)
- [Guia de Setup Original](./bunny-cdn-setup.md)

## ✨ Melhorias Futuras (Opcional)

Após a integração funcionar:

1. **Upload em chunks** para arquivos >500MB
2. **Barra de progresso real** durante upload
3. **Retry automático** em caso de falha
4. **Compressão automática** de vídeos (se necessário)
5. **Thumbnail automático** de vídeos

---

**Última atualização:** $(date)
**Status:** Aguardando Access Key correta do Bunny.net




