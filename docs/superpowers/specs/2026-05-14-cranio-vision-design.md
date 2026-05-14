# Especialista em Raio X da Cabeça (Crânio/Face) — Med Vision

**Data:** 2026-05-14  
**Origem:** Brainstorm aprovado (Abordagem 2 — Especialidade Completa).  
**Status:** 🟡 Aguardando implementação

---

## 1. Objetivo

Criar a especialidade **`cranio`** no Med Vision, permitindo que usuários enviem radiografias simples de crânio e face para análise assistida por inteligência artificial.

O especialista deve gerar laudos técnicos completos em português do Brasil (pt-BR formal), com checklist anatômico sistemático, achados priorizados com CID-10, diagnóstico diferencial e ações recomendadas — no mesmo padrão de qualidade da especialidade **Tórax**.

---

## 2. Escopo

### Tipos de imagem suportados

| Projeção / Tipo | Contexto |
|-----------------|----------|
| Crânio AP (anteroposterior) | Avaliação de simetria, fraturas, suturas |
| Crânio lateral (norma lateral) | Calota, base do crânio, seios, calcificações |
| Towne | Base do crânio, osso temporal, ATM |
| Waters (occipitomental) | Seios maxilares, órbitas, arcos zigomáticos |
| Caldwell (occipitofrontal) | Seios frontais, órbitas, etmoidais |
| Hemifaces | Trauma facial, arcos zigomáticos |
| Mandíbula / ATM | Fraturas, articulação, dentição |
| Panorâmica / periapicais (contexto cabeça) | Quando contextualizadas como exame de cabeça |

### O que NÃO está no escopo

- Tomografia computadorizada (TC) de crânio — manter na especialidade **Geral**
- Ressonância magnética (RM) — fora do escopo de RX simples
- Angiografia cerebral — não é radiografia simples

---

## 3. Estrutura do Laudo e Checklist Anatômico

O laudo segue avaliação sistemática em ordem obrigatória:

### 3.1 Qualidade Técnica

- Projeção identificada (AP, lateral, Waters, Caldwell, Towne, etc.)
- Posicionamento: rotação (simetria das órbitas/petrosas), inclinação
- Exposição: penetrância óssea (distinguem-se corticais interna/externa?), contraste
- Inspiração (se aplicável a face)
- Artefatos: aparelhos ortodônticos, implantes, corpos estranhos, movimento

### 3.2 Calota Craniana

- Vault: integridade das tabas (interna, externa, diploica), suturas (coronal, sagital, lambdoidea, esquamosas)
- Bossas frontais, parietais, occipital
- Foco de osteólise / osteocondensação, espessamento difuso

### 3.3 Base do Crânio

- Estruturas médias e posteriores: selas turca (forma, tamanho, integridade do dorso), clinoides, apófise petrosa, osso temporal
- Arco zigomático, asa maior do esfenoide, ápice petroso

### 3.4 Face

- Órbitas: parede medial/lateral/superior/inferior, lâmina papirácea, assoalho orbitário, fissuras (superior/inferior)
- Arcos zigomáticos: continuidade, projeção
- Estruturas nasais: osso nasal, septo nasal, conchas (superior, média, inferior se visível)

### 3.5 Seios Paranasais

- Frontal: pneumotização, opacidade, nível hidroaéreo
- Maxilar: pneumotização, espessamento de parede, opacidade completa/parcial
- Etmoidal: células, opacidade, espessamento
- Esfenoidal: visibilidade, opacidade

### 3.6 Mandíbula

- Corpo, ramo, ângulo, apófise coronóide e condilar
- Canal mandibular, forame mentual
- Continuidade cortical, focos de osteólise/osteocondensação

### 3.7 Articulação Temporomandibular (ATM)

- Espaço articular (superior, médio, inferior)
- Cabeça da mandíbula e fossa mandibular (contornos, erosões, osteófitos)
- Se visível em projeção específica (Towne, lateral)

### 3.8 Dentição

- Arcada superior e inferior (se visível)
- Número de elementos, posição, raízes
- Restaurações, tratamentos endodônticos, implantes, exodontias
- Lesões periapicais, reabsorções, quistos

### 3.9 Partes Moles e Outras Estruturas

- Contornos de partes moles da face e couro cabeludo
- Calcificações (pineal, coroide, basal ganglia se visíveis em lateral)
- Corpos estranhos

---

## 4. Achados Prioritários com CID-10

### A) FRATURAS CRANIANAS E FACIAIS (`detectionType: 'fracture'`)

- Fratura de calota (S02.0), fratura de base do crânio (S02.1, S02.7)
- Fratura de ossos nasais (S02.2), fratura de órbita (S02.3, S02.8)
- Fratura de arco zigomático/malar (S02.4, S02.8)
- Fratura de maxila (Le Fort I/II/III — S02.4, S02.5, S02.6)
- Fratura de mandíbula (S02.6, S02.7)
- Fratura de osso temporal/petrosa (S02.1)
- Fraturas dentoalveolares (S02.5)

**Anotação obrigatória:** linha de fratura, desvio, afastamento de fragmentos, comprometimento de seio adjacente.

### B) TRAUMATISMO CRÂNIOENCEFÁLICO (TCHE) — INDIRETO (`detectionType: 'fracture'`)

- Pneumocele (ar em seio paranasal = fístula dural — S02.1+)
- Opacidade de seio (sangue — S06.5+)
- Afastamento de suturas (diastase)

### C) PATOLOGIA DOS SEIOS PARANASAIS (`detectionType: 'opacity'`)

- Sinusite aguda (J01.0-J01.4), sinusite crônica (J32.0-J32.4)
- Mucocele (J32.8), piomucocele
- Polipose sinusal (J33.8)

