-- =====================================================
-- Migration 019: Campos de updated_at e is_available em materials
-- =====================================================

BEGIN;

ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true NOT NULL;

CREATE OR REPLACE FUNCTION public.set_materials_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_materials_updated_at ON public.materials;
CREATE TRIGGER update_materials_updated_at
BEFORE UPDATE ON public.materials
FOR EACH ROW
EXECUTE FUNCTION public.set_materials_updated_at();

COMMIT;

