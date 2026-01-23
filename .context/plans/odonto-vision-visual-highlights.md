# Plano de Implementação: Destaques Visuais no Odonto Vision

Este plano foca na implementação do sistema técnico para detectar e destacar anomalias em imagens odontológicas usando IA Vision, substituindo mocks por dados reais.

## 1. Arquitetura de Dados

### Interfaces (TypeScript)
Criar em `lib/types/vision.ts`:
```typescript
export interface BoundingBox {
  ymin: number; // 0-100%
  xmin: number; // 0-100%
  ymax: number; // 0-100%
  xmax: number; // 0-100%
}

export interface Detection {
  id: string;
  label: string; // ex: "Cárie", "Perda Óssea"
  confidence: number;
  box: BoundingBox;
  color: 'red' | 'amber' | 'blue' | 'green';
  description?: string;
}

export interface VisionAnalysisResult {
  imageId: string;
  detections: Detection[];
  findings: FindingItem[]; // Lista sumarizada para sidebar
  clinicalAssessment: string; // Texto corrido
  recommendations: string[];
}
```

## 2. API Backend (`app/api/vision/analyze/route.ts`)

### Fluxo
1. Receber POST com `{ image: base64String }`.
2. Validar tamanho e formato.
3. Chamar `openrouter.chat.completion` usando `anthropic/claude-3.5-sonnet` (ou Gemini 2.0 Flash).
4. **Prompt de Sistema**:
   "Você é um especialista em radiologia odontológica. Analise a imagem fornecida. Identifique patologias (cáries, perdas ósseas, lesões periapiacais, restaurações).
   Retorne APENAS um JSON válido.
   Formato esperado:
   {
     "detections": [{ "label": "...", "box": [ymin, xmin, ymax, xmax], "severity": "critical|moderate|normal" }],
     "assessment": "...",
     "recommendations": ["..."]
   }
   As coordenadas (box) devem ser normalizadas de 0 a 100."
5. Processar resposta JSON e retornar ao cliente.

## 3. Componentes Frontend

### `components/vision/ImageOverlay.tsx`
- Recebe `imageSrc` e `detections[]`.
- Renderiza a imagem.
- Renderiza um SVG absoluto por cima.
- Para cada detecção, desenha um `<rect>` e um `<text>` (ou componente Badge) posicionado em `%`.

### Atualização de `app/dashboard/odonto-vision/page.tsx`
- Substituir o timeout simulado por `fetch('/api/vision/analyze')`.
- Gerenciar estados de erro e loading real.
- Passar dados reais para `ImageOverlay` e para o painel de laudo.

## 4. Prompt Engineering (Detalhes)
- Garantir que o modelo saiba a diferença entre RX Periapical e Panorâmica.
- Calibrar Cores: mapear "severity" para cores (Critical -> Red).

## 5. Passos de Execução
1. Criar tipos.
2. Criar API Endpoint.
3. Criar Componente de Overlay.
4. Integrar na Página Principal.
