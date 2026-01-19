---
status: active
generated: 2026-01-19
priority: critical
agents:
  - type: "devops-specialist"
    role: "Investigar e restaurar o serviço Railway"
  - type: "bug-fixer"
    role: "Diagnosticar erros de conexao e timeout"
  - type: "backend-specialist"
    role: "Verificar configuracao do Agno Service"
  - type: "frontend-specialist"
    role: "Melhorar tratamento de erros no chat UI"
docs:
  - "architecture.md"
  - "tooling.md"
phases:
  - id: "phase-1"
    name: "Diagnostico do Backend Railway"
    prevc: "P"
  - id: "phase-2"
    name: "Restauracao do Servico"
    prevc: "E"
  - id: "phase-3"
    name: "Melhorias de Resiliencia"
    prevc: "E"
  - id: "phase-4"
    name: "Validacao e Monitoramento"
    prevc: "V"
---

# Plano de Correcao - Conectividade do Chat OdontoGPT

> Plano para diagnosticar e corrigir problemas de conectividade do chat com o backend Agno Service hospedado no Railway

## Resumo do Problema Identificado

### Sintomas Observados
Durante a verificacao do chat em `https://www.odontogpt.com/dashboard/chat`:

1. **Mensagem de erro**: "Servico OdontoGPT nao esta disponivel. Verifique se o backend esta rodando."
2. **Status Offline**: Indicador vermelho mostrando "Offline"
3. **Agentes nao carregam**: Mensagem "Carregando agentes..." permanece indefinidamente
4. **Input desabilitado**: Placeholder mostra "AgentOS desconectado..."

### Causa Raiz
O backend hospedado no Railway (`https://v0-odonto-gpt-ui-production.up.railway.app`) esta **completamente inacessivel**:

```
Health Check: Failed to fetch (v0-odonto-gpt-ui-production.up.railway.app)
Agents API:   Failed to fetch (v0-odonto-gpt-ui-production.up.railway.app)
```

### Arquitetura Afetada

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vercel)                           │
│  odontogpt.com/dashboard/chat                                   │
│                                                                 │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │  AgnoChat.tsx   │────▶│ useAgnoAgents   │                   │
│  │                 │     │ useAgnoChat     │                   │
│  └─────────────────┘     └────────┬────────┘                   │
└────────────────────────────────────┼────────────────────────────┘
                                     │
                                     ▼ FALHA AQUI
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Railway) - OFFLINE                   │
│  v0-odonto-gpt-ui-production.up.railway.app                     │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  /health    │  │ /api/v1/    │  │ /api/v1/    │             │
│  │             │  │  agentes    │  │  equipe/chat│             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Task Snapshot

- **Primary goal**: Restaurar a conectividade do chat OdontoGPT com o backend Agno Service
- **Success signal**: 
  - Health check retorna status 200
  - Lista de agentes carrega corretamente
  - Usuario consegue enviar mensagens e receber respostas
  - Indicador mostra "Ativo" (verde)
- **Key references:**
  - [Agno Service](/odonto-gpt-agno-service/)
  - [lib/hooks/useAgnoAgents.ts](/lib/hooks/useAgnoAgents.ts)
  - [lib/hooks/useAgnoChat.ts](/lib/hooks/useAgnoChat.ts)

## Arquivos Criticos

