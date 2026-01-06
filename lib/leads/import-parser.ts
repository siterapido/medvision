import * as XLSX from "xlsx"
import { ColumnMapping, ImportLeadRow } from "@/app/actions/leads"

export interface ParsedSheet {
  headers: string[]
  rows: Record<string, string>[]
  totalRows: number
}

/**
 * Normaliza número de telefone removendo caracteres não numéricos
 */
export function normalizePhone(phone: string): string {
  if (!phone) return ""
  return phone.replace(/\D/g, "")
}

/**
 * Lê um arquivo (CSV ou Excel) e retorna headers e linhas
 */
export async function parseFile(file: File): Promise<ParsedSheet> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: "array" })
  
  // Pega a primeira planilha
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  
  // Converte para JSON
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    header: 1,
    defval: "",
    blankrows: false
  })
  
  if (jsonData.length < 2) {
    throw new Error("Arquivo vazio ou sem dados")
  }

  // A primeira linha são os headers
  const headers = (jsonData[0] as unknown[]).map(h => String(h || "").trim())
  
  // As demais linhas são dados
  const rows: Record<string, string>[] = []
  
  for (let i = 1; i < jsonData.length; i++) {
    const rowData = jsonData[i] as unknown[]
    const row: Record<string, string> = {}
    
    headers.forEach((header, index) => {
      row[header] = String(rowData[index] || "").trim()
    })
    
    // Ignora linhas vazias (sem telefone e sem nome)
    const hasData = Object.values(row).some(v => v.length > 0)
    if (hasData) {
      rows.push(row)
    }
  }

  return {
    headers,
    rows,
    totalRows: rows.length
  }
}

/**
 * Tenta adivinhar o mapeamento das colunas baseado nos nomes
 */
export function guessColumnMapping(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {}
  
  const normalizedHeaders = headers.map(h => ({ 
    original: h, 
    lower: h.toLowerCase().trim() 
  }))

  // Helper para encontrar header que corresponde a termos
  const findHeader = (terms: string[]) => {
    return normalizedHeaders.find(h => 
      terms.some(term => h.lower === term || h.lower.includes(term))
    )?.original
  }

  // Nome
  mapping.name = findHeader(["nome", "name", "cliente", "lead"]) || ""
  
  // Telefone (Prioridade alta)
  mapping.phone = findHeader(["telefone", "phone", "celular", "whatsapp", "whats", "tel"]) || ""
  
  // Email
  mapping.email = findHeader(["email", "e-mail", "mail"]) || ""
  
  // Origem
  mapping.source = findHeader(["origem", "source", "canal", "midia"]) || ""
  
  // Observações
  mapping.notes = findHeader(["observações", "observacoes", "obs", "notas", "notes", "comentarios"]) || ""
  
  // Estado
  mapping.state = findHeader(["estado", "uf", "state", "regiao"]) || ""
  
  // IES
  mapping.ies = findHeader(["ies", "universidade", "faculdade", "instituicao", "curso", "university"]) || ""

  return mapping
}

/**
 * Aplica o mapeamento às linhas para gerar o formato ImportLeadRow
 */
export function applyMapping(rows: Record<string, string>[], mapping: ColumnMapping): ImportLeadRow[] {
  return rows.map(row => {
    // Normaliza telefone
    let phone = ""
    if (mapping.phone && row[mapping.phone]) {
      phone = normalizePhone(row[mapping.phone])
    }
    
    // Só retorna se tiver telefone válido (pelo menos 10 dígitos com DDD)
    if (!phone || phone.length < 10) {
      return null
    }

    return {
      Nome: mapping.name ? row[mapping.name] : undefined,
      Telefone: phone,
      Email: mapping.email ? row[mapping.email] : undefined,
      Origem: mapping.source ? row[mapping.source] : undefined,
      Observações: mapping.notes ? row[mapping.notes] : undefined,
      Estado: mapping.state ? row[mapping.state] : undefined,
      IES: mapping.ies ? row[mapping.ies] : undefined,
    }
  }).filter((r): r is ImportLeadRow => r !== null)
}



