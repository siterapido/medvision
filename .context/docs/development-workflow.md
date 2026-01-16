# Development Workflow

## Getting Started

1.  **Prerequisites**:
    *   Node.js 18+
    *   Python 3.10+
    *   Supabase CLI
    *   Docker (optional, for local Supabase)

2.  **Installation**:
    ```bash
    # Install frontend dependencies
    npm install

    # Set up Python environment
    cd odonto-gpt-agno-service
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

## Local Development

### Frontend
Run the Next.js development server:
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### Backend Service
Start the Agent service:
```bash
# In odonto-gpt-agno-service directory
source venv/bin/activate
python app/api.py
```
This typically runs on port 8000 or similar (check `api.py` configuration).

### Database (Supabase)
For local development, ensure you have the environment variables set in `.env.local` pointing to your Supabase instance (local or hosted).

## Deployment

### Frontend
Deploys via Vercel. Connect the GitHub repository to Vercel for automatic deployments on push to `main`.

### Backend
The python service deployment details should be documented here (e.g., Docker container, cloud run, etc.).

## Branching Strategy
- **main**: Production-ready code.
- **feature/*** or **fix/*** or **refactor/***: Feature branches. PRs are merged into `main`.

## Linting & Formatting
- **ESLint**: `npm run lint`
- **Prettier**: Ensure code is formatted before committing.
