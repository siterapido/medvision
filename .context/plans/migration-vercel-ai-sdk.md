# Plano de Migracacao: Agno (Python) -> Vercel AI SDK + Chat SDK

## Resumo Executivo

Este documento detalha a migracao completa do backend de IA do OdontoGPT, atualmente implementado em Python com o framework Agno e hospedado no Railway, para uma arquitetura 100% TypeScript utilizando o **Vercel AI SDK** e o **Chat SDK**, rodando nativamente na Vercel como Edge Functions.

### Objetivos

1. **Eliminar o servico Python externo** (`odonto-gpt-agno-service/`)
2. **Unificar a stack em TypeScript/Next.js**
3. **Maximizar compatibilidade** com Chat SDK e Vercel AI SDK
4. **Suporte completo a Artefatos** (resumos, flashcards, mapas mentais)
5. **Utilizar OpenRouter** como provider de modelos

---

## Arquitetura Proposta

```
+------------------+     +-------------------+     +------------------+
|                  |     |                   |     |                  |
|  Frontend        |<--->|  Next.js API      |<--->|  OpenRouter      |
|  (React + Chat)  |     |  Route Handlers   |     |  (LLM Provider)  |
|                  |     |  (Edge Runtime)   |     |                  |
+------------------+     +-------------------+     +------------------+
        |                         |
        v                         v
+------------------+     +-------------------+
|                  |     |                   |
|  Supabase        |     |  Tools (TS)       |
|  (Persistencia)  |     |  - Perplexity     |
|                  |     |  - PubMed         |
+------------------+     |  - Memory         |
                         +-------------------+
```

---

## Fase 1: Configuracao Base

### 1.1 Dependencias

```bash
# Core AI SDK (ja instalado: ai@^5.0.89, @ai-sdk/react@^2.0.89)
# Adicionar apenas se necessario:
npm install @ai-sdk/openai  # Para compatibilidade OpenRouter via createOpenAI
```

### 1.2 Provider OpenRouter

O OpenRouter e compativel com a API OpenAI, entao usamos `@ai-sdk/openai` com `baseURL` customizado:

```typescript
// lib/ai/openrouter.ts
import { createOpenAI } from '@ai-sdk/openai';

export const openrouter = createOpenAI({
  name: 'openrouter',
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'OdontoGPT',
  },
});

// Modelos disponiveis
export const MODELS = {
  chat: 'google/gemma-2-27b-it:free',
  research: 'perplexity/sonar-reasoning',
  vision: 'openai/gpt-4o',
} as const;
```

### 1.3 Variaveis de Ambiente

```env
# .env.local
OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_APP_URL=https://www.odontogpt.com
```

---

## Fase 2: Rota de Chat Principal

### 2.1 API Route Handler

```typescript
// app/api/chat/route.ts
import { streamText, convertToModelMessages, UIMessage, tool, stepCountIs } from 'ai';
import { openrouter, MODELS } from '@/lib/ai/openrouter';
import { z } from 'zod';
import { tools } from '@/lib/ai/tools';

export const maxDuration = 60; // Timeout para Edge Functions

export async function POST(req: Request) {
  const { messages, chatId }: { messages: UIMessage[]; chatId?: string } = await req.json();

  const result = streamText({
    model: openrouter(MODELS.chat),
    system: SYSTEM_PROMPT, // Prompt do Tutor Inteligente (migrado do Python)
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5), // Permite multi-step para uso de ferramentas
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: finalMessages }) => {
      // Persistir no Supabase
      if (chatId) {
        await saveChat({ chatId, messages: finalMessages });
      }
    },
  });
}
```

### 2.2 System Prompt (Migrado do Python)

```typescript
// lib/ai/prompts/tutor.ts
export const TUTOR_SYSTEM_PROMPT = `Voce e o Odonto GPT, um Tutor Inteligente e Mentor Senior de Odontologia.
Seu objetivo e guiar o aprendizado do aluno usando a Zona de Desenvolvimento Proximal (ZPD).

## Identidade e Papel
- Nao aja como um robo que apenas cospe respostas. Aja como um professor experiente e empatico.
- Sua missao e identificar o que o aluno ja sabe e ajuda-lo a chegar ao proximo nivel.

## Pedagogia: Scaffolding & Metodo Socratico
1. Nao de a resposta pronta imediatamente (exceto para fatos simples).
2. Faca perguntas guiadas: Leve o aluno a deduzir a resposta.
3. Feedback Imediato: Se ele errar, corrija com gentileza e explique o porque.
4. Conexoes: Relacione o tema atual com outras areas da Odonto.

