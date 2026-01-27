---
status: ready
generated: 2026-01-27
agents:
  - type: "database-specialist"
    role: "Criar schema e funções de busca híbrida no Supabase"
  - type: "feature-developer"
    role: "Implementar Edge Function e ferramenta RAG"
  - type: "refactoring-specialist"
    role: "Simplificar configuração do agente removendo ferramentas"
  - type: "test-writer"
    role: "Validar busca híbrida e integração end-to-end"
docs:
  - "architecture.md"
  - "development-workflow.md"
phases:
  - id: "phase-1"
    name: "Database & Edge Function"
    prevc: "P"
  - id: "phase-2"
    name: "Ferramenta RAG & Simplificação"
    prevc: "E"
  - id: "phase-3"
    name: "Validação & Ingestão"
    prevc: "V"
---

# Implementar RAG Híbrida Única no Supabase

> Simplificar o Odonto GPT para usar apenas uma função de RAG no Supabase, combinando documentos de odontologia com contexto do usuário. Remover todas as outras ferramentas do agente.

## Task Snapshot

- **Primary goal:** Agente Odonto GPT com acesso APENAS a uma função de busca RAG híbrida (documentos + memórias do usuário)
- **Success signal:** Chat responde perguntas técnicas citando fontes dos documentos ingeridos, sem usar APIs externas
- **Key references:**
  - [Architecture Notes](../docs/architecture.md)
  - Arquivo crítico: `lib/ai/agents/config.ts`
  - Serviço existente: `MemoryService` @ `lib/ai/memory/service.ts:77`

## Codebase Context

- **Total files analyzed:** 1183
- **Total symbols discovered:** 6049
- **Architecture layers:** Config, Controllers, Components, Utils, Services, Models, Repositories
- **Detected patterns:** Factory, Service Layer, Controller, Observer
- **Entry points:** lib/supabase/server.ts, lib/db/index.ts

### Key Components

**Core Classes:**
- `MemoryService` — lib/ai/memory/service.ts:77 (REUTILIZAR)
- `ChatService` — lib/ai/chat-service.ts:26 (Manter)
- `ArtifactsService` — lib/services/artifacts.ts:15 (Não modificar)

**Arquivos Críticos a Modificar:**

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/` | CRIAR | Nova migration `knowledge_documents` |
| `supabase/functions/rag-search/` | CRIAR | Edge Function de busca híbrida |
| `lib/ai/tools/rag-tool.ts` | CRIAR | Nova ferramenta `searchKnowledge` |
| `lib/ai/agents/config.ts` | MODIFICAR | Remover ferramentas, manter só RAG |
| `app/api/admin/ingest-document/route.ts` | CRIAR | API de ingestão de documentos |

### Arquitetura Proposta

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  Odonto GPT     │────▶│  searchKnowledge     │────▶│  Edge Function      │
│  (único agente) │     │  (única ferramenta)  │     │  rag-search         │
└─────────────────┘     └──────────────────────┘     └──────────┬──────────┘
                                                                 │
                        ┌────────────────────────────────────────┼──────────┐
                        ▼                                        ▼          │
              ┌─────────────────────┐                  ┌─────────────────┐  │
              │ knowledge_documents │                  │ agent_memories  │  │
              │ (pgvector + FTS)    │                  │ (contexto user) │  │
              └─────────────────────┘                  └─────────────────┘  │
                        │                                        │          │
                        └──────── hybrid_search_knowledge ───────┘          │
                                            │                               │
                                            ▼                               │
                                   [Resultados + Citações]◀─────────────────┘
```

## Agent Lineup

| Agent | Role in this plan | Playbook | First responsibility focus |
| --- | --- | --- | --- |
| Database Specialist | Criar schema pgvector e funções SQL | N/A | Migration `knowledge_documents` + `hybrid_search_knowledge` |
| Feature Developer | Implementar Edge Function e tool | [Feature Developer](../agents/feature-developer.md) | `rag-search` Edge Function + `searchKnowledge` tool |
| Refactoring Specialist | Simplificar agent config | [Refactoring Specialist](../agents/refactoring-specialist.md) | Remover ferramentas não usadas de `config.ts` |
| Test Writer | Validar integração | [Test Writer](../agents/test-writer.md) | Testes E2E de busca e chat com citações |

## Documentation Touchpoints

| Guide | File | Updates Needed |
| --- | --- | --- |
| Architecture Notes | [architecture.md](../docs/architecture.md) | Documentar nova arquitetura RAG híbrida |
| Development Workflow | [development-workflow.md](../docs/development-workflow.md) | Adicionar processo de ingestão de documentos |

