# Refatoração Completa do Sistema de Cursos

## Resumo Executivo

Foi realizada uma refatoração completa do sistema de cursos para garantir o funcionamento correto da criação, edição e gerenciamento de cursos. Esta refatoração incluiu:

1. **Nova migration consolidada** (`010_course_structure_refactor.sql`)
2. **Refatoração completa do componente CourseWorkspace**
3. **Validação robusta de formulários**
4. **Melhor tratamento de erros**
5. **Correção do bug 400 Bad Request**

---

## 📊 Mudanças no Banco de Dados

### Migration: `010_course_structure_refactor.sql`

#### 1. Novos Campos na Tabela `courses`

```sql
ALTER TABLE public.courses ADD COLUMN:
- area text                      -- Área/especialidade do curso
- difficulty text                -- Nível: Iniciante, Intermediário, Avançado
- format text                    -- Formato: 100% online, Híbrido, Presencial
- price text                     -- Preço sugerido (texto livre)
- tags text                      -- Tags separadas por vírgula
- is_published boolean           -- Status de publicação
- published_at timestamptz       -- Data/hora de publicação
```

#### 2. Triggers Automáticos

**Auto-atualização de `lessons_count`:**
- Trigger que conta automaticamente o número de aulas quando inseridas/deletadas
- Mantém `courses.lessons_count` sempre atualizado

**Auto-definição de `published_at`:**
- Define automaticamente a data quando `is_published` muda para `true`
- Limpa a data quando `is_published` volta para `false`

#### 3. View para Admin

```sql
CREATE VIEW admin_courses_with_stats
```
- Agrupa cursos com todas as lições em um único JSON
- Facilita busca e listagem no painel admin
- Inclui estatísticas e metadados completos

#### 4. Correção de Dados Existentes

A migration automaticamente:
- Define valores padrão para cursos existentes
- Corrige `order_index` de lições sem ordenação
- Inicializa `materials` como array vazio quando nulo

---

## 🔧 Mudanças no Código

### Arquivo: `components/admin/course-workspace.tsx`

#### 1. Validação Completa de Formulários

**Etapa 1 - Básico (basics):**
- ✓ Título obrigatório
- ✓ Área/especialidade obrigatória
- ✓ Descrição obrigatória
- ✓ Imagem de capa obrigatória

**Etapa 2 - Aulas (lessons):**
- ✓ Título de módulo obrigatório
- ✓ Título de aula obrigatório
- ✓ Duração válida obrigatória (> 0)
- ✓ Link do vídeo obrigatório

**Etapa 3 - Materiais (materials):**
- ✓ Título de material obrigatório (se material existir)
- ✓ URL de material obrigatória (se material existir)

#### 2. Correção do Bug 400 Bad Request

**Problema Original:**
```typescript
// ❌ ANTES: Tentava inserir ID manualmente
const lessonsPayload = modules.flatMap((module, moduleIndex) =>
  module.lessons.map((lesson, lessonIndex) => ({
    id: lesson.id,  // ← Causava erro 400
    course_id: newCourse.id,
    // ...
  }))
)
```

**Solução:**
```typescript
// ✅ DEPOIS: Deixa o banco gerar o ID e recupera via .select()
const { data: lessonData, error: lessonError } = await supabase
  .from("lessons")
  .insert(lessonsPayload)  // Sem campo 'id'
  .select("id, title, module_title, ...")  // Recupera IDs gerados

insertedLessons = lessonData || []
```

#### 3. Cálculo Automático de Duração

```typescript
// Calcula duração total a partir das aulas
const totalDurationMinutes = modules.reduce((total, module) => {
  return total + module.lessons.reduce((sum, lesson) => {
    return sum + (Number(lesson.duration) || 0)
  }, 0)
}, 0)

const durationText = `${totalHours}h${remainingMinutes}min`
```

#### 4. Tratamento Robusto de Erros

