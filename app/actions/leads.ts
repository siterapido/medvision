"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { mapLegacyStage, VALID_LEAD_STATUSES, type LeadStatus, type LegacyLeadStatus } from "@/lib/lead-utils"

// Re-export types from lead-utils for convenience
export type { LeadStatus, LegacyLeadStatus } from "@/lib/lead-utils"

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
  assigned_to?: string | null
  created_at: string
  updated_at: string
}

export type LeadWithSeller = Lead & {
  assigned_seller?: {
    id: string
    name: string | null
    email: string | null
  } | null
}

export type LeadNote = {
  id: string
  lead_id: string
  note: string
  created_by: string
  created_at: string
  creator?: {
    name: string | null
    email: string | null
  } | null
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

  // Validar status - new conversion-focused stages
  if (!VALID_LEAD_STATUSES.includes(status)) {
    // Check if it's a legacy status and map it
    const mapped = mapLegacyStage(status)
    if (VALID_LEAD_STATUSES.includes(mapped)) {
      status = mapped
    } else {
      return { success: false, message: "Status inválido" }
    }
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
 * Cria um lead a partir do formulário da landing page (público - não requer autenticação)
 */
export async function createLeadFromLanding(data: {
  email: string
  phone: string
  source?: string
}) {
  const supabase = await createClient()

  const normalizedPhone = normalizePhone(data.phone)

  if (normalizedPhone.length < 10) {
    return { success: false, message: "Telefone inválido" }
  }

  // Verificar se já existe um lead com esse telefone
  const { data: existingLead } = await supabase
    .from("leads")
    .select("id, status")
    .eq("phone", normalizedPhone)
    .maybeSingle()

  if (existingLead) {
    // Lead já existe - atualizar email se não tinha
    if (!existingLead.status || existingLead.status === "novo_lead") {
      await supabase
        .from("leads")
        .update({
          email: data.email,
          source: data.source || "landing_page",
          updated_at: new Date().toISOString()
        })
        .eq("id", existingLead.id)
    }
    return { success: true, message: "Lead atualizado", leadId: existingLead.id }
  }

  // Criar novo lead
  const { data: newLead, error } = await supabase
    .from("leads")
    .insert({
      phone: normalizedPhone,
      email: data.email,
      source: data.source || "landing_page",
      status: "novo_lead",
      sheet_source_name: "Landing Page",
      sheet_source_description: "Formulário de teste grátis"
    })
    .select("id")
    .single()

  if (error) {
    console.error("Erro ao criar lead:", error)
    return { success: false, message: "Erro ao processar cadastro" }
  }

  revalidatePath("/admin/pipeline")
  return { success: true, message: "Lead criado", leadId: newLead.id }
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

/**
 * Busca cold leads com informações do vendedor atribuído
 */
export async function getColdLeadsWithSellers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, data: [], message: "Usuário não autenticado" }
  }

  // Verificar role do usuário
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || (profile.role !== "admin" && profile.role !== "vendedor")) {
    return { success: false, data: [], message: "Acesso negado" }
  }

  // Admins veem todos, vendedores veem apenas os seus
  let query = supabase
    .from("leads")
    .select(`
      *,
      assigned_seller:profiles!leads_assigned_to_fkey(id, name, email)
    `)
    .order("created_at", { ascending: false })

  if (profile.role === "vendedor") {
    query = query.eq("assigned_to", user.id)
  }

  const { data: leads, error } = await query

  if (error) {
    console.error("Erro ao buscar leads:", error)
    return { success: false, data: [], message: "Erro ao buscar leads" }
  }

  return { success: true, data: (leads || []) as LeadWithSeller[] }
}

/**
 * Atribui um vendedor a um cold lead
 */
export async function assignSellerToLead(leadId: string, sellerId: string | null) {
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
    return { success: false, message: "Apenas administradores podem atribuir vendedores" }
  }

  // Se sellerId for fornecido, verificar se é um vendedor válido
  if (sellerId) {
    const { data: seller } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", sellerId)
      .single()

    if (!seller) {
      return { success: false, message: "Vendedor não encontrado" }
    }

    if (seller.role !== "vendedor" && seller.role !== "admin") {
      return { success: false, message: "Usuário não é um vendedor" }
    }
  }

  const { error } = await supabase
    .from("leads")
    .update({ assigned_to: sellerId })
    .eq("id", leadId)

  if (error) {
    console.error("Erro ao atribuir vendedor:", error)
    return { success: false, message: "Erro ao atribuir vendedor" }
  }

  revalidatePath("/admin/pipeline")
  return { success: true }
}

/**
 * Adiciona uma nota a um cold lead
 */
