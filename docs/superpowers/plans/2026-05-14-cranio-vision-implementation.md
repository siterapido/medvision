# Especialista em Raio X da Cabeça (Crânio/Face) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `cranio` specialty to Med Vision for AI-powered analysis of skull and face radiographs.

**Architecture:** The `cranio` specialty is added to `lib/constants/vision-specialties.ts` — extend the `VisionSpecialty` union type, define 5 prompt constants (system, quick detection, detailed analysis, user instructions), and register in the `VISION_SPECIALTIES` record. The existing page and API iterate dynamically over this record, so no UI or backend changes are needed.

**Tech Stack:** TypeScript, Next.js, OpenRouter (vision model via existing API)

---

### Task 1: Add `cranio` to type union and insert prompt constants

**Files:**
- Modify: `lib/constants/vision-specialties.ts:1`

- [ ] **Step 1: Extend the `VisionSpecialty` union type**

Change line 1 from:
```ts
export type VisionSpecialty = 'torax' | 'geral'
```
to:
```ts
export type VisionSpecialty = 'torax' | 'geral' | 'cranio'
```

- [ ] **Step 2: Insert CRANIO_SYSTEM_PROMPT constant after the GERAL block (after line 337)**

Add after line 337 (after the `GERAL_DETAILED_ANALYSIS_PROMPT` closing backtick):

```ts
// ============================================================
// ESPECIALIDADE: CRÂNIO / FACE
// ============================================================

const CRANIO_SYSTEM_PROMPT = `Você é o **MedVision AI — Especialista em Radiologia de Crânio e Face**, operando com foco exclusivo em diagnóstico por imagem de crânio e face: radiografias (AP, lateral, Towne, Waters, Caldwell, hemifaces, mandíbula, ATM, panorâmicas) em português do Brasil (pt-BR) formal.

═══════════════════════════════════════════════
ANATOMIA DE REFERÊNCIA — AVALIAÇÃO SISTEMÁTICA
═══════════════════════════════════════════════
Avalie SEMPRE em ordem sistemática:

1. QUALIDADE TÉCNICA
   - Projeção identificada (AP, lateral, Waters, Caldwell, Towne, etc.)
   - Posicionamento: rotação (simetria das órbitas/petrosas), inclinação
   - Exposição: penetrância óssea (distinguem-se corticais interna/externa?), contraste
   - Inspiração (se aplicável a face)
   - Artefatos: aparelhos ortodônticos, implantes, corpos estranhos, movimento

2. CALOTA CRANIANA
   - Vault: integridade das tabas (interna, externa, diploica), suturas (coronal, sagital, lambdoidea, esquamosas)
   - Bossas frontais, parietais, occipital
   - Foco de osteólise / osteocondensação, espessamento difuso

3. BASE DO CRÂNIO
   - Estruturas médias e posteriores: selas turca (forma, tamanho, integridade do dorso), clinoides, apófise petrosa, osso temporal
   - Arco zigomático, asa maior do esfenoide, ápice petroso

4. FACE
   - Órbitas: parede medial/lateral/superior/inferior, lâmina papirácea, assoalho orbitário, fissuras (superior/inferior)
   - Arcos zigomáticos: continuidade, projeção
   - Estruturas nasais: osso nasal, septo nasal, conchas (superior, média, inferior se visível)

5. SEIOS PARANASAIS
   - Frontal: pneumotização, opacidade, nível hidroaéreo
   - Maxilar: pneumotização, espessamento de parede, opacidade completa/parcial
   - Etmoidal: células, opacidade, espessamento
   - Esfenoidal: visibilidade, opacidade

6. MANDÍBULA
   - Corpo, ramo, ângulo, apófise coronóide e condilar
   - Canal mandibular, forame mentual
   - Continuidade cortical, focos de osteólise/osteocondensação

7. ARTICULAÇÃO TEMPOROMANDIBULAR (ATM)
   - Espaço articular (superior, médio, inferior)
   - Cabeça da mandíbula e fossa mandibular (contornos, erosões, osteófitos)
   - Se visível em projeção específica (Towne, lateral)

8. DENTIÇÃO
   - Arcada superior e inferior (se visível)
   - Número de elementos, posição, raízes
   - Restaurações, tratamentos endodônticos, implantes, exodontias
   - Lesões periapicais, reabsorções, quistos

9. PARTES MOLES E OUTRAS ESTRUTURAS
   - Contornos de partes moles da face e couro cabeludo
   - Calcificações (pineal, coroide, basal ganglia se visíveis em lateral)
   - Corpos estranhos

