# MedVision Rebranding — Laudo-first clínico

**Data:** 2026-07-09  
**Status:** aprovado (brainstorming)  
**Registro:** product (app autenticado)  
**Direção:** opção 1 — Laudo-first clínico (tech médico discreto)

---

## 1. Contexto e problema

MedVision herdou identidade de Odonto GPT (dark, glass, glow cyan/emerald, copy odontológica). Critique de 2026-05-25 (score 25/40) apontou: estética AI-slop, design system fragmentado, rotas legadas que minam confiança clínica, revisão Med Vision cognitivamente sobrecarregada.

Objetivo do rebranding: interface que passe **autoridade e premium** para profissionais de saúde em consultório claro, com o **laudo** como produto principal e a IA nos bastidores.

---

## 2. Decisões travadas (brainstorming)

| Decisão | Escolha |
|---------|---------|
| Ambiente de uso | Consultório claro (monitor branco) → **light-first** |
| Produto principal | Laudo clínico (imagem → achados → PDF); IA nos bastidores |
| Escopo | Só produto autenticado: login, shell, Med Vision, Laudos, perfil/config |
| Tom visual | Tech médico discreto: claro + acento frio, densidade média |
| Rotas legadas | Fora do nav + **404 limpo** (não redirect, não “em breve” dramático) |
| Direção visual | Opção 1 — Laudo-first clínico |
| Fora de escopo | Landing, assinar, trial, admin, dark mode, deletar código legado |

---

## 3. Intent

**Quem:** médico/radiologista (~45), consultório claro, manhã/tarde, precisa confiar no laudo e exportar PDF sem teatro de IA.

**Verbo principal:** revisar achados e emitir/exportar laudo.

**Feel:** instrumento clínico calmo, tech médico discreto, autoridade quieta — não demo de startup de IA.

---

## 4. Domínio e assinatura

**Domain:** laudo · achado · imagem diagnóstica · confiança clínica · fluxo consultório · revisão antes de assinar.

**Color world:** branco de papel de laudo · cinza de filme/DICOM · azul-ardósia de bata · tinta de carimbo · luz de monitor clínico (não teal startup).

**Signature:** superfície “folha de laudo” — tipografia de relatório + imagem ao lado; IA só como badge/status, nunca herói visual.

**Defaults a matar:**

| Default | Substituição |
|---------|----------------|
| Dark + glow cyan/emerald | Light paper + signal frio ≤10% |
| Glass / blur / gradient text | Superfícies sólidas, tipografia sólida |
| Grid de cards métrica SaaS | Lista densa / split imagem\|laudo |
| Side-stripe decorativo | Tint de ativo + texto ink |

---

## 5. Identidade e tokens

**Estratégia de cor:** Restrained — neutros tintados azul-ardósia + 1 acento frio ≤10%.

**Profundidade:** borders-only (sem shadow dramática, sem glow).

**Tipografia:** sans séria já no repo (Geist ou equivalente) — headings 600, tracking apertado; corpo 14–16px; laudo com ritmo de relatório.

### Tokens (OKLCH — nomes de produto)

| Token | Papel |
|-------|--------|
| `--paper` | canvas |
| `--surface` / `--surface-raised` | painéis / elevação whisper |
| `--ink` / `--ink-muted` | texto |
| `--rule` | bordas quase invisíveis |
| `--signal` | CTA, foco, item ativo (azul-ardósia frio; **não** teal/emerald SaaS) |
| `--clinical-ok` / `--clinical-warn` / `--clinical-alert` | semântica de achado |

**Proibido nas rotas do escopo:** glass, `bg-clip-text` + gradient, glow cyan/emerald, side-stripe >1px decorativo, headings laranja, `#fff`/`#000` puros (tintar neutros).

**Fonte de verdade:** `app/globals.css` (+ map Tailwind). Atualizar `.interface-design/system.md` para MedVision laudo-first (substituir Odonto GPT dark/cyan).

