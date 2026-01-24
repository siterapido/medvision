---
status: active
generated: 2026-01-24
agents:
  - type: "bug-fixer"
    role: "Analisar erros no console e logs da API"
  - type: "frontend-specialist"
    role: "Investigar componentes React e estado do chat"
phases:
  - id: "phase-1"
    name: "Coleta de Evidências"
    prevc: "P"
  - id: "phase-2"
    name: "Análise e Diagnóstico"
    prevc: "E"
  - id: "phase-3"
    name: "Correção e Validação"
    prevc: "V"
---

# Investigação: Chat Bloqueado para Envio de Mensagens

> Investigar e resolver o problema que impede o envio de mensagens no chat do Odonto GPT (odontogpt.com/dashboard/chat)

## Task Snapshot
- **Primary goal:** Identificar a causa raiz do bloqueio de envio de mensagens e restaurar a funcionalidade do chat
- **Success signal:** Usuário consegue enviar mensagens e receber respostas da IA no chat
- **Sintoma observado:** Campo de input visível mas botão de envio não funciona ou mensagens não são enviadas

## Arquivos Críticos para Investigação

| Arquivo | Propósito |
|---------|-----------|
| `app/(dashboard)/dashboard/chat/page.tsx` | Página principal do chat |
| `components/chat/` | Componentes do chat (input, messages, etc.) |
| `app/api/chat/route.ts` | Rota unificada da API de chat |
| `lib/ai/agents/config.ts` | Configuração dos agentes de IA |
| `lib/supabase/server.ts` | Cliente Supabase para autenticação |
| `middleware.ts` | Proteção de rotas e sessão |

## Working Phases

### Phase 1 — Coleta de Evidências

**Steps**
1. **Verificar Console do Browser**
   - [ ] Capturar erros JavaScript no console
   - [ ] Verificar requisições de rede (Network tab)
   - [ ] Identificar se há erros 401/403/500

2. **Verificar Autenticação**
   - [ ] Confirmar que usuário está autenticado
   - [ ] Verificar se sessão Supabase é válida
   - [ ] Checar middleware de proteção de rota

3. **Verificar API de Chat**
   - [ ] Testar endpoint `/api/chat` diretamente
   - [ ] Verificar variáveis de ambiente (OPENROUTER_API_KEY)
   - [ ] Checar logs do servidor

4. **Verificar Componentes Frontend**
   - [ ] Analisar estado do componente de chat
   - [ ] Verificar hook `useChat` do AI SDK
   - [ ] Checar se botão de envio está desabilitado e por quê

### Phase 2 — Análise e Diagnóstico

**Possíveis Causas a Investigar**

| Categoria | Causa Possível | Como Verificar |
|-----------|----------------|----------------|
| **Auth** | Sessão expirada ou inválida | Console errors, Network 401 |
| **Auth** | Usuário não tem permissão | Verificar RLS policies |
| **API** | API key do OpenRouter inválida | Logs do servidor, .env |
| **API** | Rota `/api/chat` com erro | Network tab, server logs |
| **Frontend** | Estado do React corrompido | React DevTools |
| **Frontend** | Hook useChat não inicializado | Console, component state |
| **Frontend** | Botão disabled por condição | Inspecionar elemento |
| **Database** | Tabela agent_sessions com problema | Supabase logs |
| **Build** | Build desatualizado em produção | Verificar deploy Vercel |

### Phase 3 — Correção e Validação

**Steps**
1. Aplicar correção baseada no diagnóstico
2. Testar localmente com `npm run dev`
3. Verificar em produção após deploy
4. Confirmar que mensagens são enviadas e respondidas

## Comandos de Debug Úteis

```bash
# Verificar variáveis de ambiente
npm run validate:env

# Verificar status do banco
npm run db:status

# Build local para detectar erros
npm run build

# Logs do Vercel
vercel logs
```

## Checklist de Investigação Rápida

- [ ] Console do browser mostra erros?
- [ ] Network tab mostra falha na requisição POST /api/chat?
- [ ] Usuário está logado? (verificar supabase.auth.getUser())
- [ ] OPENROUTER_API_KEY está configurada em produção?
- [ ] Última deploy foi bem-sucedida?
- [ ] Botão de envio está visualmente desabilitado?
- [ ] Input aceita texto?

## Evidence & Follow-up

| Evidência | Status | Notas |
|-----------|--------|-------|
| Screenshots do console | Pendente | |
| Network requests log | Pendente | |
| Server logs | Pendente | |
| Estado dos componentes React | Pendente | |
