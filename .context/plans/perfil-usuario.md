---
status: filled
generated: 2026-01-22
agents:
  - type: "feature-developer"
    role: "Implementação da página e actions"
  - type: "frontend-specialist"
    role: "Design UI com Shadcn/Tailwind"
  - type: "architect-specialist"
    role: "Segurança e Data Flow"
docs:
  - "project-overview.md"
  - "architecture.md"
phases:
  - id: "phase-1"
    name: "Discovery & Architecture"
    prevc: "P"
  - id: "phase-2"
    name: "Implementation"
    prevc: "E"
  - id: "phase-3"
    name: "Validation"
    prevc: "V"
---

# Perfil Usuario Plan

> Implementação da página de perfil do usuário no dashboard, permitindo visualização e edição de dados pessoais e visualização de status da assinatura.

## Task Snapshot
- **Primary goal:** Permitir que o usuário visualize e atualize seus dados cadastrais (Nome, Telefone, CRO, Especialidade) e visualize seu plano atual.
- **Success signal:** O usuário consegue acessar /newdashboard/perfil, ver seus dados atuais, editar e salvar com sucesso. O status da assinatura é exibido corretamente.
- **Key references:**
  - `app/actions/users.ts` (Referência para validação Zod)
  - `app/newdashboard/layout.tsx` (Layout base)

## Agent Lineup
| Agent | Role in this plan | Focus |
| --- | --- | --- |
| Feature Developer | Implementação Fullstack | Server Actions + Page Logic |
| Frontend Specialist | UI/UX | Formulários, Cards, Responsividade |
| Architect Specialist | Security | Garantir que o usuário só edite o próprio perfil |

## Working Phases

### Phase 1 — Discovery & Architecture
**Steps**
1.  Verificar schema da tabela `profiles` (já realizado via análise de `users.ts`).
2.  Definir Server Action segura `updateProfile` em `app/actions/profile.ts` que não exija permissão de admin.
3.  Definir componentes de UI necessários: `ProfileForm` (Client Component) e `SubscriptionInfo` (Server Component ou parte da Page).

### Phase 2 — Implementation
**Steps**
1.  **Backend**: Criar `app/actions/profile.ts`.
    *   Validar sessão do usuário (`auth.getUser`).
    *   Validar dados com Zod (reutilizar schema de `users.ts` se possível, ou criar novo `updateProfileSchema`).
    *   Update no Supabase: `profiles` table.
2.  **Frontend**: Criar `app/newdashboard/perfil/page.tsx`.
    *   Fetch de dados iniciais (Server Side).
    *   Layout com Título e Descrição.
    *   Grid com duas colunas: "Dados Pessoais" (Editável) e "Assinatura" (Read-only).
3.  **Frontend**: Criar componente de formulário (pode ser inline na page se for simples, ou `app/newdashboard/perfil/profile-form.tsx`).
    *   Usar `react-hook-form` + `zod`.
    *   Feedback visual (Toasts) de sucesso/erro.

### Phase 3 — Validation
**Steps**
1.  Testar navegação para `/newdashboard/perfil`.
2.  Testar atualização de Nome e Telefone.
3.  Verificar se erro de validação aparece (ex: nome curto).
4.  Verificar se dados persistem após reload.

## Rollback Plan
- Remover arquivos criados: `app/actions/profile.ts`, `app/newdashboard/perfil/page.tsx`.
