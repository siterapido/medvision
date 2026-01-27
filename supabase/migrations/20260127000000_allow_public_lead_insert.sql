-- =====================================================
-- Permite inserção pública de leads via landing page
-- =====================================================

-- Policy: Permitir inserção anônima de leads (para formulário da landing page)
-- Isso é seguro pois só permite INSERT, não SELECT/UPDATE/DELETE
CREATE POLICY "Allow public lead insert from landing page"
  ON public.leads
  FOR INSERT
  WITH CHECK (
    -- Apenas permite inserir leads com source 'landing_page'
    source = 'landing_page'
    -- E com status 'novo_lead'
    AND status = 'novo_lead'
  );

-- Policy: Permitir update de leads existentes (para atualizar email se já existir)
-- Usa service role implicitamente através do server action
-- Esta política permite que usuários anônimos atualizem leads específicos
CREATE POLICY "Allow public lead update from landing page"
  ON public.leads
  FOR UPDATE
  USING (
    -- Só pode atualizar leads com source 'landing_page' ou null
    (source IS NULL OR source = 'landing_page')
    -- E que ainda sejam novo_lead
    AND status = 'novo_lead'
  )
  WITH CHECK (
    -- Só pode definir source como 'landing_page'
    source = 'landing_page'
  );

-- Comentário explicativo
COMMENT ON POLICY "Allow public lead insert from landing page" ON public.leads IS
  'Permite que visitantes anônimos da landing page criem leads automaticamente ao preencher o formulário de teste grátis';

COMMENT ON POLICY "Allow public lead update from landing page" ON public.leads IS
  'Permite atualizar leads existentes com email quando visitante preenche formulário novamente';
