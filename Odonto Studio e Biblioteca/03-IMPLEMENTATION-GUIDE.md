# Guia de Implementação - Odonto Studio

## Setup Inicial do Projeto

### 1. Criação do Projeto Next.js

```bash
npx create-next-app@latest odonto-gpt --typescript --tailwind --app
cd odonto-gpt
```

### 2. Instalação de Dependências

```bash
# Core Dependencies
npm install @prisma/client zod react-hook-form @hookform/resolvers
npm install @tanstack/react-query zustand
npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google

# UI Libraries
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-toast
npm install lucide-react class-variance-authority clsx tailwind-merge

# Rich Text Editor
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link

# Mind Maps
npm install reactflow

# PDF Generation
npm install jspdf react-pdf

# Utilities
npm install date-fns nanoid

# Dev Dependencies
npm install -D prisma
npm install -D @types/node
```

### 3. Configuração do Prisma

```bash
npx prisma init
```

**prisma/schema.prisma**:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String     @id @default(cuid())
  email         String     @unique
  name          String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  
  artifacts     Artifact[]
  projects      Project[]
  quizAttempts  QuizAttempt[]
}

model Artifact {
  id          String   @id @default(cuid())
  type        String   // research, flashcard, report, summary, mindmap, quiz
  title       String
  content     Json     // Estrutura específica por tipo
  metadata    Json     // Metadados flexíveis
  
  userId      String
  projectId   String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project     Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
  tags        Tag[]    @relation("ArtifactTags")
  
  @@index([userId, type])
  @@index([createdAt])
  @@index([projectId])
}

model Project {
  id          String     @id @default(cuid())
  name        String
  description String?
  color       String?    // Para UI
  
  userId      String
  
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  artifacts   Artifact[]
  
  @@index([userId])
}

model Tag {
  id        String     @id @default(cuid())
  name      String     @unique
  artifacts Artifact[] @relation("ArtifactTags")
}

model QuizAttempt {
  id         String   @id @default(cuid())
  quizId     String   // FK para Artifact where type = 'quiz'
  userId     String
  
  answers    Json     // Array de respostas
  score      Float    // 0-100
  timeSpent  Int      // segundos
  
  completedAt DateTime @default(now())
  
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, quizId])
  @@index([completedAt])
}
```

```bash
npx prisma generate
npx prisma db push
```

---

## Estrutura de Diretórios

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx (dashboard home)
│   │   ├── biblioteca/
│   │   │   ├── page.tsx (lista todos os artefatos)
│   │   │   └── [type]/
│   │   │       ├── page.tsx (lista por tipo)
│   │   │       └── [id]/
│   │   │           └── page.tsx (visualização individual)
│   │   ├── studio/
│   │   │   ├── page.tsx (seleção de tipo)
│   │   │   └── new/
│   │   │       └── page.tsx (form dinâmico)
│   │   └── projetos/
│   │       └── ...
│   ├── api/
│   │   ├── artifacts/
│   │   │   ├── generate/
│   │   │   │   └── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   └── ai/
│   │       └── ...
│   └── layout.tsx
├── components/
│   ├── artifacts/
│   │   ├── ArtifactRenderer.tsx
│   │   ├── ArtifactCard.tsx
│   │   ├── types/
│   │   │   ├── ResearchViewer.tsx
│   │   │   ├── FlashcardDeck.tsx
│   │   │   ├── ReportViewer.tsx
│   │   │   ├── SummaryViewer.tsx
│   │   │   ├── MindMapViewer.tsx
│   │   │   └── QuizViewer.tsx
│   │   └── forms/
│   │       ├── CreateResearchForm.tsx
│   │       ├── CreateFlashcardForm.tsx
│   │       └── ...
│   ├── ui/ (shadcn components)
│   └── shared/
│       ├── LoadingState.tsx
│       ├── ErrorBoundary.tsx
│       └── ...
├── lib/
│   ├── ai/
│   │   ├── providers/
│   │   │   ├── openai.ts
│   │   │   ├── anthropic.ts
│   │   │   ├── perplexity.ts
│   │   │   └── google.ts
│   │   ├── prompts/
│   │   │   └── templates.ts
│   │   └── generators/
│   │       ├── research.ts
│   │       ├── flashcard.ts
│   │       └── ...
│   ├── db/
│   │   └── prisma.ts
│   ├── validations/
│   │   └── artifact-schemas.ts
│   └── utils/
│       ├── cn.ts
│       └── format.ts
└── types/
    ├── artifacts.ts
    └── api.ts
```

---

## Implementação: Geração de Flashcards (Exemplo Completo)

### 1. Definição de Tipos

