# Anexos de Arquivos em Aulas

## Visão Geral
- Arquivos são enviados para o Bunny Storage (Storage Zone definida por `BUNNY_STORAGE_ZONE`), servidos via CDN em `BUNNY_CDN_BASE_URL` (ex.: `https://odontogpt.b-cdn.net`).
- Metadados permanecem na tabela `public.lesson_attachments` no Supabase.
- O backend valida permissão e entrega a URL CDN já pronta para download.

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
  - Retorna `{ url }` apontando para o arquivo no Bunny CDN (CDN pública, apenas liberada após checagem de permissão).
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
- Bunny Storage (Object Storage) com paths `lessons/{lessonId}/{uuid}.{ext}`.
- CDN pública configurada em `BUNNY_CDN_BASE_URL`.
- Upload e remoção feitos pelo backend usando a Storage API do Bunny (AccessKey).

## Configuração
- `BUNNY_STORAGE_ZONE`: nome da Storage Zone.
- `BUNNY_STORAGE_API_KEY`: AccessKey da Storage Zone (não do pull zone).
- `BUNNY_CDN_BASE_URL`: domínio CDN público (ex.: `https://odontogpt.b-cdn.net`).
- `BUNNY_STORAGE_HOST` (opcional): host da região do Bunny, padrão `storage.bunnycdn.com`.
- `NEXT_PUBLIC_MAX_ATTACHMENT_MB`: limite máximo de tamanho por arquivo (padrão 10). Para vídeos subidos pelo admin, aumente conforme necessário (ex.: 500).
- Para esta instância, configure `.env.local` com as credenciais enviadas (ex.: `BUNNY_STORAGE_API_KEY=<chave fornecida>`).

## Frontend
- Admin: `AttachmentUploader` com validação client-side, barra de progresso e envio direto para o Bunny (PDF, imagens e vídeos leves).
- Formulário de aula (Nova/Editar): botões de upload preenchem automaticamente a URL do vídeo e dos materiais; os arquivos vão para `/api/uploads/materials` com pasta por curso.
- Aula: seção "Arquivos da aula" em `CoursePlayer` consumindo listagem e download seguro.

## Segurança
- Autenticação: Supabase Auth.
- Autorização: `admin` para upload/remoção; `admin` ou inscritos para listagem/download.
- O link CDN só é devolvido após checagem de permissão no endpoint; evite compartilhar publicamente para manter controle de acesso.

## Testes
- Unit: util de MIME e validações.
- Integração: validações e fluxo de download exercitados via UI.
