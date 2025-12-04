"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type LeadStatus = "novo_lead" | "situacao" | "problema" | "implicacao" | "motivacao" | "convertido"

export type Lead = {
  id: string
  name?: string | null
  phone: string
  email?: string | null
  status: LeadStatus
  notes?: string | null
  source?: string | null
  converted_at?: string | null
  converted_to_user_id?: string | null
  created_at: string
  updated_at: string
}

export type ImportLeadRow = {
  Nome?: string
  Telefone: string
  Email?: string
  Origem?: string
  Observações?: string
}

/**
 * Normaliza número de telefone removendo caracteres não numéricos
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "")
}

/**
 * Valida e processa uma linha do CSV
 */
function parseLeadRow(row: Record<string, string>): ImportLeadRow | null {
  const phone = row["Telefone"] || row["telefone"] || row["Telefone/WhatsApp"] || row["telefone/whatsapp"]
  if (!phone || normalizePhone(phone).length < 10) {
    return null
  }

  return {
    Nome: row["Nome"] || row["nome"] || "",
    Telefone: normalizePhone(phone),
    Email: row["Email"] || row["email"] || "",
    Origem: row["Origem"] || row["origem"] || row["Source"] || row["source"] || "",
    Observações: row["Observações"] || row["observações"] || row["Notas"] || row["notas"] || "",
  }
}

/**
 * Importa leads de um arquivo CSV
 */
export async function importLeads(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Usuário não autenticado" }
  }

  // Verificar se o usuário é admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { success: false, message: "Apenas administradores podem importar leads" }
  }

  const file = formData.get("file") as File | null
  if (!file) {
    return { success: false, message: "Nenhum arquivo enviado" }
  }

  if (!file.name.endsWith(".csv")) {
    return { success: false, message: "Arquivo deve ser um CSV" }
  }

  try {
    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())
    
    if (lines.length < 2) {
      return { success: false, message: "CSV deve ter pelo menos um cabeçalho e uma linha de dados" }
    }

    // Parse header
    const header = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
    const rows: ImportLeadRow[] = []

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
      const row: Record<string, string> = {}
      
      header.forEach((key, index) => {
        row[key] = values[index] || ""
      })

      const parsed = parseLeadRow(row)
      if (parsed) {
        rows.push(parsed)
      }
    }

    if (rows.length === 0) {
      return { success: false, message: "Nenhum lead válido encontrado no CSV" }
    }

    // Inserir leads no banco (ignorar duplicatas por phone)
    let inserted = 0
    let skipped = 0
    const errors: string[] = []

    for (const lead of rows) {
      const { error } = await supabase
        .from("leads")
        .insert({
          name: lead.Nome || null,
          phone: lead.Telefone,
          email: lead.Email || null,
          source: lead.Origem || null,
          notes: lead.Observações || null,
          status: "novo_lead",
        })
        .select()
        .maybeSingle()

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation (duplicate phone)
          skipped++
        } else {
          errors.push(`Erro ao importar ${lead.Telefone}: ${error.message}`)
        }
      } else {
        inserted++
      }
    }

    revalidatePath("/admin/pipeline")
    
    return {
      success: true,
      message: `Importação concluída: ${inserted} leads importados, ${skipped} duplicados ignorados`,
      inserted,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    console.error("Erro ao processar CSV:", error)
    return { success: false, message: `Erro ao processar arquivo: ${error instanceof Error ? error.message : "Erro desconhecido"}` }
  }
}

/**
 * Busca todos os leads frios
 */
export async function getColdLeads() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, data: [], message: "Usuário não autenticado" }
  }

  // Verificar se o usuário é admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { success: false, data: [], message: "Apenas administradores podem visualizar leads" }
  }

  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar leads:", error)
    return { success: false, data: [], message: "Erro ao buscar leads" }
  }

  return { success: true, data: (leads || []) as Lead[] }
}

/**
 * Atualiza o status de um lead
 */
export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Usuário não autenticado" }
  }

  // Verificar se o usuário é admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { success: false, message: "Apenas administradores podem atualizar leads" }
  }

  // Validar status
  if (!["novo_lead", "situacao", "problema", "implicacao", "motivacao", "convertido"].includes(status)) {
    return { success: false, message: "Status inválido" }
  }

  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId)

  if (error) {
    console.error("Erro ao atualizar status do lead:", error)
    return { success: false, message: "Erro ao atualizar status" }
  }

  revalidatePath("/admin/pipeline")
  return { success: true }
}

/**
 * Atualiza as notas de um lead
 */
export async function updateLeadNotes(leadId: string, notes: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Usuário não autenticado" }
  }

  // Verificar se o usuário é admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { success: false, message: "Apenas administradores podem atualizar notas" }
  }

  const { error } = await supabase
    .from("leads")
    .update({ notes: notes.trim() || null })
    .eq("id", leadId)

  if (error) {
    console.error("Erro ao atualizar notas do lead:", error)
    return { success: false, message: "Erro ao atualizar notas" }
  }

  revalidatePath("/admin/pipeline")
  return { success: true }
}

/**
 * Deleta um lead
 */
export async function deleteLead(leadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Usuário não autenticado" }
  }

  // Verificar se o usuário é admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { success: false, message: "Apenas administradores podem deletar leads" }
  }

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId)

  if (error) {
    console.error("Erro ao deletar lead:", error)
    return { success: false, message: "Erro ao deletar lead" }
  }

  revalidatePath("/admin/pipeline")
  return { success: true }
}

