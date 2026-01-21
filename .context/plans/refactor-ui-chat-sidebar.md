---
status: completed
generated: 2026-01-21
agents:
  - type: "code-reviewer"
    role: "Review code changes for quality, style, and best practices"
  - type: "feature-developer"
    role: "Implement new features according to specifications"
  - type: "frontend-specialist"
    role: "Design and implement user interfaces"
docs:
  - "project-overview.md"
phases:
  - id: "phase-1"
    name: "Sidebar & Navigation Refactor"
    prevc: "E"
  - id: "phase-2"
    name: "Unified Chat Interface"
    prevc: "E"
  - id: "phase-3"
    name: "Library & Vision Implementation"
    prevc: "E"
---

# UI Refactor: Unified Chat & Sidebar Reorganization Plan

> Refactor sidebar navigation to unify artifacts into a Library, separate Odonto Vision, and add Certificates. Update Chat to support Agent Selection and Audio/Image input.

## Task Snapshot
- **Primary goal:** Create a single unified chat with agent selection, consolidate artifact pages into a single "Library" page, and add new specific pages for Vision and Certificates.
- **Success signal:** Sidebar reflects new structure, Chat allows selecting agents, Audio/Image input works, and Artifacts are accessible in the new Library.
- **Key references:**
  - `components/dashboard/new-sidebar.tsx`
  - `components/agno-chat/agno-chat.tsx`

## Working Phases

### Phase 1 — Sidebar & Navigation Refactor
**Steps**
1.  **Modify `components/dashboard/new-sidebar.tsx`**:
    *   Update `dashboardNavigation` array.
    *   **Remove:** Pesquisas, Questionários, Escritor, Imagens, Resumos, Materiais.
    *   **Add:**
        *   "Biblioteca" (Icon: `Library` or `BookOpen`) -> `/dashboard/biblioteca`
        *   "Odonto Vision" (Icon: `ScanEye` or `Eye`) -> `/dashboard/vision`
        *   "Certificados" (Icon: `Award` or `Certificate`) -> `/dashboard/certificados`
        *   Keep "Cursos".
2.  **Create Page Shells**:
    *   Create `app/dashboard/biblioteca/page.tsx`.
    *   Create `app/dashboard/vision/page.tsx`.
    *   Create `app/dashboard/certificados/page.tsx`.

### Phase 2 — Unified Chat Interface
**Steps**
1.  **Update `components/agno-chat/agno-chat.tsx`**:
    *   Import and use `AgentSelector` in the header (replace static "Odonto GPT" title).
    *   Ensure `handleSend` passes the `selectedAgent` correctly (it already seems to).
    *   Verify `AgnoInput` is correctly handling file uploads and audio recording (logic exists, ensure UI matches requirements).
2.  **Verify Agent Selection**:
    *   Ensure `useAgnoAgents` returns the list of agents (GPT, Research, Practice, Write, Vision).

### Phase 3 — Library & Vision Implementation
**Steps**
1.  **Implement `app/dashboard/biblioteca/page.tsx`**:
    *   Create a Unified Artifact View.
    *   Use Tabs (`components/ui/tabs`) to filter by type: "Resumos", "Pesquisas", "Questionários", "Mind Maps", "Materiais".
    *   Reuse existing components like `SummaryCard`, `ArtifactCard` where possible.
2.  **Implement `app/dashboard/vision/page.tsx`**:
    *   Move/Refactor content from `app/dashboard/imagens` to here.
    *   Focus on Image Analysis features.

## Risks
*   **Data Migration:** Ensure links to existing artifacts still work. The plan assumes we are just moving the *views*, not changing the database structure.
*   **User Confusion:** Drastic navigation changes might confuse users.
