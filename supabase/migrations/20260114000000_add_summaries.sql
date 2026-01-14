-- Create topics table
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES public.topics(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create summaries table
CREATE TABLE IF NOT EXISTS public.summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    content TEXT, -- Markdown content
    status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed')),
    complexity_level TEXT DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create summary_topics junction table
CREATE TABLE IF NOT EXISTS public.summary_topics (
    summary_id UUID REFERENCES public.summaries(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    PRIMARY KEY (summary_id, topic_id)
);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    summary_id UUID REFERENCES public.summaries(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mind_maps table
CREATE TABLE IF NOT EXISTS public.mind_maps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    summary_id UUID REFERENCES public.summaries(id) ON DELETE CASCADE,
    data JSONB NOT NULL, -- The mind map structure
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS Policies
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summary_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mind_maps ENABLE ROW LEVEL SECURITY;

-- Topics are readable by everyone, writable only by admins (or service role)
CREATE POLICY "Topics are viewable by everyone" ON public.topics FOR SELECT USING (true);

-- Summaries are private to the user
CREATE POLICY "Users can insert their own summaries" ON public.summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own summaries" ON public.summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own summaries" ON public.summaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own summaries" ON public.summaries FOR DELETE USING (auth.uid() = user_id);

-- Summary Topics
CREATE POLICY "Users can view summary topics" ON public.summary_topics FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.summaries WHERE id = summary_topics.summary_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert summary topics" ON public.summary_topics FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.summaries WHERE id = summary_topics.summary_id AND user_id = auth.uid())
);

-- Flashcards
CREATE POLICY "Users can view flashcards" ON public.flashcards FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.summaries WHERE id = flashcards.summary_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert flashcards" ON public.flashcards FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.summaries WHERE id = flashcards.summary_id AND user_id = auth.uid())
);

-- Mind Maps
CREATE POLICY "Users can view mind maps" ON public.mind_maps FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.summaries WHERE id = mind_maps.summary_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert mind maps" ON public.mind_maps FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.summaries WHERE id = mind_maps.summary_id AND user_id = auth.uid())
);