## Risk Assessment

### Identified Risks

| Risk | Probability | Impact | Mitigation Strategy | Owner |
| --- | --- | --- | --- | --- |
| Qualidade da busca baixa | Média | Alto | Ajustar pesos semântico/keyword (70/30 inicialmente) | Database Specialist |
| Corpus de documentos vazio | Alta | Alto | Preparar 5-10 documentos iniciais antes do deploy | Feature Developer |
| Latência da Edge Function > 3s | Baixa | Médio | Cache de embeddings, otimizar índices IVFFlat | Feature Developer |

### Dependencies

- **Interno:** pgvector já habilitado ✅, tabela `agent_memories` existente ✅
- **Externo:** OpenRouter API para embeddings (text-embedding-3-small)
- **Técnico:** Supabase Edge Functions habilitadas, OPENROUTER_API_KEY configurada

### Assumptions

- Embeddings de 1536 dimensões (OpenAI text-embedding-3-small)
- FTS em português já configurado via `to_tsvector('portuguese', ...)`
- Documentos serão ingeridos em chunks de ~1500 caracteres com overlap de 200
- Usuários aceitam que respostas sejam limitadas ao conhecimento ingerido

## Resource Estimation

### Time Allocation

| Phase | Estimated Effort | Calendar Time | Team Size |
| --- | --- | --- | --- |
| Phase 1 - Database & Edge Function | 4 horas | 1 dia | 1 pessoa |
| Phase 2 - Ferramenta & Simplificação | 3 horas | 1 dia | 1 pessoa |
| Phase 3 - Validação & Ingestão | 3 horas | 1 dia | 1 pessoa |
| **Total** | **10 horas** | **3 dias** | **1 pessoa** |

### Required Skills

- PostgreSQL + pgvector (migrations, índices, funções)
- Deno/TypeScript (Edge Functions)
- Vercel AI SDK v6 (ferramentas)
- Next.js API Routes

### Ferramentas a REMOVER do Agente

```typescript
// De lib/ai/agents/config.ts
❌ askPerplexity      // Busca externa via Perplexity
❌ searchPubMed       // Busca externa via PubMed
❌ generateArtifact   // Geração de artifacts
❌ saveResearch       // Salvar pesquisa
❌ savePracticeExam   // Salvar simulado
❌ saveSummary        // Salvar resumo
❌ saveFlashcards     // Salvar flashcards
❌ saveMindMap        // Salvar mapa mental
❌ saveImageAnalysis  // Salvar análise de imagem
❌ updateUserProfile  // Atualizar perfil
```

### Ferramentas a MANTER

```typescript
✅ searchKnowledge    // NOVA - busca RAG híbrida
✅ rememberFact       // Salvar fatos do aluno
✅ getStudentContext  // Recuperar perfil do aluno
```

---

## Working Phases

### Phase 1 — Database & Edge Function

**Objetivo:** Criar infraestrutura de dados e busca no Supabase

**Steps:**

1. **Criar migration `knowledge_documents`** (Database Specialist)
   - Arquivo: `supabase/migrations/20260128000000_create_knowledge_documents.sql`
   - Schema:
     ```sql
     CREATE TABLE knowledge_documents (
       id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
       title text NOT NULL,
       source_type text CHECK (source_type IN ('textbook','article','protocol','guideline')),
       source_name text,
       author text,
       specialty text,
       chapter text,
       content text NOT NULL,
       chunk_index int DEFAULT 0,
       total_chunks int DEFAULT 1,
       parent_document_id uuid REFERENCES knowledge_documents(id),
       embedding vector(1536),
       search_vector tsvector GENERATED ALWAYS AS (
         to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(content,''))
       ) STORED,
       metadata jsonb DEFAULT '{}',
       created_at timestamptz DEFAULT now()
     );

     -- Indexes
     CREATE INDEX ON knowledge_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
     CREATE INDEX ON knowledge_documents USING gin(search_vector);
     CREATE INDEX ON knowledge_documents(specialty);
     CREATE INDEX ON knowledge_documents(source_type);

     -- RLS
     ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
     CREATE POLICY "read_all" ON knowledge_documents FOR SELECT TO authenticated USING (true);
     CREATE POLICY "service_role_all" ON knowledge_documents FOR ALL TO service_role USING (true);
     ```

