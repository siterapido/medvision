export default function EnvWarning() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const missing = !url || !anon
  const urlInvalid = url ? !/^https?:\/\//.test(url) : false

  if (!missing && !urlInvalid) return null

  return (
    <div className="w-full bg-yellow-50 border-b border-yellow-200 text-yellow-900">
      <div className="max-w-6xl mx-auto px-4 py-2 text-sm">
        <strong>Atenção:</strong> Variáveis do Supabase não configuradas corretamente.
        <span className="ml-2">
          Defina <code className="px-1">NEXT_PUBLIC_SUPABASE_URL</code> e
          <code className="px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> em <code>.env.local</code>
          {" "}e reinicie o servidor.
        </span>
      </div>
    </div>
  )
}

