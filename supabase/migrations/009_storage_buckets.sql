-- ============================================================================
-- STORAGE: Create buckets for course assets
-- ============================================================================

-- Insert bucket for course assets (thumbnails, materials, etc)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-assets',
  'course-assets',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- POLICIES: Storage policies for course-assets bucket
-- ============================================================================

-- Policy: Anyone can view files in course-assets
CREATE POLICY "Anyone can view course assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-assets');

-- Policy: Authenticated users can upload to course-assets
CREATE POLICY "Authenticated users can upload course assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'course-assets'
    AND auth.role() = 'authenticated'
  );

-- Policy: Authenticated users can update their own uploads
CREATE POLICY "Authenticated users can update course assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'course-assets'
    AND auth.role() = 'authenticated'
  );

-- Policy: Authenticated users can delete their own uploads
CREATE POLICY "Authenticated users can delete course assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'course-assets'
    AND auth.role() = 'authenticated'
  );
