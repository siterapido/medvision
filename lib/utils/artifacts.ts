/**
 * Utility functions for artifacts
 */

import type { ArtifactType } from '@/lib/types/artifacts'

/**
 * Detect artifact type from content or metadata
 */
export function detectArtifactType(artifact: any): ArtifactType {
    // Check explicit type
    if (artifact.type) {
        return artifact.type as ArtifactType
    }

    // Detect from content
    const content = artifact.content || artifact

    // Check if it's a chat/conversation
    if (Array.isArray(content) && content.some((item: any) => item.role || item.message)) {
        return 'chat'
    }

    // Check if it's code
    if (
        typeof content === 'string' &&
        (content.includes('function') ||
            content.includes('const') ||
            content.includes('import') ||
            content.includes('export') ||
            content.match(/^```/m))
    ) {
        return 'code'
    }

    // Check if it's an image
    if (
        artifact.mimeType?.startsWith('image/') ||
        artifact.imageUrl ||
        (typeof content === 'string' && content.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i))
    ) {
        return 'image'
    }

    // Default to document
    return 'document'
}

/**
 * Download artifact as file
 */
export function downloadArtifact(artifact: any, filename?: string) {
    const { title, type, content } = artifact
    const name = filename || `${title || 'artifact'}.${getFileExtension(type)}`

    let blob: Blob
    let mimeType: string

    switch (type) {
        case 'code':
            blob = new Blob([typeof content === 'string' ? content : JSON.stringify(content, null, 2)], {
                type: 'text/plain',
            })
            mimeType = 'text/plain'
            break

        case 'document':
            blob = new Blob([typeof content === 'string' ? content : JSON.stringify(content, null, 2)], {
                type: 'text/markdown',
            })
            mimeType = 'text/markdown'
            break

        case 'chat':
            blob = new Blob([JSON.stringify(content, null, 2)], {
                type: 'application/json',
            })
            mimeType = 'application/json'
            break

        case 'image':
            // For images, content might be a URL or base64
            if (typeof content === 'string' && content.startsWith('http')) {
                window.open(content, '_blank')
                return
            }
            blob = new Blob([content], { type: 'image/png' })
            mimeType = 'image/png'
            break

        default:
            blob = new Blob([JSON.stringify(content, null, 2)], {
                type: 'application/json',
            })
            mimeType = 'application/json'
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

/**
 * Get file extension for artifact type
 */
function getFileExtension(type: ArtifactType): string {
    switch (type) {
        case 'code':
            return 'txt'
        case 'document':
            return 'md'
        case 'chat':
            return 'json'
        case 'image':
            return 'png'
        default:
            return 'txt'
    }
}

/**
 * Format artifact content for display
 */
export function formatArtifactContent(artifact: any): string {
    const { type, content } = artifact

    if (typeof content === 'string') {
        return content
    }

    if (type === 'chat' && Array.isArray(content)) {
        return content
            .map((msg: any) => `**${msg.role || 'User'}**: ${msg.content || msg.message}`)
            .join('\n\n')
    }

    return JSON.stringify(content, null, 2)
}
