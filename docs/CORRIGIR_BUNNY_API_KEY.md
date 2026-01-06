# Como Corrigir a API Key do Bunny CDN

## ⚠️ Problema Atual

A API key fornecida ainda retorna erro 401 (Unauthorized). Isso significa que:
- A key pode estar incorreta ou incompleta
- Pode ser uma FTP Password em vez de Access Key
- A Storage Zone pode não estar ativa

## ✅ Como Obter a Access Key Correta

### Passo 1: Acessar o Dashboard do Bunny

1. Acesse: https://dash.bunny.net/
2. Faça login com suas credenciais

### Passo 2: Localizar a Storage Zone

1. No menu lateral, clique em **Storage**
2. Você verá a lista de Storage Zones
3. Localize a Storage Zone: **odontogptstorage** (ou similar)
4. Clique nela para abrir

### Passo 3: Obter a Access Key

1. Dentro da Storage Zone, clique em **FTP & HTTP API** (na aba Settings ou no menu lateral)
2. Procure por **Access Key** ou **API Key**
3. Você verá algo como: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (formato UUID duplo)
4. **Copie essa key completa** (não copie a FTP Password)

### Passo 4: Verificar Informações

Enquanto estiver no dashboard, anote também:

- **Storage Zone Name**: deve ser `odontogptstorage` (verifique o nome exato)
- **Hostname/Region**: deve ser `storage.bunnycdn.com` ou outra região
- **Status**: deve estar **Active** (ativo)

### Passo 5: Atualizar o Projeto

#### Opção A: Usar o Script Automatizado

1. Abra o arquivo `scripts/update-env-bunny.sh`
2. Edite a linha da `BUNNY_STORAGE_API_KEY` com a key correta
3. Execute: `bash scripts/update-env-bunny.sh`

#### Opção B: Editar Manualmente

1. Abra o arquivo `.env.local` na raiz do projeto
2. Localize a linha `BUNNY_STORAGE_API_KEY=...`
3. Substitua com a Access Key correta do Passo 3
4. Salve o arquivo

Exemplo:
```bash
BUNNY_STORAGE_API_KEY=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeeefffffff-gggg-hhhh-iiii-jjjjjjjjjjjj
```

### Passo 6: Testar a Configuração

Execute o teste:
```bash
npm run test:bunny
```

Você deve ver:
```
✓ Conexão com Bunny Storage funcionando
✓ Credenciais válidas - upload e delete testados com sucesso
```

## 🔍 Como Verificar se é Access Key ou FTP Password

**Access Key (correto):**
- Formato: UUID duplo conectado por hífen
- Exemplo: `12345678-1234-1234-1234-123456789012-12345678-1234-1234-1234-123456789012`
- Comprimento: ~80 caracteres

**FTP Password (incorreto):**
- Formato: string aleatória mais curta
- Exemplo: `Xh8sK2pQw9rT`
- Comprimento: ~12-20 caracteres

## 📋 Configurações na Vercel (Produção)

Depois de corrigir localmente, atualize também na Vercel:

1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables
2. Localize ou adicione as variáveis:
   - `BUNNY_STORAGE_ZONE` = `odontogptstorage`
   - `BUNNY_STORAGE_API_KEY` = (access key correta)
   - `BUNNY_STORAGE_HOST` = `storage.bunnycdn.com`
   - `BUNNY_CDN_BASE_URL` = `https://odonto-gpt.b-cdn.net/`
   - `NEXT_PUBLIC_MAX_ATTACHMENT_MB` = `1500`
3. Selecione os ambientes: Production, Preview, Development
4. Salve e faça um novo deploy

## 🆘 Se Ainda Não Funcionar

### Verificar Região da Storage Zone

Se sua Storage Zone estiver em uma região específica, o hostname pode ser diferente:

- **Padrão (Falkenstein, Germany)**: `storage.bunnycdn.com`
- **Nueva York**: `ny.storage.bunnycdn.com`
- **Los Angeles**: `la.storage.bunnycdn.com`
- **Singapore**: `sg.storage.bunnycdn.com`
- **Sydney**: `syd.storage.bunnycdn.com`
- **Londres**: `uk.storage.bunnycdn.com`

Atualize `BUNNY_STORAGE_HOST` se necessário.

### Verificar Pull Zone

1. No dashboard, vá em **CDN** → **Pull Zones**
2. Localize o Pull Zone (ex: `odonto-gpt`)
3. Verifique:
   - **CDN Hostname**: deve ser `odonto-gpt.b-cdn.net` (ou similar)
   - **Origin**: deve apontar para a Storage Zone
   - **Status**: deve estar **Active**

### Teste Manual com cURL

Para testar diretamente a API:

```bash
curl -X PUT \
  -H "AccessKey: SUA_ACCESS_KEY_AQUI" \
  -H "Content-Type: text/plain" \
  -d "test" \
  "https://storage.bunnycdn.com/odontogptstorage/test.txt"
```

Se retornar 201, está funcionando. Se retornar 401, a key está errada.

## 📞 Suporte

Se precisar de ajuda:
- Documentação Bunny: https://docs.bunny.net/docs/storage-api
- Suporte Bunny: https://support.bunny.net/

---

## ✅ Checklist de Verificação

- [ ] Acessei o dashboard do Bunny.net
- [ ] Localizei a Storage Zone correta
- [ ] Copiei a **Access Key** (não FTP Password)
- [ ] Verifiquei que o Storage Zone está ativo
- [ ] Anotei o hostname/região correto
- [ ] Atualizei o `.env.local` com a key correta
- [ ] Executei `npm run test:bunny` com sucesso
- [ ] Atualizei as variáveis na Vercel (produção)
- [ ] Testei upload de arquivo no admin