export async function addLeadNote(leadId: string, note: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Usuário não autenticado" }
  }

  // Verificar role do usuário
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || (profile.role !== "admin" && profile.role !== "vendedor")) {
    return { success: false, message: "Acesso negado" }
  }

  if (!note || note.trim().length === 0) {
    return { success: false, message: "A nota não pode estar vazia" }
  }

  // Vendedores só podem adicionar notas em seus próprios leads
  if (profile.role === "vendedor") {
    const { data: lead } = await supabase
      .from("leads")
      .select("assigned_to")
      .eq("id", leadId)
      .single()

    if (lead?.assigned_to !== user.id) {
      return { success: false, message: "Você só pode adicionar notas em seus próprios leads" }
    }
  }

  const { error } = await supabase
    .from("lead_notes")
    .insert({
      lead_id: leadId,
      note: note.trim(),
      created_by: user.id,
    })

  if (error) {
    console.error("Erro ao adicionar nota:", error)
    return { success: false, message: "Erro ao adicionar nota" }
  }

  revalidatePath("/admin/pipeline")
  return { success: true }
}

/**
 * Busca notas de um cold lead
 */
export async function getLeadNotes(leadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, data: [], message: "Usuário não autenticado" }
  }

  // Verificar role do usuário
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || (profile.role !== "admin" && profile.role !== "vendedor")) {
    return { success: false, data: [], message: "Acesso negado" }
  }

  const { data: notes, error } = await supabase
    .from("lead_notes")
    .select(`
      id,
      lead_id,
      note,
      created_by,
      created_at
    `)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar notas:", error)
    return { success: false, data: [], message: "Erro ao buscar notas" }
  }

  if (!notes || notes.length === 0) {
    return { success: true, data: [] }
  }

  // Buscar perfis dos criadores das notas
  const creatorIds = [...new Set(notes.map((note) => note.created_by))]
  const { data: creators } = await supabase
    .from("profiles")
    .select("id, name, email")
    .in("id", creatorIds)

  // Adicionar informações do criador a cada nota
  const notesWithCreators = notes.map((note) => ({
    ...note,
    creator: creators?.find((creator) => creator.id === note.created_by) || null,
  }))

  return { success: true, data: notesWithCreators as LeadNote[] }
}

/**
 * Deleta uma nota de um cold lead
 */
export async function deleteLeadNote(noteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Usuário não autenticado" }
  }

  // Verificar se o usuário é o autor da nota ou admin
  const { data: note } = await supabase
    .from("lead_notes")
    .select("created_by")
    .eq("id", noteId)
    .single()

  if (!note) {
    return { success: false, message: "Nota não encontrada" }
  }

  if (note.created_by !== user.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return { success: false, message: "Apenas o autor ou admin pode excluir esta nota" }
    }
  }

  const { error } = await supabase
    .from("lead_notes")
    .delete()
    .eq("id", noteId)

  if (error) {
    console.error("Erro ao excluir nota:", error)
    return { success: false, message: "Erro ao excluir nota" }
  }

  revalidatePath("/admin/pipeline")
  return { success: true }
}

/**
 * Busca detalhes completos de um cold lead
 */
export async function getLeadDetails(leadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Usuário não autenticado" }
  }

  // Verificar role do usuário
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || (profile.role !== "admin" && profile.role !== "vendedor")) {
    return { success: false, message: "Acesso negado" }
  }

  // Buscar lead com vendedor
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select(`
      *,
      assigned_seller:profiles!leads_assigned_to_fkey(id, name, email)
    `)
    .eq("id", leadId)
    .single()

  if (leadError) {
    console.error("Erro ao buscar lead:", leadError)
    return { success: false, message: "Erro ao buscar lead" }
  }

  // Vendedores só podem ver seus próprios leads
  if (profile.role === "vendedor" && lead.assigned_to !== user.id) {
    return { success: false, message: "Acesso negado a este lead" }
  }

  // Buscar notas
  const { data: notes } = await supabase
    .from("lead_notes")
    .select(`
      *,
      creator:profiles!lead_notes_created_by_fkey(name, email)
    `)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })

  // Se o lead foi convertido, buscar o perfil do usuário
  let convertedProfile = null
  if (lead.converted_to_user_id) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, name, email, pipeline_stage, created_at, trial_ends_at")
      .eq("id", lead.converted_to_user_id)
      .single()
    convertedProfile = profileData
  }

  // Construir timeline
  const timeline = [
    {
      id: "created",
      type: "created",
      date: lead.created_at,
      description: "Lead importado",
      metadata: { source: lead.source, sheet: lead.sheet_source_name },
    },
    // Notas
    ...(notes || []).map((n: any) => ({
      id: n.id,
      type: "note",
      date: n.created_at,
      description: "Nota adicionada",
      metadata: { note: n.note, creator: n.creator?.name || n.creator?.email },
    })),
    // Conversão
    ...(lead.converted_at ? [{
      id: "converted",
      type: "converted",
      date: lead.converted_at,
      description: "Convertido para trial",
      metadata: { user_id: lead.converted_to_user_id },
    }] : []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return {
    success: true,
    data: {
      lead,
      notes: notes || [],
      convertedProfile,
      timeline,
    }
  }
}

