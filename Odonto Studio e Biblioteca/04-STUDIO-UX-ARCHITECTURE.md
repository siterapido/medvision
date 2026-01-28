# Odonto Studio - Arquitetura UI/UX

## Conceito "Studio"

O **Studio** é uma evolução do paradigma de chat tradicional. Em vez de depender de prompts bem-escritos pelo usuário, o Studio oferece **formulários especializados** que coletam dados estruturados, garantindo que a IA receba inputs perfeitos.

### Por que Studio > Chat?

| Aspecto | Chat Tradicional | Studio |
|---------|------------------|--------|
| **Input do Usuário** | Prompt livre (requer habilidade) | Formulário guiado |
| **Qualidade da Geração** | Inconsistente | Previsível e alta |
| **Experiência** | Limitada pela janela de chat | Interface rica e especializada |
| **Edição Pós-Geração** | Difícil (re-prompt) | Nativa e fluida |
| **Contexto** | Limitado ao histórico | Campos específicos |

### Exemplo Prático

**Cenário**: Usuário quer gerar um laudo radiográfico

#### Abordagem Chat ❌
```
Usuário: "Gere um laudo radiográfico de uma panorâmica"
Claude: "Claro! Preciso de mais informações..."
Usuário: "É de uma paciente de 45 anos..."
Claude: "Ok, e quais são os achados?"
[5-10 mensagens depois...]
```

#### Abordagem Studio ✅
```
1. Usuário acessa: /studio/new?type=report
2. Seleciona: "Laudo Radiográfico"
3. Formulário apresenta:
   ├─ Tipo de exame: [Dropdown: Panorâmica, Periapical, ...]
   ├─ Dados do paciente: [Nome, Idade, ID]
   ├─ Achados clínicos: [Textarea]
   ├─ Upload de imagem: [File upload]
   └─ [GERAR LAUDO]
4. Live Preview aparece ao lado
5. Usuário revisa e edita inline
6. Salva na biblioteca
```

---

## Arquitetura de Fluxo

### 1. Seleção de Tipo de Artefato

**Página**: `/dashboard/studio`

```tsx
// app/dashboard/studio/page.tsx
export default function StudioPage() {
  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-2">Odonto Studio</h1>
      <p className="text-gray-600 mb-8">
        Crie artefatos profissionais com IA especializada
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ArtifactTypeCard
          type="research"
          title="Pesquisa Científica"
          description="Relatórios com citações e referências"
          icon={<FlaskConical />}
          href="/studio/new?type=research"
        />
        <ArtifactTypeCard
          type="flashcard"
          title="Flashcards"
          description="Cartões para memorização ativa"
          icon={<BookOpen />}
          href="/studio/new?type=flashcard"
        />
        <ArtifactTypeCard
          type="report"
          title="Laudos & Prescrições"
          description="Documentos clínicos profissionais"
          icon={<FileText />}
          href="/studio/new?type=report"
        />
        <ArtifactTypeCard
          type="summary"
          title="Resumos"
          description="Sínteses de conteúdo extenso"
          icon={<FileStack />}
          href="/studio/new?type=summary"
        />
        <ArtifactTypeCard
          type="mindmap"
          title="Mapas Mentais"
          description="Visualização de conceitos conectados"
          icon={<Network />}
          href="/studio/new?type=mindmap"
        />
        <ArtifactTypeCard
          type="quiz"
          title="Simulados"
          description="Questões para testar conhecimento"
          icon={<ClipboardCheck />}
          href="/studio/new?type=quiz"
        />
      </div>
    </div>
  );
}
```

### 2. Formulário Dinâmico

**Página**: `/dashboard/studio/new`

