import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

let _sql: NeonQueryFunction<false, false> | null = null

/**
 * Cliente SQL Neon (HTTP) para uso apenas no servidor.
 * Usa DATABASE_URL (pooler recomendado). Não usar o pacote `postgres` (Node net/fs),
 * pois quebra o bundle Edge e o cliente.
 */
export function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      "DATABASE_URL não definido. Configure no .env.local ou na Vercel.",
    )
  }
  _sql = neon(url)
  return _sql
}