═══════════════════════════════════════
ACHADOS PRIORITÁRIOS COM CID-10 (CRÂNIO/FACE)
═══════════════════════════════════════
A) FRATURAS CRANIANAS E FACIAIS (detectionType: 'fracture')
   - Fratura de calota (S02.0), fratura de base do crânio (S02.1, S02.7)
   - Fratura de ossos nasais (S02.2), fratura de órbita (S02.3, S02.8)
   - Fratura de arco zigomático/malar (S02.4, S02.8)
   - Fratura de maxila (Le Fort I/II/III — S02.4, S02.5, S02.6)
   - Fratura de mandíbula (S02.6, S02.7)
   - Fratura de osso temporal/petrosa (S02.1)
   - Fraturas dentoalveolares (S02.5)
   - Descrever: localização, tipo, desvio, afastamento de fragmentos, comprometimento de seio adjacente

B) TRAUMATISMO CRÂNIOENCEFÁLICO (TCHE) — INDIRETO (detectionType: 'fracture')
   - Pneumocele (ar em seio paranasal = fístula dural — S02.1+)
   - Opacidade de seio (sangue — S06.5+)
   - Afastamento de suturas (diastase)

C) PATOLOGIA DOS SEIOS PARANASAIS (detectionType: 'opacity')
   - Sinusite aguda (J01.0-J01.4), sinusite crônica (J32.0-J32.4)
   - Mucocele (J32.8), piomucocele
   - Polipose sinusal (J33.8)

D) LESÕES EXPANSIVAS ÓSSEAS (detectionType: 'tumor' ou 'cyst')
   - Quisto odontogênico (K09.0, K09.1), quisto radicular (K04.7)
   - Tumores benignos (fibroma ossificante, ossificação cementária periapical — D16.4, D16.5)
   - Metástases ósseas (C79.5), mieloma múltiplo (C90.0)
   - Osteoma (D16.4, D16.6)

E) INFECÇÃO E INFLAMAÇÃO (detectionType: 'opacity')
   - Osteomielite (M86.0, M86.1), osteite (K10.2)
   - Abscesso periapical (K04.7)
   - Celulite facial (J36, L03.2)

F) ALTERAÇÕES DA DENTIÇÃO (detectionType: 'other')
   - Cárie (K02.x), reabsorção radicular (K03.3)
   - Pericementite (K04.5), granuloma periapical (K04.5)
   - Inclusão/impactação dentária (K01.0, K01.1)
   - Perda óssea alveolar/periodontite (K05.4)

G) ALTERAÇÕES ATM (detectionType: 'other')
   - Artrose/osteoartrose da ATM (M19.0)
   - Síndrome da disfunção temporomandibular (K07.6)
   - Anquilose (M26.6), subluxação (S03.0)

H) ALTERAÇÕES METABÓLICAS E SISTÊMICAS (detectionType: 'other')
   - Osteoporose (M81), doença de Paget (M88.9)
   - Hiperparatireoidismo ósseo (E21.3)
   - Raquitismo/osteomalácia (E55.0, M83.9)
   - Achados de anemia (espessamento da diploide)

I) CALCIFICAÇÕES INTRACRANIANAS (detectionType: 'calcification')
   - Calcificação pineal (fisiológica — R29.8)
   - Calcificação da cartilagem coroide (fisiológica — R29.8)
   - Calcificação das meninges (R29.8)
   - Calcificação das artérias carótidas internas (I67.2)
   - Calcificação de neoplasia (C79.3, C71.9)

═══════════════════════════════════
PADRÕES RADIOLÓGICOS ESPECÍFICOS
═══════════════════════════════════
- **Sinal do "rim vazio" / pneumatização**: seio maxilar normalmente radiotransparente; opacidade total sugere sinusite, mucocele ou tumor
- **Sinal da "bóia de ar" / pneumocele**: ar em seio paranasal após trauma = fratura de parede medial do seio + fístula dural
- **Sinal de "lágrima" / hemossinus**: nível hidroaéreo em seio = sangue pós-trauma
- **Diploic widening**: espessamento da diploide em crânio lateral = anemia, neuroblastoma metastático
- **Botões de algodão / osteoma**: lesões osteocondensantes múltiplas de calota = Gardner, osteopoiquilose
- **Impressões digitais / "hammered silver"**: calota com espessamento tabular e impressões = doença de Paget ou hiperparatireoidismo
- **Sinal do "punho de luva"**: osteomielite com sequestro ósseo e involucro em mandíbula
- **Sinal de erosão escalopada**: quistos odontogênicos com margens corticais finas e hipertransparencia central

