import { getSql } from "@/lib/db/pool"

const IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*$/

function qIdent(name: string): string {
  if (!IDENT.test(name)) throw new Error(`Identificador SQL inválido: ${name}`)
  return `"${name.replace(/"/g, '""')}"`
}

function qTable(name: string): string {
  if (!IDENT.test(name)) throw new Error(`Tabela inválida: ${name}`)
  return `public.${qIdent(name)}`
}

type Filter =
  | { k: "eq"; col: string; val: unknown }
  | { k: "neq"; col: string; val: unknown }
  | { k: "in"; col: string; val: unknown[] }
  | { k: "gte"; col: string; val: unknown }
  | { k: "lte"; col: string; val: unknown }
  | { k: "gt"; col: string; val: unknown }
  | { k: "lt"; col: string; val: unknown }
  | { k: "is"; col: string; val: unknown }
  | { k: "not"; col: string; op: string; val: unknown }
  | { k: "or"; raw: string }
  | { k: "filter"; col: string; op: string; val: unknown }

/** `data` e `error` permissivos para compatibilidade com código legado do Supabase. */
export type SupabaseCompatResult<T = any> = {
  data: T | null
  error: any
  count?: number | null
}

/**
 * Builder estilo Supabase (.from().select().eq()...) sobre Postgres (Neon).
 */
export class FromBuilder implements PromiseLike<SupabaseCompatResult<any>> {
  private op: "select" | "insert" | "update" | "delete" | "upsert" = "select"
  private cols = "*"
  private countMode: "exact" | null = null
  private head = false
  private filters: Filter[] = []
  private orderBy: { col: string; asc: boolean; nullsFirst?: boolean }[] = []
  private limitN: number | null = null
  private rangeFrom: number | null = null
  private rangeTo: number | null = null
  private wantSingle = false
  private wantMaybeSingle = false
  private insertRows: Record<string, unknown>[] = []
  private updatePatch: Record<string, unknown> = {}
  private upsertOpts: { onConflict?: string; ignoreDuplicates?: boolean } = {}
  private insertWantsReturning = false

  constructor(private readonly table: string) {}

  select(cols = "*", opts?: { count?: "exact"; head?: boolean }) {
    if (this.op === "insert" || this.op === "upsert") {
      this.insertWantsReturning = true
      return this
    }
    this.cols = cols
    if (opts?.count) this.countMode = opts.count
    if (opts?.head) this.head = true
    return this
  }

  insert(rows: Record<string, unknown> | Record<string, unknown>[]) {
    this.op = "insert"
    this.insertRows = Array.isArray(rows) ? rows : [rows]
    return this
  }

  update(patch: Record<string, unknown>) {
    this.op = "update"
    this.updatePatch = patch
    return this
  }

  delete() {
    this.op = "delete"
    return this
  }

  upsert(rows: Record<string, unknown> | Record<string, unknown>[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.op = "upsert"
    this.insertRows = Array.isArray(rows) ? rows : [rows]
    this.upsertOpts = opts ?? {}
    return this
  }

  eq(col: string, val: unknown) {
    this.filters.push({ k: "eq", col, val })
    return this
  }
  neq(col: string, val: unknown) {
    this.filters.push({ k: "neq", col, val })
    return this
  }
  in(col: string, val: unknown[]) {
    this.filters.push({ k: "in", col, val })
    return this
  }
  gte(col: string, val: unknown) {
    this.filters.push({ k: "gte", col, val })
    return this
  }
  lte(col: string, val: unknown) {
    this.filters.push({ k: "lte", col, val })
    return this
  }
  gt(col: string, val: unknown) {
    this.filters.push({ k: "gt", col, val })
    return this
  }
  lt(col: string, val: unknown) {
    this.filters.push({ k: "lt", col, val })
    return this
  }
  is(col: string, val: unknown) {
    this.filters.push({ k: "is", col, val })
    return this
  }
  not(col: string, op: string, val: unknown) {
    this.filters.push({ k: "not", col, op, val })
    return this
  }
  or(expr: string) {
    this.filters.push({ k: "or", raw: expr })
    return this
  }
  filter(col: string, op: string, val: unknown) {
    this.filters.push({ k: "filter", col, op, val })
    return this
  }
  contains(col: string, val: Record<string, unknown>) {
    this.filters.push({ k: "filter", col, op: "@>", val: JSON.stringify(val) })
    return this
  }
  textSearch(col: string, q: string) {
    this.filters.push({ k: "filter", col, op: "@@", val: q })
    return this
  }

  order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.orderBy.push({ col, asc: opts?.ascending !== false, nullsFirst: opts?.nullsFirst })
    return this
  }

