-- ============================================================================
-- STORAGE: Create bucket for live assets
-- ============================================================================

-- Insert bucket for live assets (thumbnails)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'live-assets',
  'live-assets',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- POLICIES: Storage policies for live-assets bucket
-- ============================================================================

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