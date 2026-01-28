# Integrações de AI - Odonto GPT

## Visão Geral

O sistema utiliza múltiplos provedores de IA, cada um otimizado para tarefas específicas:

| Provider | Modelos | Uso Principal | Vantagens |
|----------|---------|---------------|-----------|
| **OpenAI** | GPT-4o, GPT-4 Turbo | Geração geral, estruturação | Confiável, rápido, ótima formatação |
| **Anthropic** | Claude 3.5 Sonnet | Raciocínio complexo, hierarquias | Contexto longo, ética |
| **Google** | Gemini 1.5 Pro | Resumos de textos longos | 1M tokens de contexto |
| **Perplexity** | Sonar Pro | Pesquisas com citações | Acesso web, fontes reais |

---

## Setup Inicial

### 1. Variáveis de Ambiente

```bash
# .env.local

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google AI
GOOGLE_AI_API_KEY=...

# Perplexity
PERPLEXITY_API_KEY=pplx-...

# OpenRouter (alternativa para múltiplos modelos)
OPENROUTER_API_KEY=sk-or-...

# Configurações
AI_TIMEOUT_MS=60000
AI_MAX_RETRIES=3
AI_DEFAULT_TEMPERATURE=0.7
```

### 2. Instalação do Vercel AI SDK

```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google
```

### 3. Configuração dos Providers

**lib/ai/providers/config.ts**:
```typescript
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// OpenAI
export const gpt4o = openai('gpt-4o', {
  structuredOutputs: true,
});

export const gpt4Turbo = openai('gpt-4-turbo', {
  structuredOutputs: true,
});

// Anthropic
export const claudeSonnet = anthropic('claude-3-5-sonnet-20241022', {
  cacheControl: true, // Prompt caching
});

// Google
export const gemini15Pro = google('gemini-1.5-pro-latest');

// OpenRouter (para Perplexity)
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const perplexitySonar = openrouter('perplexity/sonar-pro');
```

---

## Abstrações Reutilizáveis

### 1. Wrapper Genérico de Geração

