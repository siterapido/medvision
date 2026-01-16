# Security & Compliance Notes

## Authentication & Authorization

### Supabase Auth
The application relies on Supabase for authentication.
- **Providers**: Email/Password, OAuth (if configured).
- **Session Management**: JWTs handled by Supabase client libraries.
- **Row Level Security (RLS)**: Crucial for data security. Every table in Supabase MUST have RLS enabled. Policies determine who can select, insert, update, or delete rows (typically narrowed to `auth.uid() = user_id`).

### Frontend Protection
- **Middleware**: `middleware.ts` protects routes, ensuring only authenticated users can access `/dashboard` and other protected areas.
- **Client Components**: Verify session state using `createClientComponentClient`.

## Secrets & Sensitive Data

- **Environment Variables**:
    - `.env.local`: Stores API keys (Supabase URL, Anon Key, OpenRouter Key).
    - **Never commit `.env` files.**
- **Database Connection**: Managed via Supabase secure connection pooling.
- **LLM Keys**: The OpenRouter API key is sensitive and must differ between development and production if possible. It is used by the Python service.

## Data Privacy (HIPAA Consideration)
Since this is a dental application, it may process Patient Health Information (PHI).
- **Current Status**: Prototype/MVP.
- **Warning**: Do not store real patient data (names, identifiable images) in the current environment unless a BAA is signed with Supabase/OpenRouter and strict compliance measures are in place. Use anonymized data for development.

## AI Safety
- **Prompt Injection**: Input validation should be performed before sending data to LLMs.
- **Output Validation**: Responses from the AI should be sanitized, especially if rendering HTML/Markdown.

## Incident Response
- **Logging**:
    - Frontend: Console logs (should be minimized in prod), potential Sentry integration.
    - Backend: Python logging, Supabase logs.
- **Critical Issues**: Unexpected downtime or data leaks should be escalated immediately.
