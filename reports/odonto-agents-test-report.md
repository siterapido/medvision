# Relatório de Testes - Agentes Odonto

**Data:** 22/01/2026, 18:20:36
**Gerado por:** test-odonto-agents.ts

---

## Resumo Executivo

| Métrica | Valor |
|---------|-------|
| Total de Agentes Testados | 5 |
| Total de Tools Testadas | 10 |
| Tipos de Artefatos | 10 |
| Testes Passou | 51 |
| Testes Falhou | 0 |
| Avisos | 4 |
| Cobertura | 85.0% |

### Status Geral

```
✅ TODOS OS TESTES PASSARAM
```

---

## 1. Testes de Configuração dos Agentes

### ✅ Odonto GPT (`odonto-gpt`)

**Modelo:** `google/gemini-2.0-flash-exp:free`
**Tools Disponíveis:** 6 (askPerplexity, searchPubMed, updateUserProfile, generateArtifact, saveSummary, saveFlashcards)

| Teste | Status | Mensagem |
|-------|--------|----------|
| Agente existe na configuração | ✅ passed | Agente encontrado |
| Nome do agente definido | ✅ passed | Odonto GPT |
| Descrição definida | ✅ passed | Tutor Inteligente e Mentor Senior... |
| System prompt definido | ✅ passed | System prompt com 1198 caracteres |
| Modelo LLM configurado | ✅ passed | google/gemini-2.0-flash-exp:free |
| Tools configuradas | ✅ passed | 6 tools configuradas |
| Tools esperadas presentes | ✅ passed | Todas as tools esperadas estão presentes |
| System prompt em português | ✅ passed | Configurado para português |

**Resumo:** 8 passou, 0 falhou, 0 avisos

---

### ✅ Odonto Research (`odonto-research`)

**Modelo:** `perplexity/sonar`
**Tools Disponíveis:** 5 (askPerplexity, searchPubMed, saveResearch, updateUserProfile, generateArtifact)

| Teste | Status | Mensagem |
|-------|--------|----------|
| Agente existe na configuração | ✅ passed | Agente encontrado |
| Nome do agente definido | ✅ passed | Odonto Research |
| Descrição definida | ✅ passed | Pesquisa Cientifica e Dossies... |
| System prompt definido | ✅ passed | System prompt com 2104 caracteres |
| Modelo LLM configurado | ✅ passed | perplexity/sonar |
| Tools configuradas | ✅ passed | 5 tools configuradas |
| Tools esperadas presentes | ✅ passed | Todas as tools esperadas estão presentes |
| System prompt em português | ⚠️ warning | Não menciona idioma explicitamente |

**Resumo:** 7 passou, 0 falhou, 1 avisos

---

### ✅ Odonto Practice (`odonto-practice`)

**Modelo:** `google/gemini-2.0-flash-exp:free`
**Tools Disponíveis:** 4 (generateArtifact, savePracticeExam, askPerplexity, updateUserProfile)

| Teste | Status | Mensagem |
|-------|--------|----------|
| Agente existe na configuração | ✅ passed | Agente encontrado |
| Nome do agente definido | ✅ passed | Odonto Practice |
| Descrição definida | ✅ passed | Casos Clinicos e Simulados... |
| System prompt definido | ✅ passed | System prompt com 1041 caracteres |
| Modelo LLM configurado | ✅ passed | google/gemini-2.0-flash-exp:free |
| Tools configuradas | ✅ passed | 4 tools configuradas |
| Tools esperadas presentes | ✅ passed | Todas as tools esperadas estão presentes |
| System prompt em português | ⚠️ warning | Não menciona idioma explicitamente |

**Resumo:** 7 passou, 0 falhou, 1 avisos

---

### ✅ Odonto Summary (`odonto-summary`)

**Modelo:** `anthropic/claude-3-haiku`
**Tools Disponíveis:** 5 (generateArtifact, saveSummary, saveFlashcards, saveMindMap, updateUserProfile)

| Teste | Status | Mensagem |
|-------|--------|----------|
| Agente existe na configuração | ✅ passed | Agente encontrado |
| Nome do agente definido | ✅ passed | Odonto Summary |
| Descrição definida | ✅ passed | Resumos e Flashcards... |
| System prompt definido | ✅ passed | System prompt com 833 caracteres |
| Modelo LLM configurado | ✅ passed | anthropic/claude-3-haiku |
| Tools configuradas | ✅ passed | 5 tools configuradas |
| Tools esperadas presentes | ✅ passed | Todas as tools esperadas estão presentes |
| System prompt em português | ⚠️ warning | Não menciona idioma explicitamente |

**Resumo:** 7 passou, 0 falhou, 1 avisos

---

### ✅ Odonto Vision (`odonto-vision`)

**Modelo:** `openai/gpt-4o`
**Tools Disponíveis:** 3 (generateArtifact, saveImageAnalysis, updateUserProfile)

| Teste | Status | Mensagem |
|-------|--------|----------|
| Agente existe na configuração | ✅ passed | Agente encontrado |
| Nome do agente definido | ✅ passed | Odonto Vision |
| Descrição definida | ✅ passed | Analise de Radiografias e Imagens... |
| System prompt definido | ✅ passed | System prompt com 843 caracteres |
| Modelo LLM configurado | ✅ passed | openai/gpt-4o |
| Tools configuradas | ✅ passed | 3 tools configuradas |
| Tools esperadas presentes | ✅ passed | Todas as tools esperadas estão presentes |
| System prompt em português | ⚠️ warning | Não menciona idioma explicitamente |

