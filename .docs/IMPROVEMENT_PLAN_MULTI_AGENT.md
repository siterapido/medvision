# Plano de Melhorias - Sistema Multi-Agente com Artefatos

> **Baseado em**: AI SDK v6, @ai-sdk-tools/artifacts, LangGraphJS
> **Data**: 2026-01-24
> **Versão**: 1.0

---

## Sumário Executivo

Este plano propõe melhorias estruturadas no sistema multi-agente do Odonto GPT, organizadas em **4 fases** progressivas:

| Fase | Foco | Complexidade | Impacto |
|------|------|--------------|---------|
| 1 | Artifact Streaming Avançado | Média | Alto |
| 2 | Orquestração com Supervisor | Alta | Muito Alto |
| 3 | RAG com Embeddings | Média | Alto |
| 4 | Generative UI | Alta | Muito Alto |

---

## Arquitetura Atual vs Proposta

### Atual
```
┌─────────────────────────────────────────────────────┐
│  Usuário seleciona agente manualmente               │
│                    ↓                                │
│  ┌──────────────────────────────────────────────┐  │
│  │  Agente único processa toda a requisição     │  │
│  └──────────────────────────────────────────────┘  │
│                    ↓                                │
│  Tool execution → Artifact → Save (separado)       │
└─────────────────────────────────────────────────────┘
```

### Proposta
```
┌─────────────────────────────────────────────────────────────────────┐
│                         /api/chat                                    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐                                               │
│  │    SUPERVISOR    │ ← Analisa intenção + contexto RAG             │
│  │    (Router)      │                                               │
│  └────────┬─────────┘                                               │
│           │ Command({ goto: agentId })                              │
│  ┌────────┼────────┬────────────┬────────────┬───────────────┐     │
│  │        │        │            │            │               │     │
│  ▼        ▼        ▼            ▼            ▼               │     │
│ Research Practice Summary    Vision      Odonto GPT         │     │
│  Agent    Agent    Agent      Agent       (fallback)        │     │
│  └────────┴────────┴────────────┴────────────┴───────────────┘     │
│           │                                                         │
│           │ Command({ goto: 'supervisor' })                         │
│           ▼                                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  @ai-sdk-tools/artifacts                                      │  │
│  │  - Streaming tipado com Zod                                   │  │
│  │  - Progress tracking                                          │  │
│  │  - Auto-persist on complete                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  RAG Context (pgvector)                                       │  │
│  │  - Embeddings de artefatos anteriores                         │  │
│  │  - Histórico de conversas relevantes                          │  │
│  │  - Base de conhecimento odontológico                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## FASE 1: Artifact Streaming Avançado

### Objetivo
Substituir o sistema atual de tools separados (create + save) por streaming tipado com `@ai-sdk-tools/artifacts`.

### Dependências
```bash
npm install @ai-sdk-tools/artifacts
```

### 1.1 Definir Schemas de Artefatos Tipados

```typescript
// lib/ai/artifacts/schemas.ts
import { artifact } from '@ai-sdk-tools/artifacts';
import { z } from 'zod';

// Summary Artifact
export const summaryArtifact = artifact('summary', z.object({
  title: z.string(),
  stage: z.enum(['generating', 'complete']).default('generating'),
  topic: z.string(),
  content: z.string(),
  keyPoints: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  wordCount: z.number().default(0),
}));

// Flashcard Artifact
export const flashcardArtifact = artifact('flashcard', z.object({
  title: z.string(),
  stage: z.enum(['generating', 'complete']).default('generating'),
  topic: z.string(),
  cards: z.array(z.object({
    id: z.string(),
    front: z.string(),
    back: z.string(),
    category: z.string().optional(),
  })).default([]),
  totalCards: z.number().default(0),
}));

// Quiz Artifact
export const quizArtifact = artifact('quiz', z.object({
  title: z.string(),
  stage: z.enum(['generating', 'validating', 'complete']).default('generating'),
  topic: z.string(),
  specialty: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  questions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    options: z.array(z.object({
      id: z.string(),
      text: z.string(),
      isCorrect: z.boolean(),
    })),
    explanation: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
  })).default([]),
  totalQuestions: z.number().default(0),
}));

// Research Artifact
export const researchArtifact = artifact('research', z.object({
  title: z.string(),
  stage: z.enum(['searching', 'analyzing', 'complete']).default('searching'),
  query: z.string(),
  content: z.string().default(''),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string(),
    summary: z.string().optional(),
    authors: z.string().optional(),
    pubdate: z.string().optional(),
    relevance: z.number().optional(),
  })).default([]),
  methodology: z.string().optional(),
}));