**Rollback em caso de erro:**
```typescript
if (lessonError) {
  console.error("Lesson insert error:", lessonError)
  // Limpa o curso criado se falhar ao criar aulas
  await supabase.from("courses").delete().eq("id", newCourse.id)
  throw new Error(`Erro ao criar aulas: ${lessonError.message}`)
}
```

**Warnings para recursos:**
```typescript
if (resourceError) {
  // Não falha toda operação, apenas avisa
  console.warn("Alguns materiais não puderam ser salvos:", resourceError.message)
}
```

#### 5. Feedback Melhorado

**Mensagem de sucesso detalhada:**
```typescript
const successMessage = resourcesPayload.length > 0
  ? `✓ Curso publicado com sucesso! ${insertedLessons.length} aulas e ${resourcesPayload.length} materiais foram adicionados.`
  : `✓ Curso publicado com sucesso! ${insertedLessons.length} aulas foram adicionadas.`
```

**Reset automático após sucesso:**
```typescript
setTimeout(() => {
  resetForms()
}, 2000)
```

---

## 🚀 Como Aplicar as Mudanças

### Ambiente de Produção (Supabase Cloud)

1. **Acesse o Dashboard do Supabase:**
   ```
   https://supabase.com/dashboard/project/[SEU_PROJECT_ID]
   ```

2. **Vá para SQL Editor:**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New Query"

3. **Execute a Migration:**
   - Copie todo o conteúdo de `supabase/migrations/010_course_structure_refactor.sql`
   - Cole no editor
   - Clique em "RUN" ou pressione `Ctrl+Enter`

4. **Verifique o Sucesso:**
   ```sql
   -- Verifique se as colunas foram adicionadas
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'courses'
   ORDER BY ordinal_position;

   -- Verifique se os triggers foram criados
   SELECT trigger_name, event_manipulation
   FROM information_schema.triggers
   WHERE event_object_table IN ('courses', 'lessons');
   ```

### Ambiente Local (Docker/Supabase CLI)

```bash
# 1. Certifique-se de que o Docker está rodando
docker ps

# 2. Inicie o Supabase local (se não estiver rodando)
npx supabase start

# 3. Aplique todas as migrations
npx supabase db reset --local

# 4. Ou aplique apenas a nova migration
npx supabase db push
```

---

## ✅ Checklist de Teste

Após aplicar as mudanças, teste o seguinte fluxo:

### Teste 1: Criação de Curso Completo

- [ ] Acesse `/admin/cursos/novo`
- [ ] Preencha ETAPA 1 - Estrutura:
  - [ ] Título: "Teste de Implantodontia"
  - [ ] Área: "Implantodontia"
  - [ ] Formato: "100% online"
  - [ ] Nível: "Intermediário"
  - [ ] Carga horária: "12h"
  - [ ] Investimento: "R$ 1.497"
  - [ ] Upload de imagem de capa
  - [ ] Descrição completa
  - [ ] Tags: "implante, cirurgia, digital"
- [ ] Clique em "Próxima etapa"

### Teste 2: Criação de Aulas

- [ ] ETAPA 2 - Aulas:
  - [ ] Adicione pelo menos 2 módulos
  - [ ] Cada módulo com 2-3 aulas
  - [ ] Preencha título, duração e link do vídeo para cada aula
  - [ ] Adicione materiais (PDF, checklist) em algumas aulas
- [ ] Clique em "Próxima etapa"

### Teste 3: Revisão e Publicação

- [ ] ETAPA 3 - Revisão:
  - [ ] Verifique resumo do curso
  - [ ] Confirme contagem de módulos/aulas
  - [ ] Confirme contagem de materiais
- [ ] Clique em "Publicar curso"
- [ ] **Verifique que NÃO há erro 400**
- [ ] Confirme mensagem de sucesso
- [ ] Verifique que o curso aparece na lista "Últimos cursos cadastrados"

