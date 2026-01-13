-- =====================================================
-- Migration: Adicionar campo live_url na tabela live_events
-- Created: 2025-01-01
-- Description: Adiciona campo para armazenar o link da live
-- =====================================================

-- Nota: Se a tabela live_events não existir, ela será criada com o campo live_url incluído
-- Se já existir, apenas adiciona o campo

ALTER TABLE public.live_events
ADD COLUMN IF NOT EXISTS live_url text;

COMMENT ON COLUMN public.live_events.live_url IS 'URL/link da live (ex: YouTube, Zoom, etc.)';

