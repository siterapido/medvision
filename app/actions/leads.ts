"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type LeadStatus = "novo_lead" | "situacao" | "problema" | "implicacao" | "motivacao" | "convertido" | "nao_convertido"

export type Lead = {
  id: string
  name?: string | null
  phone: string
  email?: string | null
  status: LeadStatus
  notes?: string | null
  source?: string | null
  state?: string | null
  ies?: string | null
  sheet_source_name?: string | null
  sheet_source_description?: string | null
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
  Estado?: string
  IES?: string
  [key: string]: string | undefined
}

export type ColumnMapping = {
  name: string
  phone: string
  email: string
  source: string
  notes: string
  state: string
  ies: string
}

export type SheetMetadata = {
  name: string
  description?: string
  updateDuplicates: boolean
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
    Estado: row["Estado"] || row["estado"] || row["UF"] || row["uf"] || "",
    IES: row["IES"] || row["ies"] || row["Universidade"] || row["universidade"] || "",
  }
}

/**
 * Importa leads de um array de objetos processados (suporta CSV e Excel via JSON)
 */
export async function importLeadsFromJson(
  rows: ImportLeadRow[], 
  metadata: SheetMetadata
) {
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

  if (!metadata.name) {
    return { success: false, message: "Nome da planilha é obrigatório" }
  }

  if (rows.length === 0) {
    return { success: false, message: "Nenhum lead válido para importar" }
  }

  // Inserir leads no banco
  let inserted = 0
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  // TODO: Batch insert would be better, but we need to handle duplicates individually
  // Or upsert. If updateDuplicates is true, we upsert.
  
  for (const lead of rows) {
    // Normalizar telefone para garantir unicidade correta
    const normalizedPhone = normalizePhone(lead.Telefone)
    
    // Dados para inserir/atualizar
    const leadData = {
      name: lead.Nome || null,
      phone: normalizedPhone,
      email: lead.Email || null,
      source: lead.Origem || null,
      notes: lead.Observações || null,
      status: "novo_lead",
      state: lead.Estado || null,
      ies: lead.IES || null,
      sheet_source_name: metadata.name,
      sheet_source_description: metadata.description || null,
    }

    // Se deve atualizar duplicados, usamos upsert
    if (metadata.updateDuplicates) {
      const { error } = await supabase
        .from("leads")
        .upsert(leadData, { onConflict: "phone", ignoreDuplicates: false })
      
      if (error) {
        errors.push(`Erro ao importar ${lead.Telefone}: ${error.message}`)
      } else {
        // Upsert retorna sucesso tanto para insert quanto update.
        // É difícil distinguir sem fazer select antes, mas podemos assumir "processed"
        // Para ser mais preciso, poderíamos fazer select count antes e depois, mas é custoso.
        // Vamos apenas contar como inserido/atualizado.
        inserted++ 
      }
    } else {
      // Se NÃO deve atualizar, usamos insert e ignoramos erro de duplicidade
      const { error } = await supabase
        .from("leads")
        .insert(leadData)
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
  }

  revalidatePath("/admin/pipeline")
  
  return {
    success: true,
    message: `Processamento concluído: ${inserted} leads processados, ${skipped} ignorados`,
    inserted,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Importa leads de um arquivo CSV (LEGACY - Mantido para compatibilidade se necessário, mas ideal migrar)
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

    // Reutilizar a lógica nova de inserção
    return importLeadsFromJson(rows, {
      name: file.name,
      description: "Importação via CSV Legacy",
      updateDuplicates: false
    })

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
  if (!["novo_lead", "situacao", "problema", "implicacao", "motivacao", "convertido", "nao_convertido"].includes(status)) {
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

/**
 * Deleta múltiplos leads
 */
export async function deleteLeads(leadIds: string[]) {
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

  if (!leadIds || leadIds.length === 0) {
    return { success: false, message: "Nenhum lead selecionado" }
  }

  const { error } = await supabase
    .from("leads")
    .delete()
    .in("id", leadIds)

  if (error) {
    console.error("Erro ao deletar leads em massa:", error)
    return { success: false, message: "Erro ao deletar leads" }
  }

  revalidatePath("/admin/pipeline")
  return { success: true }
}

