# Biblioteca de Laudos — Med Vision

**Data:** 2026-05-22  
**Origem:** Brainstorm aprovado (Abordagem 1 — Reativar `/dashboard/biblioteca` como hub só de laudos).  
**Status:** Aguardando implementação

---

## 1. Objetivo

Oferecer a aba **Biblioteca** no dashboard, onde ficam **todos os laudos** gerados pelo Med Vision: listagem, busca, filtros, preview e reabertura completa da análise.

O usuário não precisa salvar manualmente — cada análise concluída entra na biblioteca automaticamente. Refinamentos e anotações posteriores atualizam o mesmo registro, sem duplicar laudos.

---

## 2. Decisões de produto (brainstorm)

| Tema | Decisão |
|------|---------|
| Conteúdo da Biblioteca | Somente laudos Med Vision (`type: vision`) |
| Abrir um laudo | Preview na Biblioteca + botão **Abrir no Med Vision** |
| Salvamento | Automático ao concluir análise; PATCH em refinamentos/anotações |
| Nome na navegação | **Biblioteca** (sem “Laudos” na UI) |
| Lista | Busca por título + filtro por especialidade + filtro por período + ordenação por data (mais recente primeiro) |

---

## 3. Navegação e rotas

### Sidebar

- Substituir item **Laudos** por **Biblioteca**.
- `href`: `/dashboard/biblioteca`
- Ícone: pasta/biblioteca (ex.: `Library` do lucide).

### Páginas

| Rota | Comportamento |
|------|----------------|
| `/dashboard/biblioteca` | Lista de laudos (página principal) |
| `/dashboard/laudos` | Redirect 308 → `/dashboard/biblioteca` |
| `/dashboard/biblioteca/laudos` | Redirect 308 → `/dashboard/biblioteca` |

### Layout `app/dashboard/biblioteca/layout.tsx`

- **Remover** overlay `UnavailablePage` (“em atualização”).
- **Remover** redirect de usuários `free` para `/dashboard` (alinhado ao acesso atual de `/dashboard/laudos`).
- Manter apenas verificação de autenticação herdada do layout pai do dashboard.

### Med Vision — links

- Toast “Ver na Biblioteca” → `/dashboard/biblioteca`
- Botão “Ver na Biblioteca” no resultado → `/dashboard/biblioteca`
- Remover referências visuais a “Laudos” nesses fluxos.

Arquivo de navegação: `lib/constants/navigation.ts` — item `{ href: "/dashboard/biblioteca", label: "Biblioteca", icon: Library }`.

---

## 4. UI da Biblioteca

### Cabeçalho

- Título: **Biblioteca**
- Subtítulo: laudos salvos automaticamente pelas análises do Med Vision.
- CTA: **Nova análise** → `/dashboard/odonto-vision`

### Barra de filtros

| Controle | Comportamento |
|----------|----------------|
| Busca | Debounce 300ms; `search` na API (`title` / `description`) |
| Especialidade | Dropdown: Todas + lista `VISION_SPECIALTY_ORDER` (labels em pt-BR) |
| Período | Hoje \| Última semana \| Último mês \| Todos |
| Ordenação | `createdAt` desc (padrão fixo na v1) |

**Implementação v1 dos filtros de especialidade e período:** filtro no cliente sobre até 100 laudos retornados pela API. Evolução futura: query params no backend se o volume crescer.

### Cards (`ArtifactCard` ajustado para `vision`)

- Thumbnail (`content.thumbnailBase64`)
- Título
- Trecho da hipótese (`description`)
- Badge de especialidade (`metadata.specialty` ou fallback “Geral”)
- Data/hora (pt-BR)

Menu: **Visualizar**, **Abrir no Med Vision**, **Excluir** (fluxo de confirmação existente).

### Estado vazio

- Mensagem: “Nenhum laudo salvo ainda”
- Ação: **Ir ao Med Vision**

### Preview (modal)

Reutilizar `ArtifactList` + `ArtifactRenderer` + rodapé:

- **Fechar**
- **Exportar PDF** — `generateVisionPdf` com dados do artefato (substituir placeholder “em breve”)
- **Abrir no Med Vision** (primário) → `/dashboard/odonto-vision?artifact=<id>`

Fechar modal antes de navegar para o Med Vision.

---

## 5. Salvamento (Med Vision)

### Fluxo atual (manter e corrigir)

- Ao concluir análise simples ou comparação (modelo A canônico), chamar `performSave` (já implementado).
- Não bloquear UI se o save falhar; exibir toast de aviso e 1 retry em background.

### Metadados no create/update

```ts
metadata: {
  specialty: string,      // ex. "torax" — valor de VISION_SPECIALTIES
  imageType?: string,     // analysis.meta?.imageType
  source: "med-vision",
}
```

### Um laudo por análise (sem duplicatas)

1. Após `POST /api/artifacts` bem-sucedido, guardar `savedArtifactId` no estado da página Med Vision.
2. Saves subsequentes (refinamento regional concluído, anotações com debounce ~2s, edições de conteúdo) usam **`PATCH /api/artifacts/:id`** no mesmo id.
3. Remover botão primário **“Salvar na Biblioteca”**.
4. Exibir indicador: **Salvo na Biblioteca** / **Salvando…** / **Erro ao salvar** (com retry manual opcional).

