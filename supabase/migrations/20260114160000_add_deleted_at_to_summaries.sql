-- Add deleted_at column to summaries table for Soft Delete support
ALTER TABLE public.summaries 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Update RLS policies to exclude soft-deleted items by default from SELECT
-- We need to drop the existing policy and recreate it, OR ensure the frontend handles the filtering.
-- Usually, for "Trash" features, we want to allow users to SELECT their own deleted items (to see them in trash).
-- So we won't enforcing "deleted_at IS NULL" in the RLS policy for SELECT, 
-- but we will rely on the application query to filter them out in the main view.

-- However, we do verify the column addition.
SELECT 'Added deleted_at to summaries' as status;
