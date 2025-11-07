# Supabase Database Setup - Odonto GPT

Este diretório contém as migrations e configurações do banco de dados Supabase.

## 📁 Estrutura

```
supabase/
├── migrations/
│   └── 001_initial_schema.sql    # Schema inicial do banco
└── README.md                      # Este arquivo
```

## 🚀 Quick Start

### Opção 1: Executar via Supabase Dashboard (Recomendado)

1. **Acesse seu projeto no Supabase**
   - Vá para https://app.supabase.com
   - Abra seu projeto Odonto GPT

2. **Abra o SQL Editor**
   - No menu lateral, clique em **SQL Editor**
   - Clique em **+ New query**

3. **Execute a Migration**
   - Copie o conteúdo de `migrations/001_initial_schema.sql`
   - Cole no editor SQL
   - Clique em **Run** ou pressione `Ctrl/Cmd + Enter`

4. **Verifique as Tabelas**
   - Vá para **Table Editor**
   - Você deve ver as tabelas:
     - ✅ `notes` (tabela de exemplo)
     - ✅ `profiles` (perfis de usuário)
     - ✅ `subscriptions` (assinaturas)
     - ✅ `usage_logs` (logs de uso)

### Opção 2: Copiar e Colar SQL Diretamente

Se você preferir executar manualmente, aqui está o SQL mínimo para começar:

```sql
-- Criar tabela de exemplo
create table public.notes (
  id bigint primary key generated always as identity,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Inserir dados de exemplo
insert into public.notes (title)
values
  ('Hoje criei o projeto Odonto GPT no Supabase.'),
  ('Adicionei autenticação e dados de exemplo.'),
  ('O sistema está funcionando perfeitamente!');

-- Habilitar RLS
alter table public.notes enable row level security;

-- Política: leitura pública
create policy "public can read notes"
  on public.notes
  for select
  to anon
  using (true);
```

## 📊 Tabelas Criadas

### 1. **notes** (Tabela de Exemplo)

Tabela simples para testar a conexão com o banco.

**Campos:**
- `id` - Identificador único (auto-incremento)
- `title` - Texto da nota
- `created_at` - Data de criação

**RLS Policy:** Leitura pública (qualquer um pode ler)

**Acesso:** `http://localhost:3000/notes`

---

### 2. **profiles** (Perfis de Usuário)

Vinculada à tabela `auth.users` do Supabase.

**Campos:**
- `id` - UUID (referência a auth.users)
- `name` - Nome completo do usuário
- `email` - Email do usuário
- `avatar_url` - URL do avatar
- `role` - Função (`cliente` padrão ou `admin` para acesso total)
- `created_at` - Data de criação
- `updated_at` - Data de atualização

**RLS Policies:**
- ✅ Clientes podem ver apenas o próprio perfil
- ✅ Clientes podem atualizar apenas o próprio perfil
- ✅ Admins podem gerenciar qualquer registro

**Trigger:** Ao criar novo usuário em `auth.users`, automaticamente cria um perfil em `profiles`

---

### 3. **subscriptions** (Assinaturas)

Gerenciamento de planos e status de assinatura.

**Campos:**
- `id` - Identificador único
- `user_id` - Referência ao usuário
- `plan` - Plano (monthly, annual)
- `status` - Status (active, canceled, past_due, trialing)
- `current_period_start` - Início do período
- `current_period_end` - Fim do período
- `cancel_at_period_end` - Cancelar ao final do período
- `created_at` - Data de criação
- `updated_at` - Data de atualização

**RLS Policy:** Usuários podem ver apenas sua própria assinatura

---

### 4. **usage_logs** (Logs de Uso)

Tracking de ações do usuário para analytics.

**Campos:**
- `id` - Identificador único
- `user_id` - Referência ao usuário
- `action` - Ação realizada
- `metadata` - Dados adicionais (JSONB)
- `created_at` - Data da ação

**RLS Policies:**
- ✅ Usuários podem ver seus próprios logs
- ✅ Usuários podem inserir seus próprios logs

## 🔐 Row Level Security (RLS)

Todas as tabelas têm RLS habilitado para garantir que:

1. **Isolamento de dados**: Cada usuário só acessa seus próprios dados
2. **Segurança**: Políticas impedem acesso não autorizado
3. **Controle granular**: Diferentes permissões para SELECT, INSERT, UPDATE, DELETE

