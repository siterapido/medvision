# Correções para Next.js 16 - Async Params e SearchParams

## Resumo

Com o Next.js 16, os parâmetros de rotas dinâmicas (`params`) e `searchParams` agora são **Promises** e devem ser aguardados (await) antes do acesso. Essa mudança foi implementada para melhorar o streaming e o desempenho.

## Arquivos Corrigidos

### 1. Configuração - next.config.mjs

**Mudança**: Aumentado o limite de tamanho do corpo para uploads para 2GB (suporte a vídeos grandes).

```javascript
experimental: {
  serverActions: {
    bodySizeLimit: '2gb',
  },
  middlewareClientMaxBodySize: '2gb',
},
```

### 2. Rotas API

#### app/api/lessons/[lessonId]/attachments/route.ts

**Antes**:
```typescript
export async function GET(_: Request, { params }: { params: { lessonId: string } })
export async function POST(request: Request, { params }: { params: { lessonId: string } })
```

**Depois**:
```typescript
export async function GET(_: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params
  // ...
}

export async function POST(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params
  // ...
}
```

#### app/api/admin/users/[id]/route.ts

**Antes**:
```typescript
export async function GET(request: NextRequest, { params }: { params: { id: string } })
export async function PUT(request: NextRequest, { params }: { params: { id: string } })
```

**Depois**:
```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // ...
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // ...
}
```

#### app/api/lessons/[lessonId]/attachments/[attachmentId]/download/route.ts

**Antes**:
```typescript
export async function GET(_: Request, { params }: { params: { lessonId: string; attachmentId: string } })
```

**Depois**:
```typescript
export async function GET(_: Request, { params }: { params: Promise<{ lessonId: string; attachmentId: string }> }) {
  const resolvedParams = await params
  const lessonId = uuidSchemaWithMessage("...").safeParse(resolvedParams.lessonId?.trim())
  // ...
}
```

#### app/api/lessons/[lessonId]/attachments/[attachmentId]/route.ts

**Antes**:
```typescript
export async function DELETE(_: Request, { params }: { params: { lessonId: string; attachmentId: string } })
```

**Depois**:
```typescript
export async function DELETE(_: Request, { params }: { params: Promise<{ lessonId: string; attachmentId: string }> }) {
  const resolvedParams = await params
  const lessonId = uuidSchemaWithMessage("...").safeParse(resolvedParams.lessonId?.trim())
  // ...
}
```

### 3. Páginas

#### app/register/page.tsx

**Antes**:
```typescript
type RegisterPageProps = {
  searchParams?: {
    trial?: string
  }
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const requestedTrial = typeof searchParams?.trial === "string"
    ? Number(searchParams.trial)
    : undefined
}
```

**Depois**:
```typescript
type RegisterPageProps = {
  searchParams?: Promise<{
    trial?: string
  }>
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const resolvedSearchParams = await searchParams
  const requestedTrial = typeof resolvedSearchParams?.trial === "string"
    ? Number(resolvedSearchParams.trial)
    : undefined
}
```

### 4. Tratamento de Erros em Uploads

#### app/api/uploads/materials/route.ts

Adicionado tratamento específico para erros de FormData quando o arquivo excede o limite:

```typescript
let form
try {
  form = await request.formData()
} catch (formError: any) {
  console.error("[uploads/materials POST] erro ao fazer parse do FormData:", formError)
  if (formError?.message?.includes("boundary") || formError?.message?.includes("10MB")) {
    return NextResponse.json({ 
      error: "Arquivo muito grande ou formato inválido. Certifique-se de que o arquivo não excede o limite permitido." 
    }, { status: 413 })
  }
  return NextResponse.json({ error: "Erro ao processar o arquivo." }, { status: 400 })
}
```

## Páginas Já Corretas

As seguintes páginas já estavam implementadas corretamente:

- `app/dashboard/cursos/[id]/page.tsx` ✅
- `app/dashboard/cursos/live/[id]/page.tsx` ✅
- `app/api/admin/courses/[id]/lessons/import/route.ts` ✅

## Padrão a Seguir

### Para Rotas API (Route Handlers)

```typescript
// Rota com um parâmetro
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // usar id normalmente
}

// Rota com múltiplos parâmetros
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; otherId: string }> }
) {
  const resolvedParams = await params
  const { id, otherId } = resolvedParams
  // usar parâmetros normalmente
}
```

### Para Páginas (Page Components)

```typescript
// Com params
type PageProps = {
  params: Promise<{ id: string }>
}

export default async function MyPage({ params }: PageProps) {
  const { id } = await params
  // ...
}

// Com searchParams
type PageProps = {
  searchParams: Promise<{ query?: string }>
}

export default async function MyPage({ searchParams }: PageProps) {
  const { query } = await searchParams
  // ...
}

// Com ambos
type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ query?: string }>
}

export default async function MyPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { query } = await searchParams
  // ...
}
```

## Referências

- [Next.js 16 - Async Request APIs](https://nextjs.org/docs/messages/sync-dynamic-apis)
- [Next.js App Router - Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)

## Status

✅ Todas as correções implementadas
✅ Linter sem erros
✅ Limite de upload aumentado para 2GB


