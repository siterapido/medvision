/**
 * Client-side helper: upload full vision image to storage, keep a small thumbnail in JSONB.
 * Uses existing POST /api/upload (Bunny CDN).
 */

export type PersistVisionImageResult = {
  thumbnailBase64: string
  /** Public URL of the full image when upload succeeds */
  imageUrl?: string
  /** Full image data URL — only set when upload fails (fallback) */
  imageBase64?: string
}

export type VisionImageSources = {
  imageUrl?: string
  imageBase64?: string
  thumbnailBase64?: string
}

/** Prefer full remote URL, then full base64, then thumbnail. */
export function getVisionImageSrc(sources: VisionImageSources): string | undefined {
  return sources.imageUrl || sources.imageBase64 || sources.thumbnailBase64 || undefined
}

async function generateThumbnail(imageSrc: string, size = 200): Promise<string> {
  const img = new Image()
  img.src = imageSrc
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Falha ao carregar imagem para thumbnail'))
  })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  const aspectRatio = img.width / img.height
  let width = size
  let height = size
  if (aspectRatio > 1) {
    height = size / aspectRatio
  } else {
    width = size * aspectRatio
  }

  canvas.width = width
  canvas.height = height
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', 0.7)
}

function dataUrlToFile(dataUrl: string): File {
  const comma = dataUrl.indexOf(',')
  const header = comma >= 0 ? dataUrl.slice(0, comma) : ''
  const data = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  const mimeMatch = header.match(/data:([^;]+)/)
  const mime = mimeMatch?.[1] || 'image/jpeg'
  const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'

  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new File([bytes], `vision-${Date.now()}.${ext}`, { type: mime })
}

async function uploadViaApi(imageSrc: string): Promise<string> {
  const file = imageSrc.startsWith('data:')
    ? dataUrlToFile(imageSrc)
    : await (async () => {
        const res = await fetch(imageSrc)
        if (!res.ok) throw new Error(`Falha ao obter imagem (${res.status})`)
        const blob = await res.blob()
        const ext = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
        return new File([blob], `vision-${Date.now()}.${ext}`, {
          type: blob.type || 'image/jpeg',
        })
      })()

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errBody = await response.json().catch(() => null)
    throw new Error(errBody?.error || `Upload falhou (${response.status})`)
  }

  const json = (await response.json()) as { url?: string }
  if (!json.url) throw new Error('Upload sem URL')
  return json.url
}

/**
 * Upload full image; keep ~200px JPEG thumbnail for list/preview.
 * On upload failure, falls back to storing full `imageBase64`.
 */
export async function persistVisionImage(
  imageSrc: string
): Promise<PersistVisionImageResult> {
  const thumbnailBase64 = await generateThumbnail(imageSrc)

  try {
    const imageUrl = await uploadViaApi(imageSrc)
    return { imageUrl, thumbnailBase64 }
  } catch (error) {
    console.warn('[persistVisionImage] Upload failed, falling back to base64:', error)
    return { thumbnailBase64, imageBase64: imageSrc }
  }
}

/** Ensure a data URL for jsPDF (fetches remote URLs). */
export async function ensureImageDataUrl(src: string): Promise<string> {
  if (src.startsWith('data:')) return src

  const res = await fetch(src)
  if (!res.ok) throw new Error(`Falha ao baixar imagem (${res.status})`)
  const blob = await res.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Falha ao ler imagem'))
    reader.readAsDataURL(blob)
  })
}
