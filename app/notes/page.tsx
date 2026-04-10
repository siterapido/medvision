import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

/** Evita prerender no build (DATABASE_URL só existe em runtime na Vercel / .env). */
export const dynamic = "force-dynamic"

export default async function NotesPage() {
  const supabase = await createClient()

  // Query notes from Supabase
  const { data: notes, error } = await supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching notes:", error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="bg-white/95 backdrop-blur shadow-2xl border-slate-200">
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Conexão Supabase Ativa</CardTitle>
                <CardDescription className="text-slate-600">
                  Testando conexão com banco de dados
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">Erro ao conectar:</h3>
                <pre className="text-sm text-red-700 overflow-auto">
                  {JSON.stringify(error, null, 2)}
                </pre>
                <div className="mt-4 text-sm text-red-800">
                  <p className="font-medium mb-2">Verifique:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Variáveis de ambiente em .env.local</li>
                    <li>Tabela &apos;notes&apos; criada no Supabase</li>
                    <li>RLS policies configuradas corretamente</li>
                  </ul>
                </div>
              </div>
            ) : notes && notes.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Notas do Banco de Dados
                  </h3>
                  <span className="text-sm text-slate-500">
                    {notes.length} {notes.length === 1 ? 'registro' : 'registros'}
                  </span>
                </div>

                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-primary font-bold text-sm">{note.id}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-900 leading-relaxed">{note.title}</p>
                        {note.created_at && (
                          <p className="text-xs text-slate-500 mt-2">
                            {new Date(note.created_at).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">
                    Dados Raw (JSON):
                  </h4>
                  <pre className="bg-slate-900 text-green-400 rounded-lg p-4 text-xs overflow-auto max-h-64">
                    {JSON.stringify(notes, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Nenhuma nota encontrada
                </h3>
                <p className="text-slate-600 mb-4">
                  A tabela está vazia. Execute o SQL de exemplo para adicionar dados.
                </p>
                <div className="bg-slate-50 rounded-lg p-4 text-left max-w-2xl mx-auto">
                  <code className="text-xs text-slate-700">
                    insert into notes (title) values (&apos;Minha primeira nota!&apos;);
                  </code>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="font-semibold text-green-900 mb-1">✅ Conexão</div>
                  <div className="text-green-700">Supabase conectado</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="font-semibold text-blue-900 mb-1">✅ Query</div>
                  <div className="text-blue-700">SELECT funcionando</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="font-semibold text-purple-900 mb-1">✅ RLS</div>
                  <div className="text-purple-700">Políticas ativas</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-primary transition-colors"
          >
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  )
}
