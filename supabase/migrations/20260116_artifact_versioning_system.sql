-- Migration: Artifact Versioning System
-- Created: 2026-01-16
-- Description: Sistema de versionamento de artefatos para o Pipeline de Refinamento

-- ============================================================================
-- TABLE: chat_sources (Chat Original)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES public.agent_sessions(id) ON DELETE SET NULL,
    
    -- Conteúdo do chat
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_messages INTEGER DEFAULT 0,
    
    -- Metadados
    agent_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Análise
    artifacts_extracted INTEGER DEFAULT 0,
    extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: artifact_versions (Versionamento de Artefatos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.artifact_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Referência ao artefato original (polimórfico)
    artifact_type TEXT NOT NULL CHECK (artifact_type IN (
        'research', 'exam', 'summary', 'flashcard', 'mindmap', 'image', 'code', 'document'
    )),
    artifact_id UUID NOT NULL,
    
    -- Versionamento
    version INTEGER NOT NULL DEFAULT 1,
    parent_version_id UUID REFERENCES public.artifact_versions(id),
    
    -- Conteúdo
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    
    -- Qualidade
    quality_score JSONB DEFAULT '{}'::jsonb,
    
    -- Refinamento
    is_refined BOOLEAN DEFAULT FALSE,
    refinement_agent TEXT,
    refinement_notes TEXT,
    changes_made JSONB DEFAULT '[]'::jsonb,
    
    -- Origem
    source_chat_id UUID REFERENCES public.chat_sources(id),
    source_type TEXT DEFAULT 'chat' CHECK (source_type IN ('chat', 'direct', 'import')),
    created_by TEXT DEFAULT 'agent' CHECK (created_by IN ('agent', 'user', 'system')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (artifact_type, artifact_id, version)
);

-- ============================================================================
-- TABLE: user_artifact_interactions (Interações do Usuário)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_artifact_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    artifact_version_id UUID REFERENCES public.artifact_versions(id) ON DELETE CASCADE NOT NULL,
    
    interaction_type TEXT NOT NULL CHECK (interaction_type IN (
        'view', 'edit', 'copy', 'share', 'download', 'rate', 'feedback', 'refine_request', 'direct_create'
    )),
    
    metadata JSONB DEFAULT '{}'::jsonb,
    session_id UUID REFERENCES public.agent_sessions(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_chat_sources_user ON public.chat_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sources_status ON public.chat_sources(extraction_status);
CREATE INDEX IF NOT EXISTS idx_artifact_versions_artifact ON public.artifact_versions(artifact_type, artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_versions_latest ON public.artifact_versions(artifact_type, artifact_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user ON public.user_artifact_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_artifact ON public.user_artifact_interactions(artifact_version_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE public.chat_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifact_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_artifact_interactions ENABLE ROW LEVEL SECURITY;

-- Chat Sources
CREATE POLICY "Users can view own chat sources" ON public.chat_sources 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sources" ON public.chat_sources 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage chat sources" ON public.chat_sources
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Artifact Versions (complexa - via função)
CREATE POLICY "Users can view own artifact versions" ON public.artifact_versions 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.research_artifacts WHERE id = artifact_id AND user_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.practice_exams WHERE id = artifact_id AND user_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.summaries WHERE id = artifact_id AND user_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.flashcard_decks WHERE id = artifact_id AND user_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.mind_map_artifacts WHERE id = artifact_id AND user_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.image_artifacts WHERE id = artifact_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage artifact versions" ON public.artifact_versions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User Interactions
CREATE POLICY "Users can view own interactions" ON public.user_artifact_interactions 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions" ON public.user_artifact_interactions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Função para criar nova versão de artefato
CREATE OR REPLACE FUNCTION public.create_artifact_version(
    p_artifact_type TEXT,
    p_artifact_id UUID,
    p_content TEXT,
    p_quality_score JSONB DEFAULT NULL,
    p_refinement_agent TEXT DEFAULT NULL,
    p_refinement_notes TEXT DEFAULT NULL,
    p_changes_made JSONB DEFAULT '[]'::jsonb,
    p_source_chat_id UUID DEFAULT NULL,
    p_source_type TEXT DEFAULT 'chat'
) RETURNS UUID AS $$
DECLARE
    v_new_version INTEGER;
    v_parent_version_id UUID;
    v_new_id UUID;
    v_content_hash TEXT;
BEGIN
    v_content_hash := encode(sha256(p_content::bytea), 'hex');
    
    SELECT COALESCE(MAX(version), 0) + 1, id
    INTO v_new_version, v_parent_version_id
    FROM public.artifact_versions
    WHERE artifact_type = p_artifact_type AND artifact_id = p_artifact_id
    ORDER BY version DESC
    LIMIT 1;
    
    INSERT INTO public.artifact_versions (
        artifact_type, artifact_id, version, parent_version_id,
        content, content_hash, quality_score,
        is_refined, refinement_agent, refinement_notes, changes_made,
        source_chat_id, source_type
    ) VALUES (
        p_artifact_type, p_artifact_id, v_new_version, v_parent_version_id,
        p_content, v_content_hash, COALESCE(p_quality_score, '{}'::jsonb),
        (p_refinement_agent IS NOT NULL), p_refinement_agent, p_refinement_notes, p_changes_made,
        p_source_chat_id, p_source_type
    ) RETURNING id INTO v_new_id;
    
    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter última versão de um artefato
CREATE OR REPLACE FUNCTION public.get_latest_artifact_version(
    p_artifact_type TEXT,
    p_artifact_id UUID
) RETURNS public.artifact_versions AS $$
    SELECT * FROM public.artifact_versions
    WHERE artifact_type = p_artifact_type AND artifact_id = p_artifact_id
    ORDER BY version DESC
    LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_chat_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_chat_sources_updated ON public.chat_sources;
CREATE TRIGGER on_chat_sources_updated
    BEFORE UPDATE ON public.chat_sources
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_chat_sources_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.chat_sources IS 'Armazena logs de chat originais para extração de artefatos';
COMMENT ON TABLE public.artifact_versions IS 'Versionamento de artefatos com histórico de refinamentos';
COMMENT ON TABLE public.user_artifact_interactions IS 'Rastreia interações do usuário com artefatos';
COMMENT ON COLUMN public.artifact_versions.source_type IS 'Origem do artefato: chat (via conversa), direct (criação direta), import (importado)';
