---
status: ready
generated: 2026-01-25
scale: SMALL
phases:
  - id: "phase-1"
    name: "Diagnóstico"
    prevc: "P"
  - id: "phase-2"
    name: "Implementação"
    prevc: "E"
  - id: "phase-3"
    name: "Validação"
    prevc: "V"
---

# Plano: Habilitar Artefato de Resumo (Summary)

> Garantir que o `createDocument` funcione corretamente para gerar resumos estruturados no odonto-gpt

## Task Snapshot

- **Primary goal:** Fazer o agente odonto-gpt usar `createDocument` para gerar resumos que apareçam na UI
- **Success signal:** Ao pedir "faça um resumo sobre X", o artefato aparece no painel lateral
- **Key references:**
  - Handler: `lib/ai/artifacts/handlers/summary/index.ts`
  - Tool: `lib/ai/tools/create-document.ts`
  - Agent: `lib/ai/agents/config.ts`

## Estado Atual (Diagnóstico)

| Componente | Estado | Localização |
|------------|--------|-------------|
| Summary Handler | ✅ Implementado | `lib/ai/artifacts/handlers/summary/index.ts` |
| Handler Registry | ✅ Habilitado | `lib/ai/artifacts/handlers/index.ts:26` |
| createDocument Tool | ✅ Schema correto | `lib/ai/tools/create-document.ts` |
| Agente odonto-gpt | ⚠️ Usa tool legada | `lib/ai/agents/config.ts:88-100` |

## Problema Identificado

O agente `odonto-gpt` usa `generateArtifact` (tool legada de `definitions.ts`) em vez de `createDocumentTool`:

```typescript
// Estado atual (config.ts linha 92)
tools: {
  generateArtifact,  // ← Tool legada, não usa handlers
  saveSummary,       // ← Só salva, não gera UI
  ...
}
```

O `generateArtifact` retorna JSON simples, enquanto `createDocumentTool`:
- Gera IDs únicos via nanoid
- Persiste automaticamente no Supabase
- Usa o sistema de handlers tipado

## Arquivos a Modificar

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `lib/ai/agents/config.ts` | Importar e usar `createDocumentTool` |
| 2 | `lib/ai/agents/config.ts` | Melhorar system prompt com guidelines |

## Working Phases

### Phase 1 — Diagnóstico (Completo)

**Descobertas:**
1. Handler de summary existe e está correto
2. `createDocumentTool` existe mas não está importado no config do agente
3. System prompt menciona `createDocument` mas a tool não está disponível

### Phase 2 — Implementação

**Passos:**

1. **Importar createDocumentTool no config.ts**
   ```typescript
   import { createDocumentTool } from "../tools/create-document"
   ```

2. **Substituir generateArtifact por createDocumentTool**
   ```typescript
   tools: {
     createDocument: createDocumentTool,  // ← Novo
     // generateArtifact,  // ← Remover ou comentar
     ...
   }
   ```

3. **Ajustar system prompt** com guidelines claros:
   ```markdown
   # CRIAÇÃO DE RESUMOS
   Quando o aluno pedir resumo, síntese ou revisão, use `createDocument`:
   - kind: 'summary'
   - title: Título claro
   - topic: Tópico principal
   - content: Markdown estruturado
   - keyPoints: 3-5 pontos-chave
   ```

### Phase 3 — Validação

**Teste Manual:**
1. Abrir chat com odonto-gpt
2. Enviar: "Faça um resumo sobre periodontia"
3. Verificar:
   - [ ] Artefato aparece na UI
   - [ ] Console: `[createDocument] summary "..." saved`
   - [ ] Registro existe no Supabase `artifacts`

## Critérios de Sucesso

- [ ] Agente chama `createDocument` ao pedir resumo
- [ ] Artefato renderiza no painel lateral
- [ ] Dados persistem no banco

## Rollback

Se falhar, reverter import e manter `generateArtifact`.

## Estimativa

- **Esforço:** 15-20 minutos
- **Risco:** Baixo (mudança localizada)
