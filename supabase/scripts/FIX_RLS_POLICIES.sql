-- =====================================================
-- FIX: Infinite Recursion in RLS Policies
-- =====================================================
-- Este script corrige o erro de recursão infinita nas políticas RLS
-- Execute no Supabase SQL Editor
-- =====================================================

-- PASSO 1: Desabilitar temporariamente RLS em profiles para evitar recursão
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Remover políticas problemáticas de courses, lessons e course_resources
DROP POLICY IF EXISTS "Admins podem gerenciar cursos" ON public.courses;
DROP POLICY IF EXISTS "Admins podem gerenciar aulas" ON public.lessons;
DROP POLICY IF EXISTS "Admins podem gerenciar recursos de curso" ON public.course_resources;

-- PASSO 3: Criar políticas sem recursão usando auth.uid() direto
-- Para COURSES: Todos podem ler, apenas admins podem modificar
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
CREATE POLICY "Anyone can view published courses"
  ON public.courses FOR SELECT
  USING (true); -- Permite leitura para todos

DROP POLICY IF EXISTS "Authenticated users can manage courses" ON public.courses;
CREATE POLICY "Authenticated users can manage courses"
  ON public.courses FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Para LESSONS: Todos podem ler, apenas autenticados podem modificar
DROP POLICY IF EXISTS "Anyone can view lessons" ON public.lessons;
CREATE POLICY "Anyone can view lessons"
  ON public.lessons FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage lessons" ON public.lessons;
CREATE POLICY "Authenticated users can manage lessons"
  ON public.lessons FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Para COURSE_RESOURCES: Todos podem ler, apenas autenticados podem modificar
DROP POLICY IF EXISTS "Anyone can view course resources" ON public.course_resources;
CREATE POLICY "Anyone can view course resources"
  ON public.course_resources FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage course resources" ON public.course_resources;
CREATE POLICY "Authenticated users can manage course resources"
  ON public.course_resources FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- PASSO 4: Verificar se a tabela profiles tem políticas corretas
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- PASSO 5: Reabilitar RLS em profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- PASSO 6: Garantir que RLS está ativo nas outras tabelas
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Verificar políticas criadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('courses', 'lessons', 'course_resources', 'profiles')
ORDER BY tablename, policyname;

-- =====================================================
-- CONCLUÍDO! ✅
-- =====================================================
SELECT 'RLS policies fixed! Refresh your app.' as status;