2. **Criar função `hybrid_search_knowledge`** (Database Specialist)
   - Na mesma migration
   - Combina busca semântica (70%) + FTS (30%)
   ```sql
   CREATE OR REPLACE FUNCTION hybrid_search_knowledge(
     p_query_embedding vector(1536),
     p_query_text text,
     p_match_threshold float DEFAULT 0.5,
     p_match_count int DEFAULT 5,
     p_specialties text[] DEFAULT NULL,
     p_semantic_weight float DEFAULT 0.7,
     p_keyword_weight float DEFAULT 0.3
   )
   RETURNS TABLE (
     id uuid,
     title text,
     content text,
     source text,
     specialty text,
     semantic_score float,
     keyword_score float,
     combined_score float
   )
   LANGUAGE plpgsql
   STABLE
   AS $$
   BEGIN
     RETURN QUERY
     WITH semantic_results AS (
       SELECT
         d.id,
         d.title,
         d.content,
         d.source_name AS source,
         d.specialty,
         1 - (d.embedding <=> p_query_embedding) AS semantic_score
       FROM knowledge_documents d
       WHERE d.embedding IS NOT NULL
         AND 1 - (d.embedding <=> p_query_embedding) > p_match_threshold
         AND (p_specialties IS NULL OR d.specialty = ANY(p_specialties))
     ),
     keyword_results AS (
       SELECT
         d.id,
         d.title,
         d.content,
         d.source_name AS source,
         d.specialty,
         ts_rank(d.search_vector, plainto_tsquery('portuguese', p_query_text)) AS keyword_score
       FROM knowledge_documents d
       WHERE d.search_vector @@ plainto_tsquery('portuguese', p_query_text)
         AND (p_specialties IS NULL OR d.specialty = ANY(p_specialties))
     ),
     combined AS (
       SELECT
         COALESCE(s.id, k.id) AS id,
         COALESCE(s.title, k.title) AS title,
         COALESCE(s.content, k.content) AS content,
         COALESCE(s.source, k.source) AS source,
         COALESCE(s.specialty, k.specialty) AS specialty,
         COALESCE(s.semantic_score, 0) AS semantic_score,
         COALESCE(k.keyword_score, 0) AS keyword_score,
         (COALESCE(s.semantic_score, 0) * p_semantic_weight +
          COALESCE(k.keyword_score, 0) * p_keyword_weight) AS combined_score
       FROM semantic_results s
       FULL OUTER JOIN keyword_results k ON s.id = k.id
     )
     SELECT * FROM combined
     ORDER BY combined_score DESC
     LIMIT p_match_count;
   END;
   $$;
   ```

3. **Criar Edge Function `rag-search`** (Feature Developer)
   - Arquivo: `supabase/functions/rag-search/index.ts`
   ```typescript
   import "jsr:@supabase/functions-js/edge-runtime.d.ts";
   import { createClient } from "npm:@supabase/supabase-js@2";

   const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
   const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
   const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;

   const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

   async function generateEmbedding(text: string): Promise<number[]> {
     const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
       method: "POST",
       headers: {
         "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "openai/text-embedding-3-small",
         input: text.substring(0, 8000),
       }),
     });
     const data = await response.json();
     return data.data[0].embedding;
   }

   Deno.serve(async (req) => {
     if (req.method === "OPTIONS") {
       return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
     }

     try {
       const { query, userId, specialties, maxDocuments = 5, maxMemories = 3 } = await req.json();

       const embedding = await generateEmbedding(query);
       const embeddingStr = `[${embedding.join(",")}]`;

       // Busca em documentos
       const { data: documents } = await supabase.rpc("hybrid_search_knowledge", {
         p_query_embedding: embeddingStr,
         p_query_text: query,
         p_match_count: maxDocuments,
         p_specialties: specialties || null,
       });

       // Busca em memórias do usuário
       const { data: memories } = await supabase.rpc("hybrid_search_memories", {
         p_user_id: userId,
         p_query_embedding: embeddingStr,
         p_query_text: query,
         p_match_count: maxMemories,
         p_memory_types: ["long_term", "fact"],
       });

       return new Response(JSON.stringify({
         documents: (documents || []).map((d: any) => ({
           id: d.id,
           title: d.title,
           content: d.content,
           source: d.source,
           specialty: d.specialty,
           score: d.combined_score,
         })),
         userContext: (memories || []).map((m: any) => ({
           content: m.content,
           topic: m.topic,
           type: m.type,
           score: m.combined_score,
         })),
       }), { status: 200, headers: { "Content-Type": "application/json" } });
     } catch (error) {
       return new Response(JSON.stringify({ error: error.message }), { status: 500 });
     }
   });
   ```

