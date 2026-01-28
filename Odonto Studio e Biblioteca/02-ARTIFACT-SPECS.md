# Especificações de Artefatos - Odonto GPT

## 1. Pesquisas Científicas (Scientific Research)

### Conceito
Relatórios detalhados baseados em evidência científica recente, com citações e referências bibliográficas reais.

### Casos de Uso
- Revisão de literatura para TCC/dissertação
- Embasamento para casos clínicos
- Atualização sobre novos tratamentos
- Resposta a dúvidas clínicas complexas

### Estrutura de Dados
```typescript
interface ResearchArtifact {
  type: 'research';
  content: {
    query: string;
    abstract: string;
    sections: ResearchSection[];
    citations: Citation[];
    methodology: string;
    conclusions: string[];
    generatedAt: Date;
  };
  metadata: {
    evidenceLevel: 'meta-analysis' | 'rct' | 'cohort' | 'case-study' | 'expert-opinion';
    yearRange: { from: number; to: number };
    sourcesCount: number;
    processingTime: number; // segundos
  };
}

interface ResearchSection {
  id: string;
  title: string;
  content: string; // Markdown
  citationIds: string[]; // referências às citations
}

interface Citation {
  id: string;
  title: string;
  authors: string[];
  year: number;
  source: string; // Journal name
  doi?: string;
  url: string;
  snippet: string; // trecho relevante
  evidenceLevel: string;
}
```

### AI Provider Recomendado
- **Principal**: Perplexity Sonar Pro
  - Acesso real à web
  - Citações automáticas
  - Ranking de qualidade de fontes
- **Fallback**: GPT-4o com web search

### Prompt Template
```typescript
const researchPrompt = `
Você é um pesquisador científico especializado em odontologia.

TAREFA: Realizar uma pesquisa aprofundada sobre: "${query}"

REQUISITOS:
- Buscar apenas artigos publicados entre ${yearRange.from} e ${yearRange.to}
- Priorizar níveis de evidência: ${evidenceLevel.join(', ')}
- Incluir mínimo de ${minSources} fontes científicas
- Citar DOI sempre que disponível

ESTRUTURA DA RESPOSTA:
1. Resumo Executivo (150-200 palavras)
2. Introdução e Contexto
3. Metodologia da Pesquisa
4. Principais Achados (dividido em subsecções temáticas)
5. Discussão e Implicações Clínicas
6. Conclusões
7. Referências Bibliográficas (formato ABNT/Vancouver)

FORMATO: Markdown com citações numeradas [1], [2], etc.
`;
```

### Componente UI
```tsx
// components/artifacts/types/ResearchViewer.tsx
export function ResearchViewer({ artifact }: { artifact: ResearchArtifact }) {
  const [activeSection, setActiveSection] = useState(0);
  const [showCitations, setShowCitations] = useState(false);

  return (
    <div className="research-viewer">
      {/* Table of Contents */}
      <aside className="toc">
        {artifact.content.sections.map((section, i) => (
          <button onClick={() => setActiveSection(i)}>
            {section.title}
          </button>
        ))}
      </aside>

      {/* Main Content */}
      <article className="prose">
        <h1>{artifact.title}</h1>
        <div className="abstract">{artifact.content.abstract}</div>
        
        <MarkdownRenderer 
          content={artifact.content.sections[activeSection].content}
          onCitationClick={(id) => scrollToCitation(id)}
        />
      </article>

      {/* Citations Panel */}
      <aside className={cn("citations-panel", showCitations && "open")}>
        <CitationList citations={artifact.content.citations} />
      </aside>
    </div>
  );
}
```

### Features Especiais
- **Export PDF** com bibliografia formatada
- **Highlight de citações** ao hover
- **Link direto** para fonte original
- **Nota de evidência** em cada citação (badge colorido)

---

## 2. Flashcards

### Conceito
Cartões de memorização com técnica de repetição espaçada, otimizados para estudo ativo.

### Casos de Uso
- Memorização de anatomia dental
- Nomenclatura de procedimentos
- Doses de medicamentos
- Preparação para provas

### Estrutura de Dados
```typescript
interface FlashcardArtifact {
  type: 'flashcard';
  content: {
    deck: {
      name: string;
      description: string;
      cards: FlashCard[];
    };
  };
  metadata: {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    topic: string;
    sourceType?: 'pdf' | 'text' | 'topic';
    totalCards: number;
  };
}

interface FlashCard {
  id: string;
  front: string; // Pergunta ou conceito
  back: string; // Resposta (pode ter markdown)
  hint?: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  
  // Para spaced repetition
  nextReview?: Date;
  interval?: number; // dias
  easeFactor?: number;
  reviews?: number;
}
```

