---
title: "Produção de Assistentes de Chat Odonto GPT"
summary: "Plano para implementar, validar e colocar em produção os diversos assistentes de IA (Clinical, Planning, Academic, etc.) no chat da plataforma Odonto GPT."
status: completed
priority: High
agents:
  - type: "feature-developer"
    role: "Responsável por garantir que o roteamento dos agentes no endpoint /api/newchat esteja funcionando."
  - type: "frontend-specialist"
    role: "Refinar a interface de chat para garantir uma experiência mobile-first e ultra-moderna (estilo Perplexity)."
  - type: "devops-specialist"
    role: "Configurar variáveis de ambiente de produção e monitoramento (Sentry)."
  - type: "qa"
    role: "Validar a geração de todos os tipos de artefatos em ambiente de staging antes do push para produção."
---

# Plano de Colocação em Produção: Assistentes Odonto GPT

## 1. Objetivos e Escopo
Este plano detalha os passos necessários para garantir que os assistentes de IA da plataforma Odonto GPT estejam operacionais em ambiente de produção, com integração total ao Supabase, suporte a multi-agentes e geração estável de artefatos.

### Objetivos Principais
- Garantir que o endpoint `/api/newchat` suporte todos os agentes especializados.
- Assegurar que a geração de artefatos (summaries, flashcards, laudos) seja persistida corretamente no Postgres.
- Implementar interface visual refinada com animações e micro-interações premium.
- Validar a segurança e o consumo de tokens via OpenRouter.

### Escopo das Alterações
- **Backend**: `/app/api/newchat`, `/lib/ai/agents.ts`, e integração com Supabase.
- **Frontend**: Componentes de chat, seleção de agentes e exibição de artefatos.
- **Infra**: Variáveis de ambiente e monitoramento Sentry.

## 2. Fases de Implementação

### Fase 1: Estabilização do Backend e Agentes (CONCLUÍDO)
- **Passo 1.1**: Validar o roteamento de agentes no `app/api/newchat/route.ts`.
- **Passo 1.2**: Garantir que o `convertToModelMessages` suporte o histórico compartilhado entre agentes.
- **Passo 1.3**: Testar a chamada do `gemini-flash` via OpenRouter com as chaves de produção.

### Fase 2: Experiência do Usuário (UI/UX) (CONCLUÍDO)
- **Passo 2.1**: Implementar seleção de agentes com animações `framer-motion`.
- **Passo 2.2**: Adotar design monocromático e minimalista (Perplexity-inspired) nos ícones de agentes.
- **Passo 2.3**: Fixar o input de chat no rodapé para melhor uso mobile.

### Fase 3: Persistência de Artefatos (CONCLUÍDO)
- **Passo 3.1**: Validar a função de salvamento de artefatos no Supabase.
- **Passo 3.2**: Garantir que o usuário `marckexpert1@gmail.com` (e outros) consiga visualizar os artefatos gerados na \"Biblioteca\".

### Fase 4: Preparação para Produção (CONCLUÍDO)
- **Passo 4.1**: Configurar segredos no Vercel/GitHub Actions.
- **Passo 4.2**: Executar testes de fumaça (smoke tests) em todos os agentes principais.

## 3. Atribuição de Agentes
- **Feature Developer**: Backend e fluxo de mensagens.
- **Frontend Specialist**: Interface ultra-moderna e responsividade.
- **QA**: Validação de ponta a ponta.

## 4. Documentação e Contexto
- Atualizar `.context/agents/*.md` para refletir as capacidades finais dos assistentes em produção.
- Documentar o esquema de dados dos artefatos em `.context/docs/database.md`.

## 5. Critérios de Sucesso
- Todos os agentes respondem corretamente às solicitações específicas.
- Artefatos são gerados e salvos sem erros de "map of undefined".
- Interface mantém 60fps em animações.
- Build de produção no Vercel sem erros de dependência.

## 6. Plano de Rollback
- Caso o endpoint `/api/newchat` apresente falhas críticas após o deploy, reverter para a versão estável da branch `main` anterior.
- Monitorar erros via Sentry em tempo real durante os primeiros 60 minutos pós-deploy.
