# Quick Start - AI SDK Modernização

## 🚀 Start Testing in 5 Minutes

### 1. Build & Verify
```bash
# Compilar e verificar que não há erros
npm run build

# Se build passar, está OK para testar
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open Chat Interface
```
http://localhost:3000/dashboard/chat
```

### 4. Run These 3 Quick Tests

#### Test A: Summary (30 seconds)
```
Prompt no chat:
"Crie um resumo sobre endodontia"

Verificar:
✅ Resumo aparece estruturado
✅ Tem pontos-chave (3-7 items)
✅ Nenhum erro de parsing
```

#### Test B: Flashcards (30 seconds)
```
Prompt no chat:
"Faça flashcards sobre periodontia"

Verificar:
✅ Deck de flashcards aparece
✅ Cada card tem frente e verso
✅ Total de 5-20 cards
```

#### Test C: Quiz (30 seconds)
```
Prompt no chat:
"Gere um quiz sobre ortodontia"

Verificar:
✅ Quiz aparece com questões
✅ Cada questão tem 5 alternativas (A-E)
✅ Tem explicação da resposta
```

### 5. Check Console Logs

Abrir DevTools (F12) > Console

Procurar por:
```
[Chat] Intent detected: { tool: 'createDocument', kind: '...', confidence: 'high' }
[Structured Generation] Generating ... artifact...
[Structured Generation] ✓ ... artifact generated successfully
[createDocument] ✓ ... "..." saved for user ...
[AI Completion] { tokens: {...}, cost: ..., duration: ...ms }
```

Se vir esses logs, tudo está funcionando! ✅

---

## 🐛 Troubleshooting

### "Tools não está definido"
**Problema:** Build falhou ou tools não habilitadas

**Solução:**
```bash
# Re-build
npm run build

# Verificar route.ts linha ~445
# Deve ter: tools, // ✅ HABILITADO
```

### "Parsing error" ou "Invalid JSON"
**Problema:** Structured generation não está sendo usada

**Solução:**
- Verificar que `/lib/ai/structured-generation.ts` existe
- Verificar que `createDocument` importa `generateArtifact`
- Verificar logs para confirmar "Structured Generation" aparece

### "Tool não foi chamada"
**Problema:** Intent detection não detectou ou toolChoice não forçado

**Solução:**
- Verificar logs: `[Chat] Intent detected`
- Se não aparecer, intent não foi detectado
- Testar com comandos mais explícitos: "Crie um resumo sobre..."

### "Artifact não salvo no banco"
**Problema:** Context não disponível ou permission issue

**Solução:**
```bash
# Verificar variáveis de ambiente
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Verificar RLS policies na tabela artifacts
# Ou usar service role key que bypassa RLS
```

---

## 📊 Monitoring Dashboard (Manual)

### Check Supabase
```sql
-- Ver últimos artifacts criados
SELECT
  id,
  kind,
  title,
  created_at,
  user_id
FROM artifacts
ORDER BY created_at DESC
LIMIT 10;

-- Contar por tipo
SELECT
  kind,
  COUNT(*) as total
FROM artifacts
GROUP BY kind;
```

### Check Logs
```bash
# Em desenvolvimento, logs aparecem no terminal
# Procurar por:

[Chat] Intent detected
[AI Step]
[Structured Generation]
[createDocument]
[AI Completion]
```

---

## ✅ Success Criteria (Quick Check)

Após rodar os 3 testes rápidos, verificar:

1. **Artifacts Generated**
   - [ ] Summary criado
   - [ ] Flashcards criado
   - [ ] Quiz criado

2. **No Errors**
   - [ ] Nenhum parsing error
   - [ ] Nenhum "undefined" em campos obrigatórios
   - [ ] Build passou

3. **Logs Present**
   - [ ] Intent detection logs visíveis
   - [ ] Structured generation logs visíveis
   - [ ] Completion metrics visíveis

**Se todos ✅, implementação está funcionando!**

---

## 🎯 Next Steps

### Para Produção
1. Fazer deploy para staging
2. Rodar checklist completo (TESTING_CHECKLIST.md)
3. Testar com usuários reais
4. Monitorar logs por 24h
5. Deploy para produção

### Para Melhorias
1. Adicionar mais variações de intent detection
2. Implementar cache de artifacts similares
3. Dashboard de métricas (Vercel Analytics)
4. Retry logic para rate limits

---

## 📚 Documentation

- **Implementação Completa:** `AI_SDK_MODERNIZATION_SUMMARY.md`
- **Checklist Detalhado:** `TESTING_CHECKLIST.md`
- **Este Guia:** `QUICK_START.md`

---

**Happy Testing! 🚀**
