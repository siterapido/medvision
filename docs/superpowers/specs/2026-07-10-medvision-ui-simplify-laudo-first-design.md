# MedVision UI — Simplificar + Laudo-first premium

**Data:** 2026-07-10  
**Status:** aprovado (decisões pelo agente; usuário pediu update + implementação)  
**Registro:** product (app autenticado)  
**Supersede:** `2026-07-09-medvision-rebranding-laudo-first-design.md` (mantém direção; amplia corte e concreção)

---

## 1. Contexto e problema

MedVision herdou identidade Odonto GPT (dark sidebar, glass, glow emerald, copy odontológica, módulos LMS). Nav user já reduzida a Med Vision + Laudos, mas tokens/shell/telas ainda gritam “IA SaaS”. Admin ainda expõe cursos/materiais.

Objetivo: interface **tech premium clínico**, sem cara de IA, com **laudo** como produto e corte de funções desnecessárias.

---

## 2. Decisões travadas

| Decisão | Escolha |
|---------|---------|
| Spec anterior | Expandir (não recomeçar do zero) |
| Abordagem build | **Token-first → shell → telas** |
| Ambiente | Consultório claro → **light-first** |
| Produto principal | Laudo (imagem → achados → PDF); IA nos bastidores |
| Escopo user | login, shell, Med Vision, Laudos, perfil/config |
| Nav user | **Med Vision · Laudos** (+ user menu → perfil/config) |
| Legado user | Fora do nav + **404 limpo** (não redirect, não “em breve”) |
| Admin | **Remover Cursos + Materiais do nav**; manter Visão Geral + Usuários (+ Agentes se ops) |
| Código legado | **Não deletar** arquivos nesta fase |
| Landing / assinar / trial | Fora de escopo |
| Dark mode | Fora de escopo nesta fase |
| API / modelos de análise | Sem mudança |
| Tom visual | Tech médico discreto, densidade média, autoridade quieta |

---

## 3. Intent

**Quem:** médico/radiologista (~45), consultório claro, manhã/tarde.  
**Verbo:** revisar achados e emitir/exportar laudo.  
**Feel:** instrumento clínico premium — não demo de startup de IA.

---

## 4. Domínio e assinatura

**Domain:** laudo · achado · imagem diagnóstica · confiança · revisão antes de exportar.

**Color world:** papel de laudo · cinza filme/DICOM · azul-ardósia bata · tinta carimbo · luz monitor clínico.

**Signature:** superfície “folha de laudo” — tipografia de relatório + imagem ao lado; IA só status discreto.

**Defaults a matar:**

| Default | Substituição |
|---------|----------------|
| Dark sidebar + emerald glow | Light paper + signal frio ≤10% |
| Glass / blur / gradient text | Superfícies sólidas |
| Grid cards métrica SaaS | Lista densa / split imagem\|laudo |
| Side-stripe >1px | Tint ativo + texto ink |
| Badges Sparkles / “IA” herói | Status tipográfico discreto |
| Admin cursos/materiais | Fora do nav |

---

## 5. Identidade e tokens

**Estratégia:** Restrained — neutros tintados azul-ardósia + 1 acento frio ≤10%.  
**Profundidade:** borders-only.  
**Tipo:** Geist (ou sans do repo) — headings 600, tracking apertado; corpo 14–16px.

### Tokens OKLCH (fonte: `app/globals.css`)

Valores alvo (ajustar fino no impl, manter nomes):

| Token | Papel | Direção |
|-------|--------|---------|
| `--paper` | canvas | oklch(0.985 0.004 250) |
| `--surface` | painéis | oklch(0.97 0.006 250) |
| `--surface-raised` | elevação whisper | oklch(1 0.003 250) |
| `--ink` | texto | oklch(0.22 0.02 255) |
| `--ink-muted` | secundário | oklch(0.45 0.015 255) |
| `--rule` | bordas | oklch(0.88 0.01 250) |
| `--signal` | CTA / foco / ativo | oklch(0.42 0.06 255) — **não** teal/emerald |
| `--clinical-ok` | achado ok | oklch(0.55 0.08 145) |
| `--clinical-warn` | atenção | oklch(0.65 0.12 75) |
| `--clinical-alert` | alerta | oklch(0.55 0.14 25) |

