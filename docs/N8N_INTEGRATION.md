# Integração com N8N - Odonto GPT

## Visão Geral

O chat do Odonto GPT está integrado com um webhook N8N que processa as mensagens usando IA (OpenAI GPT-4o-mini) e ferramentas especializadas em odontologia.

## Configuração

### 1. Variáveis de Ambiente

Adicione a seguinte variável no arquivo `.env.local`:

```env
N8N_WEBHOOK_URL=https://devthierryc.app.n8n.cloud/webhook-test/conexão n8n odonto gpt
```

### 2. Webhook N8N

O webhook está configurado para receber mensagens no seguinte formato:

```json
{
  "action": "sendMessage",
  "sessionId": "user-id",
  "chatInput": "mensagem do usuário",
  "metadata": {
    "plan": "free",
    "timestamp": "2025-11-06T..."
  }
}
```

### 3. Fluxo de Processamento

1. **Usuário envia mensagem** → Frontend (`components/chat/chat-interface.tsx`)
2. **POST /api/chat** → API Route (`app/api/chat/route.ts`)
3. **Webhook N8N** → Processa com IA
4. **Resposta retorna** → Exibida no chat

## Estrutura do Workflow N8N

O workflow N8N (`public/Odonto gpt.json`) inclui:

- **Chat Trigger**: Recebe mensagens via webhook
- **AI Agent**: Processa com LangChain
- **OpenAI Chat Model**: GPT-4o-mini para respostas
- **Memory Buffer**: Mantém contexto (últimas 6 mensagens)
- **Tool Code**: FAQ técnico de odontologia
- **HTTP Request**: Integração opcional com Z-API (WhatsApp)

## Formato da Resposta

O N8N deve retornar um JSON com uma das seguintes chaves:

```json
{
  "output": "resposta da IA",
  // ou
  "reply": "resposta da IA",
  // ou
  "message": "resposta da IA",
  // ou
  "response": "resposta da IA"
}
```

## Tratamento de Erros

A API implementa:

- Validação de variável de ambiente
- Tratamento de erros HTTP
- Logging detalhado no console
- Mensagens de erro amigáveis para o usuário

## Testando a Integração

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse o chat em: `http://localhost:3000/dashboard/chat`

3. Envie uma mensagem de teste

4. Verifique os logs no console para debug:
   - `Calling N8N webhook: ...`
   - `N8N response: ...`

## Troubleshooting

### Erro: "Webhook não configurado"
- Verifique se `N8N_WEBHOOK_URL` está definido no `.env.local`
- Reinicie o servidor Next.js após adicionar variáveis de ambiente

### Erro: "Erro ao processar mensagem"
- Verifique se o webhook N8N está ativo
- Teste o webhook diretamente usando curl:
  ```bash
  curl -X POST "https://devthierryc.app.n8n.cloud/webhook-test/conexão n8n odonto gpt" \
    -H "Content-Type: application/json" \
    -d '{"action":"sendMessage","sessionId":"test","chatInput":"Olá"}'
  ```

### Resposta vazia ou genérica
- Verifique a estrutura da resposta do N8N
- Ajuste o código em `app/api/chat/route.ts:52` conforme necessário

## Segurança

- O `.env.local` está no `.gitignore` e não será commitado
- Use HTTPS para comunicação com webhook
- Valide e sanitize entradas do usuário
- Implemente rate limiting em produção

## Próximos Passos

- [ ] Adicionar streaming de respostas em tempo real
- [ ] Implementar retry logic para falhas de rede
- [ ] Adicionar telemetria e analytics
- [ ] Configurar rate limiting por usuário
- [ ] Implementar cache de respostas frequentes
