/**
 * PDF Export Utilities
 *
 * Generates PDF documents from artifacts using jsPDF.
 */

import { jsPDF } from 'jspdf'

// Color palette
const COLORS = {
  primary: '#14b8a6',    // Teal
  secondary: '#64748b',  // Slate
  text: '#1e293b',       // Dark slate
  lightText: '#64748b',  // Gray
  accent: '#0ea5e9',     // Sky
  border: '#e2e8f0',     // Light border
}

// Font sizes
const FONT_SIZES = {
  title: 20,
  subtitle: 14,
  heading: 12,
  body: 10,
  small: 8,
}

/**
 * Add a styled header to the PDF
 */
function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header background
  doc.setFillColor(20, 184, 166) // Teal
  doc.rect(0, 0, pageWidth, 25, 'F')

  // Logo/Brand text
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(FONT_SIZES.title)
  doc.setFont('helvetica', 'bold')
  doc.text('ODONTO GPT', 15, 12)

  doc.setFontSize(FONT_SIZES.small)
  doc.setFont('helvetica', 'normal')
  doc.text(subtitle || 'Artefato de Estudo', 15, 18)

  // Date on right
  const date = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  doc.text(date, pageWidth - 15, 12, { align: 'right' })

  return 30 // Return Y position after header
}

/**
 * Add a styled footer to the PDF
 */
function addFooter(doc: jsPDF, pageNumber: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setDrawColor(226, 232, 240) // Border color
  doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15)

  doc.setTextColor(100, 116, 139) // Gray
  doc.setFontSize(FONT_SIZES.small)
  doc.text('Gerado por Odonto GPT', 15, pageHeight - 8)
  doc.text(`Página ${pageNumber}`, pageWidth - 15, pageHeight - 8, { align: 'right' })
}

/**
 * Export Research artifact to PDF
 */
export function exportResearchToPDF(artifact: {
  title: string
  content: {
    markdownContent?: string
    sources?: Array<{ title: string; url?: string }>
    query?: string
  }
}): Blob {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = addHeader(doc, artifact.title, 'Pesquisa Científica')

  // Title
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(FONT_SIZES.subtitle)
  doc.setFont('helvetica', 'bold')
  const titleLines = doc.splitTextToSize(artifact.title, pageWidth - 30)
  doc.text(titleLines, 15, y)
  y += titleLines.length * 7 + 5

  // Query if available
  if (artifact.content.query) {
    doc.setFontSize(FONT_SIZES.body)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 116, 139)
    doc.text(`Pergunta: ${artifact.content.query}`, 15, y)
    y += 10
  }

  // Content
  if (artifact.content.markdownContent) {
    doc.setFontSize(FONT_SIZES.body)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 41, 59)

    // Simple markdown to text conversion (remove markdown formatting)
    const plainText = artifact.content.markdownContent
      .replace(/#{1,6}\s+/g, '') // Remove headings
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/`([^`]+)`/g, '$1') // Remove code

    const lines = doc.splitTextToSize(plainText, pageWidth - 30)

    for (const line of lines) {
      if (y > 270) {
        addFooter(doc, doc.getNumberOfPages())
        doc.addPage()
        y = 20
      }
      doc.text(line, 15, y)
      y += 5
    }
  }

  // Sources
  if (artifact.content.sources && artifact.content.sources.length > 0) {
    if (y > 240) {
      addFooter(doc, doc.getNumberOfPages())
      doc.addPage()
      y = 20
    }

    y += 10
    doc.setFontSize(FONT_SIZES.heading)
    doc.setFont('helvetica', 'bold')
    doc.text('Referências', 15, y)
    y += 8

    doc.setFontSize(FONT_SIZES.small)
    doc.setFont('helvetica', 'normal')

    artifact.content.sources.forEach((source, index) => {
      if (y > 270) {
        addFooter(doc, doc.getNumberOfPages())
        doc.addPage()
        y = 20
      }
      const sourceText = `${index + 1}. ${source.title}${source.url ? ` - ${source.url}` : ''}`
      const sourceLines = doc.splitTextToSize(sourceText, pageWidth - 30)
      doc.text(sourceLines, 15, y)
      y += sourceLines.length * 4 + 2
    })
  }

  addFooter(doc, doc.getNumberOfPages())

  return doc.output('blob')
}

/**
 * Export Summary artifact to PDF
 */
export function exportSummaryToPDF(artifact: {
  title: string
  content: {
    markdownContent?: string
    keyPoints?: string[]
    topic?: string
  }
}): Blob {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = addHeader(doc, artifact.title, 'Resumo de Estudo')

  // Title
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(FONT_SIZES.subtitle)
  doc.setFont('helvetica', 'bold')
  const titleLines = doc.splitTextToSize(artifact.title, pageWidth - 30)
  doc.text(titleLines, 15, y)
  y += titleLines.length * 7 + 5

  // Key points
  if (artifact.content.keyPoints && artifact.content.keyPoints.length > 0) {
    doc.setFillColor(240, 253, 250) // Light teal bg
    doc.roundedRect(15, y, pageWidth - 30, artifact.content.keyPoints.length * 6 + 10, 3, 3, 'F')

    y += 5
    doc.setFontSize(FONT_SIZES.small)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(13, 148, 136) // Teal text
    doc.text('PONTOS-CHAVE', 20, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 41, 59)
    artifact.content.keyPoints.forEach(point => {
      doc.text(`• ${point}`, 20, y)
      y += 5
    })
    y += 10
  }

  // Content
  if (artifact.content.markdownContent) {
    doc.setFontSize(FONT_SIZES.body)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 41, 59)

    const plainText = artifact.content.markdownContent
      .replace(/#{1,6}\s+/g, '\n')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')

    const lines = doc.splitTextToSize(plainText, pageWidth - 30)

    for (const line of lines) {
      if (y > 270) {
        addFooter(doc, doc.getNumberOfPages())
        doc.addPage()
        y = 20
      }
      doc.text(line, 15, y)
      y += 5
    }
  }

  addFooter(doc, doc.getNumberOfPages())

  return doc.output('blob')
}

/**
 * Export Flashcards to Anki-compatible TSV format
 */
export function exportFlashcardsToAnki(artifact: {
  title: string
  content: {
    cards: Array<{ front: string; back: string; category?: string }>
  }
}): Blob {
  const lines = ['#separator:tab', '#html:false', '#columns:front\tback\ttags']

  const deckTag = artifact.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()

  artifact.content.cards.forEach(card => {
    const tags = card.category ? `${deckTag} ${card.category}` : deckTag
    const line = `${card.front}\t${card.back}\t${tags}`
    lines.push(line)
  })

  return new Blob([lines.join('\n')], { type: 'text/tab-separated-values' })
}

/**
 * Export Flashcards to simple TXT format
 */
export function exportFlashcardsToTxt(artifact: {
  title: string
  content: {
    cards: Array<{ front: string; back: string }>
  }
}): Blob {
  const lines = [`# ${artifact.title}`, '', `Total de cards: ${artifact.content.cards.length}`, '']

  artifact.content.cards.forEach((card, index) => {
    lines.push(`--- Card ${index + 1} ---`)
    lines.push(`P: ${card.front}`)
    lines.push(`R: ${card.back}`)
    lines.push('')
  })

  return new Blob([lines.join('\n')], { type: 'text/plain' })
}

