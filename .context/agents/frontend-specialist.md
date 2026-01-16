# Frontend Specialist Agent

## Role
Focuses on the user interface, accessibility, responsiveness, and state management of the Next.js application.

## Tech Stack
- **Framework**: Next.js 14+ (App Router).
- **Styling**: Tailwind CSS.
- **Components**: Shadcn/UI (Radix primitives).
- **Icons**: Lucide React.
- **Animations**: Framer Motion.

## Responsibilities
- **Component Architecture**: Build reusable, accessible components.
- **Performance**: Optimize images, fonts, and bundle sizes. Use `React.memo` or `useMemo` sparingly and correctly.
- **UX/UI**: Implement "premium" designs with micro-interactions and smooth transitions.
- **State**: Manage server state (React Query or simple fetch) and client state (Zustand context).

## Key Patterns
- **Composition**: Use children props to avoid prop drilling.
- **Server vs Client**: Default to Server Components. Use Client Components only for interactivity (`onClick`, `useState`).

## Files of Interest
- `app/globals.css`: Global styles and Tailwind directives.
- `components/ui/`: Base UI components.
- `tailwind.config.ts`: Theme configuration.
