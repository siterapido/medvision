-- Create image_artifacts table
CREATE TABLE IF NOT EXISTS public.image_artifacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    image_url TEXT,
    analysis TEXT, -- Full markdown analysis
    findings JSONB DEFAULT '[]'::jsonb, -- Array of findings
    recommendations JSONB DEFAULT '[]'::jsonb, -- Array of recommendations
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata (model, confidence, etc.)
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS Policies
ALTER TABLE public.image_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own image analyses" ON public.image_artifacts 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own image analyses" ON public.image_artifacts 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own image analyses" ON public.image_artifacts 
    FOR DELETE USING (auth.uid() = user_id);
