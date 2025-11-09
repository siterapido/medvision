# Configuração do Supabase - Odonto GPT

Este documento descreve como configurar a autenticação via Supabase no projeto Odonto GPT.

## 📋 Pré-requisitos

- Conta no Supabase (gratuita): https://supabase.com
- Node.js instalado
- Projeto Next.js configurado

## 🚀 Configuração Inicial

### 1. Criar Projeto no Supabase

1. Acesse https://app.supabase.com
2. Clique em "New Project"
3. Preencha:
   - **Name**: Odonto GPT
   - **Database Password**: Crie uma senha forte
   - **Region**: Escolha a região mais próxima (South America)
4. Aguarde a criação do projeto (~2 minutos)

### 2. Obter Credenciais

1. No painel do Supabase, vá em **Settings** > **API**
2. Copie os valores:
   - **Project URL** (algo como: `https://xxxxx.supabase.co`)
   - **anon/public key** (chave pública para uso no frontend)

### 3. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edite `.env.local` e adicione suas credenciais:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   APP_URL=http://localhost:3000
   # Necessário para rotas administrativas (/api/admin/users)
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 4. Configurar Authentication no Supabase

1. No painel do Supabase, vá em **Authentication** > **Providers**
2. Configure o **Email Provider**:
   - ✅ Enable Email provider
   - ✅ Confirm email (recomendado para produção)
   - ⚠️ Para desenvolvimento, você pode desabilitar "Confirm email"

3. Em **Authentication** > **URL Configuration**, adicione:
   - **Site URL**: `http://localhost:3000` (dev) ou seu domínio em produção
   - **Redirect URLs**:
     - `http://localhost:3000/auth/callback`
     - Seu domínio de produção + `/auth/callback`

### 5. Configurar Banco de Dados

#### Opção A: Via SQL Editor (Recomendado)

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **+ New query**
3. Abra o arquivo `supabase/migrations/001_initial_schema.sql` do projeto
4. Copie todo o conteúdo
5. Cole no SQL Editor do Supabase
6. Clique em **Run** ou pressione `Ctrl/Cmd + Enter`
7. Aguarde a execução (~5 segundos)

#### Opção B: SQL Mínimo (Quick Start)

Se preferir começar apenas com o essencial para teste:

1. Vá em **SQL Editor**
2. Execute:
   ```sql
   -- Criar tabela de perfis de usuário (opcional)
   create table public.profiles (
     id uuid references auth.users on delete cascade not null primary key,
     name text,
     role text not null default 'cliente' check (role in ('cliente', 'admin')),
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     updated_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Habilitar RLS
   alter table public.profiles enable row level security;

   -- Política: clientes enxergam apenas o próprio registro
   create policy "Clientes podem ver o próprio perfil"
     on public.profiles for select
     using ( auth.uid() = id );

   -- Política: clientes atualizam apenas o próprio registro
   create policy "Clientes podem atualizar o próprio perfil"
     on public.profiles for update
     using ( auth.uid() = id and role = 'cliente' )
     with check ( auth.uid() = id and role = 'cliente' );

   -- Política: admins têm acesso completo
   create policy "Admins podem gerenciar perfis"
     on public.profiles for all
     using ( exists (
       select 1 from public.profiles admins
       where admins.id = auth.uid() and admins.role = 'admin'
     ))
     with check ( exists (
       select 1 from public.profiles admins
       where admins.id = auth.uid() and admins.role = 'admin'
     ));

   -- Trigger para criar perfil automaticamente ao registrar
   create function public.handle_new_user()
   returns trigger as $$
   declare
     sanitized_role text := case
       when new.raw_user_meta_data->>'role' = 'admin' then 'admin'
       else 'cliente'
     end;
   begin
     insert into public.profiles (id, name, role)
     values (
       new.id,
       coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
       sanitized_role
     );
     return new;
   end;
   $$ language plpgsql security definer;

   create trigger on_auth_user_created
     after insert on auth.users
     for each row execute procedure public.handle_new_user();
   ```

## 🔐 Funcionalidades Implementadas

### ✅ Login
- Formulário de login em `/login`
- Validação de email/senha
- Mensagens de erro em português
- Botão de mostrar/ocultar senha
- Loading states
- Redirecionamento para dashboard após login

### ✅ Cadastro
- Formulário de registro em `/register`
- Validação de senha (mínimo 8 caracteres)
- Confirmação de senha
- Campos: Nome completo, Email, Senha
- Mensagens de sucesso/erro em português
- Confirmação de email (se habilitado)
- Salvamento do nome + role (cliente) no metadata do usuário

### ✅ Middleware de Autenticação
- Proteção automática de rotas
- Rotas protegidas: `/dashboard`, `/settings`, `/profile`
- Redirecionamento automático:
  - Usuários não autenticados → `/login`
  - Usuários autenticados → `/dashboard` (se tentarem acessar `/login` ou `/register`)