  limit(n: number) {
    this.limitN = n
    return this
  }

  range(from: number, to: number) {
    this.rangeFrom = from
    this.rangeTo = to
    return this
  }

  single<_T = any>() {
    this.wantSingle = true
    return this
  }

  maybeSingle<_T = any>() {
    this.wantMaybeSingle = true
    return this
  }

  returns() {
    return this
  }

  then<TResult1 = SupabaseCompatResult<any>, TResult2 = never>(
    onfulfilled?: ((value: SupabaseCompatResult<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected)
  }

  private buildWhere(values: unknown[]): string {
    const parts: string[] = []
    for (const f of this.filters) {
      if (f.k === "eq") {
        values.push(f.val)
        parts.push(`${qIdent(f.col)} = $${values.length}`)
      } else if (f.k === "neq") {
        values.push(f.val)
        parts.push(`${qIdent(f.col)} <> $${values.length}`)
      } else if (f.k === "in") {
        const ph = f.val.map((v) => {
          values.push(v)
          return `$${values.length}`
        })
        parts.push(`${qIdent(f.col)} IN (${ph.join(",")})`)
      } else if (f.k === "gte") {
        values.push(f.val)
        parts.push(`${qIdent(f.col)} >= $${values.length}`)
      } else if (f.k === "lte") {
        values.push(f.val)
        parts.push(`${qIdent(f.col)} <= $${values.length}`)
      } else if (f.k === "gt") {
        values.push(f.val)
        parts.push(`${qIdent(f.col)} > $${values.length}`)
      } else if (f.k === "lt") {
        values.push(f.val)
        parts.push(`${qIdent(f.col)} < $${values.length}`)
      } else if (f.k === "is") {
        if (f.val === null) parts.push(`${qIdent(f.col)} IS NULL`)
        else {
          values.push(f.val)
          parts.push(`${qIdent(f.col)} IS NOT DISTINCT FROM $${values.length}`)
        }
      } else if (f.k === "not") {
        if (f.op === "is" && f.val === null) parts.push(`${qIdent(f.col)} IS NOT NULL`)
        else if (f.op === "in" && typeof f.val === "string") {
          const inner = f.val.replace(/^\(|\)$/g, "")
          const opts = inner.split(",").map((s) => s.trim().replace(/^"|"$/g, ""))
          const ph = opts.map((o) => {
            values.push(o)
            return `$${values.length}`
          })
          parts.push(`${qIdent(f.col)} NOT IN (${ph.join(",")})`)
        } else {
          values.push(f.val)
          parts.push(`NOT (${qIdent(f.col)} ${f.op} $${values.length})`)
        }
      } else if (f.k === "or") {
        parts.push(`(${translateOrExpr(f.raw, values)})`)
      } else if (f.k === "filter") {
        if (f.op === "@>") {
          values.push(f.val)
          parts.push(`${qIdent(f.col)}::jsonb @> $${values.length}::jsonb`)
        } else {
          values.push(f.val)
          parts.push(`${qIdent(f.col)} ${f.op} $${values.length}`)
        }
      }
    }
    if (!parts.length) return ""
    return `WHERE ${parts.join(" AND ")}`
  }

  private buildOrder(): string {
    if (!this.orderBy.length) return ""
    const parts = this.orderBy.map((o) => {
      const dir = o.asc ? "ASC" : "DESC"
      const nf = o.nullsFirst === true ? " NULLS FIRST" : o.nullsFirst === false ? " NULLS LAST" : ""
      return `${qIdent(o.col)} ${dir}${nf}`
    })
    return `ORDER BY ${parts.join(", ")}`
  }

  private buildLimitOffset(): string {
    if (this.rangeFrom !== null && this.rangeTo !== null) {
      return ` LIMIT ${this.rangeTo - this.rangeFrom + 1} OFFSET ${this.rangeFrom}`
    }
    if (this.limitN !== null) return ` LIMIT ${this.limitN}`
    return ""
  }

  private async run(): Promise<SupabaseCompatResult<any>> {
    const sql = getSql()
    const values: unknown[] = []
    const t = qTable(this.table)

    try {
      if (this.op === "select") {
        const nested = /^\s*\*\s*,\s*(\w+)\(\s*\*\s*\)\s*$/.exec(this.cols)
        if (nested) {
          const child = nested[1]
          const where = this.buildWhere(values)
          const ord = this.buildOrder()
          const lim = this.buildLimitOffset()
          const parentRows = (await sql.query(
            `SELECT * FROM ${t} ${where} ${ord} ${lim}`,
            values,
          )) as Record<string, unknown>[]
          const parent = parentRows[0]
          if (!parent) {
            return { data: this.wantMaybeSingle ? null : [], error: null }
          }
          const pid = parent.id as string
          const crows = (await sql.query(
            `SELECT * FROM ${qTable(child)} WHERE ${qIdent("session_id")} = $1 ORDER BY ${qIdent("created_at")} ASC`,
            [pid],
          )) as unknown[]
          return { data: { ...parent, [child]: crows }, error: null }
        }

        if (this.cols.includes(":") && !/^\s*\*\s*,\s*\w+\(\s*\*\s*\)\s*$/.test(this.cols)) {
          throw new Error(
            "Select com relações (alias:tabela) requer rota dedicada ou SQL explícito. Use * ou ajuste a consulta.",
          )
        }

        const colSql =
          this.cols === "*"
            ? "*"
            : this.cols
                .split(",")
                .map((c) => c.trim())
                .map((c) => qIdent(c))
                .join(", ")

        const where = this.buildWhere(values)
        const ord = this.buildOrder()
        const lim = this.buildLimitOffset()

        if (this.countMode === "exact" && this.head) {
          const cnt = (await sql.query(`SELECT count(*)::int AS c FROM ${t} ${where}`, values)) as {
            c: number
          }[]
          return { data: null, error: null, count: cnt[0]?.c ?? 0 }
        }

        const rows = await sql.query(`SELECT ${colSql} FROM ${t} ${where} ${ord} ${lim}`, values)

        if (this.countMode === "exact") {
          const cnt = (await sql.query(`SELECT count(*)::int AS c FROM ${t} ${where}`, values)) as {
            c: number
          }[]
          if (this.wantSingle) {
            const r = (rows as unknown[])[0] ?? null
            if (!r) return { data: null, error: Object.assign(new Error("PGRST116"), { code: "PGRST116" }) }
            return { data: r, error: null, count: cnt[0]?.c ?? 0 }
          }
          return { data: rows, error: null, count: cnt[0]?.c ?? 0 }
        }

        if (this.wantSingle) {
          const r = (rows as unknown[])[0] ?? null
          if (!r) return { data: null, error: Object.assign(new Error("PGRST116"), { code: "PGRST116" }) }
          return { data: r, error: null }
        }
        if (this.wantMaybeSingle) {
          const arr = rows as unknown[]
          if (arr.length > 1) return { data: null, error: new Error("Múltiplas linhas") }
          return { data: arr[0] ?? null, error: null }
        }

        return { data: rows, error: null }
      }

      if (this.op === "insert") {
        const row = this.insertRows[0]!
        const keys = Object.keys(row)
        const vals = keys.map((k) => (row as Record<string, unknown>)[k])
        const ph = keys.map((_, i) => `$${i + 1}`)
        const ret = this.insertWantsReturning || this.wantSingle || this.wantMaybeSingle
        const ins = await sql.query(
          `INSERT INTO ${t} (${keys.map(qIdent).join(",")}) VALUES (${ph.join(",")}) ${ret ? "RETURNING *" : ""}`,
          vals,
        )
        let data: unknown = ret ? (ins as unknown[])[0] ?? ins : null
        if (this.wantSingle && ret) {
          if (!data) return { data: null, error: Object.assign(new Error("PGRST116"), { code: "PGRST116" }) }
        }
        return { data, error: null }
      }

      if (this.op === "update") {
        const keys = Object.keys(this.updatePatch)
        const setParts: string[] = []
        for (const k of keys) {
          values.push((this.updatePatch as Record<string, unknown>)[k])
          setParts.push(`${qIdent(k)} = $${values.length}`)
        }
        const where = this.buildWhere(values)
        const rows = await sql.query(`UPDATE ${t} SET ${setParts.join(",")} ${where} RETURNING *`, values)
        const arr = rows as unknown[]
        if (this.wantSingle) {
          const r = arr[0] ?? null
          if (!r) return { data: null, error: Object.assign(new Error("PGRST116"), { code: "PGRST116" }) }
          return { data: r, error: null }
        }
        return { data: rows, error: null }
      }

      if (this.op === "delete") {
        const where = this.buildWhere(values)
        await sql.query(`DELETE FROM ${t} ${where}`, values)
        return { data: null, error: null }
      }

      if (this.op === "upsert") {
        const row = this.insertRows[0]!
        const keys = Object.keys(row)
        const vals = keys.map((k) => (row as Record<string, unknown>)[k])
        const conflict = this.upsertOpts.onConflict ?? "id"
        const ignore = this.upsertOpts.ignoreDuplicates
        const ph = keys.map((_, i) => `$${i + 1}`)
        const q = ignore
          ? `INSERT INTO ${t} (${keys.map(qIdent).join(",")}) VALUES (${ph.join(",")}) ON CONFLICT (${qIdent(conflict)}) DO NOTHING RETURNING *`
          : `INSERT INTO ${t} (${keys.map(qIdent).join(",")}) VALUES (${ph.join(",")}) ON CONFLICT (${qIdent(conflict)}) DO UPDATE SET ${keys
              .filter((k) => k !== conflict)
              .map((k) => `${qIdent(k)} = EXCLUDED.${qIdent(k)}`)
              .join(",")} RETURNING *`
        const res = await sql.query(q, vals)
        return { data: (res as unknown[])[0] ?? res, error: null }
      }

      return { data: null, error: new Error("op inválida") }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e : new Error(String(e)) }
    }
  }
}

