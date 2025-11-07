# Aplicar Migrations do Supabase

## Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse: https://app.supabase.com/project/qphofwxpmmhfplylozsh/editor
2. Vá para **SQL Editor**
3. Copie o conteúdo de `supabase/migrations/002_courses_and_chat.sql`
4. Cole no editor e clique em **Run**

## Opção 2: Via Supabase CLI

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar ao projeto
supabase link --project-ref qphofwxpmmhfplylozsh

# Aplicar migrations
supabase db push
```

## Opção 3: Via Script SQL Direto

Copie e execute o SQL abaixo no SQL Editor do Supabase:

```sql
-- Copie todo o conteúdo do arquivo:
-- supabase/migrations/002_courses_and_chat.sql
```

## Verificar se funcionou

Após aplicar, execute no SQL Editor:

```sql
-- Ver tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Ver cursos seed
SELECT * FROM courses;

-- Ver lessons do curso 1
SELECT * FROM lessons WHERE course_id = 1 ORDER BY order_index;
```

## Troubleshooting

**Erro: "function handle_updated_at does not exist"**
- Aplique primeiro a migration `001_initial_schema.sql`

**Erro: "permission denied"**
- Certifique-se de estar usando as credenciais corretas
- Verifique se você tem permissões de admin no projeto
