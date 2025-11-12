-- =====================================================
-- Migration 016: Tabela de materiais e políticas
-- =====================================================

CREATE TABLE IF NOT EXISTS public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  pages integer NOT NULL DEFAULT 0 CHECK (pages >= 0),
  tags text[] DEFAULT ARRAY[]::text[],
  resource_type text NOT NULL DEFAULT 'ebook',
  file_url text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT materials_resource_type_check CHECK (resource_type IN (
    'ebook',
    'slides',
    'checklist',
    'template',
    'video',
    'link',
    'outro'
  ))
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read materials"
  ON public.materials FOR SELECT
  USING (true);

CREATE POLICY "Admins podem gerir materiais"
  ON public.materials FOR INSERT, UPDATE, DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles admins
      WHERE admins.id = auth.uid()
        AND admins.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles admins
      WHERE admins.id = auth.uid()
        AND admins.role = 'admin'
    )
  );

INSERT INTO public.materials (id, title, description, pages, tags, resource_type, file_url)
VALUES
  (
    '93e45942-9691-4c68-93bb-664c1b2e7ce5',
    'Guia Prático de Gestão Clínica Odontológica',
    'Checklist de operações, comunicação com pacientes e indicadores monitorados pela IA.',
    52,
    ARRAY['Gestão', 'Protocolos', 'Inovação'],
    'ebook',
    '/ebooks/gestao-clinica.pdf'
  ),
  (
    '76496a8e-4c9e-46b5-bbbf-19b5e7b8d9a5',
    'Marketing Clínico para Consultórios Modernos',
    'Estratégias digitais e offline para atrair pacientes premium e manter a retenção.',
    48,
    ARRAY['Marketing', 'Conteúdo', 'Digital'],
    'ebook',
    '/ebooks/marketing-clinico.pdf'
  ),
  (
    'd41e5dd7-ccd2-4a3f-bf70-37cac799d3af',
    'Protocolos de Segurança e Atendimento',
    'Fluxos de triagem, comunicação de erros e treinamentos rápidos para a equipe.',
    40,
    ARRAY['Segurança', 'Qualidade', 'Equipe'],
    'ebook',
    '/ebooks/protocolos-seguranca.pdf'
  )
ON CONFLICT (id) DO NOTHING;
