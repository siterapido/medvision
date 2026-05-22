# MedVision 2 Etapas — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplificar o MedVision para duas etapas (Personalizar → Revisar), ampliar personalização A–E, fixar **MedVision IA 0.1** na UI e padronizar compressão ~1024px antes do modelo.

**Architecture:** Extrair Etapa 1 e Etapa 2 em componentes em `components/vision/med-vision/`, centralizar opções em `lib/constants/vision-analysis-options.ts`, validar payload estendido na API e injetar contexto composto no pipeline via `buildVisionUserContext()`. A página `odonto-vision/page.tsx` orquestra estado e resultado; remove comparação de modelos.

**Tech Stack:** Next.js 16 App Router, React 19, Zod, Tailwind 4, ReactCrop, sharp (servidor), canvas (cliente), Playwright E2E.

**Spec:** [`docs/superpowers/specs/2026-05-22-medvision-2-etapas-design.md`](../specs/2026-05-22-medvision-2-etapas-design.md)

---

## Mapa de arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `lib/constants/vision-analysis-options.ts` |
| Criar | `lib/types/vision-analysis-request.ts` |
| Criar | `lib/vision/build-analysis-context.ts` |
| Criar | `components/vision/med-vision/med-vision-ai-badge.tsx` |
| Criar | `components/vision/med-vision/med-vision-config-form.tsx` |
| Criar | `components/vision/med-vision/med-vision-analysis-summary.tsx` |
| Criar | `components/vision/med-vision/med-vision-configure-step.tsx` |
| Criar | `components/vision/med-vision/med-vision-review-step.tsx` |
| Criar | `tests/vision-analysis-request.test.ts` |
| Criar | `tests/vision-wizard-state.test.ts` |
| Modificar | `lib/constants/vision.ts` |
| Modificar | `lib/utils/image-quality-validator.ts` |
| Modificar | `components/vision/med-vision/vision-wizard-state.ts` |
| Modificar | `components/vision/med-vision/step-indicator.tsx` |
| Modificar | `components/vision/med-vision/analyzing-stage.tsx` |
| Modificar | `components/vision/med-vision/vision-error-recovery.tsx` |
| Modificar | `components/vision/med-vision/index.ts` |
| Modificar | `lib/vision/pipeline.ts` |
| Modificar | `app/api/vision/analyze/route.ts` |
| Modificar | `lib/utils/generate-vision-pdf.ts` |
| Modificar | `app/dashboard/odonto-vision/page.tsx` |
| Modificar | `tests-e2e/odonto-vision.spec.ts` |
| Remover | `components/vision/model-selector.tsx` (se sem outros imports) |

---

### Task 1: Constantes, tipos e defaults

**Files:**
- Create: `lib/constants/vision-analysis-options.ts`
- Create: `lib/types/vision-analysis-request.ts`
- Modify: `lib/constants/vision.ts`

- [ ] **Step 1: Adicionar label do produto em `vision.ts`**

```ts
export const MEDVISION_AI_LABEL = 'MedVision IA 0.1' as const
```

- [ ] **Step 2: Criar `vision-analysis-options.ts`**

