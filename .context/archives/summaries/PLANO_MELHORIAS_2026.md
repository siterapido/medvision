# Plano de Melhorias Técnicas - Odonto GPT (2026)

Este documento descreve as otimizações e refatorações planejadas para elevar a qualidade, performance e estabilidade do projeto.

## 🚀 1. Performance & Otimização (Prioridade Alta)

Já realizamos otimizações críticas no servidor (`standalone` mode, lazy loading de libs pesadas), mas podemos ir além no **Client-side**.

- [ ] **Otimização de Fontes**: O `layout.tsx` carrega múltiplos pesos da fonte Inter.
  - *Ação*: Migrar para `Inter Variable Font` para reduzir requisições e tamanho.
- [ ] **Bundle Analysis**: Rodar `@next/bundle-analyzer` regularmente.
  - *Meta*: Garantir que nenhuma biblioteca gigante (como `framer-motion` ou `shiki`) vaze para o bundle principal inicial.
- [ ] **Otimização de Imagens**:
  - *Ação*: Revisar uso de `next/image` em listas longas (ex: biblioteca de cursos). Usar `sizes` prop corretamente para não baixar imagens 4k em thumbnails de celular.
- [ ] **Dynamic Imports em Rotas Pesadas**:
  - *Ação*: Identificar componentes administrativos pesados (gráficos, tabelas complexas) e usar `next/dynamic`.

## 🗄️ 2. Banco de Dados & Backend (Supabase)

O diretório `migrations` tem mais de 50 arquivos, indicando evolução rápida.

- [ ] **Review de Índices**: O Supabase não cria índices em chaves estrangeiras automaticamente.
  - *Ação Critica*: Verificar tabelas `chat_threads`, `course_purchases`, `pipeline_leads`. A falta de índices aqui causará lentidão conforme o app cresce.
- [ ] **Squash de Migrations**: Consolidar migrations antigas para limpar o histórico e acelerar o setup de novos ambientes dev.
- [ ] **Row Level Security (RLS)**:
  - *Ação*: Auditoria de segurança nas políticas RLS. Garantir que `service_role` não está sendo usado desnecessariamente no frontend via client.

## 💎 3. UX & Interface (Shadcn/Tailwind)

- [ ] **Skeleton Loading (Suspense)**:
  - *Ação*: Adicionar `loading.tsx` nas rotas principais (`/dashboard`, `/courses`). Evitar o "layout shift" (pulos na tela) enquanto carrega dados.
- [ ] **Optimistic UI**:
  - *Ação*: Ao favoritar um curso ou mover um lead no pipeline, a UI deve atualizar *instantaneamente*, antes mesmo do servidor responder.

## 🛡️ 4. Segurança & Qualidade de Código

- [ ] **Zod Validation**:
  - *Ação*: Padronizar validação de *todas* as Server Actions com `zod`. Nunca confiar no input do usuário.
- [ ] **Strict Types**: Manter o `tsconfig.json` em `strict: true` (já está, parabéns!) e evitar `any` nos novos componentes.
- [ ] **Tratamento de Erros Global**:
  - *Ação*: Melhorar `global-error.tsx` e `error.tsx` para dar feedback útil ao usuário em vez de quebrar a tela branca.

## 🧪 5. Testes (QA)

- [ ] **Testes E2E Críticos**:
  - *Ação*: Criar teste Playwright para o fluxo de "Cadastro -> Login -> Abrir Curso". É o fluxo do dinheiro; não pode quebrar.
- [ ] **Testes Unitários**:
  - *Ação*: Focar testes nas funções de "Cálculo de Progresso" e "Permissões de Acesso".

---

### Próximo Passo Sugerido

Recomendo começarmos pela **Auditoria de Índices no Banco de Dados** ou pela **Implementação de Suspense/Skeletons** no Dashboard, pois são os que trazem percepção de "app rápido" mais imediata.
