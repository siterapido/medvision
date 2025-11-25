## Visão Geral

* Adicionar “Cadastrar Lives” ao painel admin, reutilizando padrões do módulo de cursos.

* Criar tabela `public.lives` com RLS e bucket `live-assets` para thumbnails.

* Fluxo completo: cadastro → listagem → edição → exclusão, com status: `agendada`, `realizada`, `cancelada`.

* Integrar lives na página `"/dashboard/cursos"`, mantendo os carrosséis e adicionando filtro de tipo.

## Banco de Dados (Supabase)

1. Nova tabela `public.lives`:

   * Campos: `id uuid PK`, `title text`, `description text`, `instructor text`, `scheduled_at timestamptz NOT NULL`, `status text CHECK (status IN ('agendada','realizada','cancelada')) DEFAULT 'agendada'`, `thumbnail_url text`, `is_published boolean DEFAULT true`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`.

   * Índices: `created_at DESC`, `scheduled_at`.
2. RLS e Políticas:

   * `ENABLE ROW LEVEL SECURITY` em `public.lives`.

   * Leitura pública: `SELECT` para todos onde `is_published = true`.

   * Gestão: `INSERT/UPDATE/DELETE` apenas para `profiles.role = 'admin'`.
3. Storage:

   * Criar bucket `live-assets` (público para leitura) com `allowed_mime_types` para imagens e upload permitido a usuários autenticados.

## Validações e Tipos

* `lib/validations/live.ts`:

  * `liveFormSchema` (Zod): `title`, `description`, `instructor`, `thumbnail_url?`, `scheduled_at` (`string` → `Date`), `status` (`agendada|realizada|cancelada`), `is_published`.

  * Regra: `scheduled_at` deve ser futura (`refine(date > new Date())`).

  * Tipos exportados: `LiveFormData`.

## Ações de Servidor

* `app/actions/lives.ts`:

  * `createLive(formData)`: valida, normaliza e insere em `public.lives`; `revalidatePath('/admin/lives')` e `revalidatePath('/dashboard/cursos')`.

  * `updateLive(liveId, formData)`: valida/atualiza campos;

  * `deleteLive(liveId)`;

  * `togglePublishLive(liveId, currentStatus)`;

  * (Opcional) `bulkActionLives({ action, liveIds })` para excluir/publicar/despublicar em lote.

* Reutilizar padrão de `app/actions/courses.ts` (safeParse + normalização + revalidate).

## Upload de Thumbnail (Reuso)

* Reutilizar lógica de upload dos cursos:

  * Basear em `components/admin/course-form-dialog.tsx` e `components/admin/course-workspace.tsx`.

  * Ajustar bucket para `live-assets`.

  * Fluxo: `supabase.storage.from('live-assets').upload(...)` → `getPublicUrl(...)` → preencher `thumbnail_url`.

## Admin: Nova Aba e Gestão

1. Menu Admin

   * `components/admin/sidebar.tsx`: adicionar `{ name: 'Cadastrar Lives', href: '/admin/lives', icon: Calendar }` ao array `navigation` (referência: `components/admin/sidebar.tsx:38-42`).
2. Página Admin

   * `app/admin/lives/page.tsx`: espelhar `app/admin/cursos/page.tsx` para carregar usuário, perfil, e listar lives ordenadas por `created_at`.

   * Componente container `app/admin/lives/live-management.tsx`: similar ao `course-management`, com barra de ações (criar live, busca, filtro por status) e tabela.
3. Diálogo de Formulário

   * `components/admin/live-form-dialog.tsx`: campos obrigatórios (título, descrição, instrutor), `input type="datetime-local"` para `scheduled_at`, `Select` para `status`, upload de thumbnail.

   * Validação inline e exibição de erros conforme padrão de `CourseFormDialog`.
4. Tabela

   * `components/admin/lives-table.tsx`: colunas: thumb, título, instrutor, data/hora (formatada), status, publicado, ações (editar, excluir, publicar/despublicar). Reuso de `AlertDialog` para confirmar exclusão.

## Dashboard: Integração com Cursos

1. Página `app/dashboard/cursos/page.tsx`

   * Buscar lives: `supabase.from('lives').select('id,title,description,thumbnail_url,scheduled_at,status,is_published')` após carregar cursos (referências atuais de consulta a cursos: `app/dashboard/cursos/page.tsx:57-73`).

   * Divisões:

     * `livesAgendadas`: `status==='agendada' && scheduled_at > now`.

     * `livesRealizadas`: `status==='realizada'` (opcional listar em bloco separado ou não exibir aqui).

   * Exibição:

     * Novo bloco “Lives Agendadas” com `CourseCarousel`, rendendo cards de lives.

     * Manter “Cursos Em Breve” e “Meus Cursos” como estão (referências de carrossel: `app/dashboard/cursos/page.tsx:268-301`).
2. Filtro de Tipo

   * Inserir `Select` no header da página (padrão shadcn) para `Tipo`: `Todos | Cursos | Lives`.

   * Componente client leve `components/dashboard/content-type-filter.tsx` que recebe listas e controla visibilidade dos blocos; a página continua server-side.
3. Card de Live

   * Função `renderLiveCard(live)` com visual consistente ao `renderCourseCard` (referência de card: `app/dashboard/cursos/page.tsx:162-240`).

   * Badge “Live” e chip com data/hora: `new Date(live.scheduled_at).toLocaleString('pt-BR', { dateStyle:'short', timeStyle:'short' })`.

   * Sem barra de progresso; sem contadores de aulas/materiais.

## Edição e Exclusão (Admin)

* A tabela de lives oferece “Editar” (abre `live-form-dialog` com `initialData`) e “Excluir” com confirmação.

* Alteração de status: disponível na edição; opcional ação rápida na linha.

## Consistência Visual

* Reusar `Button`, `Select`, `Badge`, `Dialog` de `@/components/ui/*`.

* Gradientes e estilos iguais ao módulo de cursos.

## Verificações e Revalidações

* Após cada action de live, revalidar `/admin/lives` e `/dashboard/cursos`.

* Validação de data futura: bloqueia submissão se `scheduled_at <= agora`.

* Upload: aceitar apenas `image/*`, exibir preview.

## Referências de Código

* Sidebar admin: `components/admin/sidebar.tsx:38-42`.

* Página Dashboard de cursos (consultas e carrosséis): `app/dashboard/cursos/page.tsx:57-73`, `126-134`, `162-240`, `268-301`.

* Ações servidor (padrão a reutilizar): `app/actions/courses.ts`.

* Validações com Zod: `lib/validations/course.ts`.

* Upload de imagens: `components/admin/course-form-dialog.tsx` e `components/admin/course-workspace.tsx`.

## Entregáveis

* Migrações SQL para `public.lives` + políticas RLS e bucket `live-assets`.

* Arquivos: `lib/validations/live.ts`, `app/actions/lives.ts`, `app/admin/lives/page.tsx`, `app/admin/lives/live-management.tsx`, `components/admin/live-form-dialog.tsx`, `components/admin/lives-table.tsx`, ajuste em `components/admin/sidebar.tsx`.

* Atualização em `app/dashboard/cursos/page.tsx` para listar lives e adicionar filtro de tipo.

## Observações

* “Manter a visualização de custos existente”: cursos continuam exibindo preço como hoje; lives não exibem preço.

* Se desejar preço em lives, adicionamos campo opcional `price` posteriormente, sem impacto no fluxo acima.