### AI Provider Recomendado
- **Principal**: GPT-4o
  - Excelente em estruturação
  - Bom balanço entre clareza e profundidade
- **Alternativa**: Claude 3.5 Sonnet

### Prompt Template
```typescript
const flashcardPrompt = `
Você é um professor de odontologia especializado em didática.

TAREFA: Criar ${numberOfCards} flashcards sobre: "${topic}"

PRINCÍPIOS:
1. Frente: Pergunta clara, direta, sem ambiguidades
2. Verso: Resposta concisa (50-150 palavras) com a informação essencial
3. Evitar cartões muito fáceis ou excessivamente complexos
4. Incluir mnemônicos quando apropriado
5. Distribuir dificuldade: 40% easy, 40% medium, 20% hard

FORMATO DE SAÍDA: JSON
[
  {
    "front": "Qual é a sequência de erupção dos dentes permanentes?",
    "back": "**Sequência típica:**\\n1. Primeiro molar (6 anos)\\n2. Incisivos centrais (6-7 anos)...",
    "hint": "Pense na regra dos '6 anos'",
    "tags": ["odontopediatria", "cronologia", "erupção"],
    "difficulty": "medium"
  }
]
`;
```

### Componente UI
```tsx
// components/artifacts/types/FlashcardDeck.tsx
export function FlashcardDeck({ artifact }: { artifact: FlashcardArtifact }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<'study' | 'review'>('study');

  const currentCard = artifact.content.deck.cards[currentIndex];

  return (
    <div className="flashcard-deck">
      {/* Modos */}
      <div className="mode-selector">
        <button onClick={() => setMode('study')}>Modo Estudo</button>
        <button onClick={() => setMode('review')}>Modo Revisão</button>
      </div>

      {/* Card Display */}
      <div className="card-container">
        <div 
          className={cn("card", flipped && "flipped")}
          onClick={() => setFlipped(!flipped)}
        >
          <div className="card-front">
            <p>{currentCard.front}</p>
            {currentCard.hint && !flipped && (
              <button className="hint-btn">💡 Dica</button>
            )}
          </div>
          <div className="card-back">
            <Markdown>{currentCard.back}</Markdown>
            <div className="tags">
              {currentCard.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation & Progress */}
      <div className="controls">
        <button onClick={previousCard}>←</button>
        <span>{currentIndex + 1} / {artifact.content.deck.cards.length}</span>
        <button onClick={nextCard}>→</button>
      </div>

      {/* Difficulty Rating (for spaced repetition) */}
      {mode === 'review' && flipped && (
        <div className="difficulty-buttons">
          <button onClick={() => rateCard('easy')}>Fácil</button>
          <button onClick={() => rateCard('medium')}>Médio</button>
          <button onClick={() => rateCard('hard')}>Difícil</button>
        </div>
      )}
    </div>
  );
}
```

### Features Especiais
- **Algoritmo Anki Simplificado** para revisão espaçada
- **Modo Aleatório** para estudo não-linear
- **Export para Anki** (formato .apkg)
- **Estatísticas** de progresso

---

## 3. Laudos & Prescrições (Clinical Reports)

### Conceito
Documentos clínicos formais gerados a partir de inputs estruturados, prontos para impressão e uso profissional.

### Casos de Uso
- Laudos radiográficos
- Prescrições de medicamentos
- Atestados odontológicos
- Planos de tratamento
- Relatórios de procedimentos

### Estrutura de Dados
```typescript
interface ReportArtifact {
  type: 'report';
  content: {
    reportType: 'prescription' | 'radiology' | 'treatment-plan' | 'certificate';
    header: ReportHeader;
    body: TiptapJSON; // Editor rico
    footer: ReportFooter;
  };
  metadata: {
    patientName?: string;
    patientId?: string;
    cid10?: string[];
    professionalCRO: string;
    generatedFrom: 'form' | 'voice' | 'image-analysis';
  };
}

interface ReportHeader {
  clinicName: string;
  clinicAddress: string;
  professionalName: string;
  professionalCRO: string;
  phone: string;
  date: Date;
}

interface ReportFooter {
  signature?: string; // base64 ou path
  observations?: string;
}
```