```ts
import type { VisionSpecialty } from '@/lib/constants/vision-specialties'

export const VISION_MODALITIES = [
  { id: 'rx', label: 'Radiografia (RX)' },
  { id: 'tc', label: 'Tomografia (TC)' },
  { id: 'rm', label: 'Ressonância (RM)' },
  { id: 'us', label: 'Ultrassom (US)' },
  { id: 'outro', label: 'Outro' },
] as const

export type VisionModality = (typeof VISION_MODALITIES)[number]['id']

export const VISION_REPORT_DEPTHS = [
  { id: 'resumido', label: 'Resumido', description: 'Laudo objetivo, foco nos achados principais.' },
  { id: 'completo', label: 'Completo', description: 'Laudo detalhado com diferenciais e recomendações amplas.' },
] as const

export type VisionReportDepth = (typeof VISION_REPORT_DEPTHS)[number]['id']

export const DEFAULT_REPORT_SECTIONS = {
  findings: true,
  impression: true,
  recommendations: true,
  comparison: false,
} as const

export type VisionReportSections = typeof DEFAULT_REPORT_SECTIONS

export const VISION_FOCUS_CHIPS_BY_SPECIALTY: Partial<Record<VisionSpecialty, string[]>> = {
  torax: ['Suspeita de pneumonia', 'Derrame pleural', 'Pneumotórax', 'Nódulo pulmonar'],
  abdome: ['Dor abdominal', 'Obstrução intestinal', 'Colelitíase'],
  cranio: ['Trauma craniano', 'Sinusite', 'Fratura facial'],
  coluna: ['Hérnia discal', 'Estenose', 'Fratura vertebral'],
  pelve: ['Fratura de quadril', 'Artrose'],
  membro_superior: ['Fratura', 'Luxação'],
  membro_inferior: ['Fratura de tíbia/fíbula', 'Artrose de joelho'],
  geral: ['Achado incidental', 'Controle pós-operatório'],
}

export function getFocusChipsForSpecialty(specialty: VisionSpecialty): string[] {
  return VISION_FOCUS_CHIPS_BY_SPECIALTY[specialty] ?? VISION_FOCUS_CHIPS_BY_SPECIALTY.geral ?? []
}
```

- [ ] **Step 3: Criar tipos + Zod em `vision-analysis-request.ts`**

```ts
import { z } from 'zod'
import { VISION_SPECIALTY_ORDER } from '@/lib/constants/vision-specialties'

const specialtyEnum = z.enum(VISION_SPECIALTY_ORDER as [string, ...string[]])

export const visionAnalysisRequestSchema = z.object({
  image: z.string().min(32),
  specialty: specialtyEnum.optional(),
  clinicalContext: z.string().max(500).optional(),
  modality: z.enum(['rx', 'tc', 'rm', 'us', 'outro']).optional(),
  reportDepth: z.enum(['resumido', 'completo']).optional(),
  focusTags: z.array(z.string().min(1).max(80)).max(12).optional(),
  patientAge: z.number().int().min(0).max(120).optional(),
  patientSex: z.enum(['masculino', 'feminino', 'outro', 'nao_informado']).optional(),
  reportSections: z
    .object({
      findings: z.boolean(),
      impression: z.boolean(),
      recommendations: z.boolean(),
      comparison: z.boolean(),
    })
    .optional(),
  mode: z.enum(['refine', 'quick', 'preview', 'detailed']).optional(),
  originalAnalysisSummary: z.string().optional(),
})

export type VisionAnalysisRequest = z.infer<typeof visionAnalysisRequestSchema>

export type MedVisionAnalysisConfig = {
  specialty: import('@/lib/constants/vision-specialties').VisionSpecialty
  clinicalContext: string
  modality: import('@/lib/constants/vision-analysis-options').VisionModality
  reportDepth: import('@/lib/constants/vision-analysis-options').VisionReportDepth
  focusTags: string[]
  patientAge?: number
  patientSex?: import('@/lib/constants/vision-analysis-options').VisionPatientSex
  reportSections: import('@/lib/constants/vision-analysis-options').VisionReportSections
}

// VisionPatientSex em vision-analysis-options:
// export type VisionPatientSex = 'masculino' | 'feminino' | 'outro' | 'nao_informado'
```

- [ ] **Step 4: Commit**

```bash
git add lib/constants/vision.ts lib/constants/vision-analysis-options.ts lib/types/vision-analysis-request.ts
git commit -m "feat(vision): constantes e schema do payload de personalização"
```

---

### Task 2: Contexto composto para o pipeline

**Files:**
- Create: `lib/vision/build-analysis-context.ts`
- Create: `tests/vision-analysis-request.test.ts`

- [ ] **Step 1: Teste do builder**

```ts
import { describe, it, expect } from 'node:test'
import { buildVisionUserContext } from '@/lib/vision/build-analysis-context'

describe('buildVisionUserContext', () => {
  it('monta blocos de modalidade, profundidade e seções desligadas', () => {
    const text = buildVisionUserContext({
      modality: 'tc',
      reportDepth: 'resumido',
      focusTags: ['Suspeita de pneumonia'],
      clinicalContext: 'Tosse há 3 semanas',
      patientAge: 45,
      patientSex: 'masculino',
      reportSections: { findings: true, impression: true, recommendations: false, comparison: false },
    })
    expect(text).toContain('MODALIDADE: TC')
    expect(text).toContain('PROFUNDIDADE: resumido')
    expect(text).toContain('Suspeita de pneumonia')
    expect(text).toContain('NÃO inclua seção de recomendações')
    expect(text).toContain('45 anos')
  })
})
```

