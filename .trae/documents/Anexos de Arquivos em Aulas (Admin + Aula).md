## Visão Geral

* Implementar anexos de arquivos por aula com upload seguro, validação de tipo/tamanho, feedback visual e download autorizado.

* Stack existente: Next.js (App Router), Supabase (Auth, Postgres, Storage), React Hook Form, Zod, Tailwind/Radix.

* Alinhar ao padrão atual: usar `lib/supabase/server.ts`/`admin.ts`, `react-hook-form`, validações com `zod`, UI com componentes `components/ui/*` e ícones `lucide-react`.

## Mudanças de Banco

* Criar tabela `lesson_attachments` para metadados:

  * Campos: `id (uuid)`, `lesson_id (uuid FK lessons.id)`, `file_name`, `mime_type`, `size_bytes`, `storage_path`, `uploaded_by (uuid)`, `created_at`.

  * Índices: `idx_lesson_attachments_lesson_id`, `idx_lesson_attachments_created_at`.

  * Políticas RLS (se usar SELECT direto):

    * `SELECT`: usuários autenticados com acesso à aula (participantes do curso) ou `admin`.

    * `INSERT/DELETE`: apenas `admin`.

* Estratégia de Storage:

  * Usar bucket privado (novo `lesson-attachments`) ou tornar privado o atual e manter materiais públicos em bucket separado.

  * Organização de path: `lessons/{lessonId}/{uuid}.{ext}`.

## Endpoints Backend (REST)

* `app/api/lessons/[lessonId]/attachments/route.ts`

  * `POST`: recebe `multipart/form-data` (`file`), valida tipo e tamanho (máx `NEXT_PUBLIC_MAX_ATTACHMENT_MB` padrão 10MB), verifica `admin` e existência da aula, faz upload ao bucket privado, grava metadados em `lesson_attachments`, retorna JSON do anexo.

  * `GET`: lista anexos da aula (metadados) para usuários autorizados.

* `app/api/lessons/[lessonId]/attachments/[attachmentId]/download/route.ts`

  * `GET`: valida autorização (participação no curso da aula ou `admin`), gera URL assinada temporária via `createAdminClient` e redireciona/retorna a URL.

* `app/api/lessons/[lessonId]/attachments/[attachmentId]/route.ts`

  * `DELETE`: somente `admin`; remove objeto no Storage e entrada em `lesson_attachments`.

* Reuso de helpers:

  * Supabase clients: `lib/supabase/server.ts`, `lib/supabase/admin.ts`.

  * Resolução de papéis: `lib/auth/roles.ts`.

  * Curso/aula/participação: usar padrões de `app/api/courses/lessons/complete/route.ts` para checagens (curso ↔ aula ↔ user).

## UI Admin

* Componente reutilizável `components/admin/attachment-uploader.tsx`:

  * `<input type="file" multiple>` com `accept` cobrindo PDF, DOCX, PPTX, XLSX, imagens, ZIP.

  * Validação client-side (tipo/tamanho 10MB), lista de arquivos selecionados e barra de progresso por arquivo.

  * Upload via `XMLHttpRequest` para capturar `onprogress` ao endpoint `POST /api/lessons/[lessonId]/attachments`.

  * Após sucesso, atualiza a lista de anexos renderizada.

* Integração em `components/admin/lesson-form-dialog.tsx`:

  * Adicionar seção "Anexos da aula" com `AttachmentUploader` e tabela de anexos (nome, tipo, tamanho, data, ações: baixar, remover).

  * Mapear ícones por MIME usando `lucide-react` (PDF, Word, PowerPoint, Excel, Imagem, ZIP, genérico).

  * Manter compatibilidade com campo existente `materials` (não remover), porém separar UI de anexos dos materiais embutidos.

## Página da Aula