### Toast pós primeiro save

- “Salvo na Biblioteca” com ação **Ver na Biblioteca** → `/dashboard/biblioteca`.

---

## 6. Reabertura no Med Vision

### URL

`/dashboard/odonto-vision?artifact=<artifactId>`

### Comportamento

1. No mount (client), se `artifact` presente: `GET /api/artifacts/:id`.
2. Validar: existe, `type === 'vision'`, usuário é dono.
3. Restaurar:
   - `image` ← `content.imageBase64`
   - `analysisResult` ← `content.analysis`
   - `annotations` ← `content.annotations`
   - `refinements` ← `content.refinements`
   - `specialty` ← `metadata.specialty` (fallback `geral`)
   - `savedArtifactId` = id
   - `isSaved = true`
4. `setState('RESULT')` — usuário vê laudo e abas Imagem/Laudo.
5. Erro 404/403: toast informativo; fluxo normal de nova análise.

### Entrada pela Biblioteca

- Card → preview → **Abrir no Med Vision**
- Menu do card → **Abrir no Med Vision**
- Ambos usam a mesma URL com query `artifact`.

---

## 7. Modelo de dados

Sem migration. Tabela `artifacts` existente.

### `type`

Sempre `vision` para laudos Med Vision.

### `content` (`VisionArtifactContent`)

| Campo | Uso |
|-------|-----|
| `thumbnailBase64` | Card e preview |
| `imageBase64` | Reabertura e PDF |
| `analysis` | Laudo completo |
| `annotations` | Marcadores na imagem |
| `refinements` | Refinamentos regionais |
| `analyzedAt` | ISO timestamp |

### `metadata`

| Campo | Uso |
|-------|-----|
| `specialty` | Filtro e badge no card |
| `imageType` | Contexto opcional |
| `source` | `"med-vision"` |

### Laudos legados

Sem `metadata.specialty`: exibir badge **Geral**; tentar inferir de `content.analysis.meta` quando existir; sempre visíveis em **Todas**.

---

## 8. Componentes e arquivos (implementação)

| Arquivo | Mudança |
|---------|---------|
| `lib/constants/navigation.ts` | Laudos → Biblioteca, novo href |
| `app/dashboard/biblioteca/page.tsx` | Página de lista (substituir UnavailablePage) |
| `app/dashboard/biblioteca/layout.tsx` | Remover bloqueio e overlay |
| `app/dashboard/laudos/page.tsx` | Redirect ou remover em favor de redirect config |
| `next.config` ou `middleware` | Redirects `/dashboard/laudos` e `/biblioteca/laudos` |
| `components/biblioteca/artifact-list.tsx` | Filtros especialidade/período; botão Abrir no Med Vision; PDF |
| `components/biblioteca/artifact-card.tsx` | Badge especialidade; ação Abrir no Med Vision |
| `app/dashboard/odonto-vision/page.tsx` | metadata no save; PATCH; load `?artifact`; UI de status; links biblioteca |
| `lib/hooks/use-artifacts.ts` | Opcional: helper de filtro por período no cliente |

Novos (se necessário):

- `components/biblioteca/biblioteca-filters.tsx` — barra de filtros reutilizável
- `lib/utils/biblioteca-filters.ts` — `filterByPeriod`, `filterBySpecialty`

---

## 9. Fora de escopo (YAGNI)

- Hub da biblioteca de estudo (resumos, flashcards, simulados, mapas) — rotas antigas permanecem sem destaque na nav.
- Preferência “salvar só manualmente”.
- Histórico de versões do laudo.
- Compartilhamento entre usuários.
- Filtros server-side por especialidade/período (v2 se necessário).

---

## 10. Critérios de aceite

- [ ] Sidebar exibe **Biblioteca** (não “Laudos”) apontando para `/dashboard/biblioteca`.
- [ ] `/dashboard/laudos` redireciona para `/dashboard/biblioteca`.
- [ ] Página Biblioteca lista laudos `vision` com busca, filtro de especialidade e filtro de período.
- [ ] Nova análise no Med Vision aparece na Biblioteca sem clique em salvar.
- [ ] Refinamento após análise atualiza o mesmo artefato (sem segundo card duplicado).
- [ ] Preview abre laudo; **Exportar PDF** gera arquivo.
- [ ] **Abrir no Med Vision** restaura imagem, laudo, anotações e refinamentos.
- [ ] Toast e botões do Med Vision apontam para `/dashboard/biblioteca`.
- [ ] Layout da biblioteca não exibe página “em atualização”.

---

## 11. Testes

### Manual / E2E

1. Concluir análise → verificar card na Biblioteca.
2. Aplicar refinamento → verificar um único card atualizado.
3. Preview → Exportar PDF → arquivo baixado.
4. Abrir no Med Vision → estado RESULT com dados corretos.
5. Filtros: especialidade e período reduzem lista corretamente.
6. Redirect de `/dashboard/laudos`.

### Regressão

- Auto-save em modo comparação de modelos continua salvando modelo A.
- Exclusão de laudo na Biblioteca remove da lista após confirmar.