### AI Provider Recomendado
- **Principal**: GPT-4o
  - Alta precisão em texto formal
  - Bom seguimento de templates
- **Para análise de imagem**: GPT-4 Vision

### Prompt Template (Exemplo: Laudo Radiográfico)
```typescript
const radiologyReportPrompt = `
Você é um radiologista odontológico experiente.

DADOS DO EXAME:
- Tipo: ${examType}
- Região: ${region}
- Achados clínicos: ${clinicalFindings}
- Imagem anexa: [descrição da imagem]

TAREFA: Gerar laudo radiográfico profissional

ESTRUTURA:
1. IDENTIFICAÇÃO
   - Paciente: ${patientName}
   - Data: ${date}
   - Tipo de exame: ${examType}

2. TÉCNICA
   [Descrever técnica utilizada]

3. ACHADOS RADIOGRÁFICOS
   [Descrição detalhada e técnica]

4. CONCLUSÃO
   [Interpretação clínica objetiva]

5. CID-10
   [Se aplicável]

ESTILO: Linguagem técnica, objetiva, sem especulações. Use terminologia odontológica precisa.
`;
```

### Componente UI
```tsx
// components/artifacts/types/ReportViewer.tsx
export function ReportViewer({ artifact }: { artifact: ReportArtifact }) {
  const [editing, setEditing] = useState(false);
  const editor = useEditor({
    content: artifact.content.body,
    editable: editing,
  });

  return (
    <div className="report-viewer">
      {/* Toolbar */}
      <div className="toolbar">
        <button onClick={() => setEditing(!editing)}>
          {editing ? 'Visualizar' : 'Editar'}
        </button>
        <button onClick={handlePrint}>🖨️ Imprimir</button>
        <button onClick={handleExportPDF}>📄 Exportar PDF</button>
      </div>

      {/* Document */}
      <div className="document a4-page">
        {/* Header com logo e dados do profissional */}
        <header className="document-header">
          <div className="clinic-info">
            <h2>{artifact.content.header.clinicName}</h2>
            <p>{artifact.content.header.clinicAddress}</p>
          </div>
          <div className="professional-info">
            <p>{artifact.content.header.professionalName}</p>
            <p>CRO: {artifact.content.header.professionalCRO}</p>
          </div>
        </header>

        {/* Body - Editor Rico */}
        <main className="document-body">
          <EditorContent editor={editor} />
        </main>

        {/* Footer */}
        <footer className="document-footer">
          {artifact.content.footer.signature && (
            <div className="signature">
              <img src={artifact.content.footer.signature} alt="Assinatura" />
            </div>
          )}
          <p className="date">
            {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </footer>
      </div>
    </div>
  );
}
```

### Features Especiais
- **Live Preview** durante preenchimento do form
- **Templates** pré-definidos por tipo de documento
- **Autocomplete CID-10** odontológico
- **Assinatura digital** integrada
- **Impressão otimizada** (CSS @media print)

---

## 4. Resumos (Summaries)

### Conceito
Sínteses estruturadas de conteúdo extenso, mantendo os pontos principais e facilitando revisão rápida.

### Casos de Uso
- Resumo de aulas/palestras transcritas
- Síntese de artigos longos
- Compressão de PDFs extensos
- Preparação para provas

### Estrutura de Dados
```typescript
interface SummaryArtifact {
  type: 'summary';
  content: {
    source: {
      type: 'pdf' | 'text' | 'transcription' | 'url';
      title: string;
      originalLength: number; // caracteres ou páginas
    };
    summary: {
      brief: string; // 2-3 parágrafos
      detailed: SummarySection[];
      keyPoints: string[];
      definitions: { term: string; definition: string }[];
    };
  };
  metadata: {
    compressionRatio: number; // ex: 0.15 (85% redução)
    readingTime: number; // minutos estimados
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
}

interface SummarySection {
  id: string;
  title: string;
  content: string;
  collapsed: boolean;
}
```

### AI Provider Recomendado
- **Principal**: Gemini 1.5 Pro (contexto de 1M tokens)
- **Alternativa**: GPT-4 Turbo (128k context)
- **Fallback**: Claude 3.5 Sonnet (200k context)

### Prompt Template
```typescript
const summaryPrompt = `
Você é um especialista em síntese de conteúdo acadêmico.

CONTEÚDO ORIGINAL:
${originalText}

TAREFA: Criar resumo estruturado mantendo fidelidade ao conteúdo original