* Atualizar `components/courses/course-player.tsx`:

  * Adicionar seção "Arquivos da aula" abaixo do conteúdo, consumindo `GET /api/lessons/[lessonId]/attachments`.

  * Renderizar ícone por tipo, nome, tamanho e `created_at`.

  * Botão "Baixar" chama `GET /api/.../download`, garantindo controle de acesso e URLs temporárias.

## Segurança e Permissões

* Autenticação: usar `lib/supabase/server.ts` para obter usuário no backend.

* Autorização upload: somente `admin` nas rotas `POST/DELETE` de anexos.

* Autorização download/lista: `admin` ou usuário participante do curso da aula (consultar `user_courses`).

* Storage: bucket privado + URLs assinadas; nunca expor chaves sensíveis no cliente.

* Env necessário: `SUPABASE_SERVICE_ROLE_KEY` (para gerar URLs assinadas) e `NEXT_PUBLIC_MAX_ATTACHMENT_MB=10`.

## Validações

* Client: tipo e tamanho por arquivo antes do envio.

* Server: repetir validação de tipo/tamanho e rejeitar formatos não suportados.

* MIME whitelist: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `image/*`, `application/zip`.

## Testes

* Unit (frontend): validar util de `mime→ícone`, validação de tipo/tamanho.

* Unit (backend): validações e helpers de autorização.

* Integração (backend):

  * `POST` upload com arquivo válido e inválido (tipo/tamanho).

  * `GET` listagem com usuário autorizado vs não autorizado.

  * `GET` download retorna URL assinada quando autorizado.

  * `DELETE` remove metadata e objeto.

* Fluxo quase-e2e (frontend simulado): selecionar arquivos, progresso, atualização da lista.

## Entregáveis

* Código fonte completo (frontend e backend) com componentes e rotas descritos.

* Documentação técnica em `docs/lesson-attachments.md` (arquitetura, endpoints, políticas, limites).

* Relatório de testes: resultados dos testes unitários e de integração (sumário + comandos).

* Guia de uso para administradores: como anexar/remover/baixar anexos.

## Migração e Compatibilidade

* Manter campo `materials` existente para não quebrar fluxos antigos; nova feature usa `lesson_attachments`.

* Opcional (futuro): criar tarefa de migração para transformar `materials` em anexos físicos armazenados e registros em `lesson_attachments`.

## Arquivos/Locais Alvo (referência)

* Backend:

  * `app/api/lessons/[lessonId]/attachments/route.ts` (POST/GET).

  * `app/api/lessons/[lessonId]/attachments/[attachmentId]/download/route.ts` (GET).

  * `app/api/lessons/[lessonId]/attachments/[attachmentId]/route.ts` (DELETE).

  * `lib/auth/roles.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts` (reuso).

* Banco:

  * `supabase/migrations/0xx_lesson_attachments.sql` (nova migração).

* Frontend Admin:

  * `components/admin/attachment-uploader.tsx` (novo).

  * `components/admin/lesson-form-dialog.tsx` (integrar seção de anexos).

* Frontend Aula:

  * `components/courses/course-player.tsx` (seção de anexos e download seguro).

* Config:

  * `.env.local`: `NEXT_PUBLIC_MAX_ATTACHMENT_MB=10`, `SUPABASE_SERVICE_ROLE_KEY`.

## Passos de Implementação

1. Criar migração `lesson_attachments` e ajustar bucket privado.
2. Implementar endpoints REST com validação e auth.
3. Criar `AttachmentUploader` com progresso e validações.
4. Integrar anexos na UI de aula (admin) e lista/remoção.
5. Adicionar seção de anexos na página da aula com download seguro.
6. Escrever testes unitários e de integração.
7. Documentar e fornecer guia para administradores.

## Observações

* O projeto já possui upload client-side em `lesson-form-dialog.tsx`; será substituído para anexos por chamadas ao backend, mantendo `materials` como legacy.

* O limite de 10MB será aplicado client + server; o bucket tem limite 50MB, então não haverá conflito.

* Ícones por tipo usarão `lucide-react` (já instalado).