/**
 * Export Exam/Quiz to PDF
 */
export function exportExamToPDF(artifact: {
  title: string
  content: {
    questions: Array<{
      question_text?: string
      text?: string
      options: string[] | Array<{ text: string; isCorrect?: boolean }>
      correct_answer?: string
      explanation?: string
    }>
    difficulty?: string
  }
}): Blob {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = addHeader(doc, artifact.title, 'Simulado Prático')

  // Title
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(FONT_SIZES.subtitle)
  doc.setFont('helvetica', 'bold')
  doc.text(artifact.title, 15, y)
  y += 10

  // Questions
  artifact.content.questions.forEach((question, qIndex) => {
    if (y > 240) {
      addFooter(doc, doc.getNumberOfPages())
      doc.addPage()
      y = 20
    }

    // Question number and text
    doc.setFontSize(FONT_SIZES.body)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)

    const questionText = question.question_text || question.text || ''
    const questionLines = doc.splitTextToSize(`${qIndex + 1}. ${questionText}`, pageWidth - 30)
    doc.text(questionLines, 15, y)
    y += questionLines.length * 5 + 3

    // Options
    doc.setFont('helvetica', 'normal')
    const letters = ['A', 'B', 'C', 'D', 'E']

    question.options.forEach((option, oIndex) => {
      const optionText = typeof option === 'string' ? option : option.text
      const optionLines = doc.splitTextToSize(`${letters[oIndex]}) ${optionText}`, pageWidth - 35)
      doc.text(optionLines, 20, y)
      y += optionLines.length * 4 + 2
    })

    y += 5
  })

  // Answer key on new page
  doc.addPage()
  y = addHeader(doc, 'Gabarito', 'Simulado Prático')

  doc.setFontSize(FONT_SIZES.heading)
  doc.setFont('helvetica', 'bold')
  doc.text('Gabarito', 15, y)
  y += 10

  doc.setFontSize(FONT_SIZES.body)
  doc.setFont('helvetica', 'normal')

  artifact.content.questions.forEach((question, qIndex) => {
    if (y > 270) {
      addFooter(doc, doc.getNumberOfPages())
      doc.addPage()
      y = 20
    }

    const correct = question.correct_answer || ''
    doc.text(`${qIndex + 1}. ${correct}`, 15, y)
    y += 5

    if (question.explanation) {
      doc.setFontSize(FONT_SIZES.small)
      doc.setTextColor(100, 116, 139)
      const explLines = doc.splitTextToSize(`   ${question.explanation}`, pageWidth - 35)
      doc.text(explLines, 15, y)
      y += explLines.length * 3 + 3
      doc.setFontSize(FONT_SIZES.body)
      doc.setTextColor(30, 41, 59)
    }
  })

  addFooter(doc, doc.getNumberOfPages())

  return doc.output('blob')
}

/**
 * Export Mind Map to Markdown outline
 */
export function exportMindMapToMarkdown(artifact: {
  title: string
  content: {
    root: {
      label: string
      children?: Array<{ label: string; children?: Array<{ label: string; children?: any[] }> }>
    }
  }
}): Blob {
  const lines: string[] = [`# ${artifact.title}`, '']

  function traverse(node: any, level: number = 0) {
    const indent = '  '.repeat(level)
    const bullet = level === 0 ? '' : '- '
    lines.push(`${indent}${bullet}${node.label}`)

    if (node.children) {
      node.children.forEach((child: any) => traverse(child, level + 1))
    }
  }

  traverse(artifact.content.root)

  return new Blob([lines.join('\n')], { type: 'text/markdown' })
}
