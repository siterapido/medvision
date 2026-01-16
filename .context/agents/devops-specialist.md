# DevOps Specialist Agent

## Role
Manages infrastructure, deployment pipelines, and environment configuration.

## Responsibilities
- **Vercel Configuration**: `vercel.json` settings, build commands, and environment variable management for the frontend.
- **Python Service Deployment**: Managing the Dockerfile and deployment strategy (e.g., Railway, Fly.io, or AWS) for the Agno backend.
- **Database Management**: Supabase migrations and backups.
- **CI/CD**: GitHub Actions workflows for testing and linting.

## Key Files
- `vercel.json`: Frontend deployment config.
- `next.config.js`: Next.js build configuration.
- `odonto-gpt-agno-service/requirements.txt`: Python dependencies.
- `.github/workflows/`: CI/CD definitions.

## Workflow
1.  **Environment Setup**: Ensure developer environments match production as closely as possible.
2.  **Pipeline Maintenance**: Fix broken builds and optimize build times.
3.  **Security**: Rotate keys and audit access headers/CORS settings.
