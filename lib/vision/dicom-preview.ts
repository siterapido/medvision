/**
 * Detecção e preview leve de DICOM (primeiro frame grayscale → PNG data URL).
 * Compressão encapsulada / multi-frame avançado ficam para conversão server-side.
 */

import * as dicomParser from 'dicom-parser'

const DICOM_MAGIC = 'DICM'
const DICOM_MAGIC_OFFSET = 128

export type DicomPreviewResult =
  | {
      ok: true
      previewDataUrl: string
      width: number
      height: number
      message?: string
    }
  | {
      ok: false
      detected: boolean
      message: string
    }

/** Detecta DICOM por extensão, MIME ou magic bytes (DICM em offset 128). */
export function isDicomFile(file: File, bytes?: ArrayBuffer | Uint8Array): boolean {
  const name = file.name.toLowerCase()
  if (name.endsWith('.dcm') || name.endsWith('.dicom')) return true
  if (file.type === 'application/dicom' || file.type === 'application/dicom+json') {
    return true
  }
  if (!bytes) return false
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  if (view.length < DICOM_MAGIC_OFFSET + 4) return false
  const magic = String.fromCharCode(
    view[DICOM_MAGIC_OFFSET],
    view[DICOM_MAGIC_OFFSET + 1],
    view[DICOM_MAGIC_OFFSET + 2],
    view[DICOM_MAGIC_OFFSET + 3],
  )
  return magic === DICOM_MAGIC
}

function readWindowParams(dataSet: dicomParser.DataSet): { center: number; width: number } | null {
  const center =
    dataSet.floatString('x00281050') ??
    dataSet.intString('x00281050') ??
    undefined
  const width =
    dataSet.floatString('x00281051') ??
    dataSet.intString('x00281051') ??
    undefined
  if (center == null || width == null || width <= 0) return null
  return { center, width }
}

function applyWindowLevel(
  value: number,
  center: number,
  width: number,
): number {
  const low = center - width / 2
  const high = center + width / 2
  if (value <= low) return 0
  if (value >= high) return 255
  return Math.round(((value - low) / width) * 255)
}

/**
 * Tenta extrair o primeiro frame não encapsulado como PNG grayscale data URL.
 */
export async function extractDicomPreview(file: File): Promise<DicomPreviewResult> {
  const buffer = await file.arrayBuffer()
  const byteArray = new Uint8Array(buffer)
  const detected = isDicomFile(file, byteArray)

  if (!detected) {
    return {
      ok: false,
      detected: false,
      message: 'Arquivo não parece ser DICOM.',
    }
  }

  try {
    const dataSet = dicomParser.parseDicom(byteArray)
    const rows = dataSet.uint16('x00280010')
    const cols = dataSet.uint16('x00280011')
    const bitsAllocated = dataSet.uint16('x00280100') ?? 16
    const pixelRepresentation = dataSet.uint16('x00280103') ?? 0
    const samplesPerPixel = dataSet.uint16('x00280002') ?? 1
    const photometric = (dataSet.string('x00280004') || '').toUpperCase()
    const pixelElement = dataSet.elements.x7fe00010

    if (!rows || !cols || !pixelElement) {
      return {
        ok: false,
        detected: true,
        message:
          'DICOM detectado — conversão de preview em breve (metadados incompletos).',
      }
    }

    if (pixelElement.fragments) {
      return {
        ok: false,
        detected: true,
        message:
          'DICOM detectado — conversão de preview em breve (pixel data encapsulado).',
      }
    }

    if (samplesPerPixel !== 1 || photometric.includes('RGB')) {
      return {
        ok: false,
        detected: true,
        message:
          'DICOM detectado — conversão de preview em breve (formato de cor não suportado).',
      }
    }

    const frameLength = rows * cols
    const bytesPerSample = bitsAllocated <= 8 ? 1 : 2
    const available = Math.floor(pixelElement.length / bytesPerSample)
    if (available < frameLength) {
      return {
        ok: false,
        detected: true,
        message:
          'DICOM detectado — conversão de preview em breve (frame incompleto).',
      }
    }

    const offset = pixelElement.dataOffset
    let pixels: Int16Array | Uint16Array | Uint8Array
    if (bitsAllocated <= 8) {
      pixels = new Uint8Array(byteArray.buffer, offset, frameLength)
    } else if (pixelRepresentation === 1) {
      pixels = new Int16Array(byteArray.buffer, offset, frameLength)
    } else {
      pixels = new Uint16Array(byteArray.buffer, offset, frameLength)
    }

    const window = readWindowParams(dataSet)
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    if (!window) {
      for (let i = 0; i < frameLength; i++) {
        const v = pixels[i]
        if (v < min) min = v
        if (v > max) max = v
      }
      if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
        min = 0
        max = 255
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = cols
    canvas.height = rows
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return {
        ok: false,
        detected: true,
        message: 'DICOM detectado — não foi possível criar preview no navegador.',
      }
    }

    const imageData = ctx.createImageData(cols, rows)
    const invert = photometric.includes('MONOCHROME1')

    for (let i = 0; i < frameLength; i++) {
      const raw = pixels[i]
      let gray: number
      if (window) {
        gray = applyWindowLevel(raw, window.center, window.width)
      } else {
        gray = Math.round(((raw - min) / (max - min)) * 255)
      }
      if (invert) gray = 255 - gray
      const idx = i * 4
      imageData.data[idx] = gray
      imageData.data[idx + 1] = gray
      imageData.data[idx + 2] = gray
      imageData.data[idx + 3] = 255
    }

    ctx.putImageData(imageData, 0, 0)
    const previewDataUrl = canvas.toDataURL('image/png')

    return {
      ok: true,
      previewDataUrl,
      width: cols,
      height: rows,
      message: 'DICOM convertido para preview (primeiro frame).',
    }
  } catch {
    return {
      ok: false,
      detected: true,
      message:
        'DICOM detectado — conversão de preview em breve (falha ao interpretar o arquivo).',
    }
  }
}