**types/artifacts.ts**:
```typescript
export type ArtifactType = 
  | 'research'
  | 'flashcard'
  | 'report'
  | 'summary'
  | 'mindmap'
  | 'quiz';

export interface BaseArtifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: unknown;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  projectId?: string;
}

export interface FlashCard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  nextReview?: Date;
  interval?: number;
  easeFactor?: number;
  reviews?: number;
}

export interface FlashcardArtifactContent {
  deck: {
    name: string;
    description: string;
    cards: FlashCard[];
  };
}

export interface FlashcardArtifact extends BaseArtifact {
  type: 'flashcard';
  content: FlashcardArtifactContent;
  metadata: {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    topic: string;
    sourceType?: 'pdf' | 'text' | 'topic';
    totalCards: number;
  };
}
```

### 2. Schema de Validação

**lib/validations/artifact-schemas.ts**:
```typescript
import { z } from 'zod';

export const createFlashcardSchema = z.object({
  topic: z.string().min(3, "Tópico muito curto").max(200, "Tópico muito longo"),
  numberOfCards: z.number().min(5, "Mínimo de 5 cards").max(100, "Máximo de 100 cards"),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  sourceType: z.enum(['topic', 'text', 'pdf']).default('topic'),
  sourceContent: z.string().optional(),
  projectId: z.string().optional(),
});

export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
```

### 3. AI Generator

**lib/ai/generators/flashcard.ts**:
```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { FlashCard } from '@/types/artifacts';

interface GenerateFlashcardsParams {
  topic: string;
  numberOfCards: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sourceContent?: string;
}

const FLASHCARD_PROMPT = `
Você é um professor de odontologia especializado em didática e criação de materiais de estudo.

TAREFA: Criar {numberOfCards} flashcards sobre o tópico: "{topic}"

NÍVEL DE DIFICULDADE: {difficulty}
{sourceContent ? `CONTEÚDO BASE:\n${sourceContent}\n` : ''}

PRINCÍPIOS PARA CRIAR FLASHCARDS EFETIVOS:
1. **Frente (Pergunta)**: Clara, direta, sem ambiguidades. Uma questão ou conceito por vez.
2. **Verso (Resposta)**: Concisa (50-150 palavras), focada na informação essencial.
3. **Evitar** cartões muito fáceis ou excessivamente complexos.
4. **Incluir mnemônicos** quando apropriado para facilitar memorização.
5. **Distribuir dificuldade**: 40% easy, 40% medium, 20% hard

FORMATO DE SAÍDA: JSON array puro, SEM texto adicional antes ou depois
[
  {
    "front": "Pergunta clara e direta",
    "back": "Resposta concisa com a informação essencial. Pode usar **negrito** e *itálico* em Markdown.",
    "hint": "Uma dica opcional para ajudar a lembrar",
    "tags": ["categoria1", "categoria2"],
    "difficulty": "medium"
  }
]
`;

export async function generateFlashcards(
  params: GenerateFlashcardsParams
): Promise<FlashCard[]> {
  const prompt = FLASHCARD_PROMPT
    .replace('{numberOfCards}', params.numberOfCards.toString())
    .replace('{topic}', params.topic)
    .replace('{difficulty}', params.difficulty)
    .replace(
      '{sourceContent ? `CONTEÚDO BASE:\\n${sourceContent}\\n` : \'\'}',
      params.sourceContent ? `CONTEÚDO BASE:\n${params.sourceContent}\n` : ''
    );

  try {
    const { text } = await generateText({
      model: openai('gpt-4o'),
      prompt,
      temperature: 0.7,
    });

    // Parse JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const cards = JSON.parse(jsonMatch[0]) as Array<{
      front: string;
      back: string;
      hint?: string;
      tags: string[];
      difficulty: 'easy' | 'medium' | 'hard';
    }>;

    // Add IDs and initialize spaced repetition data
    return cards.map((card, index) => ({
      id: `card-${index + 1}`,
      ...card,
      nextReview: undefined,
      interval: undefined,
      easeFactor: 2.5, // Default Anki ease factor
      reviews: 0,
    }));
  } catch (error) {
    console.error('Error generating flashcards:', error);
    throw new Error('Failed to generate flashcards');
  }
}
```

### 4. Server Action

**app/api/artifacts/generate/route.ts**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth'; // Sua implementação de auth
import { prisma } from '@/lib/db/prisma';
import { createFlashcardSchema } from '@/lib/validations/artifact-schemas';
import { generateFlashcards } from '@/lib/ai/generators/flashcard';
import type { FlashcardArtifactContent } from '@/types/artifacts';