Mapear shadcn `--background`, `--foreground`, `--primary`, `--sidebar*` para estes tokens no light. Sidebar = mesma família do canvas (não slate-950 + emerald).

**Proibido no escopo:** glass decorativo, `bg-clip-text`+gradient, glow cyan/emerald, side-stripe >1px, headings laranja, `#fff`/`#000` puros.

Atualizar `.interface-design/system.md` para MedVision laudo-first.

---

## 6. Telas e fluxos

### 6.1 Navegação user

- Itens: **Med Vision** · **Laudos**.
- Perfil/config no menu do usuário.
- Legado (chat, biblioteca, OdontoFlix, certificados, studio, histórico): URL → 404 limpo via `UnavailablePage` / not-found.

### 6.2 Admin nav

```ts
// Manter
Visão Geral, Usuários, Agentes IA
// Remover do nav (código fica)
Cursos, Materiais
```

### 6.3 Login / auth

- Fundo `--paper`, logo escuro legível.
- Form centrado, sem glass.
- CTA `--signal`. Erros inline.

### 6.4 Shell

- Sidebar cor do canvas.
- Ativo: tint + `--ink` (sem glow).
- Página: título + uma ação primária.
- Mobile nav: sem glass/blur pill.

### 6.5 Med Vision (3 etapas)

1. **Upload** — dropzone clara, qualidade, CTA Continuar.
2. **Configurar** — selects shadcn.
3. **Revisão** — split **imagem | laudo**; ferramentas avançadas recolhidas; export PDF; disclaimer discreto.

Preferir `components/vision/med-vision/*`. Não reescrever lógica de análise no monólito `odonto-vision/page.tsx` de uma vez — extrair/alinhar visual.

### 6.6 Laudos

- Lista densa (data, tipo, status, preview 1 linha).
- Empty: 1 frase + CTA Med Vision.
- Detalhe: folha de laudo.

### 6.7 Perfil / config

- Forms simples, seções com `--rule`, sem cards empilhados.

### 6.8 Estados

- Loading: skeleton whisper.
- Erro: inline + retry.
- 404 legado: mínimo + link Med Vision.

---

## 7. Arquitetura de implementação

### Camadas

1. Tokens (`globals.css` + Tailwind map)
2. Primitivos UI (`components/ui/`)
3. Shell (sidebar, mobile-nav, layout)
4. Telas escopo
5. Admin nav cut
6. Copy Odonto → MedVision nas rotas do escopo

### Ordem

1. Tokens + matar glass/glow no shell autenticado  
2. Login + sidebar + mobile-nav  
3. Med Vision visual (steps existentes)  
4. Laudos  
5. Perfil/config + 404  
6. Admin nav (sem cursos/materiais)  
7. Copy cleanup escopo  

### Aceite

- [ ] Light consultório: laudo legível 5+ min sem fadiga
- [ ] Sem glass/glow/gradient-text nas rotas autenticadas do escopo
- [ ] Nav user só Med Vision + Laudos
- [ ] Admin sem Cursos/Materiais no nav
- [ ] Legado → 404 limpo
- [ ] Logo legível no login
- [ ] Split imagem|laudo default na revisão
- [ ] Ferramentas avançadas recolhidas por padrão
- [ ] Sem badges “IA”/Sparkles como herói

---

## 8. Fora de escopo

- Landing, assinar, trial, marketing redesign
- Redesign visual completo do admin (só nav cut)
- Dark mode
- Deletar arquivos de rotas legadas / admin cursos
- Mudança de modelo/API de análise

---

## 9. Referências

- PRODUCT.md  
- Spec base: `2026-07-09-medvision-rebranding-laudo-first-design.md`  
- Nav: `lib/constants/navigation.ts`  
- Componentes: `components/vision/med-vision/`  
- Critique: `.impeccable/critique/2026-05-25T14-30-54Z__medvision-interface.md`

---

## 10. Próximo passo

Plano: `docs/superpowers/plans/2026-07-10-medvision-ui-simplify-laudo-first.md` → subagent-driven-development.
