
-- Create flashcard_decks table for standalone flashcard sets
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    topic TEXT,
    cards JSONB NOT NULL, -- Array of {front, back} objects
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mind_map_artifacts table for standalone mind maps
CREATE TABLE IF NOT EXISTS public.mind_map_artifacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    topic TEXT,
    data JSONB NOT NULL, -- The mind map structure/nodes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS Policies
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mind_map_artifacts ENABLE ROW LEVEL SECURITY;

-- Policies for Flashcard Decks
CREATE POLICY "Users can select their own flashcard decks" 
ON public.flashcard_decks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcard decks" 
ON public.flashcard_decks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcard decks" 
ON public.flashcard_decks FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcard decks" 
ON public.flashcard_decks FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for Mind Map Artifacts
CREATE POLICY "Users can select their own mind maps" 
ON public.mind_map_artifacts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mind maps" 
ON public.mind_map_artifacts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mind maps" 
ON public.mind_map_artifacts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mind maps" 
ON public.mind_map_artifacts FOR DELETE 
USING (auth.uid() = user_id);
