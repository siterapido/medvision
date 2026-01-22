---
slug: middleware
category: architecture
generatedAt: 2026-01-22T19:00:46.330Z
relevantFiles:
  - .venv/lib/python3.12/site-packages/fastapi/middleware/__init__.py
  - .venv/lib/python3.12/site-packages/fastapi/middleware/__pycache__
  - .venv/lib/python3.12/site-packages/fastapi/middleware/asyncexitstack.py
  - .venv/lib/python3.12/site-packages/fastapi/middleware/cors.py
  - .venv/lib/python3.12/site-packages/fastapi/middleware/gzip.py
  - .venv/lib/python3.12/site-packages/fastapi/middleware/httpsredirect.py
  - .venv/lib/python3.12/site-packages/fastapi/middleware/trustedhost.py
  - .venv/lib/python3.12/site-packages/fastapi/middleware/wsgi.py
  - .venv/lib/python3.12/site-packages/starlette/middleware/__init__.py
  - .venv/lib/python3.12/site-packages/starlette/middleware/__pycache__
---

# How does middleware work?

## Middleware

Middleware functions process requests before they reach route handlers.


### Validation Middleware
Request validation is implemented using middleware.