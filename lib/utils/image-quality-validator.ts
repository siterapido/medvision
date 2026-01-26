export interface ImageQualityWarning {
    type: 'low_resolution' | 'too_dark' | 'too_bright' | 'low_contrast' | 'aspect_ratio'
    message: string
    severity: 'low' | 'medium' | 'high'
}

export interface ImageMetrics {
    width: number
    height: number
    brightness: number      // 0-255 average
    contrast: number        // standard deviation
    aspectRatio: number
}

export interface ImageQualityResult {
    isValid: boolean
    canProceed: boolean     // true if only warnings, false if critical errors
    warnings: ImageQualityWarning[]
    metrics: ImageMetrics
}

const MIN_RESOLUTION = 200
const RECOMMENDED_RESOLUTION = 400
const MIN_BRIGHTNESS = 30
const MAX_BRIGHTNESS = 230
const MIN_CONTRAST = 25

/**
 * Validates image quality for dental analysis
 * Returns warnings/errors about resolution, brightness, contrast
 */
export async function validateImageQuality(imageBase64: string): Promise<ImageQualityResult> {
    const warnings: ImageQualityWarning[] = []

    // Load image
    const img = new Image()
    img.src = imageBase64

    await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
    })

    const { width, height } = img

    // Create canvas to analyze pixels
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        throw new Error('Could not get canvas context')
    }

    // Use smaller size for analysis (performance)
    const analysisSize = 200
    const scale = Math.min(analysisSize / width, analysisSize / height)
    canvas.width = Math.floor(width * scale)
    canvas.height = Math.floor(height * scale)

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data

    // Calculate brightness and contrast
    let totalBrightness = 0
    const brightnessValues: number[] = []

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]
        // Luminance formula
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b
        totalBrightness += brightness
        brightnessValues.push(brightness)
    }

    const avgBrightness = totalBrightness / brightnessValues.length

    // Calculate contrast (standard deviation)
    const variance = brightnessValues.reduce((sum, val) => sum + Math.pow(val - avgBrightness, 2), 0) / brightnessValues.length
    const contrast = Math.sqrt(variance)

    const aspectRatio = width / height

    const metrics: ImageMetrics = {
        width,
        height,
        brightness: Math.round(avgBrightness),
        contrast: Math.round(contrast),
        aspectRatio: Math.round(aspectRatio * 100) / 100
    }

    // Check resolution
    const minDimension = Math.min(width, height)
    if (minDimension < MIN_RESOLUTION) {
        warnings.push({
            type: 'low_resolution',
            message: `Resolução muito baixa (${width}x${height}). Mínimo recomendado: ${MIN_RESOLUTION}px`,
            severity: 'high'
        })
    } else if (minDimension < RECOMMENDED_RESOLUTION) {
        warnings.push({
            type: 'low_resolution',
            message: `Resolução abaixo do ideal (${width}x${height}). Recomendado: ${RECOMMENDED_RESOLUTION}px ou mais`,
            severity: 'medium'
        })
    }

    // Check brightness
    if (avgBrightness < MIN_BRIGHTNESS) {
        warnings.push({
            type: 'too_dark',
            message: 'Imagem muito escura. Pode dificultar a detecção de estruturas.',
            severity: 'medium'
        })
    } else if (avgBrightness > MAX_BRIGHTNESS) {
        warnings.push({
            type: 'too_bright',
            message: 'Imagem muito clara/superexposta. Detalhes podem estar perdidos.',
            severity: 'medium'
        })
    }

    // Check contrast
    if (contrast < MIN_CONTRAST) {
        warnings.push({
            type: 'low_contrast',
            message: 'Baixo contraste. A imagem pode parecer "lavada" ou sem definição.',
            severity: 'low'
        })
    }

    // Check aspect ratio (very extreme ratios might indicate cropping issues)
    if (aspectRatio > 4 || aspectRatio < 0.25) {
        warnings.push({
            type: 'aspect_ratio',
            message: 'Proporção incomum. Verifique se a imagem está correta.',
            severity: 'low'
        })
    }

    // Determine if can proceed
    const hasHighSeverity = warnings.some(w => w.severity === 'high')
    const isValid = warnings.length === 0
    const canProceed = !hasHighSeverity

    return {
        isValid,
        canProceed,
        warnings,
        metrics
    }
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity: 'low' | 'medium' | 'high'): string {
    switch (severity) {
        case 'high': return 'text-red-500'
        case 'medium': return 'text-amber-500'
        case 'low': return 'text-blue-500'
    }
}

/**
 * Get severity background for UI
 */
export function getSeverityBg(severity: 'low' | 'medium' | 'high'): string {
    switch (severity) {
        case 'high': return 'bg-red-500/10 border-red-500/20'
        case 'medium': return 'bg-amber-500/10 border-amber-500/20'
        case 'low': return 'bg-blue-500/10 border-blue-500/20'
    }
}
