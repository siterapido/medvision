# Testing Checklist - AI SDK Modernização

## ✅ Pre-Deploy Verification

### Build & Compilation
- [x] TypeScript compila sem erros
- [x] Build Next.js completa com sucesso
- [x] Nenhum warning crítico

### Code Quality
- [x] Todos handlers habilitados
- [x] Tools habilitadas no route.ts
- [x] Structured generation implementada
- [x] Error handling implementado
- [x] Analytics implementado
- [x] Intent detection implementado

---

## 🧪 Manual Testing (Pós-Deploy)

### Test 1: Summary Artifact ✅ CRÍTICO
```
Prompt: "Crie um resumo sobre endodontia"

Verificar:
[ ] Intent detectado no log: { tool: 'createDocument', kind: 'summary' }
[ ] Tool createDocument foi chamada
[ ] Artifact gerado com estrutura válida
[ ] Artifact salvo no banco (verificar tabela artifacts)
[ ] Resposta contém o resumo completo
[ ] Nenhum parsing error

Logs esperados:
[Chat] Intent detected: { tool: 'createDocument', kind: 'summary', confidence: 'high' }
[Structured Generation] Generating summary artifact...
[Structured Generation] ✓ summary artifact generated successfully
[createDocument] ✓ summary "..." saved for user ...
```

### Test 2: Flashcards Artifact ✅ CRÍTICO
```
Prompt: "Faça flashcards sobre periodontia"

Verificar:
[ ] Intent detectado: { kind: 'flashcards' }
[ ] 5-20 flashcards gerados
[ ] Cada card tem: front, back
[ ] Artifact salvo no banco
[ ] Estrutura válida (nenhum campo null/undefined)

Validar estrutura:
{
  title: "...",
  topic: "periodontia",
  cards: [
    { front: "...", back: "...", category: "..." },
    // ... 5-20 cards
  ]
}
```

### Test 3: Quiz Artifact ✅ CRÍTICO
```
Prompt: "Gere um quiz sobre ortodontia"

Verificar:
[ ] Intent detectado: { kind: 'quiz' }
[ ] 5-15 questões geradas
[ ] Cada questão tem EXATAMENTE 5 alternativas (A-E)
[ ] Apenas 1 alternativa marcada como isCorrect: true
[ ] Cada questão tem explanation
[ ] Estrutura válida

Validar estrutura de uma questão:
{
  text: "Qual é...",
  options: [
    { id: "A", text: "...", isCorrect: false },
    { id: "B", text: "...", isCorrect: true },
    { id: "C", text: "...", isCorrect: false },
    { id: "D", text: "...", isCorrect: false },
    { id: "E", text: "...", isCorrect: false },
  ],
  explanation: "A resposta correta é B porque..."
}
```

### Test 4: Research Artifact
```
Prompt: "Pesquise sobre implantes dentários"

Verificar:
[ ] Intent detectado: { kind: 'research' }
[ ] 3-10 fontes citadas
[ ] Cada fonte tem: title, url, summary
[ ] Conteúdo síntese gerado
[ ] URLs válidas (formato http/https)
```

### Test 5: Report Artifact
```
Prompt: "Analise esta radiografia" (com imagem anexada)

Verificar:
[ ] Intent detectado: { kind: 'report' }
[ ] examType preenchido
[ ] findings array com achados
[ ] recommendations array (se aplicável)
[ ] Disclaimer sobre limitações de IA
```

### Test 6: Intent Detection - Variações
```
Teste diferentes formas de pedir resumo:

Prompts:
1. "Crie um resumo sobre..."
2. "Faça um resumo de..."
3. "Resuma sobre..."
4. "Sintetize o tema..."

Verificar:
[ ] Todos detectam intent corretamente
[ ] toolChoice forçado para createDocument
```

### Test 7: Error Handling
```
Teste cenários de erro:

1. Rate Limit (429):
   - Fazer muitas requisições em sequência
   - Verificar: mensagem "Muitas requisições..."
   - Verificar: type: 'rate_limit'

2. Invalid Model (se aplicável):
   - Usar modelId inexistente
   - Verificar: mensagem clara de erro

3. Tool Error:
   - Forçar erro em createDocument (params inválidos)
   - Verificar: type: 'tool_args_error'
```