```tsx
// app/dashboard/studio/new/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { CreateResearchForm } from '@/components/artifacts/forms/CreateResearchForm';
import { CreateFlashcardForm } from '@/components/artifacts/forms/CreateFlashcardForm';
import { CreateReportForm } from '@/components/artifacts/forms/CreateReportForm';
// ... outros imports

export default function NewArtifactPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type');

  if (!type) {
    return <ArtifactTypeSelector />;
  }

  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto">
        <BackButton href="/studio" />
        <h1 className="text-3xl font-bold mb-6">
          {getArtifactTitle(type)}
        </h1>
        {renderForm(type)}
      </div>
    </div>
  );
}

function renderForm(type: string) {
  switch (type) {
    case 'research':
      return <CreateResearchForm />;
    case 'flashcard':
      return <CreateFlashcardForm />;
    case 'report':
      return <CreateReportForm />;
    case 'summary':
      return <CreateSummaryForm />;
    case 'mindmap':
      return <CreateMindMapForm />;
    case 'quiz':
      return <CreateQuizForm />;
    default:
      return <div>Tipo de artefato desconhecido</div>;
  }
}
```

---

## Padrões de UI por Artefato

### 1. Pesquisas Científicas

#### Estados da Geração

```tsx
enum ResearchState {
  IDLE = 'idle',
  SEARCHING = 'searching',      // Buscando fontes
  ANALYZING = 'analyzing',       // Analisando conteúdo
  WRITING = 'writing',           // Escrevendo relatório
  COMPLETE = 'complete',
  ERROR = 'error',
}
```

#### Componente de Loading Especializado

