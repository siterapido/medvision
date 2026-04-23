import { jsPDF } from 'jspdf'
import { VISION_CLINICAL_DISCLAIMER_PLAIN } from '@/lib/constants/vision'
import { VisionAnalysisResult, VisionRefinement } from '@/lib/types/vision'

interface GeneratePDFOptions {
  analysisResult: VisionAnalysisResult
  imageBase64: string
  refinements?: VisionRefinement[]
}

/** Med Vision primary #0891b2, hover #0e7490 (design system) */
const PRIMARY_RGB: [number, number, number] = [8, 145, 178]
const PRIMARY_DARK_RGB: [number, number, number] = [14, 116, 144]
const ACCENT_TINT: [number, number, number] = [224, 247, 250]

type JsPdfImageFormat = 'JPEG' | 'PNG' | 'WEBP'

function getJsPdfImageFormat(dataUrl: string): JsPdfImageFormat {
  if (dataUrl.startsWith('data:image/png')) return 'PNG'
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP'
  return 'JPEG'
}

function loadImageDimensions(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    if (typeof Image === 'undefined') {
      reject(new Error('Image not available'))
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 })
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = dataUrl
  })
}

/**
 * Inscribe image size in a max box (object-fit: contain) without stretching.
 */
function fitContain(
  naturalW: number,
  naturalH: number,
  maxW: number,
  maxH: number
): { w: number; h: number } {
  if (naturalW <= 0 || naturalH <= 0) {
    return { w: maxW, h: maxH }
  }
  const scale = Math.min(maxW / naturalW, maxH / naturalH)
  return { w: naturalW * scale, h: naturalH * scale }
}