- [ ] **Step 2: Implementar `build-analysis-context.ts`**

```ts
import type { MedVisionAnalysisConfig } from '@/lib/types/vision-analysis-request'
import { sanitizeClinicalContext } from '@/lib/vision/json-utils'
import { VISION_MODALITIES, VISION_REPORT_DEPTHS } from '@/lib/constants/vision-analysis-options'

export function buildVisionUserContext(config: Partial<MedVisionAnalysisConfig>): string | null {
  const parts: string[] = []

  if (config.modality) {
    const label = VISION_MODALITIES.find((m) => m.id === config.modality)?.label ?? config.modality
    parts.push(`MODALIDADE DO EXAME: ${label.toUpperCase()}`)
  }
  if (config.reportDepth) {
    const label = VISION_REPORT_DEPTHS.find((d) => d.id === config.reportDepth)?.label ?? config.reportDepth
    parts.push(`PROFUNDIDADE DO LAUDO: ${label} (${config.reportDepth})`)
  }
  if (config.focusTags?.length) {
    parts.push(`FOCO CLÍNICO (tags): ${config.focusTags.join('; ')}`)
  }
  if (config.patientAge != null) {
    parts.push(`CONTEXTO DEMOGRÁFICO: ${config.patientAge} anos (sem identificação do paciente).`)
  }
  if (config.patientSex && config.patientSex !== 'nao_informado') {
    parts.push(`SEXO PARA CONTEXTO EPIDEMIOLÓGICO: ${config.patientSex}`)
  }
  const sections = config.reportSections
  if (sections) {
    if (!sections.findings) parts.push('NÃO inclua seção detalhada de achados.')
    if (!sections.impression) parts.push('NÃO inclua impressão diagnóstica.')
    if (!sections.recommendations) parts.push('NÃO inclua seção de recomendações.')
    if (!sections.comparison) parts.push('NÃO inclua comparativo com exame anterior.')
  }
  const ctx = config.clinicalContext?.trim()
  if (ctx) {
    parts.push(`CONTEXTO CLÍNICO DO PROFISSIONAL:\n${sanitizeClinicalContext(ctx)}`)
  }

  return parts.length ? parts.join('\n\n') : null
}
```

- [ ] **Step 3: Rodar teste**

```bash
npm run test -- tests/vision-analysis-request.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add lib/vision/build-analysis-context.ts tests/vision-analysis-request.test.ts
git commit -m "feat(vision): builder de contexto para prompts personalizados"
```

---

### Task 3: API e pipeline

**Files:**
- Modify: `app/api/vision/analyze/route.ts`
- Modify: `lib/vision/pipeline.ts`

- [ ] **Step 1: Validar body com Zod na route**

Substituir destructuring manual por parse parcial; **não** passar `model` para `buildVisionModelChain()`:

```ts
import { visionAnalysisRequestSchema } from '@/lib/types/vision-analysis-request'
import { buildVisionUserContext } from '@/lib/vision/build-analysis-context'

// após auth:
const parsed = visionAnalysisRequestSchema.safeParse(await req.json())
if (!parsed.success) {
  return new Response(JSON.stringify({ error: 'Payload inválido', details: parsed.error.flatten() }), { status: 400 })
}
const {
  image,
  clinicalContext,
  specialty,
  modality,
  reportDepth,
  focusTags,
  patientAge,
  patientSex,
  reportSections,
  mode,
  originalAnalysisSummary,
} = parsed.data

const userContext = buildVisionUserContext({
  clinicalContext,
  modality,
  reportDepth,
  focusTags,
  patientAge,
  patientSex,
  reportSections,
})

const modelsToUse = buildVisionModelChain() // sem argumento do cliente
```

- [ ] **Step 2: Passar `userContext` para funções do pipeline**

Alterar assinaturas de `callVisionAI`, `callVisionDetection`, `callTwoStageVisionAnalysis`, `callVisionRefinement` para aceitar `userContext?: string | null` e usar no lugar de (ou mesclado com) `clinicalContext` nos `userTextParts`:

