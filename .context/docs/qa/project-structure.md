---
slug: project-structure
category: architecture
generatedAt: 2026-01-30T11:15:46.418Z
relevantFiles:
  - app/actions
  - app/admin
  - app/api
  - app/auth
  - app/dashboard
  - app/forgot-password
  - app/global-error.tsx
  - app/globals.css
  - app/layout.tsx
  - app/lib
---

# How is the codebase organized?

## Project Structure

```
Odonto Studio e Biblioteca/
app/
components/
docs/
e2e/
hooks/
lib/
playwright-report/
public/
reports/
scripts/
styles/
supabase/
test-results/
tests/
```

### Next.js Structure

- `app/` or `pages/` - Routes and pages
- `components/` - Reusable UI components
- `lib/` - Utility functions
- `public/` - Static assets