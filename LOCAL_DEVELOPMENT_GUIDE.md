# Guia de Desenvolvimento Local - Odonto GPT

Este guia consolida os passos necessários para rodar o ecossistema Odonto GPT na sua máquina local.

---

## 1. Requisitos Prévios

- **Node.js**: v18 ou superior
- **Python**: 3.9 ou superior
- **Supabase**: Conta ativa em [supabase.com](https://supabase.com)
- **OpenAI API Key**: Chave para os agentes de IA

---

## 2. Configuração do Backend (Agno Service)

O backend processa a lógica dos agentes de IA e análise de imagens.

1. **Navegue até a pasta**:
   ```bash
   cd odonto-gpt-agno-service
   ```

2. **Ambiente Virtual (Recomendado)**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # No Windows: venv\Scripts\activate
   ```

3. **Instale as dependências**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Variáveis de Ambiente**:
   - Copie o template: `cp .env.example .env`
   - Preencha os campos obrigatórios:
     - `OPENAI_API_KEY`
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_DB_URL` (URL de conexão direta do Postgres)

5. **Inicie o Servidor**:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   *O backend estará acessível em `http://localhost:8000`.*

---

## 3. Configuração do Frontend (Next.js)

A interface principal da aplicação.

1. **Retorne à raiz do projeto**:
   ```bash
   cd ..
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Variáveis de Ambiente**:
   - Copie o template: `cp .env.example .env.local`
   - Configure o acesso ao Supabase e a URL do Agno Service:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
     AGNO_SERVICE_URL=http://localhost:8000/api/v1
     ```

4. **Inicie o Ambiente de Desenvolvimento**:
   ```bash
   npm run dev
   ```
   *O frontend estará acessível em `http://localhost:3000`.*

---

## 4. Configuração do Banco de Dados (Supabase)

O projeto depende do Supabase para autenticação e persistência.

1. **Criação do Projeto**: Crie um novo projeto no dashboard do Supabase.
2. **Schema SQL**: Execute o conteúdo de `supabase/migrations/001_initial_schema.sql` (ou o arquivo mais recente) no **SQL Editor** do Supabase.
3. **Policies (RLS)**: Certifique-se de que as políticas de segurança estão aplicadas para permitir acesso aos dados.
4. **Instruções Detalhadas**: Consulte o arquivo [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) para um guia passo a passo.

---

## 5. Scripts Úteis

Na raiz do projeto, você pode usar os seguintes atalhos:

- `npm run agno:install`: Instala dependências do backend.
- `npm run agno:dev`: Inicia o backend Agno Service.
- `npm run validate:env`: Valida se as variáveis de ambiente do frontend estão corretas.

---

## 💡 Dicas de Troubleshooting

- **Erro de Conexão no Chat**: Verifique se o backend Python está rodando na porta 8000.
- **Erro de Autenticação**: Garanta que as chaves `ANON_KEY` e `SUPABASE_URL` no frontend e backend coincidam.
- **RAG/Conhecimento**: Se o agente não souber responder sobre os cursos, execute `python scripts/populate_knowledge.py` dentro da pasta do backend.