### D) LESÕES EXPANSIVAS ÓSSEAS (`detectionType: 'tumor'` ou `'cyst'`)

- Quisto odontogênico (K09.0, K09.1), quisto radicular (K04.7)
- Tumores benignos (fibroma ossificante, ossificação cementária periapical — D16.4, D16.5)
- Metástases ósseas (C79.5), mieloma múltiplo (C90.0)
- Osteoma (D16.4, D16.6)

### E) INFECÇÃO E INFLAMAÇÃO (`detectionType: 'opacity'`)

- Osteomielite (M86.0, M86.1), osteite (K10.2)
- Abscesso periapical (K04.7)
- Celulite facial (J36, L03.2)

### F) ALTERAÇÕES DA DENTIÇÃO (`detectionType: 'other'`)

- Cárie (K02.x), reabsorção radicular (K03.3)
- Pericementite (K04.5), granuloma periapical (K04.5)
- Inclusão/impactação dentária (K01.0, K01.1)
- Perda óssea alveolar/periodontite (K05.4)

### G) ALTERAÇÕES ATM (`detectionType: 'other'`)

- Artrose/osteoartrose da ATM (M19.0)
- Síndrome da disfunção temporomandibular (K07.6)
- Anquilose (M26.6), subluxação (S03.0)

### H) ALTERAÇÕES METABÓLICAS E SISTÊMICAS (`detectionType: 'other'`)

- Osteoporose (M81), doença de Paget (M88.9)
- Hiperparatireoidismo ósseo (E21.3)
- Raquitismo/osteomalácia (E55.0, M83.9)
- Achados de anemia (espessamento da diploide)

### I) CALCIFICAÇÕES INTRACRANIANAS (`detectionType: 'calcification'`)

- Calcificação pineal (fisiológica — R29.8)
- Calcificação da cartilagem coroide (fisiológica — R29.8)
- Calcificação das meninges (R29.8)
- Calcificação das artérias carótidas internas (I67.2)
- Calcificação de neoplasia (C79.3, C71.9)

---

## 5. Arquitetura e Mudanças Técnicas

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `lib/constants/vision-specialties.ts` | Adicionar `cranio` ao union type `VisionSpecialty`; criar constantes de prompt (`CRANIO_SYSTEM_PROMPT`, `CRANIO_QUICK_DETECTION_PROMPT`, `CRANIO_DETAILED_ANALYSIS_PROMPT`, `CRANIO_QUICK_DETECTION_USER`, `CRANIO_FULL_ANALYSIS_USER`); registrar em `VISION_SPECIALTIES`. |

### Arquivos NÃO modificados

- `app/dashboard/odonto-vision/page.tsx` — já itera sobre `VISION_SPECIALTIES` dinamicamente; a nova especialidade aparecerá automaticamente no seletor de especialidades.
- `app/api/vision/analyze/route.ts` — já usa `getSpecialtyConfig(specialty)`; nenhuma mudança necessária.
- Componentes em `components/vision/` — todos reutilizáveis.

### Contratos preservados

- `VisionSpecialty` type union → extendido com `'cranio'`
- `SpecialtyConfig` interface → reutilizado
- API payload (`{ image, clinicalContext, model, specialty }`) → inalterado

---

## 6. Critérios de Aceite

- [ ] Especialidade "Crânio/Face" aparece no seletor de especialidades do Med Vision.
- [ ] Seleção de `cranio` dispara o prompt de sistema específico de crânio.
- [ ] O laudo gerado segue a ordem sistemática do checklist anatômico (qualidade técnica → calota → base → face → seios → mandíbula → ATM → dentição → partes moles).
- [ ] Achados de fratura incluem: localização anatômica precisa, tipo de fratura, desvio de fragmentos, comprometimento de estruturas adjacentes.
- [ ] Achados de seios paranasais incluem: seio afetado, grau de opacidade, espessamento de parede, nível hidroaéreo se presente.
- [ ] CID-10 é fornecido para cada achado patológico.
- [ ] Diagnóstico diferencial (2-3 alternativas) é fornecido para achados relevantes.
- [ ] Significância clínica classificada como alta/média/baixa.
- [ ] Ações recomendadas específicas e práticas para cada achado.
- [ ] Limite de 8 detecções, priorizadas por relevância clínica.
- [ ] Build (`npm run build`) e lint (`npm run lint`) passam sem regressões.
- [ ] Especialidades existentes (Tórax, Geral) não são afetadas.

---

## 7. Fora de Escopo (fases seguintes)

- Templates de saída específicos por projeção (Waters vs lateral vs Towne).
- Detecção automática da projeção a partir da imagem.
- Suporte a TC de crânio — usar especialidade Geral.
- Comparação de imagens serialadas (pré/pós-tratamento).
- Métricas de produto específicas para crânio.

---

## 8. Padrões Radiológicos Específicos de Referência

Para uso nos prompts de análise detalhada:

- **Sinal do "rim vazio" / pneumatização**: seio maxilar normalmente radiotransparente; opacidade total sugere sinusite, mucocele ou tumor.
- **Sinal da "bóia de ar" / pneumocele**: ar em seio paranasal após trauma = fratura de parede medial do seio + fístula dural.
- **Sinal de "lágrima" / hemossinus**: nível hidroaéreo em seio = sangue pós-trauma.
- **Diploic widening**: espessamento da diploide em crânio lateral = anemia, neuroblastoma metastático.
- **Botões de algodão / osteoma**: lesões osteocondensantes múltiplas de calota = Gardner, osteopoiquilose.
- **Impressões digitais / "hammered silver"**: calota com espessamento tabular e impressões = doença de Paget ou hiperparatireoidismo.

---

**Última revisão:** 2026-05-14  
**Aprovado por:** *(aguardando aprovação do usuário)*
