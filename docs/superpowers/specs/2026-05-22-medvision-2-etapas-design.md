# MedVision — fluxo em 2 etapas, personalização e MedVision IA 0.1

**Data:** 2026-05-22  
**Status:** Aprovado (brainstorm)  
**Substitui parcialmente:** [`2026-04-22-med-vision-ux-design.md`](./2026-04-22-med-vision-ux-design.md) (indicador de 4 passos e seletor de modelos)

## Objetivo

Simplificar a jornada do MedVision para **duas etapas visíveis**, ampliar opções de personalização do laudo, **fixar** o motor exibido como **MedVision IA 0.1** (sem escolha nem comparação de modelos), e **padronizar** a redução de tamanho da imagem antes do envio ao modelo (~1024px / ~1–1,5 MB).

## Decisões do produto (brainstorm)

| Tema | Decisão |
|------|---------|
| Estrutura do fluxo | **B** — Etapa 1: imagem + personalização; Etapa 2: revisão + recorte + Analisar |
| Personalização | **A–E** — modalidade, profundidade, foco clínico, contexto paciente (idade/sexo), toggles de seções |
| Recorte | **B** — somente na Etapa 2, opcional antes de Analisar |
| Modelos | **A** — remover comparação e seletor; backend usa cadeia padrão |
| Compressão | **A** — equilibrada (~1024px, alinhada ao `normalizeVisionImageDataUrl`) |
| Avisos de qualidade | **A** — banner na Etapa 1 após upload, não bloqueante |
| Abordagem técnica | Componentes por etapa (**2 + 3**) com acordeão “Mais opções” |

## Requisitos funcionais

### RF1 — Wizard de 2 passos

1. Indicador linear com **dois** passos: **Personalizar** → **Revisar e analisar**.
2. Estados do assistente:
   - `CONFIGURE` — Etapa 1 (upload + formulário).
   - `REVIEW` — Etapa 2 (preview, recorte, resumo, CTA).
   - `ANALYZING`, `RESULT`, `ERROR` — inalterados em propósito.
3. Remover do fluxo principal os passos `DESCRIBE`, `CROP`, `CONFIRM` e o estado `VALIDATING` como tela dedicada.

### RF2 — Etapa 1 (Personalizar)

1. **Upload** — dropzone existente; ao aceitar arquivo, comprimir no cliente (ver RF6) e validar qualidade.
2. **Avisos de qualidade** — exibir banner/lista após upload; `canProceed` permanece sempre `true`.
3. **MedVision IA 0.1** — badge somente leitura (sem dropdown); texto consistente em toda a jornada.
4. **Especialidade** — grid atual (`VISION_SPECIALTY_ORDER` / `VISION_SPECIALTIES`).
5. **Modalidade (A)** — select: RX, TC, RM, US, Outro → campo `modality`.
6. **Profundidade do laudo (B)** — radio: `resumido` | `completo` → `reportDepth`.
7. **Foco clínico (C)** — chips sugeridos por especialidade (constantes) + entrada livre (tags) → `focusTags: string[]`.
8. **Contexto clínico** — textarea opcional, máx. 500 caracteres → `clinicalContext`.
9. **Acordeão “Mais opções”**:
   - **Paciente (D)** — idade (número opcional), sexo (opcional: masculino / feminino / outro / não informado). **Proibido** nome, documento ou identificadores.
   - **Seções do laudo (E)** — toggles com defaults:
     - Achados: **ligado**
     - Impressão diagnóstica: **ligado**
     - Recomendações: **ligado**
     - Comparativo com exame anterior: **desligado**
   - Payload → `reportSections: { findings, impression, recommendations, comparison }`.
10. CTA **“Revisar análise”** → `REVIEW` (exige imagem carregada).

### RF3 — Etapa 2 (Revisar e analisar)

1. **Coluna imagem** — preview; ferramenta de recorte (`ReactCrop` + zoom) opcional; ações “Usar imagem inteira” e “Confirmar recorte”.
2. Após recorte confirmado, atualizar `image` em memória e **recomprimir** (RF6).
3. **Coluna resumo** — card somente leitura com todos os campos da Etapa 1 + linha fixa **MedVision IA 0.1**.
4. Exibir opcionalmente tamanho estimado do payload (ex.: “~890 KB”) derivado do data URL, sem controle manual de qualidade.
5. CTAs: **Voltar** → `CONFIGURE`; **Analisar agora** → `ANALYZING` → API.

### RF4 — Remoção de modelos e comparação

1. Remover `ModelSelector`, estado `analysisMode`, `compareModelA/B`, `startCompareAnalysis`, UI e resultado em modo comparar.
2. Cliente **não envia** `model` no body de `/api/vision/analyze`.
3. API ignora `model` se presente (compatibilidade temporária) e usa `buildVisionModelChain()` sem override do cliente.
4. Resposta pode manter `modelId` interno para logs; UI exibe apenas **MedVision IA 0.1**.

### RF5 — Prompt e pipeline

1. Estender body da API com campos opcionais validados (Zod no route ou helper dedicado).
2. Injetar personalização no contexto do prompt (`lib/vision/prompts.ts` e/ou `pipeline.ts`):
   - Modalidade e profundidade orientam tom e extensão.
   - `focusTags` e `clinicalContext` reforçam hipótese.
   - `patientAge` / `patientSex` apenas como contexto epidemiológico (sem identificação).
   - Seções desligadas instruem o modelo a omitir blocos correspondentes no JSON/texto.
