## Objetivo
- Exibir um gráfico de linha da Trilha do curso contabilizando aulas de todos os módulos.
- Mostrar o gráfico tanto:
  - No detalhe do curso (CoursePlayer).
  - Nos cards de cursos (dashboard e catálogo).

## Base de Dados
- As aulas de todos os módulos já são retornadas no detalhe do curso:
  - `app/dashboard/cursos/[id]/page.tsx:123` usa `getLessonModuleSupport` para detectar suporte a módulos.
  - `app/dashboard/cursos/[id]/page.tsx:142-152` define os campos da seleção de aulas, incluindo `module_id` quando disponível.
  - `app/dashboard/cursos/[id]/page.tsx:174-185` monta `normalizedLessons` com aulas, módulo e materiais.
- No player, já existe agregação por módulo e uma lista linear da trilha:
  - `components/courses/course-player.tsx:364-422` monta `groupedByModules` (inclui "Sem módulo").
  - `components/courses/course-player.tsx:424-425` expõe `flattenedForIndex` com todas as aulas em ordem (ideal para o gráfico).
- A contagem total de aulas por curso (todos os módulos) já é mantida pelo banco:
  - Trigger `update_course_lessons_count` em `supabase/migrations/010_course_structure_refactor.sql:107-138` atualiza `courses.lessons_count` em INSERT/DELETE de `lessons`.

## Biblioteca de Gráficos
- Usar `recharts` já presente no projeto (`package.json:66`).

## Implementação — Detalhe do Curso
1. Criar `components/courses/trail-line-chart.tsx` com `ResponsiveContainer` + `LineChart`.
2. Props: `lessons: CoursePlayerLesson[]`, `completedIds?: string[]` ou `progress`.
3. Gerar pontos a partir de `flattenedForIndex`:
   - X: índice sequencial da trilha (ordem geral de aulas).
   - Y: cumulativo simples (1..N) ou duração cumulativa (opcional).
   - Destaque de progresso com cor/gradiente para aulas concluídas (`completed` já calculado no player).
4. Integrar o componente no `CoursePlayer` próximo às métricas de progresso, consumindo `flattenedForIndex` e estado `completed`:
   - Local de integração: cabeçalho do `CoursePlayer` antes/junto da barra de progresso.

## Implementação — Cards de Cursos
1. Criar `components/dashboard/course-sparkline.tsx` (versão mini):
   - Props: `lessonsCount: number`, `progress: number`.
   - Gera uma série linear de N pontos (N = `lessonsCount`), marcando a fração concluída por `progress`.
   - Visual simples (sparkline) para não exigir carregamento de todas as aulas no catálogo.
2. Integrar o sparkline:
   - `components/dashboard/course-grid.tsx` (cards do dashboard): inserir o sparkline no overlay inferior junto da barra de progresso (ex.: acima da barra ou ao lado das métricas).
   - `app/dashboard/cursos/page.tsx` dentro de `renderCourseCard`: adicionar o sparkline no bloco inferior junto das métricas.
3. Performance: não buscar aulas no catálogo; usar apenas `lessons_count` (já soma todos os módulos via trigger) e `progress`.

## Estilo e Temas
- Usar variáveis de cor para charts (`styles/globals.css:62-66` ou `app/globals.css:115-119`).
- Aplicar gradiente conforme guia (`UI_UX_GUIDE.md` menciona fundos para charts).

## Validação
- Testar com cursos:
  - Com módulos e sem módulos (agrupamento e ordenação por `order_index`).
  - Com progresso 0%, parcial e 100%.
- Confirmar que o número de pontos = total de aulas; a fração destacada respeita `progress` e/ou `completed`.

## Entregáveis
- `trail-line-chart.tsx` (detalhe do curso) integrado ao `CoursePlayer`.
- `course-sparkline.tsx` integrado aos cards no dashboard e catálogo.
- Sem alterações de schema/DB; apenas UI.

## Observação
- Se desejar refletir a distribuição real por módulo nos cards (não linear), podemos adicionar lazy-load dos pontos por curso quando o card estiver visível. Inicialmente, seguimos a versão leve com base em `lessons_count` para garantir boa performance no catálogo.