// Report (Laudo) Artifact
export const reportArtifact = artifact('report', z.object({
  title: z.string(),
  stage: z.enum(['analyzing', 'documenting', 'complete']).default('analyzing'),
  examType: z.string(),
  imageUrl: z.string().optional(),
  content: z.string().default(''),
  findings: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  quality: z.object({
    rating: z.enum(['good', 'adequate', 'limited']),
    notes: z.string().optional(),
  }).optional(),
}));

// Export all artifacts
export const artifacts = {
  summary: summaryArtifact,
  flashcard: flashcardArtifact,
  quiz: quizArtifact,
  research: researchArtifact,
  report: reportArtifact,
} as const;
```

### 1.2 Criar Typed Context

```typescript
// lib/ai/artifacts/context.ts
import { createTypedContext, BaseContext } from '@ai-sdk-tools/artifacts';
import { createClient } from '@/lib/supabase/server';

export interface OdontoContext extends BaseContext {
  userId: string;
  sessionId: string;
  userProfile: {
    university?: string;
    semester?: string;
    specialty?: string;
    level?: string;
  };
  permissions: string[];
}

export const { setContext, getContext } = createTypedContext<OdontoContext>();

// Helper para inicializar contexto
export async function initializeContext(
  writer: any,
  userId: string,
  sessionId: string
): Promise<OdontoContext> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('university, semester, specialty_interest, level')
    .eq('id', userId)
    .single();

  const context: OdontoContext = {
    writer,
    userId,
    sessionId,
    userProfile: {
      university: profile?.university,
      semester: profile?.semester,
      specialty: profile?.specialty_interest,
      level: profile?.level,
    },
    permissions: ['read', 'write', 'create_artifacts'],
  };

  setContext(context);
  return context;
}
```

### 1.3 Implementar Tools com Streaming

```typescript
// lib/ai/tools/streaming-artifact-tools.ts
import { tool } from 'ai';
import { z } from 'zod';
import { summaryArtifact, flashcardArtifact, quizArtifact } from '../artifacts/schemas';
import { getContext } from '../artifacts/context';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

export const createStreamingSummary = tool({
  description: 'Cria um resumo estruturado com streaming de progresso',
  parameters: z.object({
    title: z.string(),
    topic: z.string(),
    content: z.string(),
    keyPoints: z.array(z.string()),
    tags: z.array(z.string()).optional(),
  }),
  execute: async function* ({ title, topic, content, keyPoints, tags }) {
    const context = getContext();
    const artifactId = nanoid();

    // Iniciar streaming
    const summary = summaryArtifact.stream({
      title,
      stage: 'generating',
      topic,
      content: '',
      keyPoints: [],
      tags: tags || [],
      wordCount: 0,
    });

    yield { text: `Gerando resumo sobre "${topic}"...` };

    // Simular streaming progressivo do conteúdo
    const words = content.split(' ');
    let accumulatedContent = '';

    for (let i = 0; i < words.length; i += 10) {
      accumulatedContent += words.slice(i, i + 10).join(' ') + ' ';
      summary.progress = (i + 10) / words.length;

      await summary.update({
        content: accumulatedContent.trim(),
        wordCount: accumulatedContent.split(' ').length,
      });
    }

    // Adicionar key points
    await summary.update({
      keyPoints,
      stage: 'complete',
    });

    // Auto-persist no banco
    const supabase = await createClient();
    await supabase.from('artifacts').insert({
      id: artifactId,
      user_id: context.userId,
      title,
      type: 'summary',
      content: {
        topic,
        markdownContent: content,
        tags: tags || [],
      },
      ai_context: {
        agent: 'odonto-summary',
        model: 'google/gemini-2.0-flash-001',
        sessionId: context.sessionId,
      },
      description: `Resumo sobre ${topic}`,
    });

    // Completar artifact
    await summary.complete({
      title,
      stage: 'complete',
      topic,
      content,
      keyPoints,
      tags: tags || [],
      wordCount: content.split(' ').length,
    });

    yield {
      text: `Resumo "${title}" criado com sucesso!`,
      forceStop: true,
    };

    return { artifactId, type: 'summary', title };
  },
});

