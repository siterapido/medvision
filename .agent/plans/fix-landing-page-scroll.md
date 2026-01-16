# Plano de Correção: Landing Page - Scroll e Atualização

**Data:** 2026-01-16
**Prioridade:** Alta
**Status:** Em implementação

## Problemas Identificados

### 1. Problema de Scroll
- Classes CSS `chat-scroll-lock` podem estar sendo aplicadas na landing page
- O componente `AppScrollArea` usa `max-height: 100vh` que pode conflitar com conteúdo longo
- CSS global tem `overflow: hidden` em vários seletores

### 2. Código Desatualizado em Produção
- Mudanças locais ainda não commitadas/deployadas
- Arquivos modificados pendentes de deploy

### 3. Configuração Next.js
- Nova configuração `output: 'standalone'` adicionada
- Requer rebuild e redeploy para funcionar corretamente

## Correções a Implementar

### Fase 1: Correção CSS (Prioridade Alta)
- [x] Garantir que `chat-scroll-lock` não seja aplicada na landing page
- [x] Ajustar `app-scroll-region` para permitir scroll completo na landing
- [x] Remover conflitos de `overflow: hidden` na landing page

### Fase 2: Otimização do Layout (Prioridade Alta)
- [x] Verificar SiteFrame para rota "/"
- [x] Garantir que AppScrollArea não limite o scroll da landing

### Fase 3: Sincronização e Deploy (Prioridade Alta)
- [ ] Commit das correções
- [ ] Push para origin/main
- [ ] Verificar deploy na Vercel

## Arquivos Afetados
- `app/globals.css`
- `components/layout/site-frame.tsx`
- `components/layout/app-scroll-area.tsx`
- `app/page.tsx`
