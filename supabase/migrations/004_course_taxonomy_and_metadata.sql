-- =====================================================
-- Courses Area - Metadata, Collections, Resources & Instructors
-- =====================================================

-- =====================================================
-- TABLE: course_categories
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  icon text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read course categories"
  ON public.course_categories FOR SELECT
  USING (true);

-- =====================================================
-- TABLE: course_category_map (junction course <-> category)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_category_map (
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.course_categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (course_id, category_id)
);

ALTER TABLE public.course_category_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read course category map"
  ON public.course_category_map FOR SELECT
  USING (true);

-- =====================================================
-- TABLE: course_tags
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.course_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read course tags"
  ON public.course_tags FOR SELECT
  USING (true);

-- =====================================================
-- TABLE: course_tag_map (junction course <-> tag)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_tag_map (
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.course_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (course_id, tag_id)
);

ALTER TABLE public.course_tag_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read course tag map"
  ON public.course_tag_map FOR SELECT
  USING (true);

-- =====================================================
-- TABLE: course_instructors
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL UNIQUE,
  headline text,
  bio text,
  avatar_url text,
  instagram_url text,
  linkedin_url text,
  website_url text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.course_instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read course instructors"
  ON public.course_instructors FOR SELECT
  USING (true);

-- =====================================================
-- TABLE: course_instructor_courses (junction instructor <-> course)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_instructor_courses (
  instructor_id uuid NOT NULL REFERENCES public.course_instructors(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  role text DEFAULT 'lead' CHECK (role IN ('lead', 'assistant', 'guest')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (instructor_id, course_id)
);

ALTER TABLE public.course_instructor_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read course instructor map"
  ON public.course_instructor_courses FOR SELECT
  USING (true);

-- =====================================================
-- TABLE: course_resources
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  resource_type text NOT NULL CHECK (resource_type IN ('pdf', 'slides', 'checklist', 'link', 'video', 'template', 'outro')),
  description text,
  url text NOT NULL,
  is_downloadable boolean DEFAULT true,
  position integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(course_id, title)
);

ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read course resources"
  ON public.course_resources FOR SELECT
  USING (true);

-- =====================================================
-- TABLE: course_collections (curated rows for Netflix-style sections)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text,
  title text NOT NULL,
  description text,
  badge_text text,
  badge_class text,
  position integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.course_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read course collections"
  ON public.course_collections FOR SELECT
  USING (true);

-- =====================================================
-- TABLE: course_collection_courses (junction collection <-> course)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_collection_courses (
  collection_id uuid NOT NULL REFERENCES public.course_collections(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  highlight_message text,
  badge_override text,
  position integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (collection_id, course_id)
);

ALTER TABLE public.course_collection_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read course collection map"
  ON public.course_collection_courses FOR SELECT
  USING (true);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS course_category_map_course_idx ON public.course_category_map(course_id);
CREATE INDEX IF NOT EXISTS course_category_map_category_idx ON public.course_category_map(category_id);
CREATE INDEX IF NOT EXISTS course_tag_map_course_idx ON public.course_tag_map(course_id);
CREATE INDEX IF NOT EXISTS course_tag_map_tag_idx ON public.course_tag_map(tag_id);
CREATE INDEX IF NOT EXISTS course_resources_course_idx ON public.course_resources(course_id);
CREATE INDEX IF NOT EXISTS course_instructor_courses_course_idx ON public.course_instructor_courses(course_id);
CREATE INDEX IF NOT EXISTS course_collection_courses_collection_idx ON public.course_collection_courses(collection_id);
CREATE INDEX IF NOT EXISTS course_collection_courses_course_idx ON public.course_collection_courses(course_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
    CREATE TRIGGER on_course_categories_updated
      BEFORE UPDATE ON public.course_categories
      FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

    CREATE TRIGGER on_course_tags_updated
      BEFORE UPDATE ON public.course_tags
      FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

    CREATE TRIGGER on_course_instructors_updated
      BEFORE UPDATE ON public.course_instructors
      FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

    CREATE TRIGGER on_course_resources_updated
      BEFORE UPDATE ON public.course_resources
      FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

    CREATE TRIGGER on_course_collections_updated
      BEFORE UPDATE ON public.course_collections
      FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
  END IF;
END $$;

-- =====================================================
-- SEED DATA (idempotent)
-- =====================================================
INSERT INTO public.course_categories (slug, title, description, icon)
VALUES
  ('implantodontia', 'Implantodontia', 'Cirurgias guiadas e carga imediata', 'tooth'),
  ('sedacao-controle-dor', 'Sedação e Dor', 'Protocolos de analgesia e sedação consciente', 'activity'),
  ('odontopediatria', 'Odontopediatria', 'Atendimento humanizado para crianças', 'baby')
ON CONFLICT (slug) DO UPDATE
  SET title = EXCLUDED.title,
      description = EXCLUDED.description,
      icon = EXCLUDED.icon;

INSERT INTO public.course_tags (slug, label, description)
VALUES
  ('premium', 'Premium', 'Conteúdo avançado para especialistas'),
  ('intensivo', 'Intensivo', 'Bootcamps e imersões práticas'),
  ('ia', 'IA + Fluxo Digital', 'Integração com assistentes e planejamento digital')
ON CONFLICT (slug) DO UPDATE
  SET label = EXCLUDED.label,
      description = EXCLUDED.description;

INSERT INTO public.course_instructors (full_name, headline, bio, avatar_url, instagram_url, linkedin_url, website_url)
VALUES
  (
    'Dra. Mariana Freire',
    'Implantodontista · Carga imediata guiada',
    'Responsável por mais de 1.000 casos complexos utilizando planejamento 3D e IA clínica.',
    'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80',
    'https://instagram.com/dra.marianafreire',
    'https://linkedin.com/in/marianafreire',
    'https://dra-marianafreire.com'
  ),
  (
    'Dr. Felipe Tavares',
    'Especialista em dor orofacial',
    'Pesquisador em farmacologia aplicada e docente convidado em programas de sedação consciente.',
    'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&q=80',
    'https://instagram.com/dr.felipetavares',
    'https://linkedin.com/in/felipetavares',
    null
  )
ON CONFLICT (full_name) DO UPDATE
  SET headline = EXCLUDED.headline,
      bio = EXCLUDED.bio,
      avatar_url = EXCLUDED.avatar_url,
      instagram_url = EXCLUDED.instagram_url,
      linkedin_url = EXCLUDED.linkedin_url,
      website_url = EXCLUDED.website_url;

INSERT INTO public.course_collections (slug, label, title, description, badge_text, badge_class, position)
VALUES
  (
    'especializacoes-premium',
    'Especializações premium',
    'Domine procedimentos avançados',
    'Coleções com cirurgia guiada, sedação consciente e fluxo digital completo.',
    'Premium',
    'border-[#06b6d4]/60 bg-[#06b6d4]/15 text-white',
    1
  ),
  (
    'trilhas-intensivas',
    'Trilhas intensivas',
    'Bootcamps clínicos de alto impacto',
    'Sprints com protocolos aplicáveis, checklists e materiais para a equipe.',
    'Express',
    'border-[#f97316]/50 bg-[#f97316]/15 text-[#fed7aa]',
    2
  )
ON CONFLICT (slug) DO UPDATE
  SET label = EXCLUDED.label,
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      badge_text = EXCLUDED.badge_text,
      badge_class = EXCLUDED.badge_class,
      position = EXCLUDED.position;

-- =====================================================
-- SEED RELATIONS BASED ON COURSE TITLES (if courses exist)
-- =====================================================
INSERT INTO public.course_category_map (course_id, category_id)
SELECT c.id, cc.id
FROM public.courses c
JOIN public.course_categories cc ON cc.slug = 'implantodontia'
WHERE c.title = 'Implantodontia Básica'
ON CONFLICT DO NOTHING;

INSERT INTO public.course_category_map (course_id, category_id)
SELECT c.id, cc.id
FROM public.courses c
JOIN public.course_categories cc ON cc.slug = 'sedacao-controle-dor'
WHERE c.title = 'Endodontia Avançada'
ON CONFLICT DO NOTHING;

INSERT INTO public.course_category_map (course_id, category_id)
SELECT c.id, cc.id
FROM public.courses c
JOIN public.course_categories cc ON cc.slug = 'odontopediatria'
WHERE c.title = 'Ortodontia Digital'
ON CONFLICT DO NOTHING;

INSERT INTO public.course_tag_map (course_id, tag_id)
SELECT c.id, ct.id
FROM public.courses c
JOIN public.course_tags ct ON ct.slug = 'premium'
WHERE c.title IN ('Implantodontia Básica', 'Endodontia Avançada')
ON CONFLICT DO NOTHING;

INSERT INTO public.course_tag_map (course_id, tag_id)
SELECT c.id, ct.id
FROM public.courses c
JOIN public.course_tags ct ON ct.slug = 'intensivo'
WHERE c.title = 'Ortodontia Digital'
ON CONFLICT DO NOTHING;

INSERT INTO public.course_instructor_courses (instructor_id, course_id, role)
SELECT inst.id, c.id, 'lead'
FROM public.course_instructors inst
JOIN public.courses c ON c.title = 'Implantodontia Básica'
WHERE inst.full_name = 'Dra. Mariana Freire'
ON CONFLICT DO NOTHING;

INSERT INTO public.course_instructor_courses (instructor_id, course_id, role)
SELECT inst.id, c.id, 'lead'
FROM public.course_instructors inst
JOIN public.courses c ON c.title = 'Endodontia Avançada'
WHERE inst.full_name = 'Dr. Felipe Tavares'
ON CONFLICT DO NOTHING;

INSERT INTO public.course_resources (course_id, title, resource_type, description, url, position)
SELECT c.id,
       'Checklist pré-operatório',
       'checklist',
       'PDF com checklist clínico utilizado no curso.',
       'https://files.odonto-gpt.com/checklists/pre-op.pdf',
       1
FROM public.courses c
WHERE c.title = 'Implantodontia Básica'
ON CONFLICT (course_id, title) DO NOTHING;

INSERT INTO public.course_collection_courses (collection_id, course_id, position)
SELECT col.id, c.id, 1
FROM public.course_collections col
JOIN public.courses c ON c.title = 'Implantodontia Básica'
WHERE col.slug = 'especializacoes-premium'
ON CONFLICT DO NOTHING;

INSERT INTO public.course_collection_courses (collection_id, course_id, position)
SELECT col.id, c.id, 2
FROM public.course_collections col
JOIN public.courses c ON c.title = 'Endodontia Avançada'
WHERE col.slug = 'especializacoes-premium'
ON CONFLICT DO NOTHING;

INSERT INTO public.course_collection_courses (collection_id, course_id, position)
SELECT col.id, c.id, 1
FROM public.course_collections col
JOIN public.courses c ON c.title = 'Ortodontia Digital'
WHERE col.slug = 'trilhas-intensivas'
ON CONFLICT DO NOTHING;