export const createStreamingQuiz = tool({
  description: 'Cria um simulado com questões geradas progressivamente',
  parameters: z.object({
    title: z.string(),
    topic: z.string(),
    specialty: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    questionCount: z.number().min(3).max(10),
  }),
  execute: async function* ({ title, topic, specialty, difficulty, questionCount }) {
    const context = getContext();
    const artifactId = nanoid();

    // Iniciar streaming
    const quiz = quizArtifact.stream({
      title,
      stage: 'generating',
      topic,
      specialty,
      difficulty,
      questions: [],
      totalQuestions: questionCount,
    });

    yield { text: `Gerando ${questionCount} questões sobre "${topic}"...` };

    // Aqui você integraria com o LLM para gerar questões
    // Por enquanto, placeholder para demonstrar o padrão
    const questions = [];

    for (let i = 0; i < questionCount; i++) {
      quiz.progress = (i + 1) / questionCount;

      // Simular geração de questão (substituir por chamada real ao LLM)
      const question = {
        id: `q-${i + 1}`,
        text: `Questão ${i + 1} sobre ${topic}`,
        options: [
          { id: 'A', text: 'Opção A', isCorrect: i === 0 },
          { id: 'B', text: 'Opção B', isCorrect: false },
          { id: 'C', text: 'Opção C', isCorrect: false },
          { id: 'D', text: 'Opção D', isCorrect: false },
          { id: 'E', text: 'Opção E', isCorrect: false },
        ],
        explanation: `Explicação da questão ${i + 1}`,
        difficulty,
      };

      questions.push(question);

      await quiz.update({
        questions,
        stage: i === questionCount - 1 ? 'validating' : 'generating',
      });

      yield { text: `Questão ${i + 1}/${questionCount} gerada` };
    }

    // Validação final
    await quiz.update({ stage: 'complete' });

    // Persistir
    const supabase = await createClient();
    await supabase.from('artifacts').insert({
      id: artifactId,
      user_id: context.userId,
      title,
      type: 'exam',
      content: { topic, specialty, difficulty, questions },
      ai_context: {
        agent: 'odonto-practice',
        model: 'google/gemini-2.0-flash-001',
        sessionId: context.sessionId,
      },
      description: `Simulado de ${topic}`,
      metadata: { questionCount, difficulty },
    });

    await quiz.complete({
      title,
      stage: 'complete',
      topic,
      specialty,
      difficulty,
      questions,
      totalQuestions: questionCount,
    });

    yield { text: `Simulado "${title}" criado!`, forceStop: true };

    return { artifactId, type: 'quiz', title, questionCount };
  },
});
```

### 1.4 Hooks React para Consumir Artefatos

```typescript
// components/artifacts/use-odonto-artifacts.ts
'use client';

import { useArtifact, useArtifacts } from '@ai-sdk-tools/artifacts/client';
import {
  summaryArtifact,
  flashcardArtifact,
  quizArtifact,
  researchArtifact,
  reportArtifact
} from '@/lib/ai/artifacts/schemas';
import { toast } from 'sonner';

// Hook para resumo individual
export function useSummaryArtifact() {
  return useArtifact(summaryArtifact, {
    onUpdate: (data, prevData) => {
      if (data.stage === 'complete' && prevData?.stage !== 'complete') {
        toast.success(`Resumo "${data.title}" concluído!`);
      }
    },
    onProgress: (progress) => {
      console.log(`Progresso do resumo: ${Math.round(progress * 100)}%`);
    },
    onError: (error) => {
      toast.error(`Erro ao gerar resumo: ${error}`);
    },
  });
}

// Hook para quiz
export function useQuizArtifact() {
  return useArtifact(quizArtifact, {
    onUpdate: (data) => {
      if (data.stage === 'validating') {
        toast.info('Validando questões...');
      }
    },
    onComplete: (data) => {
      toast.success(`Simulado com ${data.totalQuestions} questões pronto!`);
    },
  });
}

// Hook unificado para todos os artefatos
export function useOdontoArtifacts() {
  return useArtifacts({
    onData: (artifactType, data) => {
      console.log(`[Artifact] ${artifactType}:`, data);

      if (data.status === 'complete') {
        // Analytics ou logging
        console.log(`[Analytics] Artifact completed: ${artifactType}`);
      }
    },
  });
}
```

### 1.5 Componente Canvas de Artefatos

```tsx
// components/artifacts/artifact-canvas-v2.tsx
'use client';

import { useOdontoArtifacts } from './use-odonto-artifacts';
import { SummaryArtifact } from './summary-artifact';
import { QuizArtifact } from './quiz-artifact';
import { FlashcardArtifact } from './flashcard-artifact';
import { ResearchArtifact } from './research-artifact';
import { ReportArtifact } from './report-artifact';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