**lib/ai/generator.ts**:
```typescript
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

interface GenerateOptions {
  model: any;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  schema?: z.ZodSchema;
}

export async function generate<T = string>(
  options: GenerateOptions
): Promise<T> {
  const {
    model,
    prompt,
    temperature = 0.7,
    maxTokens = 4096,
    schema,
  } = options;

  try {
    if (schema) {
      // Structured output
      const { object } = await generateObject({
        model,
        schema,
        prompt,
        temperature,
        maxTokens,
      });
      return object as T;
    } else {
      // Text output
      const { text } = await generateText({
        model,
        prompt,
        temperature,
        maxTokens,
      });
      return text as T;
    }
  } catch (error) {
    console.error('AI Generation Error:', error);
    throw new Error('Failed to generate content');
  }
}

// Com retry automático
export async function generateWithRetry<T>(
  options: GenerateOptions,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generate<T>(options);
    } catch (error) {
      lastError = error as Error;
      console.log(`Retry ${i + 1}/${maxRetries}`);
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }

  throw lastError;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### 2. Prompt Templates Manager

**lib/ai/prompts/templates.ts**:
```typescript
export const PROMPTS = {
  flashcard: {
    system: `Você é um professor de odontologia especializado em didática e criação de materiais de estudo efetivos.`,
    
    user: (params: {
      topic: string;
      numberOfCards: number;
      difficulty: string;
      sourceContent?: string;
    }) => `
TAREFA: Criar ${params.numberOfCards} flashcards sobre: "${params.topic}"

NÍVEL: ${params.difficulty}
${params.sourceContent ? `CONTEÚDO BASE:\n${params.sourceContent}\n` : ''}

PRINCÍPIOS:
1. Frente: Pergunta clara e direta
2. Verso: Resposta concisa (50-150 palavras)
3. Distribuir dificuldade: 40% easy, 40% medium, 20% hard
4. Incluir mnemônicos quando apropriado

Retorne um array JSON de flashcards.
    `.trim(),
  },

  research: {
    system: `Você é um pesquisador científico especializado em odontologia. Você tem acesso a fontes científicas recentes e é capaz de sintetizar evidências de forma rigorosa.`,
    
    user: (params: {
      query: string;
      evidenceLevel: string[];
      yearRange: { from: number; to: number };
    }) => `
PESQUISA: ${params.query}

CRITÉRIOS:
- Apenas estudos entre ${params.yearRange.from} e ${params.yearRange.to}
- Níveis de evidência aceitos: ${params.evidenceLevel.join(', ')}
- Incluir DOI quando disponível
- Mínimo de 10 fontes científicas

ESTRUTURA:
1. Resumo Executivo (150-200 palavras)
2. Introdução
3. Metodologia da Pesquisa
4. Principais Achados (com subsecções)
5. Discussão e Implicações Clínicas
6. Conclusões
7. Referências (formato ABNT)

Use citações numeradas [1], [2], etc.
    `.trim(),
  },

  mindmap: {
    system: `Você é um especialista em design instrucional e mapas conceituais. Você organiza informações complexas em estruturas hierárquicas visuais.`,
    
    user: (params: { topic: string; maxNodes?: number }) => `
TÓPICO: "${params.topic}"

TAREFA: Criar estrutura de mapa mental hierárquico

REQUISITOS:
- 1 nó central (tópico principal)
- 3-5 ramos principais
- Cada ramo: 2-4 subramos
- Máximo de ${params.maxNodes || 30} nós
- Relações lógicas e claras
- Cores para agrupar conceitos

Retorne JSON: { nodes: [...], edges: [...] }
    `.trim(),
  },

  quiz: {
    system: `Você é um professor de odontologia especializado em avaliação e criação de questões de múltipla escolha.`,
    
    user: (params: {
      topic: string;
      numberOfQuestions: number;
      difficulty: string;
    }) => `
TAREFA: Criar ${params.numberOfQuestions} questões de múltipla escolha

TÓPICO: ${params.topic}
DIFICULDADE: ${params.difficulty}

REQUISITOS:
- 5 alternativas (A, B, C, D, E)
- Apenas 1 alternativa correta
- Distratores plausíveis (erros comuns)
- Explicação detalhada da resposta
- Incluir referência quando relevante

DISTRIBUIÇÃO:
- 40% questões conceituais
- 30% aplicação clínica
- 30% casos clínicos

Retorne array JSON de questões.
    `.trim(),
  },

  summary: {
    system: `Você é um especialista em síntese de conteúdo acadêmico. Você mantém fidelidade ao original enquanto extrai apenas o essencial.`,
    
    user: (params: { text: string; length?: 'brief' | 'detailed' }) => `
CONTEÚDO ORIGINAL:
${params.text}

TAREFA: Criar resumo ${params.length || 'detailed'}

ESTRUTURA:
1. RESUMO EXECUTIVO (150-200 palavras)
2. RESUMO DETALHADO (seções temáticas)
3. PONTOS-CHAVE (5-10 takeaways)
4. GLOSSÁRIO (termos técnicos)

Formato: Markdown estruturado
    `.trim(),
  },

  report: {
    system: `Você é um dentista experiente que cria documentos clínicos profissionais com linguagem técnica precisa.`,
    
    user: (params: {
      reportType: string;
      patientData: Record<string, any>;
      clinicalFindings: string;
    }) => `
TIPO DE DOCUMENTO: ${params.reportType}

DADOS DO PACIENTE:
${JSON.stringify(params.patientData, null, 2)}

ACHADOS CLÍNICOS:
${params.clinicalFindings}

TAREFA: Gerar documento clínico formal

Use linguagem técnica apropriada, seja objetivo e precise.
    `.trim(),
  },
};
```

---

## Implementações Específicas

### 1. Gerador de Flashcards

**lib/ai/generators/flashcard.ts**:
```typescript
import { z } from 'zod';
import { gpt4o } from '../providers/config';
import { generate } from '../generator';
import { PROMPTS } from '../prompts/templates';
import type { FlashCard } from '@/types/artifacts';