```ts
const contextBlock = userContext ?? (safeContext ? `CONTEXTO CLÍNICO...\n${safeContext}` : null)
if (contextBlock) {
  userTextParts.push({ type: 'text', text: contextBlock })
}
```

Manter `clinicalContext` no log como `clinicalContextChars: userContext?.length ?? 0`.

- [ ] **Step 3: Commit**

```bash
git add app/api/vision/analyze/route.ts lib/vision/pipeline.ts
git commit -m "feat(vision): API aceita personalização A–E e ignora modelo do cliente"
```

---

### Task 4: Wizard de 2 passos (estado + indicador)

**Files:**
- Modify: `components/vision/med-vision/vision-wizard-state.ts`
- Modify: `components/vision/med-vision/step-indicator.tsx`
- Create: `tests/vision-wizard-state.test.ts`

- [ ] **Step 1: Atualizar estados**

```ts
export type VisionState =
  | 'UPLOAD'      // legado: tratar como CONFIGURE na UI
  | 'CONFIGURE'
  | 'REVIEW'
  | 'ANALYZING'
  | 'RESULT'
  | 'ERROR'

export const WIZARD_STEPS = [
  { key: 'CONFIGURE', label: 'Personalizar' },
  { key: 'REVIEW', label: 'Revisar e analisar' },
] as const

export function mapVisionStateToWizardStep(state: VisionState): 'CONFIGURE' | 'REVIEW' {
  switch (state) {
    case 'REVIEW':
    case 'ANALYZING':
    case 'RESULT':
    case 'ERROR':
      return 'REVIEW'
    default:
      return 'CONFIGURE'
  }
}
```

Remover referências a `DESCRIBE`, `CROP`, `CONFIRM`, `VALIDATING`.

- [ ] **Step 2: Teste**

```ts
import { describe, it, expect } from 'node:test'
import { WIZARD_STEPS, mapVisionStateToWizardStep } from '@/components/vision/med-vision/vision-wizard-state'

describe('vision-wizard-state', () => {
  it('tem exatamente 2 passos', () => {
    expect(WIZARD_STEPS).toHaveLength(2)
  })
  it('ANALYZING mapeia para REVIEW no indicador', () => {
    expect(mapVisionStateToWizardStep('ANALYZING')).toBe('REVIEW')
  })
})
```

- [ ] **Step 3: Ajustar `step-indicator.tsx`** para usar `WIZARD_STEPS` de 2 itens e marcar concluído quando `state === 'RESULT'`.

- [ ] **Step 4: Commit**

```bash
git add components/vision/med-vision/vision-wizard-state.ts components/vision/med-vision/step-indicator.tsx tests/vision-wizard-state.test.ts
git commit -m "refactor(vision): wizard com 2 passos Personalizar e Revisar"
```

---

### Task 5: Componentes de UI (badge, form, summary)

**Files:**
- Create: `components/vision/med-vision/med-vision-ai-badge.tsx`
- Create: `components/vision/med-vision/med-vision-config-form.tsx`
- Create: `components/vision/med-vision/med-vision-analysis-summary.tsx`
- Modify: `components/vision/med-vision/index.ts`

- [ ] **Step 1: `MedVisionAiBadge`** — pill com `MEDVISION_AI_LABEL` + ícone Sparkles, sem interação.

- [ ] **Step 2: `MedVisionConfigForm`** — props controladas:

```ts
export type MedVisionConfigFormProps = {
  config: MedVisionAnalysisConfig
  onChange: (patch: Partial<MedVisionAnalysisConfig>) => void
  qualityWarnings?: ImageQualityWarning[]
}
```

Incluir: select modalidade, grid especialidade, radio profundidade, chips foco (toggle multi + input para tag custom), textarea contexto, `Collapsible` “Mais opções” com idade/sexo e 4 switches de seção.

- [ ] **Step 3: `MedVisionAnalysisSummary`** — card read-only com labels pt-BR para todos os campos + `MedVisionAiBadge` + `formatPayloadSize(imageDataUrl)` helper local.

- [ ] **Step 4: Exportar em `index.ts`**