export async function POST(req: NextRequest) {
  try {
    // 1. Autenticação
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse e validação do body
    const body = await req.json();
    const validatedData = createFlashcardSchema.parse(body);

    // 3. Geração dos flashcards
    const cards = await generateFlashcards({
      topic: validatedData.topic,
      numberOfCards: validatedData.numberOfCards,
      difficulty: validatedData.difficulty,
      sourceContent: validatedData.sourceContent,
    });

    // 4. Preparar conteúdo do artefato
    const content: FlashcardArtifactContent = {
      deck: {
        name: validatedData.topic,
        description: `Deck de ${cards.length} flashcards sobre ${validatedData.topic}`,
        cards,
      },
    };

    // 5. Salvar no banco de dados
    const artifact = await prisma.artifact.create({
      data: {
        type: 'flashcard',
        title: validatedData.topic,
        content,
        metadata: {
          difficulty: validatedData.difficulty,
          topic: validatedData.topic,
          sourceType: validatedData.sourceType,
          totalCards: cards.length,
        },
        userId: session.user.id,
        projectId: validatedData.projectId,
      },
    });

    return NextResponse.json({ artifact }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating flashcard artifact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 5. Formulário de Criação

**components/artifacts/forms/CreateFlashcardForm.tsx**:
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { createFlashcardSchema, type CreateFlashcardInput } from '@/lib/validations/artifact-schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

export function CreateFlashcardForm() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<'topic' | 'text' | 'pdf'>('topic');

  const form = useForm<CreateFlashcardInput>({
    resolver: zodResolver(createFlashcardSchema),
    defaultValues: {
      topic: '',
      numberOfCards: 20,
      difficulty: 'intermediate',
      sourceType: 'topic',
    },
  });

  const createFlashcardMutation = useMutation({
    mutationFn: async (data: CreateFlashcardInput) => {
      const response = await fetch('/api/artifacts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, type: 'flashcard' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao gerar flashcards');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Flashcards criados!',
        description: `${data.artifact.metadata.totalCards} cards foram gerados.`,
      });
      router.push(`/dashboard/biblioteca/flashcard/${data.artifact.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateFlashcardInput) => {
    createFlashcardMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Topic */}
      <div className="space-y-2">
        <Label htmlFor="topic">Tópico *</Label>
        <Input
          id="topic"
          placeholder="Ex: Anatomia do Nervo Trigêmeo"
          {...form.register('topic')}
        />
        {form.formState.errors.topic && (
          <p className="text-sm text-red-500">{form.formState.errors.topic.message}</p>
        )}
      </div>

      {/* Number of Cards */}
      <div className="space-y-2">
        <Label htmlFor="numberOfCards">Número de Cards *</Label>
        <Input
          id="numberOfCards"
          type="number"
          min={5}
          max={100}
          {...form.register('numberOfCards', { valueAsNumber: true })}
        />
        {form.formState.errors.numberOfCards && (
          <p className="text-sm text-red-500">{form.formState.errors.numberOfCards.message}</p>
        )}
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <Label htmlFor="difficulty">Nível de Dificuldade *</Label>
        <Select
          id="difficulty"
          {...form.register('difficulty')}
        >
          <option value="beginner">Iniciante</option>
          <option value="intermediate">Intermediário</option>
          <option value="advanced">Avançado</option>
        </Select>
      </div>

      {/* Source Type */}
      <div className="space-y-2">
        <Label>Fonte do Conteúdo</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="topic"
              checked={sourceType === 'topic'}
              onChange={() => {
                setSourceType('topic');
                form.setValue('sourceType', 'topic');
              }}
            />
            Gerar do Tópico
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="text"
              checked={sourceType === 'text'}
              onChange={() => {
                setSourceType('text');
                form.setValue('sourceType', 'text');
              }}
            />
            Texto Personalizado
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="pdf"
              checked={sourceType === 'pdf'}
              onChange={() => {
                setSourceType('pdf');
                form.setValue('sourceType', 'pdf');
              }}
            />
            Upload PDF
          </label>
        </div>
      </div>

      {/* Conditional Content Input */}
      {sourceType === 'text' && (
        <div className="space-y-2">
          <Label htmlFor="sourceContent">Conteúdo Base</Label>
          <Textarea
            id="sourceContent"
            rows={6}
            placeholder="Cole aqui o texto que será usado como base..."
            {...form.register('sourceContent')}
          />
        </div>
      )}

      {sourceType === 'pdf' && (
        <div className="space-y-2">
          <Label htmlFor="pdfUpload">Upload PDF</Label>
          <Input
            id="pdfUpload"
            type="file"
            accept=".pdf"
            // TODO: Implementar upload e extração de texto
          />
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        disabled={createFlashcardMutation.isPending}
      >
        {createFlashcardMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Gerando Flashcards...
          </>
        ) : (
          'Criar Flashcards'
        )}
      </Button>
    </form>
  );
}
```

### 6. Visualizador de Flashcards

**components/artifacts/types/FlashcardDeck.tsx**:
```typescript
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Shuffle, Check } from 'lucide-react';
import Markdown from 'react-markdown';

import type { FlashcardArtifact } from '@/types/artifacts';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils/cn';

interface FlashcardDeckProps {
  artifact: FlashcardArtifact;
}

export function FlashcardDeck({ artifact }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completedCards, setCompletedCards] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);

  const cards = artifact.content.deck.cards;
  const currentCard = cards[currentIndex];
  const progress = (completedCards.size / cards.length) * 100;

  const handleNext = () => {
    setFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrevious = () => {
    setFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleShuffle = () => {
    // TODO: Implementar embaralhamento
  };

  const markAsCompleted = () => {
    setCompletedCards((prev) => new Set(prev).add(currentCard.id));
    handleNext();
  };

  return (
    <div className="flashcard-deck max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{artifact.content.deck.name}</h2>
        <p className="text-gray-600 mb-4">{artifact.content.deck.description}</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span>{completedCards.size} / {cards.length}</span>
          </div>
          <Progress value={progress} />
        </div>
      </div>

      {/* Card Container */}
      <div className="relative h-96 mb-6">
        <motion.div
          className={cn(
            "absolute inset-0 bg-white rounded-xl shadow-lg border-2 cursor-pointer",
            "flex items-center justify-center p-8",
            flipped ? "border-blue-500" : "border-gray-200"
          )}
          onClick={() => setFlipped(!flipped)}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div
            className={cn(
              "absolute inset-0 p-8 flex flex-col justify-center",
              flipped && "invisible"
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-center">
              <div className="text-lg font-medium mb-4">{currentCard.front}</div>
              {currentCard.hint && !showHint && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHint(true);
                  }}
                >
                  💡 Mostrar Dica
                </Button>
              )}
              {showHint && currentCard.hint && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm">
                  {currentCard.hint}
                </div>
              )}
            </div>
            <div className="absolute bottom-4 right-4 text-xs text-gray-400">
              Clique para ver a resposta
            </div>
          </div>

          {/* Back */}
          <div
            className={cn(
              "absolute inset-0 p-8 flex flex-col justify-center",
              !flipped && "invisible"
            )}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="prose prose-sm max-w-none">
              <Markdown>{currentCard.back}</Markdown>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {currentCard.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="absolute bottom-4 right-4">
              <span
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  currentCard.difficulty === 'easy' && "bg-green-100 text-green-700",
                  currentCard.difficulty === 'medium' && "bg-yellow-100 text-yellow-700",
                  currentCard.difficulty === 'hard' && "bg-red-100 text-red-700"
                )}
              >
                {currentCard.difficulty}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handlePrevious}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {currentIndex + 1} / {cards.length}
          </span>
          <Button variant="ghost" size="icon" onClick={handleShuffle}>
            <Shuffle className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" onClick={handleNext}>
          Próximo
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Mark as Completed */}
      {flipped && !completedCards.has(currentCard.id) && (
        <div className="mt-4 text-center">
          <Button onClick={markAsCompleted}>
            <Check className="mr-2 h-4 w-4" />
            Marcar como Concluído
          </Button>
        </div>
      )}
    </div>
  );
}
```

### 7. Página de Visualização

**app/dashboard/biblioteca/flashcard/[id]/page.tsx**:
```typescript
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { FlashcardDeck } from '@/components/artifacts/types/FlashcardDeck';
import type { FlashcardArtifact } from '@/types/artifacts';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function FlashcardPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const artifact = await prisma.artifact.findUnique({
    where: {
      id: params.id,
      userId: session.user.id,
      type: 'flashcard',
    },
  });

  if (!artifact) {
    notFound();
  }

  return (
    <div className="container py-8">
      <FlashcardDeck artifact={artifact as FlashcardArtifact} />
    </div>
  );
}
```

---

## Performance & Otimizações

### 1. Streaming de Respostas (Para gerações longas)

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = await streamText({
    model: openai('gpt-4o'),
    prompt,
  });

  return result.toAIStreamResponse();
}
```

### 2. Background Jobs (Para pesquisas longas)

Usar Vercel Queue ou Upstash Queue:

```typescript
import { Queue } from '@upstash/qstash';

const queue = new Queue({
  token: process.env.QSTASH_TOKEN!,
});

// Enqueue
await queue.publishJSON({
  url: `${process.env.APP_URL}/api/jobs/research`,
  body: { userId, query, artifactId },
});
```

### 3. Caching

```typescript
import { unstable_cache } from 'next/cache';

export const getCachedArtifacts = unstable_cache(
  async (userId: string) => {
    return prisma.artifact.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  },
  ['user-artifacts'],
  { revalidate: 60, tags: ['artifacts'] }
);
```

---

**Próximas Etapas**:
1. Implementar os outros 5 tipos de artefatos
2. Adicionar sistema de tags e busca
3. Implementar colaboração (compartilhamento)
4. Adicionar analytics e métricas

---

**Versão**: 1.0  
**Última atualização**: Janeiro 2026
