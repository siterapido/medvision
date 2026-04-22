# Med Vision — especificação UI/UX (jornada analisar imagem)

**Data:** 2026-04-22  
**Origem:** brainstorm aprovado (polimento A + modularização parcial B + progressive disclosure).

## Objetivo

Melhorar clareza de estado, recuperação de erro, carga cognitiva, aviso clínico/legal e manutenibilidade da tela [`app/dashboard/odonto-vision/page.tsx`](../../app/dashboard/odonto-vision/page.tsx) sem alterar o contrato da API [`app/api/vision/analyze/route.ts`](../../app/api/vision/analyze/route.ts).

## Requisitos funcionais

1. **Indicador de passos** — Cinco passos visíveis (Imagem → … → Confirmar). Em `RESULT`, todos os passos aparecem concluídos. Em `ANALYZING`, o passo ativo permanece “Confirmar”, com subtítulo explicando tempo estimado.
2. **Validação de qualidade** — O estado `VALIDATING` exibe o mesmo indicador e subtítulo “Verificando qualidade…”.
3. **Erro de análise** — Em `ERROR`, exibir banner e ações: tentar novamente (volta a `CONFIRM` se ainda houver imagem em memória), trocar modelo (`MODELS`), voltar ao recorte (`CROP`), nova imagem (`reset`).
4. **Análise em andamento** — Tela dedicada com `role="status"`, `aria-busy="true"`, microcopy honesta (sem versão inventada de motor) e dica de até ~2 minutos.
5. **Aviso clínico** — Bloco visível nos resultados (modo único e comparar) e o **mesmo texto** no PDF gerado por [`lib/utils/generate-vision-pdf.ts`](../../lib/utils/generate-vision-pdf.ts), com fonte única em [`lib/constants/vision.ts`](../../lib/constants/vision.ts) (`VISION_CLINICAL_DISCLAIMER_PLAIN`).
6. **Modelos** — Seleção principal de um modelo sempre visível; comparação entre dois modelos em seção recolhível (“avançado”).
7. **Ferramentas sobre a imagem (desktop)** — Barra de ícones opcionalmente oculta por padrão; botão “Ferramentas da imagem” expande; menu mobile inalterado.

## Requisitos não funcionais

- Tema e tipografia alinhados ao design system do projeto (Odonto GPT / Med Vision).
- Build e lint sem regressões nas rotas existentes.

## Critérios de aceite

- [x] Usuário vê subtítulo de fase durante `ANALYZING` e `VALIDATING`.
- [x] Após falha na API, usuário pode repetir análise ou ajustar modelo/recorte sem perder contexto (enquanto o estado React mantém `image`).
- [x] PDF inclui o aviso de uso assistido abaixo do cabeçalho.
- [x] Comparação de modelos não ocupa o fluxo principal até o usuário expandir a seção.
- [x] Em desktop, no resultado, a barra de ferramentas da imagem pode ficar colapsada até o usuário expandir.

## Componentes extraídos

| Módulo | Responsabilidade |
|--------|------------------|
| [`components/vision/med-vision/vision-wizard-state.ts`](../../components/vision/med-vision/vision-wizard-state.ts) | Tipo `VisionState`, mapeamento passo/subtítulo |
| [`components/vision/med-vision/step-indicator.tsx`](../../components/vision/med-vision/step-indicator.tsx) | `MedVisionStepIndicator` |
| [`components/vision/med-vision/analyzing-stage.tsx`](../../components/vision/med-vision/analyzing-stage.tsx) | Estado “processando” |
| [`components/vision/med-vision/clinical-disclaimer.tsx`](../../components/vision/med-vision/clinical-disclaimer.tsx) | `VisionClinicalDisclaimer` |
| [`components/vision/med-vision/vision-error-recovery.tsx`](../../components/vision/med-vision/vision-error-recovery.tsx) | Banner + ações de erro |

## Fora de escopo (fase seguinte)

- Extração completa da página em `VisionUploadPanel` / `VisionResultPanel` (arquivo ainda monolítico).
- Redesenho profundo de jornada (fusão de passos).
- Métricas de produto (tempo médio em `ANALYZING`).

## Revisão do documento

- Texto do aviso único em `lib/constants/vision.ts`.
- Sem contradição com [`AGENTS.md`](../../AGENTS.md) (testes: E2E existente em `tests-e2e/odonto-vision.spec.ts` continua válido).