- Refresh automático de sessão
- Preservação da URL de destino após login

### ✅ Criação de usuário Admin via API
- Endpoint: `POST /api/admin/users`
- Requer sessão ativa de um usuário com `role = admin`
- Payload:
  ```json
  {
    "email": "nova.admin@exemplo.com",
    "password": "senha-segura",
    "name": "Nome Opcional"
  }
  ```
- Utiliza `SUPABASE_SERVICE_ROLE_KEY` para chamar a Admin API do Supabase e já salva o perfil como `admin`

### ✅ Componentes de UI
- Alert component para mensagens de erro/sucesso
- Estados de loading
- Validação de formulários
- Acessibilidade (ARIA labels)

## 🧪 Testando a Integração

### 0. Testar Conexão com Banco de Dados (NOVO!)

**Página de teste criada:** `http://localhost:3000/notes`

1. Certifique-se que executou o SQL migration (passo 5 acima)
2. Inicie o servidor:
   ```bash
   npm run dev
   ```
3. Acesse: http://localhost:3000/notes
4. Você deve ver:
   - ✅ Lista das 3 notas de exemplo
   - ✅ Status de conexão (verde)
   - ✅ Dados em formato JSON
   - ✅ Confirmação que SELECT, RLS e Conexão funcionam

**Se aparecer erro:**
- Verifique se `.env.local` está configurado
- Verifique se a tabela `notes` foi criada no Supabase
- Reinicie o servidor (`npm run dev`)
- Veja troubleshooting em `supabase/README.md`

### 1. Testar Cadastro

```bash
npm run dev
```

1. Acesse http://localhost:3000/register
2. Preencha o formulário:
   - Nome: Dr. João Silva
   - Email: teste@exemplo.com
   - Senha: senha123456
3. Clique em "Criar Conta"
4. Verifique o email (se confirmação estiver habilitada)
5. Deverá redirecionar para `/dashboard` ou `/login`

### 2. Testar Login

1. Acesse http://localhost:3000/login
2. Use as credenciais criadas
3. Deverá redirecionar para `/dashboard`

### 3. Testar Proteção de Rotas

1. Tente acessar http://localhost:3000/dashboard sem estar logado
2. Deverá redirecionar para `/login?redirectTo=/dashboard`
3. Após login, deverá voltar para `/dashboard`

## 📁 Estrutura de Arquivos

```
/lib/supabase/
  ├── client.ts          # Cliente Supabase para client components
  └── server.ts          # Cliente Supabase para server components

/components/auth/
  ├── login-form.tsx     # Formulário de login integrado
  └── register-form.tsx  # Formulário de cadastro integrado

/app/
  ├── login/
  │   └── page.tsx       # Página de login
  └── register/
      └── page.tsx       # Página de cadastro

middleware.ts            # Middleware de autenticação e proteção de rotas
.env.local              # Variáveis de ambiente (não commitado)
.env.example            # Template de variáveis de ambiente
```

## 🔧 Troubleshooting

### Erro: "Missing Supabase environment variables"
- Verifique se o arquivo `.env.local` existe
- Certifique-se que as variáveis começam com `NEXT_PUBLIC_`
- Reinicie o servidor de desenvolvimento

### Erro: "Invalid login credentials"
- Verifique se o email está correto
- Verifique se a senha tem pelo menos 8 caracteres
- Certifique-se que o usuário foi criado no Supabase

### Erro: "Email not confirmed"
- Se a confirmação de email estiver habilitada, verifique a caixa de entrada
- Para desenvolvimento, desabilite em: Authentication > Providers > Email > Confirm email

### Sessão expira muito rápido
- Ajuste em: Authentication > Settings > JWT expiry
- Padrão: 3600 segundos (1 hora)
- Recomendado: 604800 segundos (7 dias)

## 📚 Recursos Adicionais

- [Documentação do Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase + Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)

## 🚀 Próximos Passos

1. **Forgot Password**: Implementar recuperação de senha
2. **Email Templates**: Customizar templates de email no Supabase
3. **OAuth Providers**: Adicionar login com Google/GitHub
4. **Profile Management**: Página de gerenciamento de perfil
5. **Email Verification**: Página de confirmação de email

## 🔒 Segurança em Produção

Antes de ir para produção:

1. ✅ Habilitar confirmação de email
2. ✅ Configurar Rate Limiting no Supabase
3. ✅ Adicionar CAPTCHA (opcional)
4. ✅ Configurar políticas de senha forte
5. ✅ Revisar políticas RLS
6. ✅ Configurar domínio de produção nas Redirect URLs
7. ✅ Monitorar tentativas de login suspeitas

---

**Desenvolvido para Odonto GPT** 🦷
