-- Script para identificar chaves estrangeiras sem índices (Falta de performance crítica)
-- Rode isso no SQL Editor do Supabase

WITH foreign_keys AS (
    SELECT
        tc.table_schema,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name
    FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
),
indexes AS (
    SELECT
        schemaname,
        tablename,
        indexname,
        array_to_string(array_agg(column_name), ', ') as columns
    FROM
        pg_indexes
        CROSS JOIN unnest(string_to_array(replace(substr(indexdef, strpos(indexdef, '(') + 1, length(indexdef) - strpos(indexdef, '(') - 1), ' ', ''), ',')) as column_name
    GROUP BY
        schemaname, tablename, indexname
)
SELECT
    fk.table_schema,
    fk.table_name,
    fk.column_name as missing_index_on_column,
    fk.foreign_table_name as references_table
FROM
    foreign_keys fk
LEFT JOIN
    indexes idx ON fk.table_schema = idx.schemaname
                AND fk.table_name = idx.tablename
                AND idx.columns LIKE '%' || fk.column_name || '%'
WHERE
    idx.indexname IS NULL
    AND fk.table_schema = 'public'
ORDER BY
    fk.table_name,
    fk.column_name;

-- Dica: Se retornar linhas, crie índices para elas usando:
-- CREATE INDEX CONCURRENTLY idx_tablename_columnname ON tablename(columnname);
