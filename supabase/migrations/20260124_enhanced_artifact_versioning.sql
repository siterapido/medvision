-- Migration: Enhanced Artifact Versioning System
-- Created: 2026-01-24
-- Phase 4 of Refactoring Plan

-- 1. Update artifact_type enum with missing types
ALTER TYPE artifact_type ADD VALUE IF NOT EXISTS 'quiz';
ALTER TYPE artifact_type ADD VALUE IF NOT EXISTS 'diagram';
ALTER TYPE artifact_type ADD VALUE IF NOT EXISTS 'text';
ALTER TYPE artifact_type ADD VALUE IF NOT EXISTS 'report';

-- 2. Enhance artifact_versions table
-- Check if artifact_versions exists and add columns if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'artifact_versions') THEN
        CREATE TABLE public.artifact_versions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            artifact_id UUID NOT NULL REFERENCES public.artifacts(id) ON DELETE CASCADE,
            version INTEGER NOT NULL,
            content JSONB NOT NULL,
            diff_from_previous JSONB,
            snapshot_content JSONB NOT NULL,
            user_initiated BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE (artifact_id, version)
        );
    ELSE
        -- Add new columns to existing table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='artifact_versions' AND column_name='diff_from_previous') THEN
            ALTER TABLE public.artifact_versions ADD COLUMN diff_from_previous JSONB;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='artifact_versions' AND column_name='snapshot_content') THEN
            ALTER TABLE public.artifact_versions ADD COLUMN snapshot_content JSONB;
            -- Fill snapshot_content with current content for existing rows
            UPDATE public.artifact_versions SET snapshot_content = content::jsonb WHERE snapshot_content IS NULL;
            ALTER TABLE public.artifact_versions ALTER COLUMN snapshot_content SET NOT NULL;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='artifact_versions' AND column_name='user_initiated') THEN
            ALTER TABLE public.artifact_versions ADD COLUMN user_initiated BOOLEAN DEFAULT false;
        END IF;
        
        -- Fix foreign key if it was polymorphic before
        -- (The old migration used artifact_id without FK because it was polymorphic)
        -- We now strictly reference public.artifacts(id)
        ALTER TABLE public.artifact_versions DROP CONSTRAINT IF EXISTS artifact_versions_artifact_id_fkey;
        ALTER TABLE public.artifact_versions ADD CONSTRAINT artifact_versions_artifact_id_fkey 
            FOREIGN KEY (artifact_id) REFERENCES public.artifacts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Create helper functions for versioning

-- Function to get version history
CREATE OR REPLACE FUNCTION get_artifact_version_history(p_artifact_id UUID)
RETURNS TABLE (
    version_id UUID,
    version_number INTEGER,
    created_at TIMESTAMPTZ,
    user_initiated BOOLEAN,
    summary TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id, 
        version, 
        created_at, 
        user_initiated,
        (content->>'description')::TEXT as summary
    FROM public.artifact_versions
    WHERE artifact_id = p_artifact_id
    ORDER BY version DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to restore a version
CREATE OR REPLACE FUNCTION restore_artifact_version(p_version_id UUID)
RETURNS UUID AS $$
DECLARE
    v_artifact_id UUID;
    v_content JSONB;
    v_new_version INTEGER;
BEGIN
    -- Get original artifact and content
    SELECT artifact_id, snapshot_content INTO v_artifact_id, v_content
    FROM public.artifact_versions
    WHERE id = p_version_id;
    
    IF v_artifact_id IS NULL THEN
        RAISE EXCEPTION 'Version not found';
    END IF;
    
    -- Update the main artifact table
    UPDATE public.artifacts
    SET content = v_content,
        updated_at = NOW()
    WHERE id = v_artifact_id;
    
    -- Create a new version record for the restoration action
    SELECT COALESCE(MAX(version), 0) + 1 INTO v_new_version
    FROM public.artifact_versions
    WHERE artifact_id = v_artifact_id;
    
    INSERT INTO public.artifact_versions (
        artifact_id,
        version,
        content,
        snapshot_content,
        user_initiated
    ) VALUES (
        v_artifact_id,
        v_new_version,
        v_content,
        v_content,
        true
    );
    
    RETURN v_artifact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable RLS and create policies
ALTER TABLE public.artifact_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own artifact versions" ON public.artifact_versions;
CREATE POLICY "Users can view own artifact versions" ON public.artifact_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.artifacts 
            WHERE id = artifact_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own artifact versions" ON public.artifact_versions;
CREATE POLICY "Users can insert own artifact versions" ON public.artifact_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.artifacts 
            WHERE id = artifact_id AND user_id = auth.uid()
        )
    );

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION get_artifact_version_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_artifact_version(UUID) TO authenticated;