export async function generateVisionPDF({ analysisResult, imageBase64, refinements = [] }: GeneratePDFOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let yPosition = margin

  const primaryColor = PRIMARY_RGB
  const primaryDark = PRIMARY_DARK_RGB
  const textColor: [number, number, number] = [30, 30, 30]
  const mutedColor: [number, number, number] = [100, 100, 100]

  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 6): number => {
    const lines = doc.splitTextToSize(text, maxWidth)
    doc.text(lines, x, y)
    return y + lines.length * lineHeight
  }

  const headerBandMm = 38

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, pageWidth, headerBandMm, 'F')

  doc.setDrawColor(primaryDark[0], primaryDark[1], primaryDark[2])
  doc.setLineWidth(0.2)
  doc.line(0, headerBandMm, pageWidth, headerBandMm)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Med Vision', margin, 17)

  doc.setFontSize(10.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Laudo de análise assistida por inteligência artificial', margin, 26.5)

  const reportId = Math.random().toString(36).slice(2, 8).toUpperCase()
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  const idStr = `ID #${reportId}`
  const idW = doc.getTextWidth(idStr)
  doc.text(idStr, pageWidth - margin - idW, 16)
  const dateW = doc.getTextWidth(currentDate)
  doc.text(currentDate, pageWidth - margin - dateW, 25)

  yPosition = headerBandMm + 8

  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  yPosition = addWrappedText(
    VISION_CLINICAL_DISCLAIMER_PLAIN,
    margin,
    yPosition,
    contentWidth,
    4.2
  )
  yPosition += 8
  doc.setFont('helvetica', 'normal')

  // Image type badge
  if (analysisResult.meta?.imageType) {
    doc.setFillColor(240, 242, 245)
    doc.setDrawColor(220, 226, 232)
    doc.setLineWidth(0.2)
    doc.roundedRect(margin, yPosition, 78, 8.5, 1.5, 1.5, 'FD')
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Tipo de exame: ${analysisResult.meta.imageType}`, margin + 3.5, yPosition + 5.8)
    yPosition += 16
  }

  // Main image (proportional, no stretch)
  if (imageBase64) {
    try {
      const imgFmt = getJsPdfImageFormat(imageBase64)
      const maxW = contentWidth
      const maxH = 112

      let naturalW = 4
      let naturalH = 3
      try {
        const d = await loadImageDimensions(imageBase64)
        naturalW = d.w
        naturalH = d.h
      } catch {
        // keep default 4:3 for layout only
      }

      let { w: imgW, h: imgH } = fitContain(naturalW, naturalH, maxW, maxH)

      if (yPosition + imgH + 32 > pageHeight) {
        doc.addPage()
        yPosition = margin
      }

      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'italic')
      doc.text('Imagem analisada (proporção original preservada)', margin, yPosition)
      yPosition += 5

      const pad = 0.5
      doc.setDrawColor(200, 208, 216)
      doc.setLineWidth(0.45)
      doc.setFillColor(250, 251, 252)
      doc.roundedRect(margin, yPosition, imgW, imgH, 1, 1, 'FD')
      doc.addImage(imageBase64, imgFmt, margin + pad, yPosition + pad, imgW - pad * 2, imgH - pad * 2)
      yPosition += imgH + 12
    } catch (error) {
      console.error('Error adding image to PDF:', error)
      yPosition += 10
    }
  }

  // Section: Principais achados
  if (analysisResult.findings && analysisResult.findings.length > 0) {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(margin, yPosition, 4, 8, 'F')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(11.5)
    doc.setFont('helvetica', 'bold')
    doc.text('Principais achados', margin + 8, yPosition + 5.5)
    yPosition += 14

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)

    analysisResult.findings.forEach((finding, idx) => {
      if (yPosition > pageHeight - 42) {
        doc.addPage()
        yPosition = margin
      }

      const matchedDet = analysisResult.detections[idx]
      let findingText = `• ${finding.type}`
      if (matchedDet?.toothNumber) {
        findingText += ` (Dente ${matchedDet.toothNumber})`
      }
      if (matchedDet?.cidCode) {
        findingText += ` - CID-10: ${matchedDet.cidCode}`
      }

      doc.setFillColor(248, 249, 251)
      doc.setDrawColor(230, 234, 240)
      doc.setLineWidth(0.2)
      doc.roundedRect(margin, yPosition, contentWidth, 12, 2, 2, 'FD')

      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.setFontSize(9)
      doc.text(findingText, margin + 4, yPosition + 7.2)

      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
      doc.setFontSize(8)
      doc.text(`${finding.zone} - ${finding.level}`, margin + contentWidth - 52, yPosition + 7.2)
      doc.setFontSize(9.5)

      yPosition += 16
    })

    yPosition += 5
  }

  if (analysisResult.report?.technicalAnalysis) {
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(margin, yPosition, 4, 8, 'F')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(11.5)
    doc.setFont('helvetica', 'bold')
    doc.text('Análise técnica', margin + 8, yPosition + 5.5)
    yPosition += 12

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    yPosition = addWrappedText(analysisResult.report.technicalAnalysis, margin, yPosition, contentWidth)
    yPosition += 10
  }

  if (analysisResult.report?.detailedFindings) {
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(margin, yPosition, 4, 8, 'F')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(11.5)
    doc.setFont('helvetica', 'bold')
    doc.text('Achados detalhados', margin + 8, yPosition + 5.5)
    yPosition += 12

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    yPosition = addWrappedText(analysisResult.report.detailedFindings, margin, yPosition, contentWidth)
    yPosition += 10
  }

  if (analysisResult.report?.diagnosticHypothesis) {
    if (yPosition > pageHeight - 50) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(margin, yPosition, 4, 8, 'F')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(11.5)
    doc.setFont('helvetica', 'bold')
    doc.text('Hipótese diagnóstica', margin + 8, yPosition + 5.5)
    yPosition += 12

    doc.setFillColor(ACCENT_TINT[0], ACCENT_TINT[1], ACCENT_TINT[2])
    const diagLines = doc.splitTextToSize(analysisResult.report.diagnosticHypothesis, contentWidth - 10)
    const diagHeight = diagLines.length * 6 + 8
    doc.setDrawColor(180, 220, 228)
    doc.setLineWidth(0.25)
    doc.roundedRect(margin, yPosition, contentWidth, diagHeight, 3, 3, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2])
    doc.text(diagLines, margin + 5, yPosition + 7)
    yPosition += diagHeight + 10
  }

  if (analysisResult.report?.differentialDiagnosis) {
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(margin, yPosition, 4, 8, 'F')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(11.5)
    doc.setFont('helvetica', 'bold')
    doc.text('Diagnóstico diferencial', margin + 8, yPosition + 5.5)
    yPosition += 12

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    yPosition = addWrappedText(analysisResult.report.differentialDiagnosis, margin, yPosition, contentWidth)
    yPosition += 10
  }

  if (analysisResult.report?.perToothBreakdown && analysisResult.report.perToothBreakdown.length > 0) {
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(margin, yPosition, 4, 8, 'F')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(11.5)
    doc.setFont('helvetica', 'bold')
    doc.text('Achados por dente (notação FDI)', margin + 8, yPosition + 5.5)
    yPosition += 14

    doc.setFillColor(240, 242, 245)
    doc.setDrawColor(220, 226, 232)
    doc.setLineWidth(0.2)
    doc.rect(margin, yPosition, contentWidth, 8, 'FD')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Dente', margin + 3, yPosition + 5.5)
    doc.text('Achado', margin + 25, yPosition + 5.5)
    doc.text('CID-10', margin + 110, yPosition + 5.5)
    doc.text('Severidade', margin + 140, yPosition + 5.5)
    yPosition += 10

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)

    analysisResult.report.perToothBreakdown.forEach((item) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFillColor(250, 251, 252)
      doc.setDrawColor(235, 238, 244)
      doc.rect(margin, yPosition, contentWidth, 8, 'FD')
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.setFont('helvetica', 'bold')
      doc.text(item.tooth, margin + 3, yPosition + 5.5)
      doc.setFont('helvetica', 'normal')
      const findingsText = item.findings.length > 60 ? item.findings.slice(0, 60) + '...' : item.findings
      doc.text(findingsText, margin + 25, yPosition + 5.5)
      doc.setFont('helvetica', 'bold')
      doc.text(item.cidCode || '—', margin + 110, yPosition + 5.5)
      doc.setFont('helvetica', 'normal')
      doc.text(item.severity || 'N/A', margin + 140, yPosition + 5.5)
      yPosition += 10
    })

    yPosition += 5
  }

  if (analysisResult.report?.recommendations && analysisResult.report.recommendations.length > 0) {
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(margin, yPosition, 4, 8, 'F')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(11.5)
    doc.setFont('helvetica', 'bold')
    doc.text('Conduta recomendada', margin + 8, yPosition + 5.5)
    yPosition += 14

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    analysisResult.report.recommendations.forEach((rec, index) => {
      if (yPosition > pageHeight - 22) {
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

  if (refinements.length > 0) {
    doc.addPage()
    yPosition = margin

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, pageWidth, 28, 'F')
    doc.setDrawColor(primaryDark[0], primaryDark[1], primaryDark[2])
    doc.line(0, 28, pageWidth, 28)

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.text('Refinamentos de região', margin, 16)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.text('Recortes adicionais analisados', margin, 22.5)
    yPosition = 36

    for (let idx = 0; idx < refinements.length; idx++) {
      const ref = refinements[idx]
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFillColor(240, 242, 245)
      doc.setDrawColor(220, 226, 232)
      doc.setLineWidth(0.2)
      doc.roundedRect(margin, yPosition, contentWidth, 10, 1.5, 1.5, 'FD')
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.setFontSize(11.5)
      doc.setFont('helvetica', 'bold')
      doc.text(`Refinamento ${idx + 1}`, margin + 3, yPosition + 7)
      doc.setFontSize(8.5)
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
      doc.setFont('helvetica', 'normal')
      doc.text(`Data: ${new Date(ref.analyzedAt).toLocaleString('pt-BR')}`, margin + contentWidth - 58, yPosition + 7)
      yPosition += 14

      try {
        const thumbFmt = getJsPdfImageFormat(ref.regionImageBase64)
        const thumbMaxW = 58
        const thumbMaxH = 48

        let tnw = 4
        let tnh = 3
        try {
          const td = await loadImageDimensions(ref.regionImageBase64)
          tnw = td.w
          tnh = td.h
        } catch {
          // default aspect
        }

        const { w: tw, h: th } = fitContain(tnw, tnh, thumbMaxW, thumbMaxH)

        doc.setDrawColor(200, 208, 216)
        doc.setLineWidth(0.35)
        doc.setFillColor(252, 252, 253)
        doc.roundedRect(margin, yPosition, tw, th, 0.5, 0.5, 'FD')
        doc.addImage(ref.regionImageBase64, thumbFmt, margin + 0.4, yPosition + 0.4, tw - 0.8, th - 0.8)

        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        doc.setFontSize(9.5)
        doc.setFont('helvetica', 'bold')
        doc.text(`${ref.analysis.detections.length} achados identificados`, margin + tw + 5, yPosition + 8)

        if (ref.analysis.detections.length > 0) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          const findingsList = ref.analysis.detections.slice(0, 4).map((d) => d.label).join(', ')
          doc.text(findingsList, margin + tw + 5, yPosition + 15)
        }
        yPosition += th + 14
      } catch (e) {
        console.error('Error adding refinement thumbnail:', e)
        yPosition += 10
      }

      if (ref.analysis.findings && ref.analysis.findings.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        doc.text('Achados refinados', margin, yPosition)
        yPosition += 6

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        ref.analysis.findings.forEach((f, fIdx) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage()
            yPosition = margin
          }
          const det = ref.analysis.detections[fIdx]
          let text = `${fIdx + 1}. ${f.type}`
          if (det?.toothNumber) text += ` (Dente ${det.toothNumber})`
          if (det?.cidCode) text += ` - ${det.cidCode}`
          doc.text(text, margin + 3, yPosition)
          yPosition += 5
        })
        yPosition += 5
      }

      if (ref.analysis.report?.diagnosticHypothesis) {
        if (yPosition > pageHeight - 30) {
          doc.addPage()
          yPosition = margin
        }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        doc.text('Hipótese diagnóstica', margin, yPosition)
        yPosition += 5
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        yPosition = addWrappedText(ref.analysis.report.diagnosticHypothesis, margin, yPosition, contentWidth - 5, 4)
        yPosition += 10
      }

      yPosition += 5
    }
  }

  // Footer
  const footerY = pageHeight - 25
  doc.setDrawColor(200, 208, 216)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY, pageWidth - margin, footerY)

  doc.setFontSize(8.5)
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
  doc.setFont('helvetica', 'italic')
  doc.text('Este laudo foi gerado por inteligência artificial e serve apenas como auxílio diagnóstico.', margin, footerY + 7.5)
  doc.text('A interpretação final deve ser realizada por um profissional habilitado.', margin, footerY + 13.5)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  const footerRight = 'Med Vision • CRM virtual 0001-AI'
  const fw = doc.getTextWidth(footerRight)
  doc.text(footerRight, pageWidth - margin - fw, footerY + 10.5)

  doc.save(`laudo-medvision-${reportId}.pdf`)
}
