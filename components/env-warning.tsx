export default function EnvWarning() {
  const url = process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL
  if (url) return null

  return (
    <div className="w-full bg-yellow-50 border-b border-yellow-200 text-yellow-900">
      <div className="max-w-6xl mx-auto px-4 py-2 text-sm">
        <strong>Atenção:</strong> Variável de autenticação não configurada.
        <span className="ml-2">
          Defina <code className="px-1">NEXT_PUBLIC_NEON_AUTH_BASE_URL</code> no ambiente e reinicie o servidor.
        </span>
      </div>
    </div>
  )
}

