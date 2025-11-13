## Visão Geral
- Ampliar a aba `Materiais` no dashboard para exibir materiais categorizados, com metadados completos e ações.
- Integrar com o painel admin (criação/edição/exclusão) e sincronizar em tempo real via Supabase Realtime.
- Implementar responsividade, estados de carregamento/erro e testes cobrindo sincronização, performance e UX.

## Arquitetura & Padrões Existentes
- Next.js (App Router) com Supabase (`lib/supabase/server.ts` e `lib/supabase/client.ts`).
- UI baseada em Tailwind v4 e componentes `components/ui/*` (Card, Badge, Table, Dialog, Select). Tabs via `@radix-ui/react-tabs`.
- Dashboard shell e navegação: `components/dashboard/shell.tsx`, `components/dashboard/sidebar.tsx`.
- Materiais já listados em `app/dashboard/materiais/page.tsx:40-166` e gerenciados no admin via `components/admin/materials-manager.tsx:40-313`.
- Realtime já utilizado em `components/dashboard/live-events.tsx:79-89` como referência de implementação.

## Modelagem de Dados (Supabase)
- Adicionar colunas na tabela `public.materials`:
  - `updated_at TIMESTAMPTZ` (default `timezone('utc', now())`, atualizado em `UPDATE`).
  - `is_available BOOLEAN` (default `true`).
- Política RLS permanece: leitura pública; `INSERT/UPDATE/DELETE` apenas `role = 'admin'` (`016_materials_table.sql:25-48`).

## Server Actions e APIs
- Expandir `app/actions/materials.ts`:
  - `updateMaterial(id, data)` com validação `zod` e update de campos (inclui `updated_at` e `is_available`).
  - `deleteMaterial(id)` para remoção segura.
  - `revalidatePath('/dashboard/materiais', '/admin/materiais')` após mutações.
- Opcional: expor endpoints REST em `app/api/materials/*` para uso futuro (mantendo padrão atual de server actions).

## Interface da Aba (Usuário)
- `app/dashboard/materiais/page.tsx`:
  - Selecionar campos: `id, title, description, pages, tags, resource_type, file_url, created_at, updated_at, is_available`.
  - Organizar por categoria com Tabs (`@radix-ui/react-tabs`): `Todos`, `E-books`, `Slides`, `Checklist`, `Template`, `Vídeo`, `Link`, `Outro`.
  - Filtros rápidos por `tags` (chips) e busca básica (client-side) usando `components/ui/command.tsx` ou `Input`.
  - Cada card exibe: Nome/descrição, Tipo/categoria (Badge com cor), Datas (`created_at` e `updated_at`), Status (`Disponível/Indisponível`), Ações:
    - `Visualizar` (abre `file_url`)
    - `Editar`/`Excluir` apenas quando usuário é admin (UI condicional; se não admin, ocultar).
- Estados:
  - `loading.tsx` com esqueleto de grid (3×2) e badges placeholders.
  - Empty-state amigável com link para `/admin/materiais` (já existe em `page.tsx:72-80`).
  - Erro: captura `error` do Supabase e mostra mensagem contextual.

## Conexão Bidirecional & Atualização Automática
- Criar `components/materials/materials-realtime.tsx` (client):
  - Assinar canal `public:materials` com `.on('postgres_changes', { event: '*', table: 'materials' })`.
  - Mapear payload para tipo local e acionar `router.refresh()` ou atualizar estado do grid, seguindo o padrão de `live-events.tsx:79-89`.
- No admin (`components/admin/materials-manager.tsx`): após `create/update/delete`, chamar `router.refresh()` (já feito em `130-131`) e confiar no Realtime para refletir no dashboard.
- Opcional: mostrar contador de materiais no sidebar ou header (server-side) para reforçar a conexão.

## Responsividade & Acessibilidade
- Grid responsivo existente (`sm:grid-cols-2 lg:grid-cols-3`) permanece; garantir que Tabs e filtros funcionem bem em mobile (stack/scroll horizontal).
- Usar roles/aria em tabs e botões de ação; garantir foco/teclado.
- `DashboardScrollArea` já atende scroll suave e mobile (`components/layout/dashboard-scroll-area.tsx:7-15`).

## Tratamento de Erros & Carregamento
- `loading.tsx` dedicado para `/dashboard/materiais`.
- Try/catch em fetch server; exibir alerta discreto e fallback (empty-state) sem quebrar a página.
- Logs no server restritos (sem segredos) e `global-error.tsx` continua responsável por exceções.

## Ações Admin (Editar/Excluir)
- Em `components/admin/materials-manager.tsx`:
  - Adicionar ações por item: `Editar` (Dialog com formulário preenchido) e `Excluir` (AlertDialog de confirmação).
  - Usar `updateMaterial`/`deleteMaterial`; feedback visual (`status`), desabilitar durante `isPending`.

## Testes
- Sincronização de dados:
  - Testar mapeamento de payloads (`INSERT/UPDATE/DELETE`) em helper exportado (ex.: `lib/material/realtime.ts`) para garantir que o estado será atualizado corretamente.
- Performance (grande volume):
  - Criar `lib/material/grouping.ts` com `groupByType(materials)` e `filterByQuery(materials, q)`.
  - Teste com 10k materiais: agrupar/filtrar em <500ms (limite razoável), usando `node:test` e `assert`.
- UX multi-dispositivo:
  - Exportar constantes de classes/roles da UI da aba para teste (padrão semelhante a `dashboard-scroll-area.tsx`) e validar presença de `sm:grid-cols-*`, `lg:grid-cols-*`, roles/aria de Tabs.

## Passos de Implementação
1. Migration: adicionar `updated_at` e `is_available` em `supabase/migrations/017_materials_extras.sql` com trigger para `updated_at`.
2. Server actions: implementar `updateMaterial` e `deleteMaterial` em `app/actions/materials.ts`.
3. UI da aba: atualizar `app/dashboard/materiais/page.tsx` para selecionar novos campos, inserir Tabs e metadados, render condicional de ações admin.
4. Realtime: adicionar `components/materials/materials-realtime.tsx` e montar no topo da aba para auto-atualização.
5. Loading: criar `app/dashboard/materiais/loading.tsx` com skeletons.
6. Admin: expandir `components/admin/materials-manager.tsx` com editar/excluir (Dialog/AlertDialog) e uso das ações.
7. Tests: adicionar arquivos de teste em `tests/materials-sync.test.js`, `tests/materials-grouping-perf.test.js`, `tests/materials-ui.test.js` seguindo o pipeline `node:test`.

## Critérios de Aceite
- Materiais exibidos por categoria com filtros e busca.
- Cada card mostra nome/descrição, tipo, datas, status, ações.
- Conexão bidirecional comprovada: criar/editar/excluir no admin reflete automaticamente na aba via Realtime.
- UI responsiva e acessível; skeleton de carregamento e tratamento de erros aplicados.
- Testes passam: sincronização, performance (10k), validação de classes/roles responsivas.

## Considerações de Segurança
- Respeitar RLS: ações admin ocultas para não-admin; sem exposição de chaves.
- Sanitizar inputs com `zod`; nunca logar `file_url` sensível em produção.