4. **Deploy Edge Function** (Feature Developer)
   ```bash
   supabase functions deploy rag-search
   ```

**Commit Checkpoint:**
```bash
git commit -m "feat(rag): add knowledge_documents table and rag-search edge function"
```

---

### Phase 2 — Ferramenta RAG & Simplificação

**Objetivo:** Criar ferramenta única e simplificar agente

**Steps:**

1. **Criar ferramenta `searchKnowledge`** (Feature Developer)
   - Arquivo: `lib/ai/tools/rag-tool.ts`
   ```typescript
   import { z } from "zod";
   import { tool } from "ai";
   import { getContext } from "../artifacts/context";

   const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
   const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

   export const searchKnowledge = tool({
     description: `Busca conhecimento odontológico na base de dados.
     Use SEMPRE antes de responder perguntas técnicas.
     Retorna trechos de livros, artigos e protocolos com citações.`,
     parameters: z.object({
       query: z.string().describe("A pergunta ou tópico para buscar"),
       specialties: z.array(z.string()).optional().describe("Filtrar por especialidades"),
     }),
     execute: async ({ query, specialties }) => {
       const ctx = getContext();
       if (!ctx?.userId) {
         return { success: false, error: "Contexto do usuário não disponível" };
       }

       const response = await fetch(`${SUPABASE_URL}/functions/v1/rag-search`, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
         },
         body: JSON.stringify({
           query,
           userId: ctx.userId,
           specialties,
           maxDocuments: 5,
           maxMemories: 3,
         }),
       });

       const data = await response.json();

       return {
         success: true,
         documents: data.documents.map((doc: any) => ({
           titulo: doc.title,
           conteudo: doc.content,
           fonte: doc.source,
           especialidade: doc.specialty,
           relevancia: Math.round(doc.score * 100) + "%",
         })),
         userContext: data.userContext.map((mem: any) => ({
           informacao: mem.content,
           topico: mem.topic,
         })),
       };
     },
   });
   ```

2. **Modificar `lib/ai/agents/config.ts`** (Refactoring Specialist)
   - Remover imports:
     ```typescript
     // REMOVER
     import {
       askPerplexity,
       searchPubMed,
       generateArtifact,
       // ... todos os save*
     } from "../tools/definitions";
     ```
   - Adicionar import:
     ```typescript
     import { searchKnowledge } from "../tools/rag-tool";
     ```
   - Atualizar agent `odonto-gpt`:
     ```typescript
     "odonto-gpt": {
       id: "odonto-gpt",
       name: "Odonto GPT",
       description: "Tutor Inteligente de Odontologia",
       model: "google/gemini-2.0-flash-001",
       maxSteps: 5,  // Reduzido de 12
       toolsRequiringApproval: [],
       system: `Você é o Odonto GPT, mentor de odontologia experiente.

     REGRA CRÍTICA: SEMPRE use searchKnowledge antes de responder perguntas técnicas.
     Baseie suas respostas APENAS no conteúdo retornado pela busca.
     Se a busca não retornar resultados, diga honestamente que não encontrou a informação.

     FORMATO DE RESPOSTA:
     1. Responda em 3-5 linhas conversacionais
     2. Cite a fonte ao final: "Fonte: [nome do livro/artigo]"
     3. Use terminologia técnica adequada

     Use rememberFact para salvar informações importantes sobre o aluno.`,
       greetingTitle: "Olá, Colega!",
       greetingDescription: "Estou aqui para apoiar seus estudos com base em literatura odontológica.",
       tools: {
         searchKnowledge,
         rememberFact,
         getStudentContext,
       },
     }
     ```

3. **Remover outros agentes (opcional)** (Refactoring Specialist)
   - Comentar ou remover de `AGENT_CONFIGS`:
     - `odonto-research`
     - `odonto-practice`
     - `odonto-summary`
     - `odonto-vision`

**Commit Checkpoint:**
```bash
git commit -m "refactor(agent): simplify to single RAG tool, remove external APIs"
```

---

### Phase 3 — Validação & Ingestão

**Objetivo:** Testar sistema e preparar corpus inicial

**Steps:**

