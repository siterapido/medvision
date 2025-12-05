# Aplicar Migrations do Supabase

## Opção 1: Via Dashboard do Supabase (MCP - Migration Control Panel)

1. Acesse: https://app.supabase.com/project/qphofwxpmmhfplylozsh/editor
2. Vá para **SQL Editor**
3. Copie o conteúdo de `supabase/migrations/002_courses_and_chat.sql`
4. Cole no editor e clique em **Run**

## Opção 2: Via Supabase CLI (Recomendado)

O projeto agora possui o Supabase CLI configurado. Esta é a maneira mais segura de manter o banco de dados sincronizado.

### 1. Setup Inicial
Se é sua primeira vez rodando o projeto:
```bash
./scripts/setup-supabase.sh
```

### 2. Verificar Status
Para ver quais migrações já foram aplicadas e quais estão pendentes:
```bash
npm run db:status
```

### 3. Aplicar Migrações Pendentes
Para aplicar todas as migrações locais que ainda não estão no banco remoto:
```bash
npm run db:push
```

### 4. Resetar Banco (Cuidado!)
Para limpar o banco e reaplicar tudo do zero (apenas em desenvolvimento):
```bash
npm run db:reset
```

## Opção 3: Validação Automática

Criamos um script para verificar se seu ambiente local está sincronizado com o remoto. Útil para rodar antes de deploys ou PRs.

```bash
npx tsx scripts/validate-migrations.ts
```

Se houver migrações pendentes, o script falhará e listará quais arquivos precisam ser aplicados.

## Opção 4: Via Script SQL Direto (Legado)

Copie e execute o SQL abaixo no SQL Editor do Supabase:

```sql
-- Copie todo o conteúdo do arquivo desejado em supabase/migrations/
```

## Troubleshooting

**Erro: "function handle_updated_at does not exist"**
- Aplique primeiro a migration `001_initial_schema.sql`

**Erro: "permission denied"**
- Certifique-se de estar usando as credenciais corretas
- Verifique se você tem permissões de admin no projeto

**Erro: "Could not find column..."**
- Execute `npm run db:status` para ver se falta alguma migração
- Se faltar, execute `npm run db:push`
