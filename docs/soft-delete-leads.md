# Sistema de Soft Delete para Leads

## Visão Geral

O sistema de soft delete permite que administradores movam leads para a "lixeira" ao invés de excluí-los permanentemente do banco de dados. Isso oferece uma camada de segurança adicional e permite a recuperação de leads excluídos acidentalmente.

## Como Funciona

### Soft Delete (Mover para Lixeira)

Quando um lead é "excluído" pelo administrador:

1. O campo `deleted_at` é preenchido com a data/hora atual
2. O campo `deleted_by` é preenchido com o ID do admin que executou a ação
3. O lead **não é removido** do banco de dados
4. O lead é **filtrado automaticamente** de todas as visualizações do pipeline

### Estrutura do Banco de Dados

```sql
-- Colunas adicionadas à tabela profiles
ALTER TABLE profiles
ADD COLUMN deleted_at TIMESTAMPTZ,
ADD COLUMN deleted_by UUID REFERENCES profiles(id);
```

### Filtros Automáticos

Todos os leads com `deleted_at IS NOT NULL` são automaticamente excluídos das queries do pipeline:

```typescript
.is("deleted_at", null)  // Filtra leads não deletados
```

## Funcionalidades

### 1. Mover para Lixeira

**Localização:** Card do lead > Menu (três pontos) > "Mover para lixeira"

**Comportamento:**
- Exibe dialog de confirmação com informações sobre o que será feito
- Move o lead para lixeira (soft delete)
- Remove o lead da visualização do pipeline
- **Preserva:** Notas, follow-ups e todo histórico do lead

**Permissões:**
- ✅ Apenas administradores
- ❌ Não é possível mover outros administradores para lixeira

### 2. Restaurar da Lixeira

**Função:** `restoreLead(userId: string)`

**Comportamento:**
- Remove `deleted_at` e `deleted_by`
- Lead volta a aparecer no pipeline
- Todo histórico é preservado

**Permissões:**
- ✅ Apenas administradores

## Diferenças: Soft Delete vs Hard Delete

| Característica | Soft Delete (Lixeira) | Hard Delete |
|---------------|----------------------|-------------|
| Dados removidos | ❌ Não | ✅ Sim |
| Recuperável | ✅ Sim | ❌ Não |
| Notas preservadas | ✅ Sim | ❌ Não |
| Follow-ups preservados | ✅ Sim | ❌ Não |
| Visível no pipeline | ❌ Não | ❌ Não |

## Implementação Técnica

### Server Actions

#### `deleteLead(userId: string)`
```typescript
// Move lead para lixeira
UPDATE profiles
SET
  deleted_at = NOW(),
  deleted_by = current_user_id
WHERE id = userId
```

#### `restoreLead(userId: string)`
```typescript
// Restaura lead da lixeira
UPDATE profiles
SET
  deleted_at = NULL,
  deleted_by = NULL
WHERE id = userId
```

### Queries do Pipeline

Todas as queries que buscam leads incluem o filtro:

```typescript
const { data: leads } = await supabase
  .from("profiles")
  .select("*")
  .is("deleted_at", null)  // ⚠️ IMPORTANTE
  // ... outros filtros
```

## Futuras Melhorias

### 1. Tela de Lixeira
- Visualizar todos os leads deletados
- Restaurar leads individuais ou em lote
- Excluir permanentemente após X dias

### 2. Auto-Limpeza
- Trigger para excluir permanentemente após 30 dias
- Notificação antes da exclusão permanente

### 3. Auditoria
- Histórico de quem moveu para lixeira
- Histórico de quem restaurou
- Log de exclusões permanentes

## Segurança

### Validações Implementadas
- ✅ Apenas admins podem mover para lixeira
- ✅ Não é possível deletar outros admins
- ✅ Verifica se lead já está deletado
- ✅ Registra quem executou a ação

### RLS (Row Level Security)
As policies do Supabase continuam válidas:
- Usuários normais não têm acesso a leads deletados
- Apenas admins podem ver e restaurar leads deletados

## Migration

```bash
# Aplicar migration
supabase db push

# Verificar
psql -c "SELECT deleted_at, deleted_by FROM profiles WHERE deleted_at IS NOT NULL;"
```

## Exemplos de Uso

### Mover lead para lixeira
```typescript
const result = await deleteLead(leadId)
if (result.success) {
  console.log("Lead movido para lixeira")
}
```

### Restaurar lead
```typescript
const result = await restoreLead(leadId)
if (result.success) {
  console.log("Lead restaurado com sucesso")
}
```

## Notas Importantes

⚠️ **IMPORTANTE:** O soft delete é apenas para leads (usuários com role != "admin"). Administradores não podem ser movidos para lixeira pelo pipeline.

⚠️ **PERFORMANCE:** O índice `idx_profiles_deleted_at` garante que queries filtrem leads deletados de forma eficiente.

⚠️ **DADOS RELACIONADOS:** Notas e follow-ups **não são deletados** quando o lead vai para lixeira. Eles são preservados e restaurados junto com o lead.
