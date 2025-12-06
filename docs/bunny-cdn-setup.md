# Configuração do Bunny CDN

Este guia descreve como configurar corretamente o Bunny CDN (Pull Zone) no projeto.

## Visão Geral

O projeto utiliza dois serviços do Bunny.net:
1. **Bunny Storage** - Para armazenar arquivos (vídeos, PDFs, imagens)
2. **Bunny CDN Pull Zone** - Para distribuir conteúdo via CDN

## Passo 1: Criar Storage Zone no Bunny.net

1. Acesse [Bunny.net Dashboard](https://dash.bunny.net/)
2. Vá em **Storage** → **Storage Zones**
3. Clique em **Add Storage Zone**
4. Configure:
   - **Name**: escolha um nome (ex: `odontogpt-storage`)
   - **Region**: escolha a região mais próxima dos seus usuários
   - **Replication Regions**: (opcional) para redundância
5. Após criar, anote:
   - **Storage Zone Name**: será usado em `BUNNY_STORAGE_ZONE`
   - **FTP Password** ou **Access Key**: será usado em `BUNNY_STORAGE_API_KEY`

### Obter Access Key da Storage Zone

1. Na Storage Zone criada, vá em **Settings**
2. Role até **FTP & HTTP API**
3. Copie o **Access Key** (não confundir com FTP Password)
4. Este será o valor de `BUNNY_STORAGE_API_KEY`

## Passo 2: Criar Pull Zone no Bunny.net

1. No dashboard, vá em **CDN** → **Pull Zones**
2. Clique em **Add Pull Zone**
3. Configure:
   - **Name**: escolha um nome (ex: `odontogpt-cdn`)
   - **Origin URL**: URL da sua Storage Zone (ex: `https://odontogpt-storage.bunnycdn.com`)
   - **Cache Expiration Time**: configure conforme necessário (padrão: 1 mês)
4. Após criar, anote:
   - **Pull Zone ID**: será usado para referência
   - **CDN Hostname**: será usado em `BUNNY_CDN_BASE_URL` (ex: `https://odontogpt.b-cdn.net`)

### Configurar Pull Zone para Storage Zone

Para que o Pull Zone sirva arquivos da Storage Zone:

1. Na Pull Zone criada, vá em **Origin**
2. Em **Origin Type**, selecione **Storage Zone**
3. Escolha sua Storage Zone na lista
4. Salve as alterações

## Passo 3: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env.local` (local) e nas configurações da Vercel (produção):

```bash
# Bunny Storage Zone
BUNNY_STORAGE_ZONE=seu-storage-zone-name
BUNNY_STORAGE_API_KEY=sua-access-key-da-storage-zone
BUNNY_STORAGE_HOST=storage.bunnycdn.com

# Bunny CDN Pull Zone
BUNNY_CDN_BASE_URL=https://seu-pull-zone.b-cdn.net
```

### Variáveis Opcionais

```bash
# Host customizado (se usar região específica)
BUNNY_STORAGE_HOST=storage.bunnycdn.com

# Limite de tamanho para anexos (em MB)
NEXT_PUBLIC_MAX_ATTACHMENT_MB=10
```

## Passo 4: Configurar na Vercel (Produção)

1. Acesse seu projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione todas as variáveis listadas acima
4. Configure o ambiente apropriado (Production/Preview/Development)
5. Faça um novo deploy para aplicar as mudanças

## Passo 5: Verificar Configuração

### Teste Local

1. Crie um arquivo `.env.local` na raiz do projeto com as variáveis acima
2. Execute o projeto:
```bash
npm run dev
```
3. Tente fazer upload de um arquivo pelo admin
4. Verifique se o arquivo aparece corretamente na CDN

### Teste de Upload

O código já está configurado para usar essas variáveis. Quando você fizer upload de um arquivo:

1. O arquivo será enviado para a Storage Zone
2. A URL pública será gerada usando `BUNNY_CDN_BASE_URL`
3. O arquivo ficará acessível via CDN

## Estrutura de URLs

Após a configuração, as URLs dos arquivos seguirão este padrão:

```
{BUNNY_CDN_BASE_URL}/{storage_path}
```

Exemplo:
```
https://odontogpt.b-cdn.net/lessons/123/uuid-abc.pdf
```

## Troubleshooting

### Erro: "Configuração do Bunny Storage ausente"

- Verifique se todas as variáveis estão definidas no `.env.local`
- Certifique-se de que não há espaços extras nos valores
- Reinicie o servidor de desenvolvimento após adicionar variáveis

### Erro 401/403 ao fazer upload

- Verifique se `BUNNY_STORAGE_API_KEY` está correto
- Certifique-se de estar usando a **Access Key** da Storage Zone, não do Pull Zone
- Verifique se a Storage Zone está ativa no dashboard

### Arquivos não aparecem na CDN

- Verifique se o Pull Zone está configurado para usar a Storage Zone como origem
- Verifique se `BUNNY_CDN_BASE_URL` está correto (deve ser o hostname do Pull Zone)
- Aguarde alguns minutos para propagação do CDN

### URLs retornam 404

- Verifique se o caminho do arquivo está correto
- Certifique-se de que o arquivo foi enviado para a Storage Zone
- Verifique se o Pull Zone está configurado corretamente

## Referências

- [Bunny.net Storage Documentation](https://docs.bunny.net/docs/storage-api)
- [Bunny.net CDN Documentation](https://docs.bunny.net/docs/cdn)
- [Bunny.net Dashboard](https://dash.bunny.net/)

## Notas Importantes

1. **Access Key vs FTP Password**: Use sempre a **Access Key** para `BUNNY_STORAGE_API_KEY`, não a senha FTP
2. **Pull Zone vs Storage Zone**: O Pull Zone distribui conteúdo, a Storage Zone armazena. Configure o Pull Zone para usar a Storage Zone como origem
3. **Regiões**: Escolha regiões próximas aos seus usuários para melhor performance
4. **Cache**: O Pull Zone cacheia arquivos automaticamente. Para forçar atualização, use o painel do Bunny ou aguarde o TTL configurado