1. **Criar API de ingestão** (Feature Developer)
   - Arquivo: `app/api/admin/ingest-document/route.ts`
   ```typescript
   import { NextRequest, NextResponse } from "next/server";
   import { createClient } from "@supabase/supabase-js";
   import { generateEmbedding } from "@/lib/ai/memory/embeddings";

   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!
   );

   function chunkText(text: string, maxSize = 1500, overlap = 200): string[] {
     const chunks: string[] = [];
     let start = 0;
     while (start < text.length) {
       let end = start + maxSize;
       if (end < text.length) {
         const lastPeriod = text.lastIndexOf(".", end);
         if (lastPeriod > start + maxSize / 2) end = lastPeriod + 1;
       }
       chunks.push(text.slice(start, end).trim());
       start = end - overlap;
     }
     return chunks.filter((c) => c.length > 50);
   }

   export async function POST(req: NextRequest) {
     const authHeader = req.headers.get("authorization");
     if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }

     const { title, content, sourceType, sourceName, specialty } = await req.json();
     const chunks = chunkText(content);
     const parentId = crypto.randomUUID();

     const results = [];
     for (let i = 0; i < chunks.length; i++) {
       const embedding = await generateEmbedding(chunks[i]);
       const { data, error } = await supabase.from("knowledge_documents").insert({
         id: i === 0 ? parentId : crypto.randomUUID(),
         title: `${title} (${i + 1}/${chunks.length})`,
         content: chunks[i],
         source_type: sourceType,
         source_name: sourceName,
         specialty,
         chunk_index: i,
         total_chunks: chunks.length,
         parent_document_id: i > 0 ? parentId : null,
         embedding: embedding.length > 0 ? `[${embedding.join(",")}]` : null,
       });
       results.push({ chunk: i, id: data?.id, error });
     }

     return NextResponse.json({ success: true, parentId, totalChunks: chunks.length, results });
   }
   ```

2. **Testar Edge Function diretamente** (Test Writer)
   ```bash
   curl -X POST https://qphofwxpmmhfplylozsh.supabase.co/functions/v1/rag-search \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     -d '{"query":"tratamento de canal","userId":"test-user-id"}'
   ```

3. **Testar chat E2E** (Test Writer)
   - Enviar pergunta técnica: "Como fazer um tratamento de canal?"
   - Verificar logs que `searchKnowledge` foi chamado
   - Verificar resposta cita fonte

4. **Ingerir documentos iniciais** (Feature Developer)
   - Preparar 5-10 documentos de odontologia
   - Fazer POST para `/api/admin/ingest-document`

**Commit Checkpoint:**
```bash
git commit -m "feat(rag): add document ingestion API and validate E2E"
```

---

## Rollback Plan

### Rollback Triggers
- Edge Function retornando erros > 10%
- Latência média > 3 segundos
- Busca retornando resultados irrelevantes (< 50% relevância)

### Rollback Procedures

#### Phase 1 Rollback
- Ação: `supabase db reset` ou reverter migration específica
- Impacto de Dados: Perda de documentos ingeridos (backup necessário)
- Tempo: < 30 minutos

#### Phase 2 Rollback
- Ação: `git revert` dos commits de `config.ts` e `rag-tool.ts`
- Impacto de Dados: Nenhum
- Tempo: < 10 minutos

#### Phase 3 Rollback
- Ação: Desabilitar Edge Function via Supabase Dashboard
- Impacto de Dados: Chat sem RAG (agente não funciona)
- Tempo: < 5 minutos

---

## Evidence & Follow-up

### Artifacts a Coletar
- [ ] Link do PR com migration
- [ ] Logs de teste da Edge Function (latência, taxa de erro)
- [ ] Screenshot do chat citando fonte
- [ ] Métricas de relevância das buscas (medir manualmente)

### Follow-up Actions
- [ ] Documentar processo de ingestão em `development-workflow.md`
- [ ] Criar dashboard de monitoramento de buscas no Supabase
- [ ] Avaliar qualidade com 10 usuários reais
- [ ] Ajustar pesos semântico/keyword baseado em feedback

---

## Arquivos Criados/Modificados

```
supabase/
├── migrations/
│   └── 20260128000000_create_knowledge_documents.sql  ✨ NOVO
└── functions/
    └── rag-search/
        └── index.ts                                    ✨ NOVO

lib/ai/
├── tools/
│   ├── rag-tool.ts                                     ✨ NOVO
│   └── definitions.ts                                  (sem alteração)
└── agents/
    └── config.ts                                       📝 MODIFICADO

app/api/admin/
└── ingest-document/
    └── route.ts                                        ✨ NOVO
```
