# Odonto GPT - Documentação do Sistema de Artefatos

## 📚 Visão Geral

Este repositório contém a documentação técnica completa do sistema de artefatos do **Odonto GPT**, uma plataforma de IA especializada em odontologia que gera documentos estruturados, interativos e persistentes.

## 🎯 O que são Artefatos?

Artefatos são **objetos de conhecimento gerados por IA** que vão além de mensagens de chat efêmeras. São documentos que:

- ✅ O usuário **possui e edita**
- ✅ São **estruturados e interativos**
- ✅ Têm **formato especializado** (não apenas texto)
- ✅ São **persistentes e reutilizáveis**

### Tipos de Artefatos

| Tipo | Descrição | Caso de Uso Principal |
|------|-----------|----------------------|
| 🔬 **Pesquisas Científicas** | Relatórios com citações reais | Revisão de literatura, TCC |
| 🎴 **Flashcards** | Cartões de memorização | Estudo ativo, revisão espaçada |
| 📄 **Laudos & Prescrições** | Documentos clínicos formais | Rotina clínica, documentação |
| 📝 **Resumos** | Sínteses de conteúdo extenso | Preparação para provas |
| 🧠 **Mapas Mentais** | Visualização de conceitos | Compreensão de relações |
| ✅ **Simulados** | Questões de múltipla escolha | Preparação para concursos |

## 📖 Índice da Documentação

### 1. [Arquitetura do Sistema](./01-ARCHITECTURE.md)
Visão geral da arquitetura técnica, stack, princípios de design e estrutura de dados.

**Tópicos principais**:
- Princípios arquiteturais (Chat vs Studio)
- Stack tecnológico completo
- Schema do banco de dados (Prisma)
- Fluxo de geração de artefatos
- Padrão de componentes
- Segurança e performance

**👥 Audiência**: Arquitetos, Tech Leads, Desenvolvedores Senior

---

### 2. [Especificações de Artefatos](./02-ARTIFACT-SPECS.md)
Detalhamento técnico de cada tipo de artefato, incluindo estruturas de dados, providers de AI e componentes UI.

**Tópicos principais**:
- Estruturas de dados TypeScript
- Schemas de validação (Zod)
- Prompt templates por artefato
- Componentes React especializados
- Features exclusivas de cada tipo
- Tabela de integrações AI

**👥 Audiência**: Desenvolvedores implementando artefatos

---

### 3. [Guia de Implementação](./03-IMPLEMENTATION-GUIDE.md)
Tutorial passo-a-passo com código completo para implementar o sistema, incluindo exemplo detalhado de Flashcards.

**Tópicos principais**:
- Setup inicial do projeto
- Configuração do Prisma
- Implementação completa de Flashcards
  - Tipos e schemas
  - AI generator
  - Server action
  - Formulário de criação
  - Componente de visualização
  - Página de detalhes
- Otimizações (streaming, background jobs, caching)

**👥 Audiência**: Desenvolvedores implementando features

---

### 4. [Arquitetura UI/UX do Studio](./04-STUDIO-UX-ARCHITECTURE.md)
Design e experiência do usuário do "Studio", incluindo padrões de UI, componentes reutilizáveis e interações avançadas.

**Tópicos principais**:
- Conceito "Studio" vs Chat tradicional
- Fluxo de seleção e criação
- Padrões de UI por artefato
  - Loading states especializados
  - Live preview (laudos)
  - Canvas infinito (mapas mentais)
- Sistema de componentes reutilizáveis
- Interações avançadas (edição inline, export)
- Mobile responsiveness
- Acessibilidade

**👥 Audiência**: Designers, Frontend Developers

---

### 5. [Integrações de AI](./05-AI-INTEGRATIONS.md)
Configuração completa de providers de IA, abstrações reutilizáveis, otimizações e controle de custos.

