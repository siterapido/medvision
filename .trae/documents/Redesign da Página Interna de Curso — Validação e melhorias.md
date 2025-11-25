## Objetivo
Validar o redesign da página interna de curso (minimalista, centrada em vídeo) e implementar melhorias incrementais: compatibilidade de vídeo (HLS), UX de navegação, acessibilidade, e persistência de estado.

## Verificação Funcional
1. Conferir layout "cinema mode": padding removido em rotas `/dashboard/cursos` (`components/dashboard/shell.tsx:204–207`).
2. Validar player 16:9 e normalização de URLs: YouTube/Vimeo/Bunny/arquivos diretos (`components/courses/course-player.tsx:147–190`, `192–194`, `419–437`).
3. Testar Sidebar com Accordion: módulos colapsáveis, progresso e scroll independente (`components/courses/course-player.tsx:668–724`, `664–666`).
4. Navegar pelas abas: "Visão Geral", "Materiais", "Arquivos" (`components/courses/course-player.tsx:493–541`, `546–637`).
5. Marcar aula como concluída e persistir progresso via API (`components/courses/course-player.tsx:297–318`, `195–215`; `app/api/courses/lessons/complete/route.ts:6–12`, `52–67`, `102–118`).
6. Confirmar integração da página: montagem de curso/módulos/aulas/materiais/progresso (`app/dashboard/cursos/[id]/page.tsx:93–121`, `123–140`, `154–171`, `187–203`).

## QA de Responsividade e UX
1. Desktop: sidebar fixa à direita, vídeo centralizado, rolagem fluida.
2. Mobile: sidebar como drawer, overlay e controle de abertura/fechamento (`components/courses/course-player.tsx:641–735`).
3. Performance: medir CLS/INP no carregamento inicial da rota e troca de aula.

## Compatibilidade de Vídeo (HLS)
1. Implementar fallback com `hls.js` para `.m3u8` em navegadores sem suporte nativo (Chrome/Edge). Condição: quando `isVideoFile` detectar HLS e `HTMLVideoElement.canPlayType('application/vnd.apple.mpegurl')` retornar falso.
2. Carregamento lazy de `hls.js` para não penalizar casos YouTube/Vimeo/Bunny.

## Persistência e Profundidade de Navegação
1. Persistir aula selecionada na URL (query `?lesson=<id>`) para deep-linking; ler no mount e sincronizar `currentLessonId`.
2. (Opcional) Auto-avançar para próxima aula ao concluir, respeitando preferência do usuário.

## Acessibilidade
1. Garantir foco visível na troca de aba e item selecionado da sidebar.
2. `aria-label`/`title` no iframe e botões de ação; validar navegação por teclado.

## Segurança
1. Sanitizar/validar URLs antes de abrir em nova aba para materiais; já há sanitização básica de vídeo, reforçar para materiais.
2. Revisar `allow` do iframe para escopo mínimo necessário.

## Testes
1. Smoke tests de renderização do `CoursePlayer` com mocks de aulas/módulos/materiais.
2. Teste de normalização de URLs (YouTube/Vimeo/Bunny/MP4/M3U8).
3. Teste de integração do endpoint de conclusão (mock supabase).

## Entregáveis
- Compatibilidade HLS com fallback inteligente.
- Deep-linking da aula atual.
- Ajustes de acessibilidade e segurança.
- Smoke tests e utilitários de normalização cobertos por testes.