---

## 6. Telas e fluxos

### 6.1 Navegação

- Itens: **Med Vision** · **Laudos**.
- Perfil/config no menu do usuário (rodapé sidebar).
- Legado (chat, biblioteca, OdontoFlix, certificados, studio, etc.): removido do nav; URL antiga → **404 limpo** (“Página não encontrada” + link Med Vision).

### 6.2 Login / auth

- Fundo `--paper`, logo escuro (corrigir bug logo white-on-white).
- Form centrado, sem glass.
- CTA = `--signal`.
- Erros inline, tom clínico.

### 6.3 Shell

- Sidebar mesma cor do canvas.
- Ativo: tint + texto `--ink` (sem glow, sem stripe grossa).
- Página: título + uma ação primária.

### 6.4 Med Vision (3 etapas)

1. **Upload** — dropzone clara, validação de qualidade, CTA “Continuar”.
2. **Configurar** — especialidade/contexto com selects shadcn (não nativo).
3. **Revisão / resultado** — split **imagem | laudo**.
   - Default: modo leitura do laudo.
   - Heatmap, anotação, comparação: painel secundário recolhido (progressive disclosure).
   - Ações: exportar PDF, nova análise, voltar.
   - Disclaimer clínico sempre visível, tipografia discreta.

### 6.5 Laudos

- Lista densa (data, tipo, status, preview 1 linha) — não grid de métricas.
- Empty state: 1 frase + CTA “Ir ao Med Vision”.
- Detalhe: mesma “folha de laudo” do resultado.

### 6.6 Perfil / config

- Form simples, seções com `--rule`, sem cards empilhados.

### 6.7 Estados

- Loading: skeleton whisper.
- Erro: recovery inline + retry.
- 404 legado: página mínima.

---

## 7. Arquitetura de implementação

### Camadas

1. Tokens (globals + Tailwind)
2. Primitivos UI (`components/ui/`)
3. Shell (sidebar + layout dashboard)
4. Telas (login, Med Vision steps, Laudos, perfil/config)

### Ordem de build

1. Tokens + remover glass/glow/gradient-text no shell autenticado
2. Login + sidebar
3. Med Vision (upload → config → split laudo)
4. Laudos lista/detalhe
5. Perfil/config + 404 legado
6. Limpeza copy Odonto → MedVision nas rotas do escopo

### Risco técnico

`app/dashboard/odonto-vision/page.tsx` (e fluxos relacionados) é monólito. Extrair views (upload/config/result) **sem** reescrever lógica de análise de uma vez. Preferir componentes já existentes em `components/vision/med-vision/` quando couber.

### Aceite

- [ ] Consultório claro: laudo legível 5+ min sem fadiga visual
- [ ] Sem glass / glow / gradient text nas rotas autenticadas do escopo
- [ ] Nav só Med Vision + Laudos
- [ ] Legado → 404 limpo
- [ ] Logo legível no login (fundo claro)
- [ ] Split imagem | laudo como default na revisão
- [ ] Ferramentas avançadas recolhidas por padrão

---

## 8. Fora de escopo (explícito)

- Landing, assinar, trial, marketing
- Admin
- Dark mode (pode ser fase posterior)
- Deletar arquivos de rotas legadas (apenas 404 + fora do nav)
- Mudança de modelo/API de análise de imagem

---

## 9. Referências internas

- Critique: `.impeccable/critique/2026-05-25T14-30-54Z__medvision-interface.md`
- Nav atual: `lib/constants/navigation.ts`
- Specs anteriores: `docs/superpowers/specs/2026-05-22-medvision-2-etapas-design.md`, `2026-05-22-biblioteca-laudos-design.md`
- System legado a substituir: `.interface-design/system.md`

---

## 10. Próximo passo

Após aprovação desta spec pelo usuário: invocar **writing-plans** para plano de implementação detalhado (sem começar código antes do plano).
