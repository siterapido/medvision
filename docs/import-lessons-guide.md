# Guia de Importação de Aulas

Este guia explica como importar aulas em lote para um curso.

## Opção 1: Via API (Recomendado)

### Pré-requisitos
1. Servidor Next.js rodando (`npm run dev`)
2. Você deve estar autenticado como admin no sistema

### Passos

1. Abra o navegador e faça login como admin em `http://localhost:3000/login`

2. Execute o script de importação:
```bash
npx tsx scripts/import-lessons-via-api.ts
```

O script irá:
- Conectar à API local
- Importar todas as aulas do curso `1ec7ee66-0597-4fb8-add6-f9dc4e6f0f2c`
- Criar os módulos automaticamente
- Organizar as aulas por módulo

## Opção 2: Via Script Direto (Requer Service Role Key)

Se você tiver acesso à `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`:

```bash
npx tsx scripts/import-lessons-from-text.ts
```

**Nota:** Este método requer que a chave de serviço esteja configurada corretamente.

## Opção 3: Via Interface Web

1. Acesse `http://localhost:3000/admin/cursos/1ec7ee66-0597-4fb8-add6-f9dc4e6f0f2c/aulas`
2. Use a interface para adicionar aulas manualmente

## Estrutura dos Dados

As aulas serão organizadas nos seguintes módulos:

1. **Apresentação** (1 aula)
2. **Introdução a Terapéutica** (5 aulas)
3. **Antibióticos** (9 aulas)
4. **Analgésicos** (3 aulas)
5. **Antidepressivos** (1 aula)
6. **Anticonvulsivantes** (1 aula)
7. **Anti-inflamatórios** (8 aulas)
8. **Ansiolíticos** (1 aula)
9. **Relaxantes Musculares** (1 aula)
10. **Anestésicos Locais** (1 aula)
11. **Terapêutica aplicada a Ortodontia** (4 aulas)
12. **Certificado** (1 aula)

**Total:** 36 aulas

## Verificação

Após a importação, verifique em:
- `http://localhost:3000/admin/cursos/1ec7ee66-0597-4fb8-add6-f9dc4e6f0f2c/aulas`