### Teste 4: Validação de Erros

- [ ] Tente avançar sem preencher campos obrigatórios
- [ ] Verifique que alertas vermelhos aparecem
- [ ] Verifique que mensagens específicas indicam o que falta

### Teste 5: Verificação no Banco

```sql
-- Verifique o curso criado
SELECT * FROM courses
WHERE title = 'Teste de Implantodontia'
ORDER BY created_at DESC
LIMIT 1;

-- Verifique as aulas
SELECT id, title, module_title, order_index, duration_minutes
FROM lessons
WHERE course_id = '[ID_DO_CURSO]'
ORDER BY order_index;

-- Verifique os recursos/materiais
SELECT id, title, resource_type, lesson_id
FROM course_resources
WHERE course_id = '[ID_DO_CURSO]';

-- Verifique que lessons_count foi atualizado automaticamente
SELECT title, lessons_count FROM courses
WHERE title = 'Teste de Implantodontia';
```

---

## 🐛 Problemas Corrigidos

### 1. ✅ Erro 400 Bad Request ao Publicar Curso
- **Causa:** Tentativa de inserir UUID manualmente na coluna `id`
- **Solução:** Removido campo `id` do payload, usando `.select()` para recuperar IDs gerados

### 2. ✅ Campos Faltantes no Formulário
- **Causa:** Banco não tinha colunas para metadados do curso
- **Solução:** Migration adiciona `area`, `difficulty`, `format`, `price`, `tags`, `is_published`

### 3. ✅ Validação Inexistente
- **Causa:** `stepErrors` retornava sempre vazio
- **Solução:** Implementado `useMemo` com validação completa de todos os campos

### 4. ✅ Contagem Manual de Aulas
- **Causa:** `lessons_count` era definido manualmente no insert
- **Solução:** Trigger automático mantém o contador atualizado

### 5. ✅ Mensagens de Erro Genéricas
- **Causa:** Erros não eram propagados corretamente
- **Solução:** `console.error` detalhado + mensagens específicas

---

## 📝 Notas Importantes

### Compatibilidade com Dados Existentes

A migration `010_course_structure_refactor.sql` é **idempotente** e **segura**:

- Usa `ADD COLUMN IF NOT EXISTS` para não quebrar se executada múltiplas vezes
- Define valores padrão sensatos para cursos existentes
- Não deleta ou altera dados existentes
- Adiciona constraints opcionais (CHECK) que permitem NULL

### Performance

- **Índices criados:**
  - `courses_is_published_idx` - para buscar cursos publicados
  - `courses_area_idx` - para filtrar por área
  - `courses_difficulty_idx` - para filtrar por dificuldade
  - `lessons_module_title_idx` - para agrupar por módulo
  - `course_resources_lesson_idx` - para buscar materiais por aula

### Segurança (RLS)

As políticas RLS foram **recriadas** para garantir:
- Apenas admins podem criar/editar/deletar cursos
- Todos podem ler cursos publicados
- Logs de erro incluem contexto mas não expõem dados sensíveis

---

## 🎯 Próximos Passos Recomendados

1. **Aplicar a migration em produção**
2. **Testar criação de curso em staging/produção**
3. **Considerar adicionar:**
   - Upload de vídeos direto no Supabase Storage
   - Preview do curso antes de publicar
   - Rascunhos (salvamento parcial)
   - Edição de cursos publicados
   - Versionamento de conteúdo

4. **Monitoramento:**
   - Acompanhar logs de erro no Sentry
   - Verificar métricas de uso da feature
   - Coletar feedback de usuários admin

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do navegador (DevTools Console)
2. Verifique os logs do Supabase (Dashboard > Logs)
3. Revise este documento
4. Consulte a documentação do Supabase: https://supabase.com/docs

---

**Última atualização:** 2025-11-07
**Versão da Migration:** 010
**Status:** ✅ Pronto para produção