function translateOrExpr(expr: string, values: unknown[]): string {
  if (
    expr.includes("trial_started_at.not.is.null") &&
    expr.includes("trial_ends_at.not.is.null")
  ) {
    return `(trial_started_at IS NOT NULL OR trial_ends_at IS NOT NULL OR trial_used = true OR pipeline_stage IS NOT NULL)`
  }
  if (expr.includes("pipeline_stage.eq.convertido")) {
    return `(pipeline_stage = 'convertido' OR subscription_status IN ('active','trialing'))`
  }
  const lastActive = expr.match(/last_active_at\.lt\.([^,)]+)/)
  if (expr.includes("pipeline_stage.in.") && lastActive) {
    values.push(new Date(lastActive[1]))
    return `(pipeline_stage IN ('barreira_plano','risco_churn') AND last_active_at < $${values.length})`
  }
  const m = expr.match(/^title\.ilike\.%(.+?)%,description\.ilike\.%(.+?)%$/)
  if (m) {
    values.push(`%${m[1]}%`)
    const a = values.length
    values.push(`%${m[2]}%`)
    const b = values.length
    return `(title ILIKE $${a} OR description ILIKE $${b})`
  }
  return `(TRUE)`
}

/** Encadeamento: insert().select().single() — select após insert só ativa RETURNING */
export function createNeonDbClient() {
  return {
    from(table: string) {
      return new FromBuilder(table)
    },

    async rpc(fn: string, args: Record<string, unknown> = {}) {
      const sql = getSql()
      try {
        if (fn === "deduct_user_credits") {
          await sql.query(`SELECT deduct_user_credits($1::uuid, $2::int)`, [
            args.p_user_id,
            args.p_amount,
          ])
          return { data: null, error: null }
        }
        if (fn === "grant_user_credits") {
          await sql.query(`SELECT grant_user_credits($1::uuid, $2::int)`, [
            args.p_user_id,
            args.p_amount,
          ])
          return { data: null, error: null }
        }
        if (fn === "get_artifact_version_history") {
          const rows = await sql.query(`SELECT * FROM get_artifact_version_history($1::uuid, $2::int)`, [
            args.p_artifact_id,
            args.p_limit,
          ])
          return { data: rows, error: null }
        }
        if (fn === "restore_artifact_version") {
          const rows = await sql.query(`SELECT * FROM restore_artifact_version($1::uuid, $2::int)`, [
            args.p_artifact_id,
            args.p_version,
          ])
          return { data: (rows as unknown[])[0] ?? null, error: null }
        }
        if (
          fn === "search_memories" ||
          fn === "hybrid_search_memories" ||
          fn === "keyword_search_memories" ||
          fn === "get_recent_memories"
        ) {
          const rows = await sql.query(`SELECT * FROM ${qIdent(fn)}($1::jsonb)`, [JSON.stringify(args)])
          return { data: rows, error: null }
        }
        if (fn === "cleanup_expired_memories") {
          await sql.query(`SELECT cleanup_expired_memories()`, [])
          return { data: null, error: null }
        }
        return { data: null, error: new Error(`RPC não mapeada: ${fn}`) }
      } catch (e) {
        return { data: null, error: e instanceof Error ? e : new Error(String(e)) }
      }
    },
  }
}