**Tópicos principais**:
- Setup de providers (OpenAI, Anthropic, Google, Perplexity)
- Wrapper genérico de geração
- Prompt templates manager
- Implementações específicas por artefato
- Otimizações avançadas
  - Prompt caching
  - Parallel generation
  - Streaming
- Rate limiting & cost control
- Monitoramento & analytics
- Testes

**👥 Audiência**: Developers integrando AI, DevOps

---

### 6. [Roadmap & Decisões Técnicas](./06-ROADMAP-DECISIONS.md)
Planejamento de implementação, decisões arquiteturais críticas, estimativas e próximos passos.

**Tópicos principais**:
- Fases de implementação (0-5)
- Decisões técnicas críticas
  - React Flow vs Mermaid
  - Tiptap vs Plate vs Lexical
  - Algoritmo de spaced repetition
  - Background jobs
- Estimativa de custos (AI)
- Métricas de sucesso (KPIs)
- Riscos & mitigações
- Stack final recomendado
- Próximos passos imediatos
- Checklist de launch

**👥 Audiência**: Product Managers, Tech Leads, Stakeholders

---

### 7. [Biblioteca de Prompts](./07-PROMPTS-LIBRARY.md)
Coleção completa de prompts otimizados para geração de cada tipo de artefato, incluindo system prompts, user prompts, variações e técnicas de prompt engineering.

**Tópicos principais**:
- System prompts base para cada artefato
- User prompts com variáveis configuráveis
- 25+ templates principais
- Prompts auxiliares (extração, refinamento, validação)
- Técnicas de prompt engineering
- Estratégias por provider de AI (OpenAI, Anthropic, Google, Perplexity)
- Otimização de custos
- Casos de teste e validação
- Exemplos práticos de uso

**👥 Audiência**: Developers trabalhando com AI, Prompt Engineers

---


### 7. [Especificações Completas de UI/UX](./07-UI-UX-COMPLETE-SPEC.md)
Manual detalhado de interface, animações e microinterações de todo o sistema.

**Tópicos principais**:
- Design System completo (cores, tipografia, espaçamentos, sombras)
- Layout global (header, sidebar, estrutura)
- Odonto Studio - página inicial com cards animados
- Formulários de criação com progress bars
- Loading states especializados por tipo de artefato
- Biblioteca de artefatos (grid e lista com animações)
- Visualizadores detalhados de cada artefato:
  - Flashcards (flip 3D, swipe gestures, spaced repetition)
  - Pesquisas Científicas (TOC sincronizado, citações inline com tooltip)
  - Mapas Mentais (React Flow, canvas infinito, drag-and-drop)
  - Quiz (timer, navegação, tela de resultados)
  - Laudos (editor Tiptap, bubble menu, print CSS)
  - Resumos (seções colapsáveis, glossário)
- Microinterações (toasts, buttons, ripple effects)
- Animações globais (fade, slide, scale)
- Responsividade completa (desktop → mobile)
- Acessibilidade (a11y, keyboard navigation)
- Performance (lazy loading, virtualização)

**👥 Audiência**: Designers, Frontend Developers, UI Engineers

---
## 🚀 Quick Start

### Para Product Managers
1. Leia: [Roadmap & Decisões](./06-ROADMAP-DECISIONS.md)
2. Entenda os tipos de artefatos: [Especificações](./02-ARTIFACT-SPECS.md)
3. Revise o conceito Studio: [UI/UX Architecture](./04-STUDIO-UX-ARCHITECTURE.md)

### Para Desenvolvedores
1. Entenda a arquitetura: [01-ARCHITECTURE.md](./01-ARCHITECTURE.md)
2. Siga o guia: [03-IMPLEMENTATION-GUIDE.md](./03-IMPLEMENTATION-GUIDE.md)
3. Configure AI: [05-AI-INTEGRATIONS.md](./05-AI-INTEGRATIONS.md)
4. Use os prompts: [07-PROMPTS-LIBRARY.md](./07-PROMPTS-LIBRARY.md)

