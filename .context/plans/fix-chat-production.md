---
status: in-progress
generated: 2026-01-23
agents:
  - type: "bug-fixer"
    role: "Diagnosticar erros de produção e API failures"
  - type: "devops-specialist"
    role: "Verificar configurações da Vercel e variáveis de ambiente"
  - type: "backend-specialist"
    role: "Analisar e corrigir API routes e integrações"
  - type: "frontend-specialist"
    role: "Verificar componentes de chat e integração com API"
---

# Plano: Corrigir Chat em Produção (Vercel)

## Visão Geral

### Objetivo
Investigar e resolver problemas críticos que impedem o funcionamento do chat em produção (https://www.odontogpt.com/dashboard/chat), incluindo:
- Erros 404 para rota `/dashboard/notificacoes`
- Falhas na comunicação com a API `/api/newchat`
- Possíveis problemas de configuração de variáveis de ambiente na Vercel

### Escopo
**Incluído**:
- Diagnóstico completo dos erros de produção
- Verificação e atualização de variáveis de ambiente na Vercel
- Correção de rotas faltantes (notificações)
- Validação da API `/api/newchat` em produção
- Testes de integração do fluxo completo de chat
- Verificação de configurações do Vercel (Edge Runtime, timeouts, etc.)

**Excluído**:
- Refatoração completa do sistema de chat
- Mudanças de UI/UX não relacionadas ao bug
- Otimizações de performance não críticas

### Contexto
O chat funciona perfeitamente em desenvolvimento local, mas falha em produção. Os erros observados incluem:
1. `404` para `notificacoes?_rsc=18t7j` e `notificacoes?_rsc=j0a4x`
2. Falha silenciosa na comunicação com `/api/newchat`

**Componentes Envolvidos**:
- `app/dashboard/chat/page.tsx` - Página do chat
- `components/dashboard/odonto-ai-chat.tsx` - Componente principal do chat
- `app/api/newchat/route.ts` - API route para processamento de mensagens
- `components/dashboard/sidebar.tsx` - Link para notificações
- `lib/ai/chat-service.ts` - Serviço de persistência
- `lib/ai/openrouter.ts` - Integração com OpenRouter

### Stakeholders
- **Usuário Final**: Espera chat funcional em produção
- **Desenvolvedores**: Precisam de ambiente de produção estável
- **Equipe de DevOps**: Responsável por deployment e monitoramento

---

## Fases de Implementação

### FASE 1: Investigação e Diagnóstico (P - Plan)
**Objetivo**: Identificar a causa raiz dos problemas em produção

**Agentes**: `bug-fixer`, `devops-specialist`

**Passos**:

1. **Verificar Logs da Vercel**
   - Acessar dashboard da Vercel
   - Examinar logs de runtime para a rota `/api/newchat`
   - Identificar erros específicos (timeout, variáveis faltando, etc.)
   - Documentar stack traces e mensagens de erro

2. **Auditar Variáveis de Ambiente**
   - Comparar `.env.local` com variáveis na Vercel
   - Verificar se `OPENROUTER_API_KEY` está configurada
   - Confirmar URLs corretas (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`)
   - Verificar `NEXT_PUBLIC_AGNO_SERVICE_URL` (deve apontar para produção, não localhost)

3. **Validar Configurações do Edge Runtime**
   - Revisar `app/api/newchat/route.ts`:
     - `export const runtime = 'edge'`
     - `export const maxDuration = 60`
   - Verificar se há imports incompatíveis com Edge Runtime
   - Confirmar que `ChatService` e `openrouter` funcionam no Edge

4. **Testar Endpoint Diretamente**
   - Usar curl/Postman para testar `/api/newchat` em produção
   - Validar formato de request/response
   - Verificar headers e CORS

5. **Verificar Rota de Notificações**
   - Confirmar que `/app/dashboard/notificacoes/page.tsx` existe
   - Se não, planejar criação da rota

**Artefatos de Saída**:
- `investigation-report.md` - Relatório com todos os erros encontrados
- `env-comparison.md` - Comparação de variáveis local vs. produção
- `logs-snapshot.txt` - Logs relevantes da Vercel

**Critérios de Conclusão**:
- ✅ Causa raiz identificada e documentada
- ✅ Lista completa de variáveis faltantes/incorretas
- ✅ Todos os erros catalogados com stack traces

---

### FASE 2: Correções e Implementação (R - Review → E - Execute)
**Objetivo**: Aplicar correções necessárias no código e configuração

**Agentes**: `backend-specialist`, `frontend-specialist`, `devops-specialist`

**Passos**:

1. **Criar Rota de Notificações (se necessário)**
   - Criar `app/dashboard/notificacoes/page.tsx`
   - Implementar UI moderna seguindo padrão Perplexity AI
   - Adicionar metadata e layout adequado

2. **Corrigir Variáveis de Ambiente na Vercel**
   - Atualizar `NEXT_PUBLIC_AGNO_SERVICE_URL` para URL de produção
   - Verificar e adicionar variáveis faltantes
   - Garantir que `OPENROUTER_API_KEY` está presente e válida
   - Adicionar variáveis de Supabase se necessário

3. **Ajustar API Route `/api/newchat`**
   Possíveis correções:
   - Adicionar tratamento de erro mais robusto
   - Verificar compatibilidade com Edge Runtime
   - Adicionar logs para debugging em produção
   - Validar configuração do `streamText`
   - Corrigir problemas de serialização de mensagens

4. **Validar Integração com OpenRouter**
   - Verificar se `lib/ai/openrouter.ts` está configurado corretamente
   - Confirmar que model IDs são válidos
   - Testar fallback se modelo primário falhar

5. **Ajustar Cliente (odonto-ai-chat.tsx)**
   - Verificar configuração do `useChat`:
     - URL da API (`/api/newchat`)
     - Formato do body
     - Tratamento de erros
   - Adicionar logging condicional para produção
   - Melhorar feedback visual de erros

6. **Configurar Headers e CORS (se necessário)**
   - Adicionar em `next.config.mjs` se houver problemas de CORS
   - Configurar headers necessários para streaming

**Artefatos de Saída**:
- Pull Request com correções
- Atualização da documentação de environment variables
- Screenshots de configuração da Vercel

**Critérios de Conclusão**:
- ✅ Rota de notificações criada e funcionando
- ✅ Todas as variáveis de ambiente configuradas na Vercel
- ✅ Código atualizado e merged
- ✅ Build de produção bem-sucedido

---

### FASE 3: Validação e Deploy (V - Verify → C - Complete)
**Objetivo**: Testar correções em produção e validar funcionamento completo

**Agentes**: `test-writer`, `bug-fixer`, `code-reviewer`

**Passos**:

1. **Deploy para Produção**
   - Fazer push das alterações para branch principal
   - Aguardar build e deploy automático da Vercel
   - Verificar que não há erros de build

2. **Smoke Tests em Produção**
   - Acessar https://www.odontogpt.com/dashboard/chat
   - Verificar que não há erros 404 no console
   - Testar envio de mensagem simples
   - Validar que resposta é recebida corretamente
   - Testar troca de agentes
   - Verificar persistência de mensagens

3. **Teste de Casos de Borda**
   - Mensagens longas
   - Uso de ferramentas (artifacts)
   - Múltiplas mensagens em sequência
   - Timeout e retry

4. **Monitorar Logs em Tempo Real**
   - Acompanhar logs da Vercel durante testes
   - Verificar ausência de erros
   - Confirmar que métricas estão normais

5. **Validar Rota de Notificações**
   - Acessar `/dashboard/notificacoes`
   - Confirmar que página carrega sem erros
   - Verificar que não há mais 404s

6. **Teste de Regressão**
   - Verificar que outras funcionalidades não foram afetadas:
     - Login/Logout
     - Dashboard principal
     - Biblioteca
     - OdontoFlix
     - Odonto Vision

**Artefatos de Saída**:
- `production-test-report.md` - Resultado de todos os testes
- Screenshots de chat funcionando
- Logs confirmando sucesso

**Critérios de Conclusão**:
- ✅ Chat funciona perfeitamente em produção
- ✅ Zero erros 404 no console
- ✅ Mensagens enviadas e recebidas corretamente
- ✅ Notificações acessível sem erros
- ✅ Todos os testes de smoke passando

---

## Checklist de Execução

### Pré-Requisitos
- [ ] Acesso ao dashboard da Vercel
- [ ] Permissões para atualizar variáveis de ambiente
- [ ] Acesso ao repositório Git
- [ ] Credenciais válidas de OpenRouter

### Fase 1: Investigação
- [ ] Logs da Vercel analisados
- [ ] Variáveis de ambiente auditadas
- [ ] Configurações Edge verificadas
- [ ] Endpoint testado diretamente
- [ ] Relatório de investigação criado

### Fase 2: Correções
- [ ] Rota de notificações criada
- [ ] Variáveis na Vercel atualizadas
- [ ] API `/api/newchat` corrigida
- [ ] Integração OpenRouter validada
- [ ] Cliente ajustado
- [ ] PR criado e aprovado
- [ ] Build bem-sucedido

### Fase 3: Validação
- [ ] Deploy para produção concluído
- [ ] Smoke tests passando
- [ ] Casos de borda testados
- [ ] Logs monitorados
- [ ] Notificações funcionando
- [ ] Teste de regressão OK
- [ ] Documentação atualizada

---

## Questões em Aberto

1. **NEXT_PUBLIC_AGNO_SERVICE_URL**: Qual é a URL de produção do serviço Agno?
   - Verificar se está no Railway ou outro provedor
   - Confirmar endpoint correto

2. **OpenRouter API Key**: A chave em `.env.local` é a mesma de produção?
   - Verificar se precisa de chave separada

3. **Edge Runtime**: Todas as dependências são compatíveis?
   - `ChatService` usa apenas APIs Edge-safe?
   - `openrouter` library funciona no Edge?

4. **Supabase**: Connection strings estão corretas em produção?
   - Verificar service role key
   - Confirmar URL pública

---

## Rollback Plan

### Rollback Triggers
- Chat continua não funcionando após correções
- Novos erros críticos introduzidos
- Performance degradada significativamente
- Usuários relatando problemas graves

### Procedimentos de Rollback

#### Rollback Rápido (Vercel)
1. Acessar Vercel Dashboard
2. Navegar para "Deployments"
3. Selecionar deployment anterior funcional
4. Clicar em "Promote to Production"
5. **Tempo estimado**: 2-5 minutos

#### Rollback de Código
1. Reverter commit: `git revert <commit-hash>`
2. Push para main: `git push origin main`
3. Aguardar auto-deploy
4. **Tempo estimado**: 5-10 minutos

#### Rollback de Variáveis de Ambiente
1. Acessar Settings → Environment Variables na Vercel
2. Reverter para valores anteriores
3. Triggerar novo deploy
4. **Tempo estimado**: 5 minutos

### Post-Rollback
1. Documentar motivo do rollback em issue
2. Notificar equipe via Slack/Discord
3. Agendar post-mortem (24-48h)
4. Revisar plano antes de nova tentativa

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Variável de ambiente incorreta | Alta | Alto | Dupla verificação antes de salvar |
| Edge Runtime incompatibilidade | Média | Alto | Testar localmente com `vercel dev` |
| OpenRouter rate limiting | Baixa | Médio | Implementar retry logic |
| CORS issues | Média | Médio | Configurar headers no next.config |
| Timeout em produção | Média | Alto | Aumentar maxDuration se necessário |

---

## Evidence & Follow-up

### Artefatos a Coletar
- [ ] Screenshots de chat funcionando em produção
- [ ] Logs da Vercel (antes e depois)
- [ ] Configuração de variáveis de ambiente (sanitizada)
- [ ] Resultados de testes (Playwright ou manual)
- [ ] PR links e review comments
- [ ] Build logs da Vercel

### Métricas de Sucesso
- **Taxa de sucesso de mensagens**: > 99%
- **Tempo de resposta médio**: < 5s
- **Taxa de erro**: < 0.1%
- **Uptime do chat**: > 99.9%

### Ações de Acompanhamento
1. Configurar monitoring de erro no Sentry para `/api/newchat`
2. Adicionar testes E2E para fluxo de chat
3. Documentar processo de debug de produção
4. Criar runbook para problemas comuns de chat

---

## Notas Técnicas

### Diferenças Local vs. Produção

**Desenvolvimento Local**:
- Runtime: Node.js
- Hot reload ativo
- Variáveis de `.env.local`
- Sem restrições de timeout
- Logs completos no terminal

**Produção (Vercel)**:
- Runtime: Edge (V8 Isolates)
- Build otimizado
- Variáveis da Vercel Dashboard
- Timeout máximo: 60s (Edge)
- Logs limitados/filtrados

### Comandos Úteis

```bash
# Testar edge runtime localmente
vercel dev

# Ver logs em tempo real
vercel logs --follow

# Listar variáveis de ambiente
vercel env ls

# Pull variáveis de produção
vercel env pull .env.production

# Forçar novo deployment
vercel --prod --force
```

### Links de Referência
- [Vercel Edge Runtime](https://vercel.com/docs/functions/edge-functions)
- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
