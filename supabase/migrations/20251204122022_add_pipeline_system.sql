-- =====================================================
-- Pipeline System - Kanban de Leads e Conversão
-- =====================================================

-- Add pipeline_stage column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pipeline_stage text;

COMMENT ON COLUMN public.profiles.pipeline_stage IS 'Etapa atual do lead no pipeline de conversão: novo_lead, trial_ativo, urgente, contato_realizado, proposta_enviada, convertido, perdido';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_pipeline_stage ON public.profiles(pipeline_stage);

-- Add check constraint for valid pipeline stages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_pipeline_stage_check'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_pipeline_stage_check
    CHECK (
      pipeline_stage IS NULL OR 
      pipeline_stage IN (
        'novo_lead',
        'trial_ativo',
        'urgente',
        'contato_realizado',
        'proposta_enviada',
        'convertido',
        'perdido'
      )
    );
  END IF;
END $$;

-- =====================================================
-- Pipeline Notes Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pipeline_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.pipeline_notes IS 'Notas e anotações sobre leads no pipeline de conversão';
COMMENT ON COLUMN public.pipeline_notes.user_id IS 'ID do usuário/lead relacionado';
COMMENT ON COLUMN public.pipeline_notes.note IS 'Texto da nota/anotação';
COMMENT ON COLUMN public.pipeline_notes.created_by IS 'ID do admin/usuário que criou a nota';
COMMENT ON COLUMN public.pipeline_notes.created_at IS 'Data e hora de criação da nota';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pipeline_notes_user_id ON public.pipeline_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_notes_created_at ON public.pipeline_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_notes_created_by ON public.pipeline_notes(created_by);

-- Enable Row Level Security
ALTER TABLE public.pipeline_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view and manage pipeline notes
CREATE POLICY "Admins can view all pipeline notes"
  ON public.pipeline_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert pipeline notes"
  ON public.pipeline_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Admins can update pipeline notes"
  ON public.pipeline_notes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Admins can delete pipeline notes"
  ON public.pipeline_notes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );


