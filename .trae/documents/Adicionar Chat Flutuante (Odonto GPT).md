## Diagnóstico

* Confirmar onde o erro é exibido: `app/dashboard/materiais/page.tsx:82-85`.

* Capturar a causa real (`error.message`) do Supabase PostgREST na consulta inicial para diferenciar:

  * Coluna inexistente (sintoma comum quando migrações não foram aplicadas).

  * Problemas de credenciais/env (`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`).

  * Falhas de rede ou PostgREST indisponível.

* Conferir rapidamente se outras abas que consultam Supabase funcionam; se só Materiais quebra, o suspeito são colunas novas desta tabela.

## Verificação das migrações

* Validar se a base em uso tem `public.materials` com as colunas:

  * `updated_at` e `is_available` (adicionadas em `supabase/migrations/019_materials_updated_at_availability.sql`).

* Se ausentes, aplicar a migração 019 para alinhar o schema do ambiente com o código:

  * `ALTER TABLE public.materials ADD COLUMN updated_at timestamptz ...; ADD COLUMN is_available boolean ...;`

  * Garantir o trigger `update_materials_updated_at` para manter `updated_at`.

* Conferir RLS:

  * `SELECT` liberado para todos (`supabase/migrations/016_materials_table.sql:27-30`).

  * Políticas de escrita só exigem `profiles.role = 'admin'` (não afetam leitura).

## Ajuste de robustez na consulta

* Atualizar leitura no dashboard para sobreviver a drift de schema temporário:

  * Trocar a seleção explícita por `select("*")` em `app/dashboard/materiais/page.tsx:51`.

  * Mapear os campos com defaults seguros:

    * `tags ?? []`, `pages ?? null`, `is_available ?? true`, `updated_at ?? created_at`.

  * Alternativa (fallback): manter a seleção atual e, se `error.code` indicar coluna inexistente, fazer uma segunda consulta só com colunas garantidas (`id, title, description, pages, tags, resource_type, file_url, created_at`).

* Replicar o mesmo padrão na página admin: `app/admin/materiais/page.tsx:13`.

## UX e observabilidade

* Logar `error.message` no servidor para facilitar suporte, sem expor detalhes sensíveis na UI.

* Manter a mensagem amigável ao usuário, mas adicionar um fallback de retry leve (recarregar ao receber eventos Realtime, já existente em `components/materials/materials-realtime.tsx:12-17`).

## Filtragem e ordenação

* Opcional: exibir apenas materiais com `is_available = true` (quando a coluna existir), mantendo ordenação por `created_at desc`.

## Validação

* Rodar localmente, abrir “Materiais” e confirmar:

  * Sem erro quando migrações estão aplicadas.

  * Com migrações antigas, a UI continua carregando (via `select("*")`) e exibe dados sem quebrar.

* Verificar “Admin > Materiais” para garantir consistência e CRUD intactos.

## Entregáveis

* Código do dashboard e admin ajustado para consulta resiliente.

* Orientação para aplicar a migração 019 no ambiente que está quebrando.

* Breve logging do erro no servidor para suporte.

