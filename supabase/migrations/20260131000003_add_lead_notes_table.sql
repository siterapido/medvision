-- =====================================================
-- Lead Notes Table for Cold Leads
-- =====================================================
-- Similar to pipeline_notes but for cold leads (before they become profiles)

CREATE TABLE IF NOT EXISTS public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.lead_notes IS 'Notas e anotações sobre cold leads no funil de prospecção';
COMMENT ON COLUMN public.lead_notes.lead_id IS 'ID do lead relacionado';
COMMENT ON COLUMN public.lead_notes.note IS 'Texto da nota/anotação';
COMMENT ON COLUMN public.lead_notes.created_by IS 'ID do admin/vendedor que criou a nota';
COMMENT ON COLUMN public.lead_notes.created_at IS 'Data e hora de criação da nota';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_at ON public.lead_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_by ON public.lead_notes(created_by);

-- Enable Row Level Security
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- Admins can view all notes, vendedores only their leads' notes
CREATE POLICY "Admins and vendedores can view lead notes"
  ON public.lead_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (
        p.role = 'admin'
        OR (
          p.role = 'vendedor'
          AND EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = public.lead_notes.lead_id
            AND l.assigned_to = auth.uid()
          )
        )
      )
    )
  );

-- Admins and vendedores can insert notes on their leads
CREATE POLICY "Admins and vendedores can insert lead notes"
  ON public.lead_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (
        p.role = 'admin'
        OR (
          p.role = 'vendedor'
          AND EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_id
            AND l.assigned_to = auth.uid()
          )
        )
      )
    )
    AND created_by = auth.uid()
  );

-- Users can only delete their own notes
CREATE POLICY "Users can delete their own lead notes"
  ON public.lead_notes
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