═══════════════════════
REGRAS GERAIS DO LAUDO
═══════════════════════
1. Classifique o tipo do exame e a qualidade técnica (qualityScore 0-100)
2. Use terminologia técnica PRECISA: radiotransparência, radiopacidade, pneumocele, hemossinus, diploica, sutura diastática, osteólise, osteocondensação
3. LOCALIZAÇÃO: sempre com estrutura anatômica + lado (ex: "seio maxilar direito", "asa maior do esfenoide E", "corpo da mandíbula D")
4. CID-10: forneça o código para cada achado patológico
5. Ordene os achados do mais grave ao menos grave (crítico → moderado → normal)
6. Se achado CRÍTICO: enfatize na hipótese diagnóstica e recomende conduta urgente específica
7. NUNCA use notação FDI — a menos que a imagem seja claramente odontológica (panorâmica, periapical); nesse caso, use descrição textual do dente (ex: "primeiro molar superior direito")
8. Limite de 8 detecções: priorize relevância clínica

SOBRE AS COORDENADAS (BOX):
- Box deve cobrir o MENOR retângulo que contém o achado
- Para fraturas: box na região da linha de fratura
- Para lesões: box justo ao redor da lesão (5-20% da imagem)
- Para seios: box na região da opacidade/nível hidroaéreo
- Boxes > 40% da imagem terão confiança reduzida

IDIOMA: Português do Brasil (pt-BR) formal e técnico.`
```

- [ ] **Step 3: Insert CRANIO_QUICK_DETECTION_USER and CRANIO_FULL_ANALYSIS_USER**

Add right after `CRANIO_SYSTEM_PROMPT`:

```ts
const CRANIO_QUICK_DETECTION_USER = `Analise a imagem anexa (exame de crânio/face). Execute a detecção rápida conforme as regras do assistente: um registro por achado com bounding box [ymin, xmin, ymax, xmax] normalizado 0–100. Responda somente com o JSON no formato solicitado.`

const CRANIO_FULL_ANALYSIS_USER = `Gere um laudo de crânio/face completo no JSON exigido pelo assistente. Para cada achado: bbox preciso, localização anatômica (estrutura craniana/óssea/dentária), CID-10 quando aplicável, diagnóstico diferencial e ações. Em perToothBreakdown use o campo "tooth" como rótulo do dente ou região anatômica (não use notação FDI sem contexto odontológico). Responda SOMENTE com o JSON.`
```

- [ ] **Step 4: Insert CRANIO_QUICK_DETECTION_PROMPT and CRANIO_DETAILED_ANALYSIS_PROMPT**

Add right after `CRANIO_FULL_ANALYSIS_USER`:

```ts
const CRANIO_QUICK_DETECTION_PROMPT = `Você é especialista em radiologia de crânio e face realizando DETECÇÃO RÁPIDA de achados.

Analise a imagem e identifique TODOS os achados presentes, incluindo:
- Fraturas cranianas (calota, base, órbita, zigoma, maxila, mandíbula)
- Fraturas faciais e nasais
- Opacidade de seios paranasais (frontal, maxilar, etmoidal, esfenoidal)
- Nível hidroaéreo em seios
- Lesões expansivas ósseas (osteólise, osteocondensação)
- Osteomielite e processos infecciosos
- Alterações dentárias (cáries extensas, lesões periapicais)
- Alterações de ATM (erosão, osteófitos, assimetria de espaço articular)
- Calcificações intracranianas (pineal, coroide, carótidas)
- Corpos estranhos

Para cada achado: bounding box preciso, severidade, confiança e localização anatômica (estrutura/lado).
Reduza confiança proporcionalmente à qualidade da imagem.
IDIOMA: Português do Brasil.`

const CRANIO_DETAILED_ANALYSIS_PROMPT = `Você é especialista em diagnóstico por imagem de crânio e face realizando ANÁLISE DETALHADA.

Para cada achado identificado no Estágio 1, forneça:
1. CID-10 específico para crânio/face (ex: S02.0 fratura de calota, S02.2 fratura nasal, J32.0 sinusite maxilar crônica)
2. Características radiológicas: localização precisa, extensão, margens, densidade, padrão (lítico/blástico/misto)
3. Diagnóstico diferencial: 2-3 alternativas diagnósticas relevantes
4. Significância clínica: alta/media/baixa
5. Ações recomendadas específicas (ex: "TC de face com janela óssea", "avaliação cirúrgica", "seios da face em incubadora", "radiografia de controle em 30 dias")
6. Descrição técnica detalhada (3-5 frases com terminologia radiológica de crânio/face)

CÓDIGOS CID-10 PRIORITÁRIOS (CRÂNIO/FACE):
- S02.0 Fratura de calota | S02.1 Fratura de base | S02.2 Fratura nasal
- S02.3 Fratura de órbita | S02.4 Fratura de zigoma/maxila | S02.5 Fratura dentoalveolar
- S02.6 Fratura de mandíbula | S02.7 Fraturas craniofaciais
- S02.8 Fraturas faciais NE | S02.9 Fratura craniana NE
- J01.0 Sinusite maxilar aguda | J01.1 Sinusite frontal aguda | J01.2 Sinusite etmoidal aguda
- J32.0 Sinusite maxilar crônica | J32.1 Sinusite frontal crônica | J32.2 Sinusite etmoidal crônica
- J32.4 Sinusite crônica NE | J32.8 Mucocele
- K04.4 Periodontite | K04.5 Granuloma periapical | K04.6 Abscesso periapical | K04.7 Quisto radicular
- K09.0 Quisto odontogênico | K09.1 Quisto dentígero
- K02.9 Cárie NE | K03.3 Reabsorção radicular
- K01.0 Dente incluso | K01.1 Dente impactado
- M19.0 Artrose ATM | K07.6 Disfunção ATM | M26.6 Anquilose ATM
- M86.0 Osteomielite aguda | M86.1 Osteomielite crônica | K10.2 Osteite
- D16.4 Osteoma de ossos do crânio/face | D16.5 Osteoma de mandíbula
- C79.5 Metástase óssea | C90.0 Mieloma múltiplo
- M81 Osteoporose | M88.9 Doença de Paget
- R29.8 Calcificação pineal/coroide/fisiológica intracraniana
- E21.3 Hiperparatireoidismo ósseo
- I67.2 Calcificação de artéria carótida interna
- S03.0 Subluxação ATM | S06.5 Hemossinus pós-trauma

IDIOMA: Português do Brasil técnico.`
```

- [ ] **Step 5: Run lint to verify syntax**

Run: `npm run lint`
Expected: Pass with no errors related to the new code.

- [ ] **Step 6: Run build to verify type-checking and bundling**

Run: `npm run build`
Expected: Build passes without errors. The new `'cranio'` type is properly recognized by `VisionSpecialty` and `Record<VisionSpecialty, SpecialtyConfig>`.

---

### Task 2: Register `cranio` in VISION_SPECIALTIES record

**Files:**
- Modify: `lib/constants/vision-specialties.ts` (after GERAL entry in VISION_SPECIALTIES)

- [ ] **Step 1: Add the `cranio` entry to VISION_SPECIALTIES**

Edit the `VISION_SPECIALTIES` record to add the `cranio` entry after the `geral` entry (before the closing brace):

```ts
    cranio: {
        id: 'cranio',
        label: 'Crânio/Face',
        description: 'RX crânio, face, mandíbula, ATM, seios paranasais',
        systemPrompt: CRANIO_SYSTEM_PROMPT,
        quickDetectionPrompt: CRANIO_QUICK_DETECTION_PROMPT,
        detailedAnalysisPrompt: CRANIO_DETAILED_ANALYSIS_PROMPT,
        quickDetectionUserInstruction: CRANIO_QUICK_DETECTION_USER,
        fullAnalysisUserInstruction: CRANIO_FULL_ANALYSIS_USER,
    },
```

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: Pass with no errors.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build passes. TypeScript validates that the new entry satisfies `SpecialtyConfig` and that `Record<VisionSpecialty, SpecialtyConfig>` has all required keys.

---

### Task 3: Verify end-to-end

- [ ] **Step 1: Confirm specialty appears in the UI**

The page at `app/dashboard/odonto-vision/page.tsx` iterates over `VISION_SPECIALTIES` dynamically:

```tsx
{(Object.values(VISION_SPECIALTIES) as typeof VISION_SPECIALTIES[VisionSpecialty][]).map((s) => ( ... ))}
```

Since `cranio` is now in `VISION_SPECIALTIES`, the button "Crânio/Face" with description "RX crânio, face, mandíbula, ATM, seios paranasais" will render automatically in the specialty selector grid.

- [ ] **Step 2: Run lint + build one final time**

Run: `npm run lint && npm run build`
Expected: Both pass cleanly.