ESTRUTURA:
1. RESUMO EXECUTIVO (150-200 palavras)
   - Ideia central
   - Principais argumentos
   - Conclusão

2. RESUMO DETALHADO
   - Divida em seções temáticas
   - Use subtítulos claros
   - Bullet points para listas
   - Mantenha hierarquia de informação

3. PONTOS-CHAVE
   - Liste 5-10 takeaways principais
   - Fatos, números, datas importantes

4. GLOSSÁRIO
   - Termos técnicos com definições
   - Conceitos importantes

ESTILO: Claro, objetivo, acadêmico mas acessível.
FORMATO: Markdown estruturado
`;
```

### Componente UI
```tsx
// components/artifacts/types/SummaryViewer.tsx
export function SummaryViewer({ artifact }: { artifact: SummaryArtifact }) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="summary-viewer">
      {/* Quick Stats */}
      <div className="summary-stats">
        <span>⏱️ {artifact.metadata.readingTime} min de leitura</span>
        <span>📉 {Math.round(artifact.metadata.compressionRatio * 100)}% do original</span>
      </div>

      {/* Brief Summary */}
      <section className="brief-summary">
        <h2>Resumo Executivo</h2>
        <p>{artifact.content.summary.brief}</p>
      </section>

      {/* Key Points */}
      <section className="key-points">
        <h3>📌 Pontos-Chave</h3>
        <ul>
          {artifact.content.summary.keyPoints.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      </section>

      {/* Detailed Sections (Collapsible) */}
      <section className="detailed-summary">
        <h3>Resumo Detalhado</h3>
        {artifact.content.summary.detailed.map((section) => (
          <div key={section.id} className="summary-section">
            <button
              onClick={() => toggleSection(section.id)}
              className="section-header"
            >
              <span>{section.title}</span>
              <ChevronIcon rotated={expandedSections.has(section.id)} />
            </button>
            {expandedSections.has(section.id) && (
              <div className="section-content">
                <Markdown>{section.content}</Markdown>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Glossary */}
      {artifact.content.summary.definitions.length > 0 && (
        <section className="glossary">
          <h3>📖 Glossário</h3>
          <dl>
            {artifact.content.summary.definitions.map(({ term, definition }) => (
              <>
                <dt>{term}</dt>
                <dd>{definition}</dd>
              </>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
```

### Features Especiais
- **Upload de PDF** com OCR automático
- **Transcrição de áudio** (Whisper API) antes de sumarizar
- **Comparação** lado-a-lado com original
- **Export** para Notion, Obsidian (Markdown)

---

## 5. Mapas Mentais (Mind Maps)

### Conceito
Representação visual e hierárquica de conceitos interconectados, facilitando compreensão de relações complexas.

### Casos de Uso
- Visualização de protocolos clínicos
- Mapa de diagnóstico diferencial
- Estrutura de conteúdo para aulas
- Brainstorming de casos clínicos

### Estrutura de Dados
```typescript
interface MindMapArtifact {
  type: 'mindmap';
  content: {
    topic: string;
    nodes: MindMapNode[];
    edges: MindMapEdge[];
  };
  metadata: {
    layout: 'hierarchical' | 'radial' | 'force-directed';
    nodeCount: number;
    depth: number;
  };
}

interface MindMapNode {
  id: string;
  label: string;
  type: 'root' | 'branch' | 'leaf';
  data: {
    description?: string;
    color?: string;
    icon?: string;
  };
  position?: { x: number; y: number }; // Salvo após usuário arrastar
}

interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'solid' | 'dashed';
}
```

### AI Provider Recomendado
- **Principal**: Claude 3.5 Sonnet
  - Excelente em estruturação hierárquica
  - Bom em identificar relações conceituais
- **Alternativa**: GPT-4o

### Prompt Template
```typescript
const mindmapPrompt = `
Você é um especialista em design instrucional e mapas conceituais.

TÓPICO CENTRAL: "${topic}"

TAREFA: Criar estrutura de mapa mental hierárquico

REQUISITOS:
1. Nó central = tópico principal
2. 3-5 ramos principais (conceitos de 1º nível)
3. Cada ramo deve ter 2-4 subramos (conceitos de 2º nível)
4. Limite: máximo 30 nós no total
5. Relações devem ser lógicas e claras
6. Use cores para agrupar conceitos relacionados