export function ArtifactCanvasV2() {
  const { latest, current, byType } = useOdontoArtifacts();

  if (!current) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Artefatos aparecerão aqui durante a conversa
      </div>
    );
  }

  // Mostrar loading/progress se ainda está gerando
  if (current.status !== 'complete') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">
            Gerando {current.type}...
          </span>
        </div>
        {current.progress && (
          <Progress value={current.progress * 100} className="h-2" />
        )}
      </div>
    );
  }

  // Renderizar baseado no tipo
  switch (current.type) {
    case 'summary':
      return <SummaryArtifact artifact={current.data} />;
    case 'quiz':
      return <QuizArtifact artifact={current.data} />;
    case 'flashcard':
      return <FlashcardArtifact artifact={current.data} />;
    case 'research':
      return <ResearchArtifact artifact={current.data} />;
    case 'report':
      return <ReportArtifact artifact={current.data} />;
    default:
      return <div>Tipo de artefato não suportado: {current.type}</div>;
  }
}
```

---

## FASE 2: Orquestração com Supervisor

### Objetivo
Implementar roteamento automático de agentes usando padrão Supervisor do LangGraph.

### Opção A: Supervisor com AI SDK (Recomendado)

```typescript
// lib/ai/agents/supervisor.ts
import { tool } from 'ai';
import { z } from 'zod';
import { streamText } from 'ai';
import { openrouter } from '@/lib/ai/openrouter';

