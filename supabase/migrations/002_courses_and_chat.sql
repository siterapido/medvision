-- Migration: Courses, Lessons, Chat Messages, and Activities
-- Created: 2025-11-06
-- Description: Tables for course management, chat history, and user activities

-- ============================================================================
-- TABLE: courses
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  lessons_count integer DEFAULT 0,
  duration text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster queries
CREATE INDEX courses_created_at_idx ON public.courses(created_at DESC);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read courses
CREATE POLICY "Anyone can read courses"
  ON public.courses FOR SELECT
  USING (true);

-- ============================================================================
-- TABLE: lessons
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lessons (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id bigint NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  duration text,
  video_url text,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX lessons_course_id_idx ON public.lessons(course_id);
CREATE INDEX lessons_order_idx ON public.lessons(course_id, order_index);

-- Enable RLS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read lessons
CREATE POLICY "Anyone can read lessons"
  ON public.lessons FOR SELECT
  USING (true);

-- ============================================================================
-- TABLE: user_courses (relationship between users and courses)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_courses (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id bigint NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, course_id)
);

-- Indexes
CREATE INDEX user_courses_user_id_idx ON public.user_courses(user_id);
CREATE INDEX user_courses_course_id_idx ON public.user_courses(course_id);

-- Enable RLS
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own course progress"
  ON public.user_courses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own course progress"
  ON public.user_courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own course progress"
  ON public.user_courses FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE: user_lessons (track completed lessons per user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_lessons (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id bigint NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  UNIQUE(user_id, lesson_id)
);

-- Indexes
CREATE INDEX user_lessons_user_id_idx ON public.user_lessons(user_id);
CREATE INDEX user_lessons_lesson_id_idx ON public.user_lessons(lesson_id);

-- Enable RLS
ALTER TABLE public.user_lessons ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own lesson progress"
  ON public.user_lessons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lesson progress"
  ON public.user_lessons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lesson progress"
  ON public.user_lessons FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE: chat_messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  session_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX chat_messages_user_id_idx ON public.chat_messages(user_id);
CREATE INDEX chat_messages_created_at_idx ON public.chat_messages(created_at DESC);
CREATE INDEX chat_messages_session_id_idx ON public.chat_messages(session_id);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TABLE: activities (user activity feed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activities (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  activity_type text NOT NULL,
  color text DEFAULT 'bg-primary',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX activities_user_id_idx ON public.activities(user_id);
CREATE INDEX activities_created_at_idx ON public.activities(created_at DESC);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own activities"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================================

-- Trigger for courses
CREATE TRIGGER on_courses_updated
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger for user_courses
CREATE TRIGGER on_user_courses_updated
  BEFORE UPDATE ON public.user_courses
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ============================================================================
-- SEED DATA: Sample courses
-- ============================================================================

INSERT INTO public.courses (title, description, thumbnail_url, lessons_count, duration)
VALUES
  ('Implantodontia Básica', 'Fundamentos e técnicas essenciais de implantodontia', '/placeholder.svg?height=200&width=400', 6, '8h 30min'),
  ('Endodontia Avançada', 'Técnicas modernas de tratamento de canal', '/placeholder.svg?height=200&width=400', 8, '10h 15min'),
  ('Ortodontia Digital', 'Planejamento ortodôntico com tecnologia digital', '/placeholder.svg?height=200&width=400', 5, '6h 45min')
ON CONFLICT DO NOTHING;

-- Seed lessons for course 1 (Implantodontia Básica)
INSERT INTO public.lessons (course_id, title, duration, video_url, order_index)
VALUES
  (1, 'Introdução à Implantodontia', '15:30', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1),
  (1, 'Anatomia e Fisiologia Óssea', '22:45', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
  (1, 'Planejamento Cirúrgico', '18:20', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 3),
  (1, 'Técnicas de Instalação', '25:10', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 4),
  (1, 'Cuidados Pós-operatórios', '12:30', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5),
  (1, 'Complicações e Soluções', '20:15', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 6)
ON CONFLICT DO NOTHING;