FORMATO DE SAÍDA: JSON
{
  "nodes": [
    {
      "id": "root",
      "label": "Antibioticoterapia em Odontologia",
      "type": "root",
      "data": { "color": "#FF6B6B" }
    },
    {
      "id": "indicacoes",
      "label": "Indicações",
      "type": "branch",
      "data": { "color": "#4ECDC4", "description": "Quando prescrever" }
    }
  ],
  "edges": [
    { "id": "e1", "source": "root", "target": "indicacoes" }
  ]
}
`;
```

### Componente UI (React Flow)
```tsx
// components/artifacts/types/MindMapViewer.tsx
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

export function MindMapViewer({ artifact }: { artifact: MindMapArtifact }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    artifact.content.nodes.map(node => ({
      ...node,
      position: node.position || { x: 0, y: 0 },
    }))
  );

  const [edges, setEdges, onEdgesChange] = useEdgesState(
    artifact.content.edges
  );

  const [editMode, setEditMode] = useState(false);

  // Auto-layout on mount
  useEffect(() => {
    if (!nodes[0].position.x && !nodes[0].position.y) {
      const layouted = getLayoutedElements(nodes, edges, artifact.metadata.layout);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
    }
  }, []);

  const handleSavePositions = async () => {
    // Salvar posições atualizadas no DB
    await updateArtifact(artifact.id, {
      'content.nodes': nodes.map(n => ({
        ...artifact.content.nodes.find(an => an.id === n.id),
        position: n.position,
      })),
    });
  };

  return (
    <div className="mindmap-viewer" style={{ height: '100vh' }}>
      {/* Toolbar */}
      <div className="mindmap-toolbar">
        <button onClick={() => setEditMode(!editMode)}>
          {editMode ? '👁️ Visualizar' : '✏️ Editar'}
        </button>
        <button onClick={handleSavePositions}>💾 Salvar Layout</button>
        <button onClick={handleExportImage}>📷 Exportar PNG</button>
        <select onChange={(e) => relayout(e.target.value)}>
          <option value="hierarchical">Hierárquico</option>
          <option value="radial">Radial</option>
          <option value="force-directed">Livre</option>
        </select>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={customNodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {/* Node Details Panel */}
      {selectedNode && (
        <aside className="node-details-panel">
          <h3>{selectedNode.label}</h3>
          {selectedNode.data.description && (
            <p>{selectedNode.data.description}</p>
          )}
        </aside>
      )}
    </div>
  );
}
```

### Features Especiais
- **Auto-layout** com dagre ou elkjs
- **Drag & Drop** de nós
- **Zoom e Pan** ilimitados
- **Export** para PNG, SVG, JSON
- **Temas** de cores pré-definidos

---

## 6. Simulados (Exams/Quiz)

### Conceito
Conjunto de questões de múltipla escolha com gabarito comentado para avaliar conhecimento.

### Casos de Uso
- Preparação para provas de residência
- Autoavaliação de aprendizado
- Revisão pré-concurso
- Treinamento de raciocínio clínico

### Estrutura de Dados
```typescript
interface QuizArtifact {
  type: 'quiz';
  content: {
    title: string;
    description: string;
    timeLimit?: number; // minutos
    questions: QuizQuestion[];
  };
  metadata: {
    difficulty: 'easy' | 'medium' | 'hard';
    topic: string;
    totalQuestions: number;
    passingScore: number; // porcentagem
  };
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  imageUrl?: string; // Para questões com imagem
}

interface QuizAttempt {
  quizId: string;
  userId: string;
  answers: { questionId: string; selectedIndex: number }[];
  score: number;
  completedAt: Date;
  timeSpent: number; // segundos
}
```

### AI Provider Recomendado
- **Principal**: GPT-4o
  - Excelente em gerar distratores plausíveis
  - Boas explicações didáticas

### Prompt Template
```typescript
const quizPrompt = `
Você é um professor de odontologia especializado em avaliação.

TAREFA: Criar ${numberOfQuestions} questões de múltipla escolha sobre "${topic}"

REQUISITOS:
1. Cada questão deve ter 5 alternativas (A, B, C, D, E)
2. Apenas UMA alternativa correta
3. Distratores plausíveis (erros comuns)
4. Explicação detalhada da resposta
5. Incluir referência bibliográfica quando relevante
6. Dificuldade: ${difficulty}

DISTRIBUIÇÃO DE TIPOS:
- 40% questões conceituais
- 30% aplicação clínica
- 30% casos clínicos

