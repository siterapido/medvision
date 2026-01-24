---
status: completed
generated: 2026-01-24
updated: 2026-01-24
agents:
  - type: "frontend-specialist"
    role: "Implementar o novo design do MultimodalInput"
phases:
  - id: "phase-1"
    name: "Design Exploration"
    prevc: "P"
  - id: "phase-2"
    name: "Implementation"
    prevc: "E"
  - id: "phase-3"
    name: "Polish & Validation"
    prevc: "V"
ai-sdk-version: "^4.3.x / 5.x / 6.x"
---

# Redesign Multimodal Input — Estilo Perplexity com Agent Switcher

> Redesenhar o componente `multimodal-input.tsx` inspirado na UI da Perplexity, com seletor de agentes integrado, garantindo texto escuro no tema claro seguindo a paleta do projeto.

## ⚠️ AI SDK Compatibility Notes

Este plano foi atualizado para garantir **total compatibilidade com o Vercel AI SDK** (v4.3+, v5, v6).

### API Críticas do AI SDK

| API | Uso | Documentação |
|-----|-----|--------------|
| `useChat()` | Hook principal para chat | `@ai-sdk/react` |
| `sendMessage({ text, files })` | Enviar mensagem com arquivos | Substitui `handleSubmit` |
| `message.parts[]` | Array de partes da mensagem | `TextUIPart`, `FileUIPart` |
| `status` | Estado: `ready`, `submitted`, `streaming`, `error` | Controle de UI |
| `convertToModelMessages()` | Converter UI → Model messages | Server-side |
| `streamText()` | Streaming de resposta | API route |
| `toUIMessageStreamResponse()` | Response para cliente | API route |

### Tipos do AI SDK

```typescript
// @ai-sdk/react types
interface TextUIPart {
  type: 'text'
  text: string
}

interface FileUIPart {
  type: 'file'
  filename?: string
  mediaType: string
  url: string // data URL ou URL remota
}

type UIMessagePart = TextUIPart | FileUIPart | ...
```

## Referencia Visual (Perplexity)

**Caracteristicas da UI Perplexity:**
- Input centralizado e expansivo
- Borda arredondada suave (radius ~16px)
- Background branco/claro com borda sutil
- Botoes de acao em grupos organizados (esquerda: modos, direita: acoes)
- Placeholder descritivo e convidativo
- Botao de submit com destaque circular

---

## Task Snapshot

- **Primary goal:** Criar um MultimodalInput estilo Perplexity com Agent Switcher integrado
- **Success signal:** Input visualmente alinhado a referencia, com troca de agentes funcional e texto legivel em ambos os temas
- **Key files:**
  - `components/chat/multimodal-input.tsx` — Componente principal
  - `lib/ai/agents/config.ts` — Configuracao dos agentes
  - `styles/globals.css` — Tokens de design

---

## Design Exploration

### Domain Concepts
1. **Agentes especializados** — Odonto GPT, Research, Practice, Summary, Vision
2. **Modos de interacao** — Chat, Pesquisa, Estudo
3. **Consultorio dental** — Ambiente profissional, precisao clinica
4. **Aprendizado ativo** — Estudante em busca de conhecimento
5. **Evidencia cientifica** — Pesquisa baseada em literatura

### Color World (Tema Claro — FOCO)
| Token | Valor | Uso |
|-------|-------|-----|
| `--background` | `#f5f7fb` | Canvas de fundo |
| `--card` | `#ffffff` | Background do input |
| `--foreground` | `#0f172a` | **Texto escuro principal** |
| `--muted-foreground` | `#475569` | Placeholder, texto secundario |
| `--primary` | `#0891b2` | Ciano — accent, submit button |
| `--border` | `#e2e8f0` | Bordas sutis |
| `--muted` | `#f1f5f9` | Background dos pills inativos |

### Signature Element: Agent Pill Switcher

Grupo de pills/chips no footer esquerdo do input que permitem trocar entre agentes:
- Icone + nome abreviado do agente ativo
- Transicao suave com glow ciano ao selecionar
- Visual inspirado nos "modes" da Perplexity (Search, Pro, Focus)