```tsx
function ResearchLoadingState({ state }: { state: ResearchState }) {
  const steps = [
    { state: ResearchState.SEARCHING, label: 'Buscando fontes científicas', icon: '🔍' },
    { state: ResearchState.ANALYZING, label: 'Analisando evidências', icon: '📊' },
    { state: ResearchState.WRITING, label: 'Escrevendo relatório', icon: '✍️' },
  ];

  return (
    <div className="space-y-4">
      {steps.map((step, i) => {
        const isActive = state === step.state;
        const isComplete = Object.values(ResearchState).indexOf(state) > i;

        return (
          <div key={step.state} className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isComplete && "bg-green-500 text-white",
              isActive && "bg-blue-500 text-white animate-pulse",
              !isActive && !isComplete && "bg-gray-200"
            )}>
              {isComplete ? '✓' : step.icon}
            </div>
            <div className="flex-1">
              <p className={cn(
                "font-medium",
                isActive && "text-blue-600"
              )}>
                {step.label}
              </p>
              {isActive && (
                <Progress className="mt-2" value={undefined} /> // Indeterminate
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

#### Background Processing

```tsx
// Processamento em background com notificações
function useBackgroundResearch() {
  const [jobId, setJobId] = useState<string | null>(null);

  const startResearch = async (params: ResearchParams) => {
    const response = await fetch('/api/jobs/research', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    const { jobId } = await response.json();
    setJobId(jobId);

    // Notificar usuário
    toast({
      title: 'Pesquisa iniciada',
      description: 'Você será notificado quando estiver pronta.',
      action: <Button variant="outline">Ver progresso</Button>,
    });
  };

  // Polling ou WebSocket para updates
  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      const status = await checkJobStatus(jobId);
      if (status === 'complete') {
        toast({
          title: 'Pesquisa concluída! ✅',
          description: 'Clique para visualizar',
          action: <Button href={`/biblioteca/research/${jobId}`}>Ver</Button>,
        });
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [jobId]);

  return { startResearch };
}
```

---

### 2. Laudos & Prescrições - Live Preview

#### Layout Split-View

```tsx
function CreateReportForm() {
  const [formData, setFormData] = useState<ReportFormData>({});
  const [previewHtml, setPreviewHtml] = useState('');

  // Debounced preview generation
  const debouncedFormData = useDebounce(formData, 500);

  useEffect(() => {
    if (debouncedFormData) {
      generatePreview(debouncedFormData).then(setPreviewHtml);
    }
  }, [debouncedFormData]);

  return (
    <div className="grid grid-cols-2 gap-6 h-screen">
      {/* Left: Form */}
      <div className="overflow-y-auto p-6 border-r">
        <ReportForm data={formData} onChange={setFormData} />
      </div>

      {/* Right: Live Preview */}
      <div className="overflow-y-auto p-6 bg-gray-50">
        <div className="a4-page bg-white shadow-lg">
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      </div>
    </div>
  );
}
```

#### Autocomplete CID-10

```tsx
function CID10Autocomplete({ value, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<CID10[]>([]);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (debouncedSearch.length < 2) return;

    fetch(`/api/cid10/search?q=${debouncedSearch}`)
      .then(r => r.json())
      .then(setResults);
  }, [debouncedSearch]);

  return (
    <Combobox value={value} onChange={onChange}>
      <ComboboxInput
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar CID-10..."
      />
      <ComboboxOptions>
        {results.map((item) => (
          <ComboboxOption key={item.code} value={item.code}>
            <span className="font-mono text-sm">{item.code}</span>
            <span className="ml-2">{item.description}</span>
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  );
}
```

---

### 3. Mapas Mentais - Canvas Infinito

#### Full-Screen Experience

```tsx
function CreateMindMapForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [mindmapData, setMindmapData] = useState<MindMapData | null>(null);

  const handleGenerate = async (topic: string) => {
    setIsGenerating(true);
    const data = await generateMindMap({ topic });
    setMindmapData(data);
    setIsGenerating(false);
  };

  if (isGenerating) {
    return <MindMapLoadingState />;
  }

  if (mindmapData) {
    // Transição para full-screen canvas
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <MindMapCanvas 
          data={mindmapData}
          onSave={handleSave}
          onExit={() => router.push('/studio')}
        />
      </div>
    );
  }

  return <MindMapInitialForm onSubmit={handleGenerate} />;
}
```

#### React Flow com Auto-Layout

```tsx
import { useEffect } from 'react';
import ReactFlow, { useReactFlow } from 'reactflow';
import dagre from 'dagre';

function MindMapCanvas({ data }: Props) {
  const { fitView, setNodes, setEdges } = useReactFlow();

  useEffect(() => {
    // Auto-layout usando dagre
    const layoutedElements = getLayoutedElements(
      data.nodes,
      data.edges,
      'TB' // Top to Bottom
    );

    setNodes(layoutedElements.nodes);
    setEdges(layoutedElements.edges);

    // Fit view após layout
    setTimeout(() => fitView({ padding: 0.2 }), 10);
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
    >
      <Controls />
      <MiniMap />
      <Background />
    </ReactFlow>
  );
}

function getLayoutedElements(nodes, edges, direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 50 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 75,
        y: nodeWithPosition.y - 25,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
```

---

## Sistema de Componentes Reutilizáveis

### 1. Skeleton States

```tsx
// components/shared/skeletons.tsx
export function ArtifactListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="w-12 h-12 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

export function FlashcardGenerationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <div>
          <h3 className="font-medium">Gerando seus flashcards...</h3>
          <p className="text-sm text-gray-500">Isso pode levar alguns segundos</p>
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Error States

```tsx
// components/shared/error-states.tsx
export function ArtifactErrorState({ error, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Erro ao gerar artefato</h3>
      <p className="text-gray-600 mb-6 max-w-md">{error.message}</p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
        <Button onClick={onRetry}>
          Tentar Novamente
        </Button>
      </div>
    </div>
  );
}
```

### 3. Empty States

```tsx
// components/shared/empty-states.tsx
export function EmptyLibraryState({ type }: { type?: ArtifactType }) {
  const config = {
    research: {
      icon: FlaskConical,
      title: 'Nenhuma pesquisa ainda',
      description: 'Crie sua primeira pesquisa científica com citações reais.',
      action: 'Criar Pesquisa',
    },
    flashcard: {
      icon: BookOpen,
      title: 'Nenhum deck de flashcards',
      description: 'Crie flashcards para memorização ativa.',
      action: 'Criar Flashcards',
    },
    // ... outros tipos
  };

  const current = config[type || 'default'];

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <current.icon className="w-16 h-16 text-gray-300 mb-4" />
      <h3 className="text-lg font-semibold mb-2">{current.title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{current.description}</p>
      <Button asChild>
        <Link href={`/studio/new?type=${type}`}>{current.action}</Link>
      </Button>
    </div>
  );
}
```

---

## Interações Avançadas

### 1. Modo Edição Inline (Laudos)

```tsx
function EditableDocument({ initialContent }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Link],
    content: initialContent,
    editable: false, // Começa em modo visualização
  });

  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => {
    editor?.setEditable(!isEditing);
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    const html = editor?.getHTML();
    await updateDocument(html);
    setIsEditing(false);
    editor?.setEditable(false);
  };

  return (
    <div>
      <Toolbar>
        <Button onClick={toggleEdit}>
          {isEditing ? 'Cancelar' : 'Editar'}
        </Button>
        {isEditing && (
          <Button onClick={handleSave}>Salvar</Button>
        )}
      </Toolbar>

      {isEditing && (
        <BubbleMenu editor={editor}>
          <Button onClick={() => editor?.chain().focus().toggleBold().run()}>
            Bold
          </Button>
          {/* ... mais formatações */}
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
```

### 2. Exportação Multi-Formato

```tsx
function ExportMenu({ artifact }: Props) {
  const handleExportPDF = async () => {
    const doc = new jsPDF();
    // ... configuração
    doc.save(`${artifact.title}.pdf`);
  };

  const handleExportMarkdown = () => {
    const markdown = artifactToMarkdown(artifact);
    downloadFile(markdown, `${artifact.title}.md`, 'text/markdown');
  };

  const handleExportAnki = () => {
    // Gerar .apkg para flashcards
    const apkg = generateAnkiPackage(artifact);
    downloadFile(apkg, `${artifact.title}.apkg`, 'application/zip');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleExportPDF}>
          📄 PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportMarkdown}>
          📝 Markdown
        </DropdownMenuItem>
        {artifact.type === 'flashcard' && (
          <DropdownMenuItem onClick={handleExportAnki}>
            🎴 Anki (.apkg)
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 3. Colaboração (Compartilhamento)

```tsx
function ShareDialog({ artifactId }: Props) {
  const [shareLink, setShareLink] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleGenerateLink = async () => {
    const link = await createShareableLink(artifactId);
    setShareLink(link);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Compartilhar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhar Artefato</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Tornar público</Label>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {isPublic ? (
            <div className="space-y-2">
              <Label>Link de compartilhamento</Label>
              <div className="flex gap-2">
                <Input value={shareLink} readOnly />
                <Button onClick={() => copyToClipboard(shareLink)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Ative o compartilhamento público para gerar um link
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Mobile Responsiveness

### 1. Adaptação de Layout

```tsx
// Exemplo: Flashcards em Mobile
function ResponsiveFlashcardDeck() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className={cn(
      "flashcard-container",
      isMobile ? "px-4" : "max-w-2xl mx-auto"
    )}>
      {isMobile ? (
        <MobileFlashcardView />
      ) : (
        <DesktopFlashcardView />
      )}
    </div>
  );
}
```

### 2. Touch Gestures (para Flashcards)

```tsx
import { useSwipeable } from 'react-swipeable';

function SwipeableFlashcard() {
  const handlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrevious,
    onSwipedUp: () => setFlipped(true),
    preventScrollOnSwipe: true,
  });

  return (
    <div {...handlers} className="card-container">
      {/* Card content */}
    </div>
  );
}
```

---

## Acessibilidade

### 1. Navegação por Teclado

```tsx
function FlashcardDeck() {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case ' ':
          e.preventDefault();
          setFlipped(!flipped);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [flipped]);

  // ...
}
```

### 2. Screen Reader Support

```tsx
<div
  role="region"
  aria-label="Flashcard deck"
  aria-live="polite"
>
  <div
    role="article"
    aria-label={`Card ${currentIndex + 1} of ${totalCards}`}
  >
    <div className="card-front" aria-hidden={flipped}>
      {currentCard.front}
    </div>
    <div className="card-back" aria-hidden={!flipped}>
      {currentCard.back}
    </div>
  </div>
</div>
```

---

**Versão**: 1.0  
**Última atualização**: Janeiro 2026