const flashcardSchema = z.object({
  cards: z.array(
    z.object({
      front: z.string(),
      back: z.string(),
      hint: z.string().optional(),
      tags: z.array(z.string()),
      difficulty: z.enum(['easy', 'medium', 'hard']),
    })
  ),
});

export async function generateFlashcards(params: {
  topic: string;
  numberOfCards: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sourceContent?: string;
}): Promise<FlashCard[]> {
  const prompt = PROMPTS.flashcard.user(params);

  const result = await generate<{ cards: any[] }>({
    model: gpt4o,
    prompt: `${PROMPTS.flashcard.system}\n\n${prompt}`,
    schema: flashcardSchema,
    temperature: 0.7,
  });

  return result.cards.map((card, index) => ({
    id: `card-${index + 1}`,
    ...card,
    nextReview: undefined,
    interval: undefined,
    easeFactor: 2.5,
    reviews: 0,
  }));
}
```

### 2. Gerador de Pesquisas (com Perplexity)

**lib/ai/generators/research.ts**:
```typescript
import { perplexitySonar } from '../providers/config';
import { generate } from '../generator';
import { PROMPTS } from '../prompts/templates';
import type { ResearchArtifact } from '@/types/artifacts';

export async function generateResearch(params: {
  query: string;
  evidenceLevel: string[];
  yearRange: { from: number; to: number };
}): Promise<ResearchArtifact['content']> {
  const prompt = PROMPTS.research.user(params);

  // Perplexity retorna automaticamente com citações
  const text = await generate<string>({
    model: perplexitySonar,
    prompt: `${PROMPTS.research.system}\n\n${prompt}`,
    temperature: 0.3, // Mais determinístico para pesquisa
    maxTokens: 8000,
  });

  // Parse do texto retornado
  const sections = parseResearchSections(text);
  const citations = extractCitations(text);

  return {
    query: params.query,
    abstract: extractAbstract(text),
    sections,
    citations,
    methodology: extractMethodology(text),
    conclusions: extractConclusions(text),
    generatedAt: new Date(),
  };
}

function parseResearchSections(text: string): ResearchSection[] {
  // Parser customizado para extrair seções do markdown
  const sections: ResearchSection[] = [];
  const lines = text.split('\n');
  
  let currentSection: ResearchSection | null = null;
  
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        id: nanoid(),
        title: line.replace('## ', ''),
        content: '',
        citationIds: [],
      };
    } else if (currentSection) {
      currentSection.content += line + '\n';
      
      // Extrair IDs de citações [1], [2], etc.
      const citationMatches = line.matchAll(/\[(\d+)\]/g);
      for (const match of citationMatches) {
        currentSection.citationIds.push(match[1]);
      }
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}

function extractCitations(text: string): Citation[] {
  // Perplexity retorna citações em formato específico
  // Extrair e estruturar
  const citations: Citation[] = [];
  
  // Implementação depende do formato de resposta da Perplexity
  // Exemplo simplificado:
  const citationPattern = /\[(\d+)\]:\s*(.*?)(?:\n|$)/g;
  let match;
  
  while ((match = citationPattern.exec(text)) !== null) {
    citations.push({
      id: match[1],
      title: match[2],
      authors: [],
      year: 0,
      source: '',
      url: '',
      snippet: '',
      evidenceLevel: 'unknown',
    });
  }
  
  return citations;
}
```

### 3. Gerador de Mapas Mentais

**lib/ai/generators/mindmap.ts**:
```typescript
import { z } from 'zod';
import { claudeSonnet } from '../providers/config';
import { generate } from '../generator';
import { PROMPTS } from '../prompts/templates';
import type { MindMapNode, MindMapEdge } from '@/types/artifacts';

const mindmapSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(['root', 'branch', 'leaf']),
      data: z.object({
        description: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
      }),
    })
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      label: z.string().optional(),
    })
  ),
});

export async function generateMindMap(params: {
  topic: string;
  maxNodes?: number;
}): Promise<{ nodes: MindMapNode[]; edges: MindMapEdge[] }> {
  const prompt = PROMPTS.mindmap.user(params);

  const result = await generate<{
    nodes: MindMapNode[];
    edges: MindMapEdge[];
  }>({
    model: claudeSonnet,
    prompt: `${PROMPTS.mindmap.system}\n\n${prompt}`,
    schema: mindmapSchema,
    temperature: 0.8, // Mais criativo para hierarquias
  });

  return result;
}
```

### 4. Gerador de Resumos (com Gemini)

**lib/ai/generators/summary.ts**:
```typescript
import { gemini15Pro } from '../providers/config';
import { generate } from '../generator';
import { PROMPTS } from '../prompts/templates';
import type { SummaryArtifact } from '@/types/artifacts';

export async function generateSummary(params: {
  text: string;
  length?: 'brief' | 'detailed';
}): Promise<SummaryArtifact['content']> {
  const prompt = PROMPTS.summary.user(params);

  // Gemini é ideal para textos muito longos
  const text = await generate<string>({
    model: gemini15Pro,
    prompt: `${PROMPTS.summary.system}\n\n${prompt}`,
    temperature: 0.5,
    maxTokens: 6000,
  });

  return {
    source: {
      type: 'text',
      title: 'Conteúdo fornecido',
      originalLength: params.text.length,
    },
    summary: {
      brief: extractBrief(text),
      detailed: parseDetailedSections(text),
      keyPoints: extractKeyPoints(text),
      definitions: extractDefinitions(text),
    },
  };
}
```

---

## Otimizações Avançadas

### 1. Prompt Caching (Anthropic)

```typescript
import { anthropic } from '@ai-sdk/anthropic';

const cachedPrompt = anthropic('claude-3-5-sonnet-20241022', {
  cacheControl: true,
});

// Marcar partes do prompt para cache
const systemPrompt = {
  role: 'system',
  content: VERY_LONG_INSTRUCTIONS,
  cache_control: { type: 'ephemeral' }, // Será cacheado
};

const result = await generateText({
  model: cachedPrompt,
  messages: [systemPrompt, userMessage],
});

// Próximas chamadas com o mesmo system prompt serão mais rápidas e baratas
```

### 2. Parallel Generation

```typescript
export async function generateMultipleArtifacts(
  requests: GenerateOptions[]
): Promise<any[]> {
  // Gerar múltiplos artefatos em paralelo
  return Promise.all(
    requests.map((req) => generateWithRetry(req))
  );
}

// Exemplo: Gerar 3 decks diferentes simultaneamente
const decks = await generateMultipleArtifacts([
  { model: gpt4o, prompt: flashcardPrompt1 },
  { model: gpt4o, prompt: flashcardPrompt2 },
  { model: gpt4o, prompt: flashcardPrompt3 },
]);
```

### 3. Streaming para UX Responsiva

```typescript
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = await streamText({
    model: gpt4o,
    prompt,
  });

  // Retorna stream que pode ser consumido no frontend
  return result.toAIStreamResponse();
}