### Defaults Rejeitados
| Default Generico | Nossa Alternativa |
|------------------|-------------------|
| Sidebar dropdown para agentes | Pills integrados no input |
| Input simples com botao | Input expansivo estilo hero |
| Icones sem contexto | Icones com labels visiveis |
| Texto claro em fundo claro | **Texto escuro (#0f172a) em tema claro** |

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  MultimodalInput Container                                       │
│  rounded-2xl, border-border, bg-card, shadow-sm                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Attachments Preview (condicional)                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Textarea                                                    │ │
│  │  placeholder="Pergunte ao {agentName}..."                   │ │
│  │  text-foreground (escuro no light mode)                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────┐        ┌────────────────────────┐ │
│  │ Agent Switcher           │        │ Actions                │ │
│  │ [🦷 GPT] [🔬] [📋] [📝] │        │ [📎] [🎤]    [➤]     │ │
│  │ pills com icones         │        │ attach, mic, submit    │ │
│  └──────────────────────────┘        └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Agent Configuration

```typescript
const AGENT_PILLS = [
  {
    id: 'odonto-gpt',
    icon: '🦷',
    shortName: 'GPT',
    fullName: 'Odonto GPT',
    placeholder: 'Pergunte sobre odontologia...'
  },
  {
    id: 'odonto-research',
    icon: '🔬',
    shortName: 'Research',
    fullName: 'Pesquisa Cientifica',
    placeholder: 'Busque evidencias cientificas...'
  },
  {
    id: 'odonto-practice',
    icon: '📋',
    shortName: 'Practice',
    fullName: 'Casos Clinicos',
    placeholder: 'Pratique com casos clinicos...'
  },
  {
    id: 'odonto-summary',
    icon: '📝',
    shortName: 'Summary',
    fullName: 'Resumos',
    placeholder: 'Crie resumos e flashcards...'
  },
  {
    id: 'odonto-vision',
    icon: '👁️',
    shortName: 'Vision',
    fullName: 'Analise de Imagens',
    placeholder: 'Envie radiografias para analise...'
  },
]
```

---

## Working Phases

### Phase 1 — Design & Planning (P)

**Steps:**
1. Definir estrutura do AgentSwitcher component
2. Mapear icones e labels para cada agente
3. Validar tokens de cor para tema claro (texto escuro)

**Deliverables:**
- [ ] Wireframe do novo layout aprovado
- [ ] Tokens de cor validados
- [ ] Interface TypeScript definida

---

### Phase 2 — Implementation (E)

**Steps:**

#### 2.1 Criar AgentSwitcher Component

```tsx
// components/chat/agent-switcher.tsx

interface AgentSwitcherProps {
  agents: typeof AGENT_PILLS
  selectedAgent: string
  onAgentChange: (agentId: string) => void
  disabled?: boolean
}

export function AgentSwitcher({
  agents,
  selectedAgent,
  onAgentChange,
  disabled
}: AgentSwitcherProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
      {agents.map((agent) => (
        <button
          key={agent.id}
          onClick={() => onAgentChange(agent.id)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all duration-150",
            selectedAgent === agent.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={agent.fullName}
        >
          <span>{agent.icon}</span>
          <span className="hidden sm:inline">{agent.shortName}</span>
        </button>
      ))}
    </div>
  )
}
```

#### 2.2 Refatorar MultimodalInput Layout (AI SDK Pattern)

```tsx
'use client'

import { useRef, useState } from 'react'
import { FileUIPart } from 'ai'

// Utility: converter arquivos para AI SDK format
async function convertFilesToDataURLs(files: FileList): Promise<FileUIPart[]> {
  return Promise.all(
    Array.from(files).map(
      file =>
        new Promise<FileUIPart>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            resolve({
              type: 'file',
              filename: file.name,
              mediaType: file.type,
              url: reader.result as string,
            })
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        }),
    ),
  )
}

export function MultimodalInput({
  input,
  setInput,
  status,
  stop,
  onSubmit,
  selectedAgent,
  onAgentChange,
  className,
}: MultimodalInputProps) {
  const [files, setFiles] = useState<FileList | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isLoading = status === 'submitted' || status === 'streaming'
  const selectedAgentConfig = AGENT_PILLS.find(a => a.id === selectedAgent)

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if ((!input.trim() && !files?.length) || status !== 'ready') return

    // Converter para AI SDK format
    const fileParts = files?.length
      ? await convertFilesToDataURLs(files)
      : undefined

    // Chamar sendMessage com formato AI SDK
    onSubmit({
      text: input,
      files: fileParts,
    })

    // Limpar estado
    setInput('')
    setFiles(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,application/pdf"
        multiple
        onChange={(e) => setFiles(e.target.files || undefined)}
      />

      {/* Attachments Preview */}
      {files && files.length > 0 && (
        <AttachmentsPreview
          files={files}
          onRemove={() => {
            setFiles(undefined)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
        />
      )}

      {/* Textarea */}
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="min-h-[60px] resize-none border-0 bg-transparent
                   text-foreground placeholder:text-muted-foreground
                   focus-visible:ring-0"
        placeholder={selectedAgentConfig?.placeholder}
        disabled={isLoading}
      />

      {/* Footer: Agent Switcher + Actions */}
      <div className="mt-3 flex items-center justify-between">
        {/* Left: Agent Switcher */}
        <AgentSwitcher
          agents={AGENT_PILLS}
          selectedAgent={selectedAgent}
          onAgentChange={onAgentChange}
          disabled={isLoading}
        />

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <PaperclipIcon />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={toggleVoice}>
            <MicIcon />
          </Button>
          {isLoading ? (
            <Button type="button" onClick={stop} size="icon" variant="outline">
              <StopIcon />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() && !files?.length}
              className="rounded-full bg-primary text-primary-foreground"
            >
              <ArrowUpIcon />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
```

#### 2.3 Garantir Texto Escuro no Tema Claro

Verificar em `globals.css`:
```css
:root {
  --foreground: #0f172a;        /* Slate-900 - ESCURO */
  --card-foreground: #0f172a;   /* Mesmo */
  --muted-foreground: #475569;  /* Slate-600 - placeholder */
}
```

**Deliverables:**
- [ ] `agent-switcher.tsx` criado
- [ ] `multimodal-input.tsx` refatorado
- [ ] Layout responsivo (mobile: pills compactos)

---

### Phase 3 — Polish & Validation (V)

**Validation Checklist:**
- [ ] Texto **escuro e legivel** no tema claro
- [ ] Texto claro no tema escuro
- [ ] Pills funcionam e trocam agente
- [ ] Placeholder muda conforme agente
- [ ] Enter envia, Shift+Enter quebra linha
- [ ] Drag-drop de arquivos funciona
- [ ] Microfone funciona
- [ ] Estados: hover, focus, disabled, loading

**AI SDK Compatibility Checklist:**
- [ ] `sendMessage({ text, files })` funciona corretamente
- [ ] Arquivos convertidos para DataURL (`FileUIPart[]`)
- [ ] `message.parts` renderiza texto e arquivos
- [ ] `status` reflete estados corretos (ready/submitted/streaming/error)
- [ ] `stop()` interrompe streaming
- [ ] Imagens aparecem inline nas mensagens
- [ ] PDFs renderizam em iframe
- [ ] API route usa `convertToModelMessages()`
- [ ] Response usa `toUIMessageStreamResponse()`

**Visual Comparison:**
| Aspecto | Perplexity | Nossa Implementacao |
|---------|------------|---------------------|
| Shape | rounded-xl | rounded-2xl |
| Background | branco | `bg-card` (#fff light) |
| Border | cinza sutil | `border-border` |
| Left Actions | Focus, Pro, Search | GPT, Research, Practice, Summary, Vision |
| Right Actions | Web, Image, Attach, Mic | Attach, Mic, Submit |
| Submit | circular teal | circular `bg-primary` |
| **Text (Light)** | escuro | `text-foreground` (#0f172a) |

---

## Component API Final (AI SDK Compatible)

```tsx
import { FileUIPart } from 'ai'

interface MultimodalInputProps {
  // AI SDK useChat integration
  input: string
  setInput: (value: string) => void
  status: 'ready' | 'submitted' | 'streaming' | 'error'
  stop: () => void

  /**
   * AI SDK sendMessage pattern
   * Envia texto + arquivos convertidos para DataURL
   */
  onSubmit: (options: {
    text: string
    files?: FileUIPart[]
  }) => void

  className?: string

  // Agent switching
  selectedAgent: string
  onAgentChange: (agentId: string) => void
}
```

### Conversão de Files para AI SDK Format

```typescript
/**
 * Converte FileList para FileUIPart[] (AI SDK format)
 * Usado antes de chamar sendMessage
 */
async function convertFilesToDataURLs(files: FileList): Promise<FileUIPart[]> {
  return Promise.all(
    Array.from(files).map(
      file =>
        new Promise<FileUIPart>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            resolve({
              type: 'file',
              filename: file.name,
              mediaType: file.type,
              url: reader.result as string, // data:image/png;base64,...
            })
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        }),
    ),
  )
}
```

---

## Integração com Chat.tsx (AI SDK useChat)

O componente pai `chat.tsx` deve usar o hook `useChat` do AI SDK e passar as props corretas:

```tsx
// components/chat/chat.tsx
'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState } from 'react'
import { MultimodalInput } from './multimodal-input'
import { Messages } from './messages'

export function Chat() {
  const [selectedAgent, setSelectedAgent] = useState('odonto-gpt')

  const { messages, sendMessage, status, stop, input, setInput } = useChat({
    // Opcional: configurar transport customizado
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    // Passar agente selecionado no body
    body: {
      agent: selectedAgent,
    },
  })

  return (
    <div className="flex flex-col h-full">
      {/* Renderizar mensagens com parts */}
      <Messages messages={messages} />

      {/* Input multimodal */}
      <MultimodalInput
        input={input}
        setInput={setInput}
        status={status}
        stop={stop}
        onSubmit={({ text, files }) => {
          // AI SDK sendMessage pattern
          sendMessage({
            text,
            files, // FileUIPart[] já convertidos
          })
        }}
        selectedAgent={selectedAgent}
        onAgentChange={setSelectedAgent}
      />
    </div>
  )
}
```

### Renderização de Mensagens (AI SDK Parts)

```tsx
// components/chat/messages.tsx
import { UIMessage } from 'ai'

function Message({ message }: { message: UIMessage }) {
  return (
    <div>
      {message.parts.map((part, index) => {
        // Texto
        if (part.type === 'text') {
          return <span key={index}>{part.text}</span>
        }

        // Imagem
        if (part.type === 'file' && part.mediaType?.startsWith('image/')) {
          return (
            <img
              key={index}
              src={part.url}
              alt={part.filename || 'attachment'}
              className="max-w-sm rounded-lg"
            />
          )
        }

        // PDF
        if (part.type === 'file' && part.mediaType === 'application/pdf') {
          return (
            <iframe
              key={index}
              src={part.url}
              className="w-full h-96"
              title={part.filename || 'pdf'}
            />
          )
        }

        return null
      })}
    </div>
  )
}
```

---

## API Route (Server-side AI SDK)

```typescript
// app/api/chat/route.ts
import { convertToModelMessages, streamText, UIMessage } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, agent }: { messages: UIMessage[]; agent: string } =
    await req.json()

  // Buscar system prompt baseado no agente
  const systemPrompt = getAgentSystemPrompt(agent)

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: systemPrompt,
    // Converter UI messages para model messages (inclui arquivos)
    messages: await convertToModelMessages(messages),
  })

  // Retornar stream no formato UI
  return result.toUIMessageStreamResponse()
}
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Quebrar chat existente | Medium | High | Manter props backward-compatible |
| Texto ilegivel no light | Low | High | Verificar tokens antes de merge |
| Mobile layout quebrado | Medium | Medium | Testar em varios breakpoints |

---

## Success Metrics

1. **Visual:** Input se assemelha a Perplexity mas com identidade Odonto GPT
2. **Funcional:** Troca de agentes reflete no chat (system prompt muda)
3. **UX:** Texto perfeitamente legivel em AMBOS os temas
4. **DX:** Component API limpa e documentada
5. **AI SDK:** 100% compatível com `@ai-sdk/react` e `ai` packages

---

## Migração: Breaking Changes

### De → Para (AI SDK Patterns)

| Antes | Depois | Motivo |
|-------|--------|--------|
| `onSubmit(files?: File[])` | `onSubmit({ text, files: FileUIPart[] })` | AI SDK format |
| `handleSubmit(e)` | `sendMessage({ text, files })` | useChat API |
| `message.content` | `message.parts[]` | Multimodal support |
| `attachments: Attachment[]` | `files: FileList \| undefined` | Simplificação |
| FileReader manual | `convertFilesToDataURLs()` helper | Padronização |

### Imports Necessários

```typescript
// Cliente
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, FileUIPart } from 'ai'

// Servidor
import { convertToModelMessages, streamText, UIMessage } from 'ai'
```

### Dependências

```json
{
  "@ai-sdk/react": "^1.x",
  "@ai-sdk/anthropic": "^1.x",
  "ai": "^4.3 || ^5 || ^6"
}
```

---

## Referências

- [AI SDK Chatbot UI](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot)
- [Multi-modal Chatbot Guide](https://ai-sdk.dev/docs/guides/multi-modal-chatbot)
- [useChat Hook Reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)