### Políticas Implementadas

```sql
-- Exemplo: profiles
✅ Clientes podem ver o próprio perfil
✅ Clientes podem atualizar o próprio perfil
✅ Admins podem gerenciar perfis

-- Exemplo: subscriptions
✅ Users can view own subscription

-- Exemplo: usage_logs
✅ Users can view own usage logs
✅ Users can insert own usage logs
```

## 🧪 Testando a Conexão

### Via Página de Teste

1. Certifique-se que as variáveis de ambiente estão configuradas:
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```

2. Inicie o servidor:
   ```bash
   npm run dev
   ```

3. Acesse a página de teste:
   ```
   http://localhost:3000/notes
   ```

4. Você deve ver:
   - ✅ Lista das notas do banco
   - ✅ Status de conexão
   - ✅ Dados em formato JSON

### Via SQL Editor

Execute queries diretamente no Supabase:

```sql
-- Ver todas as notas
select * from notes;

-- Adicionar nova nota
insert into notes (title)
values ('Testando a conexão!');

-- Ver todos os perfis
select * from profiles;

-- Ver usuários autenticados
select * from auth.users;
```

## 📈 Indexes

Para melhorar a performance, foram criados indexes nas seguintes tabelas:

```sql
✅ profiles(id)
✅ subscriptions(user_id)
✅ subscriptions(status)
✅ usage_logs(user_id)
✅ usage_logs(created_at desc)
```

## 🔄 Triggers

### 1. **Auto-create Profile**

Quando um novo usuário se registra, automaticamente cria um perfil:

```sql
Trigger: on_auth_user_created
Function: handle_new_user()
```

### 2. **Updated At**

Atualiza automaticamente o campo `updated_at`:

```sql
Trigger: on_profile_updated (profiles)
Trigger: on_subscription_updated (subscriptions)
Function: handle_updated_at()
```

## 🛠️ Comandos Úteis

### Resetar Tabela de Notas

```sql
truncate table notes restart identity cascade;
```

### Adicionar Nova Nota

```sql
insert into notes (title)
values ('Sua nova nota aqui');
```

### Ver Políticas RLS

```sql
select * from pg_policies
where tablename = 'profiles';
```

### Desabilitar RLS (apenas para debug)

```sql
alter table notes disable row level security;
-- ATENÇÃO: Não use em produção!
```

## 🚨 Troubleshooting

### Erro: "permission denied for table X"

**Solução:** Verifique se as políticas RLS estão configuradas corretamente:

```sql
-- Ver políticas da tabela
select * from pg_policies where tablename = 'notes';

-- Recriar política se necessário
create policy "public can read notes"
  on public.notes
  for select
  to anon
  using (true);
```

### Erro: "relation 'notes' does not exist"

**Solução:** Execute a migration SQL novamente:

1. Vá no SQL Editor do Supabase
2. Execute `001_initial_schema.sql`
3. Verifique se a tabela aparece no Table Editor

### Erro: "insert or update on table violates foreign key"

**Solução:** Certifique-se que o `user_id` referenciado existe em `auth.users`

### Página /notes retorna erro 500

**Soluções:**

1. Verifique `.env.local`:
   ```bash
   cat .env.local
   ```

2. Reinicie o servidor:
   ```bash
   npm run dev
   ```

3. Verifique os logs do console do navegador

4. Teste a conexão diretamente:
   ```typescript
   const { data, error } = await supabase.from('notes').select()
   console.log(data, error)
   ```

## 📚 Próximos Passos

1. **Customizar Perfis**: Adicionar campos específicos do Odonto GPT
2. **Integração Kiwify**: Sincronizar assinaturas com Kiwify
3. **Analytics**: Implementar tracking de uso
4. **Webhooks**: Configurar webhooks do Supabase
5. **Realtime**: Adicionar funcionalidades em tempo real

## 🔗 Links Úteis

- [Supabase Dashboard](https://app.supabase.com)
- [Documentação RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Políticas SQL](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Triggers](https://supabase.com/docs/guides/database/postgres/triggers)

---

**Desenvolvido para Odonto GPT** 🦷

Se precisar de ajuda, consulte o arquivo `SUPABASE_SETUP.md` na raiz do projeto.