FORMATO DE SAÍDA: JSON
[
  {
    "question": "Paciente de 45 anos apresenta dor intensa em molar inferior direito...",
    "options": [
      "A) Pulpite reversível",
      "B) Pulpite irreversível",
      "C) Periodontite apical aguda",
      "D) Abscesso periapical",
      "E) Hipersensibilidade dentinária"
    ],
    "correctIndex": 1,
    "explanation": "Os sinais clínicos descritos (dor intensa, espontânea, que persiste após remoção do estímulo) são característicos de **pulpite irreversível**...\\n\\n**Ref:** Cohen & Hargreaves (2020)",
    "difficulty": "medium",
    "tags": ["endodontia", "diagnóstico", "pulpopatias"]
  }
]
`;
```

### Componente UI
```tsx
// components/artifacts/types/QuizViewer.tsx
export function QuizViewer({ artifact }: { artifact: QuizArtifact }) {
  const [mode, setMode] = useState<'exam' | 'review'>('exam');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [showResults, setShowResults] = useState(false);
  const [startTime] = useState(Date.now());

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    if (mode === 'exam') {
      setAnswers(new Map(answers.set(questionId, optionIndex)));
    }
  };

  const handleSubmit = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const score = calculateScore(answers, artifact.content.questions);
    
    await saveAttempt({
      quizId: artifact.id,
      answers: Array.from(answers.entries()).map(([qId, idx]) => ({
        questionId: qId,
        selectedIndex: idx,
      })),
      score,
      timeSpent,
    });

    setShowResults(true);
    setMode('review');
  };

  const question = artifact.content.questions[currentQuestion];
  const userAnswer = answers.get(question.id);

  return (
    <div className="quiz-viewer">
      {/* Header */}
      <div className="quiz-header">
        <h2>{artifact.title}</h2>
        <div className="quiz-info">
          <span>Questão {currentQuestion + 1} de {artifact.content.questions.length}</span>
          {artifact.content.timeLimit && <Timer initialTime={artifact.content.timeLimit * 60} />}
        </div>
      </div>

      {/* Question */}
      <div className="question-container">
        {question.imageUrl && (
          <img src={question.imageUrl} alt="Imagem da questão" />
        )}
        <h3>{question.question}</h3>

        {/* Options */}
        <div className="options">
          {question.options.map((option, index) => (
            <button
              key={index}
              className={cn(
                "option",
                userAnswer === index && "selected",
                mode === 'review' && index === question.correctIndex && "correct",
                mode === 'review' && userAnswer === index && index !== question.correctIndex && "incorrect"
              )}
              onClick={() => handleSelectAnswer(question.id, index)}
              disabled={mode === 'review'}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Explanation (only in review mode) */}
        {mode === 'review' && (
          <div className="explanation">
            <h4>
              {userAnswer === question.correctIndex ? '✅ Correto!' : '❌ Incorreto'}
            </h4>
            <Markdown>{question.explanation}</Markdown>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="quiz-navigation">
        <button onClick={prevQuestion} disabled={currentQuestion === 0}>
          ← Anterior
        </button>
        {currentQuestion === artifact.content.questions.length - 1 ? (
          <button onClick={handleSubmit} disabled={mode === 'review'}>
            Finalizar
          </button>
        ) : (
          <button onClick={nextQuestion}>
            Próxima →
          </button>
        )}
      </div>

      {/* Results Modal */}
      {showResults && (
        <ResultsModal score={score} totalQuestions={artifact.content.questions.length} />
      )}
    </div>
  );
}
```

### Features Especiais
- **Timer** com alarme visual
- **Revisão** questão por questão após finalizar
- **Estatísticas** detalhadas por tópico
- **Histórico** de tentativas
- **Modo Prática** (vê resposta imediatamente)

---

## Resumo de Integrações AI

| Artefato | AI Provider Principal | Fallback | Justificativa |
|----------|----------------------|----------|---------------|
| Pesquisas | Perplexity Sonar | GPT-4o | Citações reais, web access |
| Flashcards | GPT-4o | Claude 3.5 | Estruturação, didática |
| Laudos | GPT-4o | Claude 3.5 | Formatação, precisão |
| Resumos | Gemini 1.5 Pro | GPT-4 Turbo | Contexto longo |
| Mapas | Claude 3.5 Sonnet | GPT-4o | Hierarquia, relações |
| Simulados | GPT-4o | Claude 3.5 | Questões, distratores |

---

**Versão**: 1.0  
**Última atualização**: Janeiro 2026