- [ ] **Step 5: Commit**

```bash
git add components/vision/med-vision/med-vision-*.tsx components/vision/med-vision/index.ts
git commit -m "feat(vision): formulário de personalização e resumo da análise"
```

---

### Task 6: Etapas CONFIGURE e REVIEW

**Files:**
- Create: `components/vision/med-vision/med-vision-configure-step.tsx`
- Create: `components/vision/med-vision/med-vision-review-step.tsx`

- [ ] **Step 1: `MedVisionConfigureStep`**

- Dropzone (reutilizar lógica via props: `onDrop`, `isDragActive`)
- Após imagem: preview + banner qualidade (`qualityResult.warnings`)
- `MedVisionConfigForm`
- Footer: Voltar (limpa imagem → `UPLOAD`) | **Revisar análise** (disabled sem `originalImage`)

- [ ] **Step 2: `MedVisionReviewStep`**

Extrair UI de recorte de `page.tsx` (ReactCrop, zoom, skip, confirm) para props:

```ts
export type MedVisionReviewStepProps = {
  image: string
  originalImage: string
  config: MedVisionAnalysisConfig
  onBack: () => void
  onAnalyze: (finalImage: string) => void
  onImageChange: (dataUrl: string) => void
}
```

Após `handleCropConfirm` / skip: chamar `compressImageForAnalysis(dataUrl, 1024, 0.85)` antes de `onImageChange`.

Layout: `grid md:grid-cols-2` — esquerda recorte, direita `MedVisionAnalysisSummary`.

CTA: **Analisar agora** → `onAnalyze(image)`.

- [ ] **Step 3: Commit**

```bash
git add components/vision/med-vision/med-vision-configure-step.tsx components/vision/med-vision/med-vision-review-step.tsx
git commit -m "feat(vision): componentes das etapas Personalizar e Revisar"
```

---

### Task 7: Refatorar página principal

**Files:**
- Modify: `app/dashboard/odonto-vision/page.tsx`
- Delete: `components/vision/model-selector.tsx` (após grep sem outros usos)

- [ ] **Step 1: Estado unificado**

```ts
const defaultConfig: MedVisionAnalysisConfig = {
  specialty: 'geral',
  clinicalContext: '',
  modality: 'rx',
  reportDepth: 'completo',
  focusTags: [],
  reportSections: { ...DEFAULT_REPORT_SECTIONS },
}
const [config, setConfig] = useState<MedVisionAnalysisConfig>(defaultConfig)
```

Remover: `analysisMode`, `selectedModel`, `compareModelA/B`, `comparisonResult`, imports `ModelSelector`, `VISION_MODELS_LIST`.

- [ ] **Step 2: Fluxo de estados**

- `onDrop` → compress 1024 → `validateImageQuality` → `setState('CONFIGURE')`
- `CONFIGURE` → render `MedVisionConfigureStep`
- “Revisar análise” → `setState('REVIEW')`
- `REVIEW` → `MedVisionReviewStep` → `startAnalysis(image)` (único caminho)
- Remover blocos JSX `DESCRIBE`, `CROP`, `CONFIRM`, `VALIDATING`, `result-compare`

- [ ] **Step 3: `startAnalysis` simplificado**

```ts
const startAnalysis = async (imageData: string) => {
  setState('ANALYZING')
  const body = {
    image: imageData,
    specialty: config.specialty,
    clinicalContext: config.clinicalContext || undefined,
    modality: config.modality,
    reportDepth: config.reportDepth,
    focusTags: config.focusTags.length ? config.focusTags : undefined,
    patientAge: config.patientAge,
    patientSex: config.patientSex,
    reportSections: config.reportSections,
  }
  const response = await fetch('/api/vision/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  // ... tratamento existente de erro/resultado
}
```

- [ ] **Step 4: Erro → `onRetryFromConfirm` vira `() => setState('REVIEW')`**, `onBackToCrop` → `setState('REVIEW')`, remover `onChangeModel`.