### Para Designers
1. Entenda o conceito: [04-STUDIO-UX-ARCHITECTURE.md](./04-STUDIO-UX-ARCHITECTURE.md)
2. Veja componentes específicos: [02-ARTIFACT-SPECS.md](./02-ARTIFACT-SPECS.md)

---

## 🏗️ Arquitetura em Resumo

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  Next.js 14 + React + TypeScript + Tailwind     │
│                                                  │
│  ┌──────────────┐  ┌────────────────────────┐  │
│  │   Chat UI    │  │   Studio (Forms)       │  │
│  │  (Explorar)  │  │   (Criar Artefatos)    │  │
│  └──────────────┘  └────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │     Biblioteca (Gerenciar Artefatos)     │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↕️
┌─────────────────────────────────────────────────┐
│              Backend (Next.js)                   │
│                                                  │
│  ┌──────────────┐  ┌────────────────────────┐  │
│  │ API Routes   │  │  Server Actions        │  │
│  └──────────────┘  └────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │        AI Orchestration Layer            │  │
│  │  (Vercel AI SDK + Custom Wrappers)       │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
        ↕️                    ↕️                ↕️
┌─────────────┐    ┌──────────────┐    ┌──────────┐
│  PostgreSQL │    │ AI Providers │    │ Storage  │
│  (Prisma)   │    │  GPT-4o      │    │ (S3)     │
│             │    │  Claude      │    │          │
│  Artefatos  │    │  Gemini      │    │  PDFs    │
│  Users      │    │  Perplexity  │    │  Images  │
│  Projects   │    │              │    │          │
└─────────────┘    └──────────────┘    └──────────┘
```

---

## 💡 Conceitos-Chave

### Studio vs Chat

| Aspecto | Chat | Studio |
|---------|------|--------|
| **Input** | Prompt livre | Formulário estruturado |
| **Qualidade** | Variável | Consistente |
| **UX** | Chat simples | Interface rica |
| **Edição** | Difícil | Nativa |

### Artefatos como First-Class Citizens

Artefatos não são apenas outputs de chat - são entidades persistentes com:
- ID único
- Tipo específico
- Conteúdo estruturado (JSON)
- Metadados ricos
- Relacionamentos (projetos, tags)
- Histórico de versões

---

## 🛠️ Stack Tecnológico

### Core
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma
- **Styling**: Tailwind CSS + shadcn/ui
- **AI SDK**: Vercel AI SDK

### Bibliotecas Especializadas
- **Rich Text**: Tiptap
- **Mind Maps**: React Flow
- **PDF**: react-pdf + jspdf
- **Forms**: React Hook Form + Zod
- **State**: Zustand + React Query

### AI Providers
- OpenAI (GPT-4o)
- Anthropic (Claude 3.5 Sonnet)
- Google (Gemini 1.5 Pro)
- Perplexity (Sonar Pro)

---

## 📊 Métricas de Sucesso

### Técnicas
- ✅ 95%+ uptime
- ✅ P95 latency < 3s
- ✅ 90%+ test coverage

### Produto
- ✅ 70%+ artefatos editados
- ✅ 50%+ usuários retornam (D7)
- ✅ 40%+ criam 3+ artefatos (D7)

---

## 🤝 Contribuindo

Este é um projeto de documentação técnica. Para sugestões ou correções:

1. Identifique o documento relevante
2. Proponha mudanças específicas
3. Mantenha o nível de detalhe consistente
4. Atualize o histórico de versões

---

## 📝 Histórico de Versões

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0 | Jan 2026 | Documentação inicial completa |

---

## 📧 Contato

Para dúvidas sobre a documentação ou arquitetura:
- **Equipe de Arquitetura**: [arquitetura@odontogpt.com]
- **Product Manager**: [product@odontogpt.com]

---

**Última atualização**: Janeiro 2026  
**Mantido por**: Equipe Odonto GPT