// No frontend:
const response = await fetch('/api/generate-stream', {
  method: 'POST',
  body: JSON.stringify({ prompt }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  setGeneratedText((prev) => prev + chunk);
}
```

---

## Rate Limiting & Cost Control

### 1. Token Counter

```typescript
import { encode } from 'gpt-tokenizer';

export function countTokens(text: string): number {
  return encode(text).length;
}

export function estimateCost(tokens: number, model: string): number {
  const pricing = {
    'gpt-4o': { input: 0.0025, output: 0.01 }, // por 1K tokens
    'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
    'gemini-1.5-pro': { input: 0.0035, output: 0.01 },
  };

  const modelPricing = pricing[model as keyof typeof pricing];
  if (!modelPricing) return 0;

  return (tokens / 1000) * modelPricing.input;
}
```

### 2. User Quota System

```typescript
// Middleware para verificar quota
export async function checkUserQuota(userId: string, artifactType: string) {
  const usage = await getUserMonthlyUsage(userId);
  const limit = getUserPlan(userId).limits[artifactType];

  if (usage[artifactType] >= limit) {
    throw new Error(`Limite de ${artifactType} atingido neste mês`);
  }
}

// Incrementar uso após geração
export async function incrementUsage(userId: string, artifactType: string) {
  await prisma.usage.upsert({
    where: {
      userId_month: {
        userId,
        month: new Date().toISOString().slice(0, 7), // YYYY-MM
      },
    },
    update: {
      [artifactType]: { increment: 1 },
    },
    create: {
      userId,
      month: new Date().toISOString().slice(0, 7),
      [artifactType]: 1,
    },
  });
}
```

### 3. Fallback System

```typescript
export async function generateWithFallback<T>(
  options: GenerateOptions,
  fallbackModels: any[]
): Promise<T> {
  const models = [options.model, ...fallbackModels];

  for (const model of models) {
    try {
      return await generate<T>({ ...options, model });
    } catch (error) {
      console.error(`Model ${model} failed:`, error);
      // Tenta próximo modelo
    }
  }

  throw new Error('All models failed');
}

// Uso:
const flashcards = await generateWithFallback<FlashCard[]>(
  { model: gpt4o, prompt, schema },
  [claudeSonnet, gpt4Turbo] // Fallbacks
);
```

---

## Monitoramento & Analytics

### 1. Logging de Chamadas

```typescript
export async function logAICall(data: {
  userId: string;
  artifactType: string;
  model: string;
  tokensUsed: number;
  latency: number;
  success: boolean;
  error?: string;
}) {
  await prisma.aiCallLog.create({ data });
}

// Wrapper que loga automaticamente
export async function generateWithLogging<T>(
  options: GenerateOptions,
  userId: string,
  artifactType: string
): Promise<T> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    const result = await generate<T>(options);
    success = true;
    return result;
  } catch (e) {
    error = (e as Error).message;
    throw e;
  } finally {
    const latency = Date.now() - startTime;
    await logAICall({
      userId,
      artifactType,
      model: options.model.modelId,
      tokensUsed: 0, // TODO: Extrair do response
      latency,
      success,
      error,
    });
  }
}
```

### 2. Dashboard de Métricas

```sql
-- Query para insights
SELECT
  artifact_type,
  model,
  COUNT(*) as total_calls,
  AVG(latency) as avg_latency_ms,
  SUM(tokens_used) as total_tokens,
  (SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 as success_rate
FROM ai_call_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY artifact_type, model
ORDER BY total_calls DESC;
```

---

## Testes

### 1. Mock de Providers

```typescript
// __tests__/mocks/ai-providers.ts
export const mockGPT4o = {
  modelId: 'gpt-4o',
  generate: jest.fn().mockResolvedValue({
    text: 'Mocked response',
    usage: { promptTokens: 100, completionTokens: 200 },
  }),
};

// Uso em testes
import { mockGPT4o } from '@/mocks/ai-providers';

test('generateFlashcards', async () => {
  const result = await generateFlashcards({
    topic: 'Test',
    numberOfCards: 5,
    difficulty: 'beginner',
  });

  expect(mockGPT4o.generate).toHaveBeenCalled();
  expect(result).toHaveLength(5);
});
```

### 2. Snapshot Testing de Prompts

```typescript
test('flashcard prompt structure', () => {
  const prompt = PROMPTS.flashcard.user({
    topic: 'Anatomia Dental',
    numberOfCards: 10,
    difficulty: 'intermediate',
  });

  expect(prompt).toMatchSnapshot();
});
```

---

**Versão**: 1.0  
**Última atualização**: Janeiro 2026
