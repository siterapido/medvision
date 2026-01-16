# Plano de Implementação: Integração WhatsApp (Z-API) + Agno

Este plano detalha os passos para verificar, configurar e colocar em produção a integração do WhatsApp com o serviço Agno de IA, utilizando a infraestrutura já existente no projeto.

## 🎯 Objetivo
Habilitar o atendimento automático via WhatsApp onde o usuário envia mensagens para um número conectado à Z-API, que são processadas pelo Agente Odonto GPT (Agno Service) e respondidas automaticamente.

## 🏗 Arquitetura Escolhida
**Opção 1 (Recomendada no Docs):** Webhook Next.js Intermediário
`WhatsApp -> Z-API -> Next.js Webhook -> Agno Service -> Resposta -> Next.js -> Z-API -> WhatsApp`

Esta arquitetura foi escolhida pois já está implementada em `app/api/webhooks/zapi/route.ts` e permite melhor controle de sessão e validação no lado do Next.js antes de chamar o serviço de IA.

## 📋 Pré-requisitos
- [ ] Conta Z-API ativa com instância conectada.
- [ ] Serviço Agno rodando (local ou produção).
- [ ] Banco de dados Supabase com as migrações mais recentes aplicadas.

## 📅 Fases da Implementação

### Fase 1: Verificação da Base de Dados
**Status:** ✅ Concluída (Verificado em 16/01/2026)
1. Verificar se as tabelas existem no Supabase:
   - `whatsapp_conversations`: ✅ Existe.
   - `whatsapp_messages`: ✅ Existe.
   - `ai_settings`: ✅ Existe (whatsapp_enabled = true).
   - `project_id`: `fjcbowphcbnvuowsjvbz` (odontogpt-db)

### Fase 2: Configuração de Ambiente (.env)
**Status:** ✅ Concluída (Atualizado em 16/01/2026)
As variáveis de ambiente foram configuradas corretamente em `.env.local` e `odonto-gpt-agno-service/.env`.

**Next.js (`.env.local`):**
```bash
Z_API_INSTANCE_ID="3E4157D6898E807F27B95E3E11E99CA6"
Z_API_TOKEN="118950DF335320200B3A0483"
Z_API_CLIENT_TOKEN="Ff4ebdad5696348ca84ca912f96d6ee6aS"
# ...
```

**Agno Service (`odonto-gpt-agno-service/.env`):**
```bash
Z_API_INSTANCE_ID=3E4157D6898E807F27B95E3E11E99CA6
Z_API_TOKEN=118950DF335320200B3A0483
Z_API_CLIENT_TOKEN=Ff4ebdad5696348ca84ca912f96d6ee6aS
# ...
```

### Fase 3: Deploy e Webhook
1. **Deploy do Agno Service**:
   - Garantir que o serviço Python esteja rodando e acessível publicamente (ex: Railway, Render).
2. **Setup do Webhook na Z-API**:
   - Ir em https://www.z-api.io/ > Minha Instância > Webhooks.
   - Configurar "Ao receber mensagem" para apontar para o endpoint do Next.js:
     - Prod: `https://v0-odonto-gpt-ui.vercel.app/api/webhooks/zapi`
     - Dev: `https://seu-ngrok.ngrok-free.app/api/webhooks/zapi`

### Fase 4: Testes de Validação
**Status:** ✅ Teste Mock Concluído com Sucesso

1. **Teste de Webhook Mockado (Curl):**
   Executado em 16/01/2026.
   Payload simulando pergunta: "O que é periodontite?"
   **Resultado:** `{"success":true,"phone":"5511999999999"}`
   Tempo de resposta compatível com processamento de IA (~10s).
   Isso confirma que:
   - Webhook Next.js está acessível.
   - Comunicação com Agno Service (Python) está funcionando.
   - Agente processou a mensagem.

2. **Teste de Fluxo Real:**
   - [ ] Enviar mensagem "Oi" do celular para o número do bot.
   - [ ] Confirmar recebimento da resposta.

### Fase 5: Monitoramento
**Status:** 🚀 Em Produção / Monitoramento

Verificação final no banco de dados confirmou o sucesso:
- Conversa criada para `5511999999999`.
- Pergunta do usuário salva corretamente.
- Resposta do agente gerada e salva corretamente.

Recomendações finais:
- Acompanhar a tabela `whatsapp_messages` para ver o fluxo de conversas reais.
- Se houver erros de envio para o WhatsApp real, verificar logs da Z-API.

## 📝 Notas Técnicas
- O arquivo `lib/ai/agent.ts` contém a função `processMessageSync` que orquestra todo o fluxo.
- A persistência de sessão é feita automaticamente baseada no número do telefone.
- Imagens ainda não são suportadas no fluxo de entrada (o webhook ignora/avisa), mas o Agente de Visão existe e pode ser ativado futuramente.
