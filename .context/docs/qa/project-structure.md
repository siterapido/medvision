---
slug: project-structure
category: architecture
generatedAt: 2026-01-22T19:00:18.563Z
relevantFiles:
  - app/.DS_Store
  - app/actions
  - app/admin
  - app/api
  - app/auth
  - app/dashboard
  - app/faq
  - app/forgot-password
  - app/global-error.tsx
  - app/globals.css
---

# How is the codebase organized?

## Project Structure

```
_archived/
app/
components/
docs/
lib/
playwright-report/
public/
scripts/
styles/
supabase/
test-results/
tests/
tests-e2e/
tmp/
v0-odonto-gpt-ui/
```

### Next.js Structure

- `app/` or `pages/` - Routes and pages
- `components/` - Reusable UI components
- `lib/` - Utility functions
- `public/` - Static assets