## Ferramentas Disponiveis
Voce tem acesso a ferramentas de pesquisa cientifica (PubMed, Perplexity).
Use-as para garantir que suas explicacoes estejam cientificamente corretas.

## Tom e Estilo
- Seja encorajador, paciente e bem-humorado.
- Fale sempre em Portugues do Brasil (pt-BR).
`;
```

---

## Fase 3: Ferramentas (Tools) em TypeScript

### 3.1 Estrutura de Ferramentas

```typescript
// lib/ai/tools/index.ts
import { askPerplexity } from './research/perplexity';
import { searchPubMed } from './research/pubmed';
import { searchArXiv } from './research/arxiv';
import { createSummary, createFlashcards, createMindMap } from './artifacts';
import { getStudentProfile, getRecentStudies } from './memory';

export const tools = {
  // Pesquisa
  askPerplexity,
  searchPubMed,
  searchArXiv,
  
  // Artefatos
  createSummary,
  createFlashcards,
  createMindMap,
  
  // Memoria
  getStudentProfile,
  getRecentStudies,
};
```

### 3.2 Ferramenta Perplexity

```typescript
// lib/ai/tools/research/perplexity.ts
import { tool } from 'ai';
import { z } from 'zod';
import { openrouter } from '@/lib/ai/openrouter';
import { generateText } from 'ai';

export const askPerplexity = tool({
  description: 'Realiza uma pesquisa profunda online usando Perplexity AI para responder questoes complexas com citacoes.',
  inputSchema: z.object({
    query: z.string().describe('A pergunta ou topico de pesquisa'),
  }),
  execute: async ({ query }) => {
    const result = await generateText({
      model: openrouter('perplexity/sonar-reasoning'),
      system: `Voce e um assistente de pesquisa academica para Odonto GPT.
        Sua tarefa e encontrar artigos cientificos e evidencias clinicas atualizadas.
        Responda sempre em Portugues (Brasil).
        Inclua citacoes no corpo do texto.
        No final da resposta, crie uma secao '### Fontes' com a lista numerada de URLs usadas.`,
      prompt: query,
    });

    return {
      content: result.text,
      sources: result.sources || [],
    };
  },
});
```

### 3.3 Ferramenta PubMed

```typescript
// lib/ai/tools/research/pubmed.ts
import { tool } from 'ai';
import { z } from 'zod';

const PUBMED_API = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export const searchPubMed = tool({
  description: 'Busca artigos cientificos no PubMed sobre temas de odontologia e medicina.',
  inputSchema: z.object({
    query: z.string().describe('Termo de busca (ex: "dental implant failure")'),
    maxResults: z.number().optional().default(5).describe('Numero maximo de resultados'),
  }),
  execute: async ({ query, maxResults = 5 }) => {
    try {
      // Buscar IDs
      const searchUrl = `${PUBMED_API}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      const ids = searchData.esearchresult?.idlist || [];

      if (ids.length === 0) {
        return { articles: [], message: 'Nenhum artigo encontrado.' };
      }

      // Buscar detalhes
      const summaryUrl = `${PUBMED_API}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
      const summaryRes = await fetch(summaryUrl);
      const summaryData = await summaryRes.json();

      const articles = ids.map((id: string) => {
        const article = summaryData.result?.[id];
        return {
          pmid: id,
          title: article?.title || 'Sem titulo',
          authors: article?.authors?.slice(0, 3).map((a: any) => a.name).join(', ') || 'Desconhecido',
          source: article?.source || '',
          pubdate: article?.pubdate || '',
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        };
      });

      return { articles };
    } catch (error) {
      return { articles: [], error: 'Erro ao buscar no PubMed.' };
    }
  },
});
```

### 3.4 Ferramentas de Artefatos

