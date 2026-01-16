---
description: Inicie o ambiente de desenvolvimento completo (frontend + backend)
---

Execute o script `start_all.sh` para iniciar ambos os serviços (Next.js frontend na porta 3000 e Agno backend na porta 8000).

O script já está configurado para:
- Limpar as portas 3000 e 8000 automaticamente
- Iniciar o backend (Agno) em background
- Iniciar o frontend (Next.js) em background
- Capturar logs em arquivos separados (frontend.log e backend.log)
- Parar ambos os serviços quando você pressionar Ctrl+C

Use apenas:
```bash
./start_all.sh
```

Ou se preferir iniciar os serviços separadamente:
```bash
# Frontend apenas
npm run dev

# Backend apenas
cd odonto-gpt-agno-service
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