- [ ] **Step 5: Deletar `model-selector.tsx` e limpar imports**

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/odonto-vision/page.tsx
git rm -f components/vision/model-selector.tsx 2>/dev/null || true
git commit -m "refactor(vision): fluxo em 2 etapas e remoção de seleção de modelos"
```

---

### Task 8: Compressão cliente, analyzing, erro e PDF

**Files:**
- Modify: `lib/utils/image-quality-validator.ts`
- Modify: `components/vision/med-vision/analyzing-stage.tsx`
- Modify: `components/vision/med-vision/vision-error-recovery.tsx`
- Modify: `lib/utils/generate-vision-pdf.ts`

- [ ] **Step 1: Default `compressImageForAnalysis` → 1024 / 0.85**

Alterar assinatura default: `maxDimension = 1024, quality = 0.85`. Atualizar chamadas em `page.tsx` / review step que ainda usem 1280.

- [ ] **Step 2: `AnalyzingStage`**

- Remover prop `isCompare`
- Texto: `Analisando com ${MEDVISION_AI_LABEL}…`
- Exibir badge do motor

- [ ] **Step 3: `VisionErrorRecovery`**

- Remover prop `onChangeModel` e botão “Trocar modelo”
- Renomear `onRetryFromConfirm` → `onRetry` (opcional, breaking interno)
- `VisionErrorBanner`: remover “tente outro modelo” → “tente uma imagem menor ou contate o suporte”

- [ ] **Step 4: PDF** — linha `Motor: MedVision IA 0.1` no cabeçalho via `MEDVISION_AI_LABEL`

- [ ] **Step 5: Commit**

```bash
git add lib/utils/image-quality-validator.ts components/vision/med-vision/analyzing-stage.tsx components/vision/med-vision/vision-error-recovery.tsx lib/utils/generate-vision-pdf.ts
git commit -m "fix(vision): compressão 1024, copy MedVision IA 0.1 e erro sem trocar modelo"
```

---

### Task 9: Testes E2E e verificação final

**Files:**
- Modify: `tests-e2e/odonto-vision.spec.ts`

- [ ] **Step 1: Atualizar TC004 e TC001**

Fluxo novo:

```ts
await page.locator('input[type="file"]').setInputFiles(FIXTURE_JPG)
await expect(page.getByText(/Personalizar|Revisar análise/i).first()).toBeVisible()
await page.getByPlaceholder(/queixa principal|Suspeita/i).fill(marker)
await page.getByRole('button', { name: /Revisar análise/i }).click()
await expect(page.getByRole('heading', { name: /Revisar|recortar/i }).first()).toBeVisible()
await page.getByRole('button', { name: /Usar imagem inteira|Pular/i }).click()
await expect(page.getByText(marker)).toBeVisible()
await expect(page.getByText(/MedVision IA 0\.1/i)).toBeVisible()
```

TC001: `Revisar análise` → pular recorte → `Analisar agora` (ou `Analisar Agora` — padronizar label no código).

- [ ] **Step 2: Ajustar assert de modelId** (opcional)

Manter assert de `modelId` interno na API; UI não exibe nome OpenRouter.

- [ ] **Step 3: Verificação**

```bash
npm run test
npm run lint
npm run build
```

E2E smoke (sem API real):

```bash
npx playwright test tests-e2e/odonto-vision.spec.ts --grep "TC002|TC004|TC005|TC006"
```

- [ ] **Step 4: Commit + push**

```bash
git add tests-e2e/odonto-vision.spec.ts
git commit -m "test(e2e): fluxo MedVision em 2 etapas"
git push origin main
```

---

## Cobertura spec → tasks

| Requisito | Task |
|-----------|------|
| RF1 Wizard 2 passos | Task 4, 6, 7 |
| RF2 Etapa 1 A–E | Task 1, 5, 6 |
| RF3 Etapa 2 recorte + resumo | Task 6, 7 |
| RF4 Sem modelos/compare | Task 3, 7, 8 |
| RF5 Prompt personalizado | Task 2, 3 |
| RF6 Compressão 1024 | Task 6, 8 |
| RF7 Erro/PDF/Analyzing | Task 8 |

## Self-review do plano

- Sem TBD: defaults e labels definidos na Task 1.
- Tipos consistentes: `MedVisionAnalysisConfig` usado em form, summary, page e builder.
- Escopo único: não inclui refactor do painel RESULT.
- E2E cobre fluxo de 2 etapas e badge MedVision IA 0.1.
