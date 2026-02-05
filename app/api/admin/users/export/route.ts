import { NextResponse } from "next/server"

import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolveUserRole } from "@/lib/auth/roles"

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export async function GET() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    const resolvedRole = resolveUserRole(profile?.role, user)

    if (resolvedRole !== "admin") {
      return NextResponse.json({ error: "Apenas administradores podem exportar usuários." }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Fetch all users (clients only)
    const { data: users, error: usersError } = await adminClient
      .from('profiles')
      .select('id, name, email, telefone, whatsapp, created_at, assigned_to, role, plan_type, subscription_status')
      .is('deleted_at', null)
      .eq('role', 'cliente')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('[api/admin/users/export] Error fetching users:', usersError)
      return NextResponse.json({ error: "Erro ao buscar usuários." }, { status: 500 })
    }

    // Fetch all sellers (vendedores and admins)
    const { data: sellers, error: sellersError } = await adminClient
      .from('profiles')
      .select('id, name, email')
      .is('deleted_at', null)
      .in('role', ['vendedor', 'admin'])

    if (sellersError) {
      console.error('[api/admin/users/export] Error fetching sellers:', sellersError)
      return NextResponse.json({ error: "Erro ao buscar vendedores." }, { status: 500 })
    }

    // Create sellers lookup map
    const sellersMap = new Map<string, { id: string; name: string | null; email: string | null }>()
    sellers?.forEach(seller => {
      sellersMap.set(seller.id, seller)
    })

    // CSV Header
    const headers = [
      'Nome',
      'Email',
      'Telefone',
      'Data de Cadastro',
      'Responsável (Vendedor)',
      'Plano',
      'Status'
    ]

    // CSV Rows
    const rows: string[][] = []

    users?.forEach(user => {
      const seller = user.assigned_to ? sellersMap.get(user.assigned_to) : null
      const phone = user.telefone || user.whatsapp || ''

      rows.push([
        escapeCSV(user.name),
        escapeCSV(user.email),
        escapeCSV(phone),
        formatDate(user.created_at),
        escapeCSV(seller?.name || 'Não atribuído'),
        escapeCSV(user.plan_type || 'free'),
        escapeCSV(user.subscription_status || 'free')
      ])
    })

    // Generate CSV content with BOM for Excel UTF-8
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `usuarios_odontogpt_${timestamp}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[api/admin/users/export] error:", error)
    return NextResponse.json(
      { error: "Erro inesperado ao exportar usuários." },
      { status: 500 },
    )
  }
}
