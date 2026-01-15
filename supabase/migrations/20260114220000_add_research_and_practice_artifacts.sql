-- Create research_artifacts table
CREATE TABLE IF NOT EXISTS public.research_artifacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    query TEXT,
    content TEXT, -- Markdown summary/analysis
    sources JSONB DEFAULT '[]'::jsonb, -- Array of source objects {title, url, authors, publication_date}
    type TEXT DEFAULT 'literature_review', -- literature_review, clinical_trial_summary, etc.
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create practice_exams table (the container for a set of questions)
CREATE TABLE IF NOT EXISTS public.practice_exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    specialty TEXT,
    difficulty TEXT DEFAULT 'medium',
    exam_type TEXT DEFAULT 'custom', -- enade, residency, custom
    status TEXT DEFAULT 'ready',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create practice_questions table
CREATE TABLE IF NOT EXISTS public.practice_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES public.practice_exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    type TEXT DEFAULT 'multiple_choice', -- multiple_choice, essay
    options JSONB, -- Array of options strings/objects for MC
    correct_answer TEXT, -- The correct option key/text or model answer for essay
    explanation TEXT, -- Detailed explanation
    difficulty TEXT DEFAULT 'medium',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS Policies

ALTER TABLE public.research_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_questions ENABLE ROW LEVEL SECURITY;

-- Research Artifacts Policies
CREATE POLICY "Users can view own research" ON public.research_artifacts 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own research" ON public.research_artifacts 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own research" ON public.research_artifacts 
    FOR DELETE USING (auth.uid() = user_id);

-- Practice Exams Policies
CREATE POLICY "Users can view own exams" ON public.practice_exams 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exams" ON public.practice_exams 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exams" ON public.practice_exams 
    FOR DELETE USING (auth.uid() = user_id);

-- Practice Questions Policies
CREATE POLICY "Users can view exam questions" ON public.practice_questions 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.practice_exams WHERE id = practice_questions.exam_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can insert exam questions" ON public.practice_questions 
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.practice_exams WHERE id = practice_questions.exam_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can delete exam questions" ON public.practice_questions 
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.practice_exams WHERE id = practice_questions.exam_id AND user_id = auth.uid())
    );
