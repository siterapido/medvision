---
title: Plano de implementação — Med Vision UX
status: completed
created: 2026-04-22
origin: docs/superpowers/specs/2026-04-22-med-vision-ux-design.md
---

# Plano de implementação — Med Vision UX

## Problema e escopo

A jornada Med Vision estava concentrada em um único arquivo de página muito grande, com indicador de passos desalinhado de estados intermediários (`ANALYZING`, `VALIDATING`, `ERROR`), erro pouco acionável e ferramentas avançadas sempre visíveis no desktop.

**Escopo entregue:** polimento de UX (A), extração inicial de módulos (B parcial), progressive disclosure em modelos e ferramentas da imagem, aviso clínico unificado (UI + PDF).

## Decisões

| Decisão | Motivo |
|---------|--------|
| Mapear `ANALYZING`/`CONFIRM` ao mesmo passo “Confirmar” | Evita salto visual no stepper durante a chamada à API. |
| Texto legal em `lib/constants/vision.ts` | PDF (server) e UI compartilham string sem importar apenas de componente client. |
| Comparação de modelos em `Collapsible` | Reduz carga cognitiva no passo “Modelos”. |
| Desktop: barra de ícones recolhida por padrão | Mobile mantém menu ⋮ já compacto. |

## Arquivos tocados

- `components/vision/med-vision/*` — novos módulos (stepper, análise, erro, disclaimer).
- `app/dashboard/odonto-vision/page.tsx` — integração, `imageToolsExpanded`, erro, resultados.
- `components/vision/model-selector.tsx` — modo comparar recolhível.
- `lib/constants/vision.ts` — `VISION_CLINICAL_DISCLAIMER_PLAIN`.
- `lib/utils/generate-vision-pdf.ts` — parágrafo de aviso após o cabeçalho.

## Cenários de teste

1. Fluxo feliz: upload → descrever → modelo → recorte → confirmar → resultado (indicador e aviso visíveis).
2. Erro simulado na API: estado `ERROR`, ações “Tentar novamente” / “Trocar modelo” / “Voltar ao recorte”.
3. PDF: exportar e verificar presença do aviso de uso assistido.
4. Modelos: painel “Comparar dois modelos” fechado por padrão; abrir e selecionar A/B.
5. Desktop resultado: “Ferramentas da imagem” colapsado; expandir e usar anotar/calor.

## Dependências e sequência

1. Constante de disclaimer e componentes de UI.  
2. Refator da página e seletor.  
3. PDF.  
4. `npm run build` e smoke manual / E2E opcional (`E2E_VISION_ANALYZE`).

## Riscos e follow-up

- **Página ainda grande:** próxima iteração pode extrair painéis por estado e hooks `useVisionAnalyze`.
- **Créditos / API:** fora deste plano; comportamento de `deductCredits` inalterado.

## Testes automatizados sugeridos (não bloqueantes)

- Teste de unidade para `mapVisionStateToWizardStep` / `getVisionPhaseSubtitle`.
- E2E: um clique em “Ferramentas da imagem” no resultado (desktop viewport).
