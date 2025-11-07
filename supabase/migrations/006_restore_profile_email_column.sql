-- =====================================================
-- Restore email column on profiles (required by handle_new_user trigger)
-- =====================================================

-- Recreate email column if it was dropped in the hosted database
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email text;

COMMENT ON COLUMN public.profiles.email IS 'User email cached from auth.users for quick filtering and display.';

-- Backfill email using auth.users so existing profiles stay consistent
UPDATE public.profiles AS p
SET email = u.email
FROM auth.users AS u
WHERE p.id = u.id
  AND (p.email IS NULL OR btrim(p.email) = '');