```typescript
// lib/ai/tools/artifacts/index.ts
import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

export const createSummary = tool({
  description: 'Cria um resumo estruturado e salva no banco de dados do usuario.',
  inputSchema: z.object({
    title: z.string().describe('Titulo do resumo'),
    content: z.string().describe('Conteudo do resumo em Markdown'),
    topics: z.array(z.string()).describe('Topicos principais abordados'),
  }),
  execute: async ({ title, content, topics }) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Usuario nao autenticado' };
    }

    const id = nanoid();
    const { error } = await supabase.from('summaries').insert({
      id,
      user_id: user.id,
      title,
      content,
      topics,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      artifactId: id,
      artifactType: 'summary',
      message: `Resumo "${title}" criado com sucesso!`,
    };
  },
});

export const createFlashcards = tool({
  description: 'Cria um conjunto de flashcards para estudo.',
  inputSchema: z.object({
    title: z.string().describe('Titulo do deck de flashcards'),
    cards: z.array(z.object({
      front: z.string().describe('Frente do cartao (pergunta)'),
      back: z.string().describe('Verso do cartao (resposta)'),
    })).describe('Lista de flashcards'),
  }),
  execute: async ({ title, cards }) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Usuario nao autenticado' };
    }

    const id = nanoid();
    const { error } = await supabase.from('flashcards').insert({
      id,
      user_id: user.id,
      title,
      cards,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      artifactId: id,
      artifactType: 'flashcards',
      cardCount: cards.length,
      message: `Deck "${title}" com ${cards.length} flashcards criado!`,
    };
  },
});

export const createMindMap = tool({
  description: 'Cria um mapa mental visual sobre um topico.',
  inputSchema: z.object({
    title: z.string().describe('Titulo do mapa mental'),
    nodes: z.array(z.object({
      id: z.string(),
      label: z.string(),
      parentId: z.string().nullable(),
    })).describe('Nos do mapa mental'),
  }),
  execute: async ({ title, nodes }) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Usuario nao autenticado' };
    }

    const id = nanoid();
    const { error } = await supabase.from('mind_maps').insert({
      id,
      user_id: user.id,
      title,
      nodes,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      artifactId: id,
      artifactType: 'mindmap',
      nodeCount: nodes.length,
      message: `Mapa mental "${title}" criado com ${nodes.length} nos!`,
    };
  },
});
```

---

## Fase 4: Frontend - Componentes de Chat

### 4.1 Hook useChat Configurado

```typescript
// lib/hooks/useOdontoChat.ts
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { useState, useCallback } from 'react';

interface UseOdontoChatOptions {
  chatId?: string;
  initialMessages?: UIMessage[];
}

export function useOdontoChat({ chatId, initialMessages }: UseOdontoChatOptions = {}) {
  const [artifacts, setArtifacts] = useState<any[]>([]);

  const chat = useChat({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { chatId },
    }),
    onFinish: ({ message }) => {
      // Extrair artefatos criados pelas ferramentas
      for (const part of message.parts) {
        if (part.type.startsWith('tool-create') && part.state === 'output-available') {
          setArtifacts(prev => [...prev, part.output]);
        }
      }
    },
  });

  return {
    ...chat,
    artifacts,
    clearArtifacts: useCallback(() => setArtifacts([]), []),
  };
}
```

### 4.2 Componente de Chat Principal

```typescript
// components/chat/odonto-chat.tsx
'use client';

import { useOdontoChat } from '@/lib/hooks/useOdontoChat';
import { useState } from 'react';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { ArtifactPanel } from './artifact-panel';

interface OdontoChatProps {
  chatId?: string;
  initialMessages?: any[];
}

export function OdontoChat({ chatId, initialMessages }: OdontoChatProps) {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, artifacts } = useOdontoChat({
    chatId,
    initialMessages,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status === 'ready') {
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div className="flex h-full">
      {/* Area do Chat */}
      <div className="flex-1 flex flex-col">
        <ChatMessages messages={messages} status={status} />
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          disabled={status !== 'ready'}
        />
      </div>

      {/* Painel de Artefatos */}
      {artifacts.length > 0 && (
        <ArtifactPanel artifacts={artifacts} />
      )}
    </div>
  );
}
```

### 4.3 Renderizacao de Mensagens com Tool Parts

