-- Migration: Importar aulas do curso "Prescrição em Odontologia"
-- Curso ID: 1ec7ee66-0597-4fb8-add6-f9dc4e6f0f2c
-- Execute este script no Supabase SQL Editor

-- Primeiro, criar ou obter os módulos
DO $$
DECLARE
  v_course_id uuid := '1ec7ee66-0597-4fb8-add6-f9dc4e6f0f2c';
  v_module_apresentacao uuid;
  v_module_intro uuid;
  v_module_intro2 uuid;
  v_module_antibioticos uuid;
  v_module_analgesicos uuid;
  v_module_antidepressivos uuid;
  v_module_anticonvulsivantes uuid;
  v_module_antiinflamatorios uuid;
  v_module_ansioliticos uuid;
  v_module_relaxantes uuid;
  v_module_anestesicos uuid;
  v_module_ortodontia uuid;
  v_module_certificado uuid;
BEGIN
  -- Criar módulos
  INSERT INTO public.lesson_modules (course_id, title, order_index)
  VALUES 
    (v_course_id, 'Apresentação', 0),
    (v_course_id, 'Introdução a Terapéutica', 1),
    (v_course_id, 'Introducão a Terapéutica', 2),
    (v_course_id, 'Antibióticos', 3),
    (v_course_id, 'Analgésicos', 4),
    (v_course_id, 'Antidepressivos', 5),
    (v_course_id, 'Anticonvulsivantes', 6),
    (v_course_id, 'Anti-inflamatórios', 7),
    (v_course_id, 'Ansiolíticos', 8),
    (v_course_id, 'Relaxantes Musculares', 9),
    (v_course_id, 'Anestésicos Locais', 10),
    (v_course_id, 'Terapêutica aplicada a Ortodontia', 11),
    (v_course_id, 'Certificado', 12)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_module_apresentacao;

  -- Obter IDs dos módulos
  SELECT id INTO v_module_apresentacao FROM public.lesson_modules WHERE course_id = v_course_id AND title = 'Apresentação';
  SELECT id INTO v_module_intro FROM public.lesson_modules WHERE course_id = v_course_id AND title = 'Introdução a Terapéutica';
  SELECT id INTO v_module_intro2 FROM public.lesson_modules WHERE course_id = v_course_id AND title = 'Introducão a Terapéutica';
  SELECT id INTO v_module_antibioticos FROM public.lesson_modules WHERE course_id = v_course_id AND title = 'Antibióticos';
  SELECT id INTO v_module_analgesicos FROM public.lesson_modules WHERE course_id = v_course_id AND title = 'Analgésicos';
  SELECT id INTO v_module_antidepressivos FROM public.lesson_modules WHERE course_id = v_course_id AND title = 'Antidepressivos';
  SELECT id INTO v_module_anticonvulsivantes FROM public.lesson_modules WHERE course_id = v_course_id AND title = 'Anticonvulsivantes';
  SELECT id INTO v_module_antiinflamatorios FROM public.lesson_modules WHERE course_id = v_course_id AND title = 'Anti-inflamatórios';
  SELECT id INTO v_module_ansioliticos FROM public.lesson_modules WHERE course_id = v_course_id AND title = 'Ansiolíticos';
  SELECT id INTO v_module_relaxantes FROM public.lesson_modules WHERE course_id = v_course_id AND title = 'Relaxantes Musculares';
  SELECT id INTO v_module_anestesicos FROM public.lesson_modules WHERE course_id = v_course_id AND title = 'Anestésicos Locais';
  SELECT id INTO v_module_ortodontia FROM public.lesson_modules WHERE course_id = v_course_id AND title = 'Terapêutica aplicada a Ortodontia';
  SELECT id INTO v_module_certificado FROM public.lesson_modules WHERE course_id = v_course_id AND title = 'Certificado';

  -- Inserir aulas
  INSERT INTO public.lessons (course_id, title, description, video_url, duration_minutes, module_title, module_id, order_index, materials, available_at)
  VALUES
    -- Apresentação
    (v_course_id, 'Prescrição em Odontologia - Modulos e Aulas', NULL, NULL, NULL, 'Apresentação', v_module_apresentacao, 0, '[]'::jsonb, NULL),
    
    -- Introdução a Terapéutica
    (v_course_id, 'Introducão à Terapéutica', NULL, NULL, NULL, 'Introdução a Terapéutica', v_module_intro, 1, '[]'::jsonb, NULL),
    
    -- Introducão a Terapéutica (segundo módulo)
    (v_course_id, 'Tipos de Receitas Odontológicas', NULL, NULL, NULL, 'Introducão a Terapéutica', v_module_intro2, 2, '[]'::jsonb, NULL),
    (v_course_id, 'Receita Comum em Odontologia', NULL, NULL, NULL, 'Introducão a Terapéutica', v_module_intro2, 3, '[]'::jsonb, NULL),
    (v_course_id, 'Receita Especial em Odontologia', NULL, NULL, NULL, 'Introducão a Terapéutica', v_module_intro2, 4, '[]'::jsonb, NULL),
    (v_course_id, 'Atestado x Declaração', NULL, NULL, NULL, 'Introducão a Terapéutica', v_module_intro2, 5, '[]'::jsonb, NULL),
    
    -- Antibióticos
    (v_course_id, 'Antibióticos - Conceitos Iniciais', NULL, NULL, NULL, 'Antibióticos', v_module_antibioticos, 6, '[]'::jsonb, NULL),
    (v_course_id, 'Tipos de Antibióticos na Odontologia', NULL, NULL, NULL, 'Antibióticos', v_module_antibioticos, 7, '[]'::jsonb, NULL),
    (v_course_id, 'Antibióticos Betalactâmicos - parte 1', NULL, NULL, NULL, 'Antibióticos', v_module_antibioticos, 8, '[]'::jsonb, NULL),
    (v_course_id, 'Antibióticos Betalactâmicos - parte 2', NULL, NULL, NULL, 'Antibióticos', v_module_antibioticos, 9, '[]'::jsonb, NULL),
    (v_course_id, 'Antibióticos Macrolídeos', NULL, NULL, NULL, 'Antibióticos', v_module_antibioticos, 10, '[]'::jsonb, NULL),
    (v_course_id, 'Antibióticos Azalídeos', NULL, NULL, NULL, 'Antibióticos', v_module_antibioticos, 11, '[]'::jsonb, NULL),
    (v_course_id, 'Antibióticos Tetraciclina', NULL, NULL, NULL, 'Antibióticos', v_module_antibioticos, 12, '[]'::jsonb, NULL),
    (v_course_id, 'Antibióticos Quinolonas', NULL, NULL, NULL, 'Antibióticos', v_module_antibioticos, 13, '[]'::jsonb, NULL),
    (v_course_id, 'Antibióticos Clindamicina', NULL, NULL, NULL, 'Antibióticos', v_module_antibioticos, 14, '[]'::jsonb, NULL),
    (v_course_id, 'Antibióticos mais indicados na gravidez', NULL, NULL, NULL, 'Antibióticos', v_module_antibioticos, 15, '[]'::jsonb, NULL),
    
    -- Analgésicos
    (v_course_id, 'Prescrição de Analgésicos em Odontologia', NULL, NULL, NULL, 'Analgésicos', v_module_analgesicos, 16, '[]'::jsonb, NULL),
    (v_course_id, 'Analgésicos Opióides', NULL, NULL, NULL, 'Analgésicos', v_module_analgesicos, 17, '[]'::jsonb, NULL),
    (v_course_id, 'Prescrição de Associações Analgésicas', NULL, NULL, NULL, 'Analgésicos', v_module_analgesicos, 18, '[]'::jsonb, NULL),
    
    -- Antidepressivos
    (v_course_id, 'Prescrição de Antidepressivos em Odontologia', NULL, NULL, NULL, 'Antidepressivos', v_module_antidepressivos, 19, '[]'::jsonb, NULL),
    
    -- Anticonvulsivantes
    (v_course_id, 'Prescrição de Anticonvulsivantes em Odontologia', NULL, NULL, NULL, 'Anticonvulsivantes', v_module_anticonvulsivantes, 20, '[]'::jsonb, NULL),
    
    -- Anti-inflamatórios
    (v_course_id, 'Prescrição de Anti-inflamatórios em Odontologia', NULL, NULL, NULL, 'Anti-inflamatórios', v_module_antiinflamatorios, 21, '[]'::jsonb, NULL),
    (v_course_id, 'Prescrição de Anti-inflamatórios em Odontologia - parte 2', NULL, NULL, NULL, 'Anti-inflamatórios', v_module_antiinflamatorios, 22, '[]'::jsonb, NULL),
    (v_course_id, 'Prescrição de Anti-inflamatórios em Odontologia - parte 3', NULL, NULL, NULL, 'Anti-inflamatórios', v_module_antiinflamatorios, 23, '[]'::jsonb, NULL),
    (v_course_id, 'Prescrição de Anti-inflamatórios em Odontologia - parte 4', NULL, NULL, NULL, 'Anti-inflamatórios', v_module_antiinflamatorios, 24, '[]'::jsonb, NULL),
    (v_course_id, 'Prescrição de Anti-inflamatórios em Odontologia - parte 5', NULL, NULL, NULL, 'Anti-inflamatórios', v_module_antiinflamatorios, 25, '[]'::jsonb, NULL),
    (v_course_id, 'Prescrição de Anti-inflamatórios em Odontologia - parte 6', NULL, NULL, NULL, 'Anti-inflamatórios', v_module_antiinflamatorios, 26, '[]'::jsonb, NULL),
    (v_course_id, 'Prescrição de Anti-inflamatórios em Odontologia - parte 7', NULL, NULL, NULL, 'Anti-inflamatórios', v_module_antiinflamatorios, 27, '[]'::jsonb, NULL),
    (v_course_id, 'Prescrição de Anti-inflamatórios esteroides em Odontologia', NULL, NULL, NULL, 'Anti-inflamatórios', v_module_antiinflamatorios, 28, '[]'::jsonb, NULL),
    
    -- Ansiolíticos
    (v_course_id, 'Prescrição de Benzodiazepínicos em Odontologia', NULL, NULL, NULL, 'Ansiolíticos', v_module_ansioliticos, 29, '[]'::jsonb, NULL),
    
    -- Relaxantes Musculares
    (v_course_id, 'Prescrição de Relaxantes Musculares em Odontologia', NULL, NULL, NULL, 'Relaxantes Musculares', v_module_relaxantes, 30, '[]'::jsonb, NULL),
    
    -- Anestésicos Locais
    (v_course_id, 'Anestésicos Locais em Odontologia', NULL, NULL, NULL, 'Anestésicos Locais', v_module_anestesicos, 31, '[]'::jsonb, NULL),
    
    -- Terapêutica aplicada a Ortodontia
    (v_course_id, 'Terapêutica Aplicada a Ortodontia', NULL, NULL, NULL, 'Terapêutica aplicada a Ortodontia', v_module_ortodontia, 32, '[]'::jsonb, NULL),
    (v_course_id, 'Fármacos que atrasam a movimentação ortodôntica', NULL, NULL, NULL, 'Terapêutica aplicada a Ortodontia', v_module_ortodontia, 33, '[]'::jsonb, NULL),
    (v_course_id, 'Fármacos que aceleram a movimentação ortodôntica', NULL, NULL, NULL, 'Terapêutica aplicada a Ortodontia', v_module_ortodontia, 34, '[]'::jsonb, NULL),
    (v_course_id, 'Fármacos de escolha para Ortodontia', NULL, NULL, NULL, 'Terapêutica aplicada a Ortodontia', v_module_ortodontia, 35, '[]'::jsonb, NULL),
    
    -- Certificado
    (v_course_id, 'Certificado', NULL, NULL, NULL, 'Certificado', v_module_certificado, 36, '[]'::jsonb, NULL)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Aulas importadas com sucesso!';
END $$;





