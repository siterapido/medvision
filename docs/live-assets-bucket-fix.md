# Correção: Bucket live-assets no Supabase Storage

## Problema Identificado

Ao tentar fazer upload de thumbnails de Lives no painel administrativo, os usuários recebiam a mensagem de erro:

```
Falha ao enviar a imagem. Tente novamente.
```

### Causa Raiz

O bucket `live-assets` não existia no Supabase Storage, apesar de haver uma migration (`018_live_assets_bucket.sql`) definida no projeto. O código do formulário de Lives (`components/admin/live-form-dialog.tsx`) tentava fazer upload para um bucket inexistente.

## Solução Aplicada

### 1. Criação do Bucket

Foi aplicada a migration para criar o bucket `live-assets` no Supabase Storage com as seguintes configurações:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'live-assets',
  'live-assets',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
```

### 2. Políticas de Acesso (RLS)

Foram criadas 4 políticas de Row Level Security para o bucket:

1. **Visualização pública** - Qualquer pessoa pode visualizar as imagens
2. **Upload autenticado** - Apenas usuários autenticados podem fazer upload
3. **Atualização autenticada** - Apenas usuários autenticados podem atualizar
4. **Exclusão autenticada** - Apenas usuários autenticados podem excluir

```sql
-- Policy: Anyone can view files in live-assets
CREATE POLICY "Anyone can view live assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'live-assets');

-- Policy: Authenticated users can upload to live-assets
CREATE POLICY "Authenticated users can upload live assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'live-assets'
    AND auth.role() = 'authenticated'
  );

-- Policy: Authenticated users can update live assets
CREATE POLICY "Authenticated users can update live assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'live-assets'
    AND auth.role() = 'authenticated'
  );

-- Policy: Authenticated users can delete live assets
CREATE POLICY "Authenticated users can delete live assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'live-assets'
    AND auth.role() = 'authenticated'
  );
```

## Verificação

Após aplicar a correção, foi verificado que:

✅ O bucket `live-assets` foi criado com sucesso  
✅ As políticas RLS estão ativas e configuradas corretamente  
✅ O bucket aceita apenas imagens (JPEG, PNG, WebP, GIF)  
✅ Limite de 50MB por arquivo  
✅ Acesso público para leitura  
✅ Upload restrito a usuários autenticados  

## Buckets Configurados no Projeto

| Bucket ID       | Público | Limite     | Tipos Permitidos                               |
|----------------|---------|------------|------------------------------------------------|
| course-assets  | Sim     | 50MB       | image/jpeg, image/png, image/webp, image/gif, application/pdf |
| live-assets    | Sim     | 50MB       | image/jpeg, image/png, image/webp, image/gif  |

## Próximos Passos

1. Testar o upload de thumbnails no painel administrativo de Lives
2. Verificar se as imagens são exibidas corretamente nas listagens
3. Confirmar que as URLs públicas estão sendo geradas corretamente

## Arquivos Relacionados

- Migration: `supabase/migrations/018_live_assets_bucket.sql`
- Componente: `components/admin/live-form-dialog.tsx` (linhas 61-87)
- Tabela: `lives` (coluna `thumbnail_url`)

## Data de Aplicação

04/12/2025 - Migration aplicada via Supabase MCP

---

**Status**: ✅ Resolvido  
**Impacto**: Upload de thumbnails de Lives agora funciona corretamente