3. **Não alterar** o schema JSON de saída (`VisionAnalysis`); apenas conteúdo e ênfase.

### RF6 — Compressão de imagem

| Momento | Onde | Alvo |
|---------|------|------|
| Após upload | Cliente `compressImageForAnalysis` | max edge **1024px**, JPEG quality **~0.85** |
| Após recorte na Etapa 2 | Mesma função no cliente | Idem |
| Antes do modelo | Servidor `normalizeVisionImageDataUrl` | max edge 1024, WebP ~1,2 MB target |
| Fallback | Servidor `compressToMax` | se payload > 2 MB |

Constante de produto em `lib/constants/vision.ts`: `MEDVISION_AI_LABEL = 'MedVision IA 0.1'`.

### RF7 — Erro, resultado e PDF

1. `VisionErrorRecovery`: remover ação “trocar modelo”; manter repetir análise, voltar ao recorte (`REVIEW`), nova imagem.
2. `AnalyzingStage` e resumo da Etapa 2: exibir **MedVision IA 0.1** (sem versão inventada além de 0.1).
3. PDF (`generate-vision-pdf.ts`): cabeçalho ou rodapé com **MedVision IA 0.1**; disclaimer em `VISION_CLINICAL_DISCLAIMER_PLAIN` mantido.

## Requisitos não funcionais

- Idioma pt-BR em labels e microcopy.
- Mobile: Etapa 2 empilha colunas (imagem acima, resumo abaixo).
- Acessibilidade: `AnalyzingStage` mantém `role="status"` e `aria-busy`.
- Build, lint e E2E atualizados sem regressão de auth/créditos.

## Arquitetura de componentes (recomendada)

| Módulo | Responsabilidade |
|--------|------------------|
| `vision-wizard-state.ts` | `VisionState` com `CONFIGURE` \| `REVIEW`; `WIZARD_STEPS` com 2 entradas; mapeamento e subtítulos |
| `med-vision-configure-step.tsx` | Etapa 1 completa |
| `med-vision-review-step.tsx` | Etapa 2 (recorte + resumo + CTAs) |
| `med-vision-config-form.tsx` | Campos A–E reutilizáveis |
| `med-vision-analysis-summary.tsx` | Card de resumo na Etapa 2 |
| `lib/constants/vision-analysis-options.ts` | Modalidades, profundidades, chips por especialidade, defaults de seções |
| `lib/types/vision-analysis-request.ts` | Tipo + schema Zod do payload estendido |
| `app/dashboard/odonto-vision/page.tsx` | Orquestração de estado, chamada API, resultado |

Remover ou deprecar `components/vision/model-selector.tsx` se sem outros consumidores.

## Contrato API (POST `/api/vision/analyze`)

**Body (campos novos em negrito):**

```ts
{
  image: string                    // obrigatório, data URL ou base64
  specialty?: VisionSpecialty
  clinicalContext?: string
  modality?: 'rx' | 'tc' | 'rm' | 'us' | 'outro'
  reportDepth?: 'resumido' | 'completo'
  focusTags?: string[]
  patientAge?: number              // 0–120, opcional
  patientSex?: 'masculino' | 'feminino' | 'outro' | 'nao_informado'
  reportSections?: {
    findings: boolean
    impression: boolean
    recommendations: boolean
    comparison: boolean
  }
  mode?: 'refine' | 'quick' | 'preview' | 'detailed'  // existente
  // model REMOVIDO do contrato público (ignorado se enviado)
}
```

## Critérios de aceite

- [ ] Usuário percorre apenas **2 passos** no indicador antes da análise.
- [ ] Não há seletor de modelo nem modo comparar na UI.
- [ ] Badge **MedVision IA 0.1** visível na Etapa 1, Etapa 2 e tela de análise.
- [ ] Todos os campos A–E persistem do passo 1 para o resumo do passo 2 e influenciam o prompt.
- [ ] Recorte opcional só na Etapa 2; imagem recomprimida após recorte.
- [ ] Upload comprime para ~1024px no cliente; servidor normaliza sem aumentar payload.
- [ ] Avisos de qualidade aparecem na Etapa 1 e não impedem avançar.
- [ ] Erro de análise não oferece “trocar modelo”.
- [ ] `tests-e2e/odonto-vision.spec.ts` reflete o fluxo de 2 etapas.
- [ ] `npm run lint` e `npm run build` passam.

## Fora de escopo

- Slider de compressão configurável pelo usuário.
- Comparar dois modelos (removido).
- Extração completa do painel de resultado (RESULT) em subcomponentes.
- Persistir preferências de personalização no perfil do usuário (fase futura).
- Métricas de produto (tempo por etapa).

## Migração e compatibilidade

- Links/bookmarks não dependem de passo antigo; estado é só em memória React.
- Testes unitários que referenciam `WIZARD_STEPS` de 4 itens devem ser atualizados.
- `tests/vision-model-chain.test.ts` permanece para cadeia interna; sem UI de override.

## Revisão do documento (self-review)

- Sem placeholders TBD: defaults de seções e modalidades definidos acima.
- Consistente com brainstorm (B, A–E, recorte na 2, remover compare, compressão A, qualidade A).
- Escopo único para um plano de implementação; não inclui redesign do painel RESULT.
- Ambiguidade resolvida: chips de foco vêm de constantes por `specialty` com fallback em `geral`.
