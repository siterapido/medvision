# Testing Strategy

## Overview
We aim to ensure application stability through a mix of static analysis and component testing.

## Test Types

### Static Analysis (Linting)
- **Tool**: ESLint
- **Scope**: All TypeScript/JavaScript files.
- **Goal**: Catch syntax errors, unused variables, and enforce coding standards.
- **Command**: `npm run lint`

### Frontend Unit/Component Testing (Planned)
- **Framework**: Jest + React Testing Library (to be implemented).
- **Scope**: Reusable UI components, hooks, and utility functions.
- **Naming**: `*.test.tsx` or `*.spec.ts`.

### Backend Testing
- **Framework**: Pytest (recommended for Agno service).
- **Scope**: Agent logic, API endpoints.
- **Location**: `odonto-gpt-agno-service/tests/`.

## Running Tests
currently, the primary verification method is **manual testing** and **linting**.

```bash
# Linting
npm run lint

# Type Checking
npm run type-check # (if script exists in package.json, otherwise tsc --noEmit)
```

## Future Improvements
- Implement automated unit tests for critical components (`useAgnoChat`, `AuthForm`).
- Add Cypress or Playwright for End-to-End (E2E) testing of the chat flow.