| Arquivo | Funcao | Linha Chave |
|---------|--------|-------------|
| `lib/ai/agno-service.ts:4` | URL do backend | `AGNO_SERVICE_URL = process.env.AGNO_SERVICE_URL \|\| "https://v0-odonto-gpt-ui-production.up.railway.app/api/v1"` |
| `lib/hooks/useAgnoAgents.ts:39` | Health check | `NEXT_PUBLIC_AGNO_SERVICE_URL` |
| `lib/agno.ts:14` | Config base | `baseUrl: process.env.NEXT_PUBLIC_AGNO_SERVICE_URL` |
| `odonto-gpt-agno-service/app/main.py` | App FastAPI | Endpoints /health, /api/v1/* |
| `odonto-gpt-agno-service/railway.json` | Deploy config | healthcheckPath: "/health" |

## Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Railway pode ter custos nao pagos | Alta | Critico | Verificar billing no Railway dashboard |
| Railway sleep mode em plano free | Alta | Alto | Upgrade para plano Pro ou configurar keep-alive |
| Variaveis de ambiente faltando | Media | Alto | Verificar env vars no Railway |
| Dependencias Python desatualizadas | Baixa | Medio | Verificar requirements.txt |

## Working Phases

### Phase 1 - Diagnostico do Backend Railway (P)

**Objetivo**: Identificar por que o servico esta inacessivel

**Steps**:

1. **Acessar Railway Dashboard**
   - URL: https://railway.app/dashboard
   - Verificar status do projeto `v0-odonto-gpt-ui-production`
   - Checar logs de deploy e runtime

2. **Verificar Status do Servico**
   ```bash
   # Testar endpoints diretamente
   curl -v https://v0-odonto-gpt-ui-production.up.railway.app/health
   curl -v https://v0-odonto-gpt-ui-production.up.railway.app/api/v1/agentes
   ```

3. **Analisar Possiveis Causas**
   - [ ] Servico crashou (verificar logs)
   - [ ] Plano free com sleep mode ativado
   - [ ] Billing expirado/problema de pagamento
   - [ ] Deploy falhou
   - [ ] Variaveis de ambiente faltando (OPENAI_API_KEY, etc.)
   - [ ] Dominio/DNS com problema

4. **Coletar Evidencias**
   - Screenshot do dashboard Railway
   - Logs de erro
   - Status do ultimo deploy

**Owner**: DevOps Specialist

---

### Phase 2 - Restauracao do Servico (E)

**Objetivo**: Fazer o backend voltar a funcionar

**Opcao A - Se o servico crashou/pausou**:

1. **Restart do Servico**
   ```bash
   # Via Railway CLI
   railway up
   # Ou via dashboard: Redeploy
   ```

2. **Verificar Environment Variables**
   Variaveis necessarias no Railway:
   ```
   OPENAI_API_KEY=sk-...
   ALLOWED_ORIGINS=https://www.odontogpt.com,https://odontogpt.com
   PORT=8000
   ```

3. **Verificar Logs de Deploy**
   - Confirmar que o Dockerfile buildou com sucesso
   - Verificar se o healthcheck passou

**Opcao B - Se for problema de plano/billing**:

1. **Upgrade para Railway Pro** (recomendado para producao)
   - Evita sleep mode
   - Melhor uptime
   - Suporte prioritario

2. **Alternativa: Implementar Keep-Alive**
   - Configurar cron job para pingar /health a cada 5 min
   - Pode ser feito via Vercel Cron ou external service

**Opcao C - Se o dominio/projeto foi deletado**:

1. **Recriar o Projeto**
   ```bash
   cd odonto-gpt-agno-service
   railway login
   railway init
   railway up
   ```

2. **Atualizar URL no Frontend**
   - Atualizar `NEXT_PUBLIC_AGNO_SERVICE_URL` no Vercel
   - Atualizar `AGNO_SERVICE_URL` no Vercel

**Owner**: DevOps Specialist + Backend Specialist

---

### Phase 3 - Melhorias de Resiliencia (E)

**Objetivo**: Prevenir problemas futuros e melhorar UX quando backend estiver offline

**3.1 - Melhorar Tratamento de Erros no Frontend**

Arquivo: `lib/hooks/useAgnoAgents.ts`

```typescript
// Adicionar retry logic
const loadAgents = useCallback(async (retryCount = 0) => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;
  
  try {
    // ... codigo existente
  } catch (err) {
    if (retryCount < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, RETRY_DELAY));
      return loadAgents(retryCount + 1);
    }
    // ... tratamento de erro existente
  }
}, []);
```

**3.2 - Adicionar Fallback UI**

Arquivo: `components/agno-chat/agno-chat.tsx`

```typescript
// Mostrar mensagem mais amigavel quando offline
{!isConnected && (
  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
    <p className="text-amber-400">
      O servico de IA esta temporariamente indisponivel.
      Tente novamente em alguns minutos.
    </p>
    <button onClick={() => refresh()}>Tentar Novamente</button>
  </div>
)}
```

**3.3 - Implementar Health Check Periodico**

```typescript
// Em useAgnoAgents.ts - verificar conexao periodicamente
useEffect(() => {
  const interval = setInterval(loadAgents, 30000); // 30s
  return () => clearInterval(interval);
}, [loadAgents]);
```

**3.4 - Adicionar Monitoramento**

- Configurar alertas no Sentry para erros de conexao
- Adicionar uptime monitoring (UptimeRobot, Better Uptime)

**Owner**: Frontend Specialist

---

### Phase 4 - Validacao e Monitoramento (V)

**Objetivo**: Confirmar que tudo esta funcionando e configurar alertas

**Steps**:

1. **Testar Fluxo Completo**
   - [ ] Acessar https://www.odontogpt.com/dashboard/chat
   - [ ] Verificar status "Ativo" (verde)
   - [ ] Lista de agentes carrega (Odonto Flow, etc.)
   - [ ] Enviar mensagem de teste
   - [ ] Receber resposta do agente
   - [ ] Verificar historico de conversas

2. **Verificar Endpoints**
   ```bash
   curl https://v0-odonto-gpt-ui-production.up.railway.app/health
   # Esperado: {"status": "healthy"}
   
   curl https://v0-odonto-gpt-ui-production.up.railway.app/api/v1/agentes
   # Esperado: {"agentes": [...]}
   ```

3. **Configurar Monitoramento**
   - [ ] UptimeRobot ou similar para /health
   - [ ] Alertas no Sentry para erros de conexao
   - [ ] Notificacao no Slack/Discord quando servico cair

4. **Documentar**
   - [ ] Atualizar AGENTS.md com procedimento de restart
   - [ ] Criar runbook para incidentes futuros

**Owner**: DevOps Specialist

---

## Checklist de Validacao Final

- [ ] Health check retorna 200
- [ ] Lista de agentes carrega em < 2s
- [ ] Chat envia e recebe mensagens
- [ ] Historico de conversas funciona
- [ ] Status mostra "Ativo" (verde)
- [ ] Sem erros no console do navegador
- [ ] Monitoramento configurado
- [ ] Documentacao atualizada

## Comandos Uteis

```bash
# Testar backend localmente
cd odonto-gpt-agno-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Deploy via Railway CLI
railway login
railway up

# Ver logs do Railway
railway logs

# Testar endpoints
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/agentes
```

## Contatos de Emergencia

- **Railway Support**: https://railway.app/help
- **Documentacao Agno**: https://docs.agno.com
- **Sentry Dashboard**: https://insightfy-dr.sentry.io

---

## Evidence & Follow-up

| Artefato | Status | Link/Localizacao |
|----------|--------|------------------|
| Screenshot do erro | Coletado | Sessao de analise |
| Logs do Railway | Pendente | Dashboard Railway |
| PR de melhorias | Pendente | GitHub |
| Configuracao de monitoramento | Pendente | UptimeRobot |