**Resumo:** 7 passou, 0 falhou, 1 avisos

---

## 2. Testes de Tools (definitions.ts)

| Tool | Status | Descrição | Schema | Execute | Parâmetros |
|------|--------|-----------|--------|---------|------------|
| askPerplexity | ✅ | ✅ | ✅ | ✅ | query |
| searchPubMed | ✅ | ✅ | ✅ | ✅ | query, max_results, specialty |
| updateUserProfile | ✅ | ✅ | ✅ | ✅ | userId, university, semester, specialty_interest, level |
| saveResearch | ✅ | ✅ | ✅ | ✅ | userId, title, content, query, sources, researchType |
| savePracticeExam | ✅ | ✅ | ✅ | ✅ | userId, title, topic, questions, specialty, difficulty, examType |
| saveSummary | ✅ | ✅ | ✅ | ✅ | userId, title, content, tags, topic |
| saveFlashcards | ✅ | ✅ | ✅ | ✅ | userId, title, cards, topic |
| saveMindMap | ✅ | ✅ | ✅ | ✅ | userId, title, mapData, topic |
| saveImageAnalysis | ✅ | ✅ | ✅ | ✅ | userId, title, analysis, imageUrl, findings, recommendations, metadata |
| generateArtifact | ✅ | ✅ | ✅ | ✅ | type, title, content, topic |

---

## 3. Tipos de Artefatos Suportados

| Tipo | Status | Campos Obrigatórios | Observação |
|------|--------|---------------------|------------|
| summary | ✅ | userId, title, content | Artefato suportado com campos: userId, title, content |
| flashcards | ✅ | userId, title, cards | Artefato suportado com campos: userId, title, cards |
| quiz | ⏭️ | type, title, content | Sem tool de persistência dedicada (usa generateArtifact) |
| research-dossier | ⏭️ | userId, title, content, sources | Sem tool de persistência dedicada (usa generateArtifact) |
| clinical-protocol | ⏭️ | type, title, content | Sem tool de persistência dedicada (usa generateArtifact) |
| study-guide | ⏭️ | type, title, content | Sem tool de persistência dedicada (usa generateArtifact) |
| case-analysis | ⏭️ | type, title, content | Sem tool de persistência dedicada (usa generateArtifact) |
| exam | ✅ | userId, title, topic, questions | Artefato suportado com campos: userId, title, topic, questions |
| mindmap | ✅ | userId, title, mapData | Artefato suportado com campos: userId, title, mapData |
| image | ✅ | userId, title, analysis | Artefato suportado com campos: userId, title, analysis |

---

## 5. Matriz Agente x Tools

| Tool | odonto-gpt | odonto-research | odonto-practice | odonto-summary | odonto-vision |
|------|:----------:|:---------------:|:---------------:|:--------------:|:-------------:|
| askPerplexity | ✅ | ✅ | ✅ | ❌ | ❌ |
| searchPubMed | ✅ | ✅ | ❌ | ❌ | ❌ |
| updateUserProfile | ✅ | ✅ | ✅ | ✅ | ✅ |
| saveResearch | ❌ | ✅ | ❌ | ❌ | ❌ |
| savePracticeExam | ❌ | ❌ | ✅ | ❌ | ❌ |
| saveSummary | ✅ | ❌ | ❌ | ✅ | ❌ |
| saveFlashcards | ✅ | ❌ | ❌ | ✅ | ❌ |
| saveMindMap | ❌ | ❌ | ❌ | ✅ | ❌ |
| saveImageAnalysis | ❌ | ❌ | ❌ | ❌ | ✅ |
| generateArtifact | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 6. Recomendações

- **Odonto Research**: Revisar 1 aviso(s)
- **Odonto Practice**: Revisar 1 aviso(s)
- **Odonto Summary**: Revisar 1 aviso(s)
- **Odonto Vision**: Revisar 1 aviso(s)

---

## 7. Cobertura de Funcionalidades

### Por Agente

```
odonto-gpt           ██████████ 100%
odonto-research      ████████░░ 88%
odonto-practice      ████████░░ 88%
odonto-summary       ████████░░ 88%
odonto-vision        ████████░░ 88%
```

### Funcionalidades Implementadas

- [x] Tutor Socrático (odonto-gpt)
- [x] Pesquisa Científica (odonto-research)
- [x] Casos Clínicos e Simulados (odonto-practice)
- [x] Resumos e Flashcards (odonto-summary)
- [x] Análise de Imagens (odonto-vision)
- [x] Persistência de Artefatos (Supabase)
- [x] Integração com Perplexity/PubMed
- [ ] Testes E2E automatizados
- [ ] Métricas de uso por agente

---

## 8. Próximos Passos

1. Implementar testes E2E com chamadas reais à API
2. Adicionar métricas de latência por modelo
3. Criar dashboard de monitoramento de agentes
4. Implementar testes de regressão automáticos

---

*Relatório gerado automaticamente por `scripts/test-odonto-agents.ts`*
