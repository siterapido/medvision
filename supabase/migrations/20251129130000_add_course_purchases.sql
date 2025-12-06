-- =====================================================
-- Migration: Add Course Purchases and Cakto Product ID
-- Created: 2025-11-29
-- Description: Adds support for individual course purchases via Cakto
-- =====================================================

BEGIN;

-- 1) Add cakto_product_id to courses table
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS cakto_product_id text;

COMMENT ON COLUMN public.courses.cakto_product_id IS 'ID do produto no Cakto para compra avulsa do curso.';

-- 2) Create course_purchases table
CREATE TABLE IF NOT EXISTS public.course_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  transaction_id text NOT NULL,
  amount numeric(10,2),
  status text DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, course_id),
  UNIQUE(transaction_id)
);

-- 3) Enable RLS and add policies
ALTER TABLE public.course_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias compras" ON public.course_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

GRANT SELECT ON public.course_purchases TO authenticated;
GRANT ALL PRIVILEGES ON public.course_purchases TO service_role;

-- 4) Update "Prescrição em Odontologia" with the specific Cakto product ID
-- Using ILIKE to be case-insensitive and matching broadly if needed, but 'Prescrição em Odontologia' seems specific enough.
UPDATE public.courses
SET cakto_product_id = '3dtg9j3_671071'
WHERE title ILIKE '%Prescrição em Odontologia%';

COMMIT;












