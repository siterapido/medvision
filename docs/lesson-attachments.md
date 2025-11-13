# Anexos de Arquivos em Aulas

## Visão Geral
- Anexos são armazenados em bucket privado `lesson-attachments` no Supabase Storage.
- Metadados ficam na tabela `public.lesson_attachments`.
- Acesso aos arquivos é feito via URLs assinadas geradas pelos endpoints.

## Endpoints
- `POST /api/lessons/:lessonId/attachments`
  - Body: `multipart/form-data` com campo `file`.
  - Permissão: somente `admin`.
  - Validações: tipo e tamanho (padrão 10MB, configurável por `NEXT_PUBLIC_MAX_ATTACHMENT_MB`).
  - Resposta: `{ success: true, attachment: { id, file_name, mime_type, size_bytes, storage_path, created_at } }`.

- `GET /api/lessons/:lessonId/attachments`
  - Lista metadados dos anexos da aula.
  - Permissão: `admin` ou usuário participante do curso (`user_courses`).

- `GET /api/lessons/:lessonId/attachments/:attachmentId/download`
  - Retorna `{ url }` com URL assinada válida por 10 minutos.
  - Permissão: `admin` ou participante do curso.

- `DELETE /api/lessons/:lessonId/attachments/:attachmentId`
  - Remove o arquivo e seu metadado.
  - Permissão: somente `admin`.

## Banco de Dados
- Tabela `public.lesson_attachments`:
  - `id uuid PK` • `lesson_id uuid FK` • `file_name text` • `mime_type text` • `size_bytes bigint` • `storage_path text` • `uploaded_by uuid` • `created_at timestamptz`.
  - Índices em `lesson_id` e `created_at`.
  - RLS: SELECT para `admin` e participantes; INSERT/DELETE para `admin` (apenas se acessado direto).

## Storage
- Bucket `lesson-attachments` privado.
- Sem políticas de leitura pública.
- Upload/remoção feitos via service role no backend.

## Configuração
- `SUPABASE_SERVICE_ROLE_KEY`: obrigatório para geração de URLs assinadas.
- `NEXT_PUBLIC_MAX_ATTACHMENT_MB`: limite máximo de tamanho por arquivo (padrão 10).

## Frontend
- Admin: `AttachmentUploader` com validação client-side e barra de progresso.
- Aula: seção "Arquivos da aula" em `CoursePlayer` consumindo listagem e download seguro.

## Segurança
- Autenticação: Supabase Auth.
- Autorização: `admin` para upload/remoção; `admin` ou inscritos para listagem/download.

## Testes
- Unit: util de MIME e validações.
- Integração: validações e fluxo de download exercitados via UI.

