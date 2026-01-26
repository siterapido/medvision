import { jsPDF } from 'jspdf'
import { VisionAnalysisResult } from '@/lib/types/vision'

interface GeneratePDFOptions {
  analysisResult: VisionAnalysisResult
  imageBase64: string
}

export async function generateVisionPDF({ analysisResult, imageBase64 }: GeneratePDFOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  let yPosition = margin

  // Colors
  const primaryColor: [number, number, number] = [2, 132, 199] // #0284c7 - teal/cyan
  const textColor: [number, number, number] = [30, 30, 30]
  const mutedColor: [number, number, number] = [100, 100, 100]

  // Helper function to add wrapped text
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 6): number => {
    const lines = doc.splitTextToSize(text, maxWidth)
    doc.text(lines, x, y)
    return y + (lines.length * lineHeight)
  }

  // Header with Logo/Title
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, pageWidth, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('ODONTO GPT', margin, 18)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Laudo de Análise por Inteligência Artificial', margin, 28)

  // Report ID and Date
  const reportId = Math.random().toString(36).slice(2, 8).toUpperCase()
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  doc.setFontSize(9)
  doc.text(`ID: #${reportId}`, pageWidth - margin - 30, 18)
  doc.text(currentDate, pageWidth - margin - 30, 25)

  yPosition = 45

  // Image Type Badge
  if (analysisResult.meta?.imageType) {
    doc.setFillColor(240, 240, 240)
    doc.roundedRect(margin, yPosition, 60, 8, 2, 2, 'F')
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.setFontSize(9)
    doc.text(`Tipo: ${analysisResult.meta.imageType}`, margin + 3, yPosition + 5.5)
    yPosition += 15
  }

  // Add Image
  if (imageBase64) {
    try {
      const imgWidth = contentWidth
      const imgHeight = 70

      // Add border around image
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.5)
      doc.rect(margin, yPosition, imgWidth, imgHeight)

      doc.addImage(imageBase64, 'JPEG', margin + 1, yPosition + 1, imgWidth - 2, imgHeight - 2)
      yPosition += imgHeight + 10
    } catch (error) {
      console.error('Error adding image to PDF:', error)
      yPosition += 10
    }
  }

  // Section: Principais Achados
  if (analysisResult.findings && analysisResult.findings.length > 0) {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(margin, yPosition, 4, 8, 'F')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('PRINCIPAIS ACHADOS', margin + 8, yPosition + 6)
    yPosition += 14

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    analysisResult.findings.forEach((finding) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFillColor(248, 248, 248)
      doc.roundedRect(margin, yPosition, contentWidth, 12, 2, 2, 'F')

      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text(`• ${finding.type}`, margin + 4, yPosition + 7)

      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
      doc.setFontSize(8)
      doc.text(`${finding.zone} - ${finding.level}`, margin + contentWidth - 50, yPosition + 7)
      doc.setFontSize(10)

      yPosition += 16
    })

    yPosition += 5
  }

  // Section: Análise Técnica
  if (analysisResult.report?.technicalAnalysis) {
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(margin, yPosition, 4, 8, 'F')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('ANÁLISE TÉCNICA', margin + 8, yPosition + 6)
    yPosition += 12

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    yPosition = addWrappedText(analysisResult.report.technicalAnalysis, margin, yPosition, contentWidth)
    yPosition += 10
  }

  // Section: Achados Detalhados
  if (analysisResult.report?.detailedFindings) {
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(margin, yPosition, 4, 8, 'F')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('ACHADOS DETALHADOS', margin + 8, yPosition + 6)
    yPosition += 12

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    yPosition = addWrappedText(analysisResult.report.detailedFindings, margin, yPosition, contentWidth)
    yPosition += 10
  }

  // Section: Hipótese Diagnóstica
  if (analysisResult.report?.diagnosticHypothesis) {
    if (yPosition > pageHeight - 50) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(margin, yPosition, 4, 8, 'F')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('HIPÓTESE DIAGNÓSTICA', margin + 8, yPosition + 6)
    yPosition += 12

    // Highlight box for diagnosis
    doc.setFillColor(240, 249, 255)
    const diagLines = doc.splitTextToSize(analysisResult.report.diagnosticHypothesis, contentWidth - 10)
    const diagHeight = diagLines.length * 6 + 8
    doc.roundedRect(margin, yPosition, contentWidth, diagHeight, 3, 3, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text(diagLines, margin + 5, yPosition + 7)
    yPosition += diagHeight + 10
  }

  // Section: Conduta Recomendada
  if (analysisResult.report?.recommendations && analysisResult.report.recommendations.length > 0) {
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(margin, yPosition, 4, 8, 'F')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('CONDUTA RECOMENDADA', margin + 8, yPosition + 6)
    yPosition += 14

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    analysisResult.report.recommendations.forEach((rec, index) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage()
        yPosition = margin
      }

      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.text(`${index + 1}.`, margin, yPosition)
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      yPosition = addWrappedText(rec, margin + 8, yPosition, contentWidth - 8)
      yPosition += 4
    })
  }

  // Footer
  const footerY = pageHeight - 25
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY, pageWidth - margin, footerY)

  doc.setFontSize(9)
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
  doc.setFont('helvetica', 'italic')
  doc.text('Este laudo foi gerado por inteligência artificial e serve apenas como auxílio diagnóstico.', margin, footerY + 8)
  doc.text('A interpretação final deve ser realizada por um profissional habilitado.', margin, footerY + 14)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('OdontoVision AI • CRM Virtual: 0001-AI', pageWidth - margin - 55, footerY + 11)

  // Save the PDF
  doc.save(`laudo-odontovision-${reportId}.pdf`)
}