```typescript
// components/chat/chat-messages.tsx
'use client';

import { UIMessage } from 'ai';
import { Loader2 } from 'lucide-react';

interface ChatMessagesProps {
  messages: UIMessage[];
  status: string;
}

export function ChatMessages({ messages, status }: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-4 ${
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            {message.parts.map((part, index) => {
              // Texto normal
              if (part.type === 'text') {
                return <div key={index} className="prose dark:prose-invert">{part.text}</div>;
              }

              // Ferramentas de pesquisa
              if (part.type === 'tool-askPerplexity' || part.type === 'tool-searchPubMed') {
                if (part.state === 'input-available') {
                  return (
                    <div key={index} className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Pesquisando...
                    </div>
                  );
                }
                if (part.state === 'output-available') {
                  return (
                    <div key={index} className="mt-2 p-2 bg-background rounded border">
                      <span className="text-xs text-muted-foreground">Pesquisa concluida</span>
                    </div>
                  );
                }
              }

              // Artefatos criados
              if (part.type.startsWith('tool-create')) {
                if (part.state === 'output-available' && part.output?.success) {
                  return (
                    <div key={index} className="mt-2 p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200">
                      <span className="text-sm text-green-700 dark:text-green-300">
                        {part.output.message}
                      </span>
                    </div>
                  );
                }
              }

              return null;
            })}
          </div>
        </div>
      ))}

      {(status === 'submitted' || status === 'streaming') && (
        <div className="flex justify-start">
          <div className="bg-muted rounded-lg p-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Fase 5: Persistencia de Mensagens

### 5.1 Funcoes de Persistencia

```typescript
// lib/ai/chat-store.ts
import { createClient } from '@/lib/supabase/server';
import { UIMessage } from 'ai';
import { nanoid } from 'nanoid';

export async function createChat(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Usuario nao autenticado');

  const id = nanoid();
  await supabase.from('chats').insert({
    id,
    user_id: user.id,
    messages: [],
    created_at: new Date().toISOString(),
  });

  return id;
}

export async function loadChat(id: string): Promise<UIMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('chats')
    .select('messages')
    .eq('id', id)
    .single();

  return data?.messages || [];
}

export async function saveChat({ chatId, messages }: { chatId: string; messages: UIMessage[] }): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from('chats')
    .update({
      messages,
      updated_at: new Date().toISOString(),
    })
    .eq('id', chatId);
}
```

---

## Fase 6: Migracao de Dados

### 6.1 Tabelas Supabase Necessarias

```sql
-- Chats
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Summaries (Artefatos)
CREATE TABLE IF NOT EXISTS summaries (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  topics TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flashcards (Artefatos)
CREATE TABLE IF NOT EXISTS flashcard_decks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cards JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mind Maps (Artefatos)
CREATE TABLE IF NOT EXISTS mind_maps (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  nodes JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own chats"
  ON chats FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own summaries"
  ON summaries FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own flashcards"
  ON flashcard_decks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own mind maps"
  ON mind_maps FOR ALL USING (auth.uid() = user_id);
```

---

## Fase 7: Limpeza e Desativacao

### 7.1 Arquivos a Remover (Apos Validacao)

```
odonto-gpt-agno-service/          # Servico Python completo
lib/agno.ts                       # Tipos e helpers do Agno
lib/hooks/useAgnoChat.ts          # Hook antigo
lib/hooks/useAgnoAgents.ts        # Hook antigo
components/agno-chat/             # Componentes antigos
app/api/copilotkit/               # API CopilotKit (se nao mais necessario)
```

### 7.2 Variaveis de Ambiente a Remover

```
NEXT_PUBLIC_AGNO_SERVICE_URL      # URL do servico Railway
```

---

## Cronograma de Implementacao

| Fase | Descricao | Duracao Estimada |
|------|-----------|------------------|
| 1 | Configuracao Base (Provider, Env) | 1 hora |
| 2 | Rota de Chat Principal | 2 horas |
| 3 | Ferramentas de Pesquisa (TS) | 3 horas |
| 4 | Ferramentas de Artefatos | 2 horas |
| 5 | Componentes de Chat Frontend | 3 horas |
| 6 | Persistencia de Mensagens | 2 horas |
| 7 | Testes e Validacao | 2 horas |
| 8 | Limpeza e Deploy | 1 hora |

**Total Estimado: ~16 horas**

---

## Beneficios da Migracao

1. **Reducao de Complexidade**: Stack unica (TypeScript/Next.js)
2. **Melhor Performance**: Edge Functions vs. Railway container
3. **Menor Latencia**: Sem chamadas cross-cloud
4. **Custo Reduzido**: Elimina Railway
5. **Type Safety**: Tipos end-to-end com AI SDK
6. **Artefatos Nativos**: Suporte first-class do Chat SDK
7. **Manutencao Simplificada**: Um repositorio, uma linguagem

---

## Referencias

- [AI SDK Documentation](https://ai-sdk.dev/docs)
- [Chat SDK Documentation](https://chat-sdk.dev/docs)
- [OpenRouter API](https://openrouter.ai/docs)
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