### Test 8: Analytics & Telemetry
```
Verificar logs do console:

[ ] [Chat] Intent detected aparece
[ ] [AI Step] mostra progresso de cada step
[ ] [Structured Generation] mostra geração
[ ] [createDocument] mostra tempo de geração
[ ] [AI Completion] mostra métricas finais:
    - tokens (prompt, completion, total)
    - cost (calculado corretamente)
    - duration em ms
    - toolsUsed array
    - artifactType
```

### Test 9: Performance
```
Medir tempos:

[ ] Summary: ~2-5 segundos (blocking)
[ ] Flashcards: ~3-6 segundos (mais cards)
[ ] Quiz: ~4-7 segundos (mais questões)
[ ] Research: ~5-10 segundos (busca + síntese)

Nota: Tempos variam com modelo e complexidade
```

### Test 10: Database Persistence
```
Verificar no Supabase:

Tabela: artifacts

SELECT * FROM artifacts
WHERE user_id = '<test-user-id>'
ORDER BY created_at DESC
LIMIT 10;

Verificar:
[ ] Artifact salvo corretamente
[ ] kind correto (summary, flashcards, quiz, etc)
[ ] content JSONB válido
[ ] user_id, session_id, agent_id preenchidos
[ ] created_at timestamp correto
```

---

## 🔍 Edge Cases

### Edge Case 1: Greeting (não deve chamar tool)
```
Prompt: "Oi, tudo bem?"

Verificar:
[ ] Intent NÃO detectado (null)
[ ] Tool NÃO chamada
[ ] Resposta conversacional normal
```

### Edge Case 2: Pergunta sem intent claro
```
Prompt: "O que é endodontia?"

Verificar:
[ ] Intent pode ser null ou askPerplexity
[ ] toolChoice: 'auto' (deixa LLM decidir)
[ ] Resposta apropriada
```

### Edge Case 3: Multiple intents em uma mensagem
```
Prompt: "Crie um resumo sobre endodontia e depois faça flashcards"

Verificar:
[ ] Sistema lida corretamente
[ ] Primeiro intent detectado (summary)
[ ] Ou LLM decide fazer múltiplas ferramentas (maxSteps)
```

### Edge Case 4: Structured generation failure
```
Simular falha de schema validation (modificar schema temporariamente)

Verificar:
[ ] Error handler captura: type: 'validation_error'
[ ] Log mostra detalhes do erro
[ ] Mensagem user-friendly retornada
```

---

## 📊 Success Metrics

### CRITICAL ✅
- [ ] 100% de artefatos gerados são válidos (zero parsing errors)
- [ ] Todas as 8 kinds funcionam (summary, flashcards, quiz, research, report, code, text, diagram)
- [ ] Intent detection funciona para comandos comuns
- [ ] Tools habilitadas e executando corretamente
- [ ] Artifacts salvos no banco automaticamente

### IMPORTANT ✅
- [ ] Telemetry logging visível no console
- [ ] Error handling com mensagens claras
- [ ] Performance aceitável (<10s para maioria dos artifacts)
- [ ] Custo calculado corretamente

### NICE TO HAVE ✅
- [ ] Todos logs estruturados e legíveis
- [ ] Métricas de tokens precisas
- [ ] Progress tracking visível (onStepFinish)

---

## 🚨 Red Flags (Falhas Críticas)

Se algum destes ocorrer, NÃO fazer deploy:

- [ ] ❌ Build falha ou tem erros TypeScript
- [ ] ❌ createDocument retorna estrutura inválida
- [ ] ❌ Parsing errors em artefatos
- [ ] ❌ Tools não sendo chamadas quando deveria
- [ ] ❌ Database insert falha (artifacts não salvos)
- [ ] ❌ Error handler não captura erros de API

---

## 🎯 Deploy Checklist

Antes de fazer deploy para produção:

- [ ] Todos testes manuais passaram
- [ ] Zero red flags identificados
- [ ] Build compilando sem erros
- [ ] Environment variables configuradas:
  - NEXT_PUBLIC_SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - OPENROUTER_API_KEY
- [ ] Backup do banco de dados feito
- [ ] Deploy para staging primeiro (se disponível)

---

## 📝 Notas de Teste

Registre aqui quaisquer issues encontrados durante os testes:

```
Data: ___________
Testador: ___________

Issue 1:
- Descrição:
- Severidade: [CRÍTICO | ALTO | MÉDIO | BAIXO]
- Reproduzir:
- Status:

Issue 2:
...
```

---

**Última Atualização:** 25 de Janeiro de 2026
**Status:** Pronto para testes