// Schema de roteamento
const routingSchema = z.object({
  selectedAgent: z.enum([
    'odonto-gpt',      // Tutor geral
    'odonto-research', // Pesquisa científica
    'odonto-practice', // Simulados
    'odonto-summary',  // Resumos e flashcards
    'odonto-vision',   // Análise de imagens
  ]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export const supervisorTool = tool({
  description: `Analisa a intenção do usuário e roteia para o agente especializado mais adequado.

Critérios de roteamento:
- odonto-research: Perguntas sobre artigos, evidências, PubMed, pesquisa científica
- odonto-practice: Pedidos de simulado, quiz, questões de prova, treino
- odonto-summary: Pedidos de resumo, flashcards, mapas mentais, síntese
- odonto-vision: Análise de radiografia, imagem, laudo, diagnóstico por imagem
- odonto-gpt: Dúvidas gerais, explicações conceituais, tutoria`,
  parameters: z.object({
    userMessage: z.string(),
    conversationContext: z.string().optional(),
    hasImage: z.boolean().default(false),
  }),
  execute: async ({ userMessage, conversationContext, hasImage }) => {
    // Se tem imagem, vai direto para vision
    if (hasImage) {
      return {
        selectedAgent: 'odonto-vision',
        confidence: 0.95,
        reasoning: 'Mensagem contém imagem para análise',
      };
    }

    // Usar LLM para classificar intenção
    const { text } = await streamText({
      model: openrouter('google/gemini-2.0-flash-001'),
      system: `Você é um roteador de agentes. Analise a mensagem e retorne JSON com:
- selectedAgent: um dos agentes disponíveis
- confidence: 0-1
- reasoning: breve explicação

Agentes:
- odonto-research: pesquisa científica, artigos, PubMed
- odonto-practice: simulados, quizzes, questões
- odonto-summary: resumos, flashcards, mapas mentais
- odonto-vision: análise de imagens (só se mencionado)
- odonto-gpt: dúvidas gerais, explicações`,
      prompt: `Mensagem: "${userMessage}"
${conversationContext ? `Contexto: ${conversationContext}` : ''}

Retorne apenas o JSON.`,
      maxTokens: 200,
    });

    try {
      const parsed = JSON.parse(text);
      return routingSchema.parse(parsed);
    } catch {
      // Fallback para agente geral
      return {
        selectedAgent: 'odonto-gpt',
        confidence: 0.5,
        reasoning: 'Fallback para agente geral',
      };
    }
  },
});

// Implementar no chat route
export async function routeToAgent(
  userMessage: string,
  context?: string,
  hasImage?: boolean
) {
  const routing = await supervisorTool.execute({
    userMessage,
    conversationContext: context,
    hasImage: hasImage || false,
  });

  return routing;
}
```

### Opção B: LangGraph Full (Para Workflows Complexos)

```typescript
// lib/ai/agents/langgraph-supervisor.ts
import { StateGraph, MessagesAnnotation, Command, END, START } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

// Definir estado
const AgentState = {
  ...MessagesAnnotation,
  currentAgent: null as string | null,
  artifacts: [] as any[],
  context: {} as Record<string, any>,
};

// Criar supervisor
const supervisorNode = async (state: typeof AgentState) => {
  const model = new ChatOpenAI({ model: 'gpt-4o-mini' });

  const response = await model.withStructuredOutput({
    type: 'object',
    properties: {
      next_agent: {
        type: 'string',
        enum: ['research', 'practice', 'summary', 'vision', 'general', '__end__']
      },
      reasoning: { type: 'string' },
    },
    required: ['next_agent'],
  }).invoke(state.messages);

  if (response.next_agent === '__end__') {
    return new Command({ goto: END });
  }

  return new Command({
    goto: response.next_agent,
    update: { currentAgent: response.next_agent },
  });
};

// Criar agentes
const researchAgent = async (state: typeof AgentState) => {
  // Executar pesquisa
  const result = await executeResearchAgent(state.messages);

  return new Command({
    goto: 'supervisor',
    update: {
      messages: [...state.messages, result],
      artifacts: [...state.artifacts, result.artifact],
    },
  });
};

// Montar grafo
const graph = new StateGraph(AgentState)
  .addNode('supervisor', supervisorNode, {
    ends: ['research', 'practice', 'summary', 'vision', 'general', END],
  })
  .addNode('research', researchAgent, { ends: ['supervisor'] })
  .addNode('practice', practiceAgent, { ends: ['supervisor'] })
  .addNode('summary', summaryAgent, { ends: ['supervisor'] })
  .addNode('vision', visionAgent, { ends: ['supervisor'] })
  .addNode('general', generalAgent, { ends: ['supervisor'] })
  .addEdge(START, 'supervisor')
  .compile();

export { graph as supervisorGraph };
```

### 2.3 Handoff entre Agentes

```typescript
// lib/ai/tools/handoff-tool.ts
import { tool } from 'ai';
import { z } from 'zod';

export const handoffTool = tool({
  description: `Transfere a conversa para outro agente especializado quando necessário.
Use quando:
- A tarefa atual requer expertise de outro agente
- O usuário fez uma pergunta fora do seu escopo
- Uma subtarefa seria melhor executada por outro agente`,
  parameters: z.object({
    targetAgent: z.enum([
      'odonto-research',
      'odonto-practice',
      'odonto-summary',
      'odonto-vision',
      'odonto-gpt',
    ]),
    reason: z.string().describe('Motivo da transferência'),
    contextToPass: z.string().describe('Contexto relevante para o próximo agente'),
    preserveArtifacts: z.boolean().default(true),
  }),
  execute: async ({ targetAgent, reason, contextToPass, preserveArtifacts }) => {
    return {
      handoff: true,
      targetAgent,
      reason,
      context: contextToPass,
      preserveArtifacts,
      timestamp: new Date().toISOString(),
    };
  },
});
```

### 2.4 Atualizar Chat Route com Supervisor

```typescript
// app/api/chat/route.ts (atualizado)
import { streamText, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { openrouter } from '@/lib/ai/openrouter';
import { routeToAgent } from '@/lib/ai/agents/supervisor';
import { getAgentConfig } from '@/lib/ai/agents/config';
import { initializeContext } from '@/lib/ai/artifacts/context';

export async function POST(req: Request) {
  const { messages, sessionId, userId, imageUrl } = await req.json();

  const lastMessage = messages[messages.length - 1];
  const hasImage = !!imageUrl || lastMessage.content.includes('[image]');

  // 1. Rotear para agente apropriado
  const routing = await routeToAgent(
    lastMessage.content,
    messages.slice(-5).map(m => m.content).join('\n'),
    hasImage
  );

  console.log(`[Supervisor] Routing to: ${routing.selectedAgent} (${routing.confidence})`);

  // 2. Obter configuração do agente
  const agentConfig = getAgentConfig(routing.selectedAgent);

  // 3. Criar stream com contexto
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // Inicializar contexto para artifacts
      await initializeContext(writer, userId, sessionId);

      const result = streamText({
        model: openrouter(agentConfig.model),
        system: agentConfig.systemPrompt,
        messages,
        tools: {
          ...agentConfig.tools,
          handoff: handoffTool, // Permitir handoff
        },
        maxSteps: 5,
        temperature: 0.1,
        onFinish: async (event) => {
          // Verificar se houve handoff
          const handoffCall = event.toolCalls?.find(
            tc => tc.toolName === 'handoff'
          );

          if (handoffCall) {
            // Processar handoff para outro agente
            console.log(`[Handoff] → ${handoffCall.args.targetAgent}`);
          }

          // Salvar mensagem
          await saveMessage(sessionId, routing.selectedAgent, event);
        },
      });

      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({
    stream,
    headers: {
      'x-session-id': sessionId,
      'x-agent-id': routing.selectedAgent,
      'x-routing-confidence': String(routing.confidence),
    },
  });
}
```

---

## FASE 3: RAG com Embeddings

### Objetivo
Usar artefatos e conversas anteriores como contexto para novas interações.

### 3.1 Configurar pgvector no Supabase

```sql
-- Migration: add_embeddings_support.sql

-- Habilitar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Adicionar coluna de embedding aos artefatos
ALTER TABLE artifacts
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Criar índice para busca por similaridade
CREATE INDEX IF NOT EXISTS artifacts_embedding_idx
ON artifacts
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Função de busca por similaridade
CREATE OR REPLACE FUNCTION match_artifacts(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter_user_id uuid DEFAULT NULL,
  filter_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  type text,
  content jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.type::text,
    a.content,
    1 - (a.embedding <=> query_embedding) as similarity
  FROM artifacts a
  WHERE
    (filter_user_id IS NULL OR a.user_id = filter_user_id)
    AND (filter_type IS NULL OR a.type::text = filter_type)
    AND a.embedding IS NOT NULL
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Tabela para embeddings de chunks de conhecimento
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL, -- 'artifact', 'conversation', 'document'
  source_id uuid,
  content text NOT NULL,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
ON knowledge_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### 3.2 Serviço de Embeddings

```typescript
// lib/ai/embeddings/service.ts
import { embed, embedMany } from 'ai';
import { openrouter } from '@/lib/ai/openrouter';
import { createClient } from '@/lib/supabase/server';

const EMBEDDING_MODEL = 'openai/text-embedding-3-small';

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openrouter(EMBEDDING_MODEL),
    value: text,
  });
  return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: openrouter(EMBEDDING_MODEL),
    values: texts,
  });
  return embeddings;
}

// Atualizar embedding de um artefato
export async function updateArtifactEmbedding(artifactId: string) {
  const supabase = await createClient();

  const { data: artifact } = await supabase
    .from('artifacts')
    .select('title, content, type')
    .eq('id', artifactId)
    .single();

  if (!artifact) return;

  // Criar texto para embedding
  const textForEmbedding = `
    Título: ${artifact.title}
    Tipo: ${artifact.type}
    Conteúdo: ${JSON.stringify(artifact.content).slice(0, 5000)}
  `.trim();

  const embedding = await generateEmbedding(textForEmbedding);

  await supabase
    .from('artifacts')
    .update({ embedding })
    .eq('id', artifactId);
}

// Buscar artefatos similares
export async function searchSimilarArtifacts(
  query: string,
  userId: string,
  options: {
    limit?: number;
    type?: string;
    minSimilarity?: number;
  } = {}
) {
  const { limit = 5, type, minSimilarity = 0.7 } = options;

  const queryEmbedding = await generateEmbedding(query);
  const supabase = await createClient();

  const { data } = await supabase.rpc('match_artifacts', {
    query_embedding: queryEmbedding,
    match_count: limit,
    filter_user_id: userId,
    filter_type: type,
  });

  return (data || []).filter(
    (item: any) => item.similarity >= minSimilarity
  );
}
```

### 3.3 RAG Context Provider

```typescript
// lib/ai/rag/context-provider.ts
import { searchSimilarArtifacts } from '../embeddings/service';

export interface RAGContext {
  relevantArtifacts: Array<{
    id: string;
    title: string;
    type: string;
    content: any;
    similarity: number;
  }>;
  contextText: string;
}

export async function getRAGContext(
  query: string,
  userId: string,
  options: {
    maxArtifacts?: number;
    includeTypes?: string[];
  } = {}
): Promise<RAGContext> {
  const { maxArtifacts = 3, includeTypes } = options;

  // Buscar artefatos relevantes
  const relevantArtifacts = await searchSimilarArtifacts(query, userId, {
    limit: maxArtifacts,
    minSimilarity: 0.6,
  });

  // Filtrar por tipo se especificado
  const filtered = includeTypes
    ? relevantArtifacts.filter(a => includeTypes.includes(a.type))
    : relevantArtifacts;

  // Construir contexto textual
  const contextText = filtered.length > 0
    ? `
## Contexto de Estudos Anteriores

${filtered.map((a, i) => `
### ${i + 1}. ${a.title} (${a.type})
${formatArtifactContent(a.content, a.type)}
`).join('\n')}
`.trim()
    : '';

  return {
    relevantArtifacts: filtered,
    contextText,
  };
}

function formatArtifactContent(content: any, type: string): string {
  switch (type) {
    case 'summary':
      return content.markdownContent?.slice(0, 500) + '...';
    case 'research':
      return `Pesquisa: ${content.query}\n${content.markdownContent?.slice(0, 500)}...`;
    case 'flashcard':
      return `${content.cards?.length || 0} flashcards sobre ${content.topic}`;
    case 'exam':
      return `${content.questions?.length || 0} questões sobre ${content.topic}`;
    default:
      return JSON.stringify(content).slice(0, 300) + '...';
  }
}
```

### 3.4 Integrar RAG no Chat

```typescript
// app/api/chat/route.ts (com RAG)
import { getRAGContext } from '@/lib/ai/rag/context-provider';

export async function POST(req: Request) {
  const { messages, sessionId, userId } = await req.json();
  const lastMessage = messages[messages.length - 1];

  // 1. Buscar contexto RAG
  const ragContext = await getRAGContext(lastMessage.content, userId, {
    maxArtifacts: 3,
    includeTypes: ['summary', 'research', 'exam'],
  });

  // 2. Rotear para agente
  const routing = await routeToAgent(lastMessage.content);
  const agentConfig = getAgentConfig(routing.selectedAgent);

  // 3. Injetar contexto RAG no system prompt
  const enhancedSystemPrompt = ragContext.contextText
    ? `${agentConfig.systemPrompt}\n\n${ragContext.contextText}`
    : agentConfig.systemPrompt;

  // 4. Stream com contexto enriquecido
  const result = streamText({
    model: openrouter(agentConfig.model),
    system: enhancedSystemPrompt,
    messages,
    tools: agentConfig.tools,
    maxSteps: 5,
  });

  return result.toUIMessageStreamResponse({
    headers: {
      'x-rag-artifacts': ragContext.relevantArtifacts.length.toString(),
    },
  });
}
```

---

## FASE 4: Generative UI

### Objetivo
Usar `streamUI` para renderizar componentes React diretamente baseado na execução de tools.

### 4.1 Server Action com streamUI

```typescript
// app/actions/chat-ui.tsx
'use server';

import { streamUI } from '@ai-sdk/rsc';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { SummaryCard } from '@/components/artifacts/summary-card';
import { QuizCard } from '@/components/artifacts/quiz-card';
import { FlashcardDeck } from '@/components/artifacts/flashcard-deck';
import { ResearchPanel } from '@/components/artifacts/research-panel';
import { LoadingArtifact } from '@/components/artifacts/loading-artifact';

export async function streamChatUI(input: string, context: any) {
  const result = await streamUI({
    model: openai('gpt-4o'),
    system: 'Você é o Odonto GPT, tutor de odontologia...',
    messages: [{ role: 'user', content: input }],

    text: ({ content, done }) => {
      return <div className="prose dark:prose-invert">{content}</div>;
    },

    tools: {
      createSummary: {
        description: 'Cria um resumo estruturado',
        inputSchema: z.object({
          title: z.string(),
          content: z.string(),
          keyPoints: z.array(z.string()),
          topic: z.string(),
        }),
        generate: async function* ({ title, content, keyPoints, topic }) {
          // Mostrar loading
          yield <LoadingArtifact type="summary" title={title} />;

          // Simular processamento
          await new Promise(r => setTimeout(r, 1000));

          // Retornar componente final
          return (
            <SummaryCard
              title={title}
              content={content}
              keyPoints={keyPoints}
              topic={topic}
            />
          );
        },
      },

      createQuiz: {
        description: 'Cria um simulado interativo',
        inputSchema: z.object({
          title: z.string(),
          topic: z.string(),
          questions: z.array(z.object({
            text: z.string(),
            options: z.array(z.object({
              text: z.string(),
              isCorrect: z.boolean(),
            })),
            explanation: z.string(),
          })),
        }),
        generate: async function* ({ title, topic, questions }) {
          yield <LoadingArtifact type="quiz" title={title} progress={0} />;

          // Gerar questões progressivamente
          const generatedQuestions = [];
          for (let i = 0; i < questions.length; i++) {
            generatedQuestions.push(questions[i]);
            yield (
              <LoadingArtifact
                type="quiz"
                title={title}
                progress={(i + 1) / questions.length}
                message={`Gerando questão ${i + 1}/${questions.length}`}
              />
            );
            await new Promise(r => setTimeout(r, 500));
          }

          return (
            <QuizCard
              title={title}
              topic={topic}
              questions={generatedQuestions}
            />
          );
        },
      },

      createFlashcards: {
        description: 'Cria deck de flashcards',
        inputSchema: z.object({
          title: z.string(),
          topic: z.string(),
          cards: z.array(z.object({
            front: z.string(),
            back: z.string(),
          })),
        }),
        generate: async function* ({ title, topic, cards }) {
          yield <LoadingArtifact type="flashcard" title={title} />;

          return (
            <FlashcardDeck
              title={title}
              topic={topic}
              cards={cards}
            />
          );
        },
      },

      searchResearch: {
        description: 'Busca artigos científicos',
        inputSchema: z.object({
          query: z.string(),
          specialty: z.string().optional(),
        }),
        generate: async function* ({ query, specialty }) {
          yield (
            <LoadingArtifact
              type="research"
              title={`Pesquisando: ${query}`}
              message="Consultando PubMed e bases científicas..."
            />
          );

          // Executar busca real
          const results = await searchPubMed(query, specialty);

          return (
            <ResearchPanel
              query={query}
              results={results}
              specialty={specialty}
            />
          );
        },
      },
    },
  });

  return result;
}
```

### 4.2 Componentes de Loading

```tsx
// components/artifacts/loading-artifact.tsx
'use client';

import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LoadingArtifactProps {
  type: 'summary' | 'quiz' | 'flashcard' | 'research' | 'report';
  title: string;
  progress?: number;
  message?: string;
}

const typeConfig = {
  summary: { icon: '📝', label: 'Resumo', color: 'bg-blue-500/10' },
  quiz: { icon: '📋', label: 'Simulado', color: 'bg-purple-500/10' },
  flashcard: { icon: '🎴', label: 'Flashcards', color: 'bg-green-500/10' },
  research: { icon: '🔬', label: 'Pesquisa', color: 'bg-amber-500/10' },
  report: { icon: '📄', label: 'Laudo', color: 'bg-red-500/10' },
};

export function LoadingArtifact({
  type,
  title,
  progress,
  message
}: LoadingArtifactProps) {
  const config = typeConfig[type];

  return (
    <div className={cn(
      'rounded-lg border p-4 space-y-3',
      config.color
    )}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{config.icon}</span>
        <span className="font-medium">{config.label}</span>
        <Loader2 className="h-4 w-4 animate-spin ml-auto" />
      </div>

      <p className="text-sm font-medium">{title}</p>

      {message && (
        <p className="text-xs text-muted-foreground">{message}</p>
      )}

      {progress !== undefined && (
        <Progress value={progress * 100} className="h-1" />
      )}
    </div>
  );
}
```

---

## Cronograma de Implementação

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 1: Artifact Streaming                                     │
│  ├── 1.1 Schemas Zod                          [2-3 dias]       │
│  ├── 1.2 Typed Context                        [1-2 dias]       │
│  ├── 1.3 Tools com Streaming                  [3-4 dias]       │
│  ├── 1.4 Hooks React                          [2 dias]         │
│  └── 1.5 Canvas v2                            [2 dias]         │
│                                               Total: ~2 semanas │
├─────────────────────────────────────────────────────────────────┤
│  FASE 2: Supervisor                                             │
│  ├── 2.1 Router Tool                          [2-3 dias]       │
│  ├── 2.2 Agent Configs                        [2 dias]         │
│  ├── 2.3 Handoff Tool                         [2 dias]         │
│  └── 2.4 Chat Route Update                    [2-3 dias]       │
│                                               Total: ~1.5 semanas│
├─────────────────────────────────────────────────────────────────┤
│  FASE 3: RAG                                                    │
│  ├── 3.1 pgvector Migration                   [1 dia]          │
│  ├── 3.2 Embedding Service                    [2-3 dias]       │
│  ├── 3.3 Context Provider                     [2 dias]         │
│  └── 3.4 Integration                          [2 dias]         │
│                                               Total: ~1 semana  │
├─────────────────────────────────────────────────────────────────┤
│  FASE 4: Generative UI                                          │
│  ├── 4.1 streamUI Setup                       [2-3 dias]       │
│  ├── 4.2 Loading Components                   [2 dias]         │
│  └── 4.3 Tool Generators                      [3-4 dias]       │
│                                               Total: ~1.5 semanas│
└─────────────────────────────────────────────────────────────────┘

TOTAL ESTIMADO: 6-7 semanas
```

---

## Métricas de Sucesso

| Métrica | Atual | Meta |
|---------|-------|------|
| Tempo de resposta (P95) | ~8s | <4s |
| Acurácia de roteamento | Manual | >90% |
| Reutilização de contexto | 0% | >60% |
| Taxa de conclusão de artefatos | ~85% | >95% |
| Satisfação do usuário (NPS) | - | >50 |

---

## Próximos Passos

1. **Decisão**: Escolher entre AI SDK puro vs LangGraph
2. **PoC**: Implementar Fase 1.1-1.3 em branch de teste
3. **Validação**: Testar com usuários beta
4. **Rollout**: Deploy progressivo por fase

---

## Referências

- [AI SDK v6 Documentation](https://ai-sdk.dev)
- [AI SDK Agents Patterns](https://aisdkagents.com)
- [@ai-sdk-tools/artifacts](https://github.com/midday-ai/ai-sdk-tools)
- [LangGraphJS Documentation](https://langchain-ai.github.io/langgraphjs)
- [Supabase pgvector](https://supabase.com/docs/guides/ai/vector-columns)
