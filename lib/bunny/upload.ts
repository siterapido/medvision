/**
 * Bunny CDN Upload Utilities
 *
 * Specialized functions for uploading chat images and other user-generated content
 * to Bunny CDN storage. Integrates with the existing storage.ts module.
 */

import { uploadToBunnyStorage, buildBunnyPublicUrl } from "./storage"

export type UploadImageResult = {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export type UploadOptions = {
  maxSizeMB?: number
  allowedTypes?: string[]
}

const DEFAULT_UPLOAD_OPTIONS: UploadOptions = {
  maxSizeMB: 10,
  allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
}

/**
 * Validate image file before upload
 */
function validateImageFile(
  file: File,
  options: UploadOptions = DEFAULT_UPLOAD_OPTIONS
): { valid: boolean; error?: string } {
  const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...options }

  // Check file type
  if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Aceitos: ${opts.allowedTypes.join(", ")}`,
    }
  }

  // Check file size
  const maxSizeBytes = (opts.maxSizeMB || 10) * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${opts.maxSizeMB}MB`,
    }
  }

  return { valid: true }
}

/**
 * Generate a unique filename with timestamp and random string
 */
function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalFilename.split(".").pop() || "jpg"
  return `chat-images/${timestamp}-${random}.${extension}`
}

/**
 * Upload a chat image to Bunny CDN
 *
 * @param file - The image file to upload
 * @param userId - User ID for organizing uploads
 * @param options - Upload validation options
 * @returns Upload result with URL or error
 */
export async function uploadChatImage(
  file: File,
  userId: string,
  options?: UploadOptions
): Promise<UploadImageResult> {
  try {
    // Validate file
    const validation = validateImageFile(file, options)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      }
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.name)

    // Upload to Bunny CDN
    const result = await uploadToBunnyStorage(
      filename,
      file,
      {
        contentType: file.type,
        cacheControl: "public, max-age=31536000", // 1 year cache
      }
    )

    return {
      success: true,
      url: result.publicUrl,
      path: result.path,
    }
  } catch (error) {
    console.error("[BunnyUpload] Error uploading image:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao fazer upload",
    }
  }
}

/**
 * Upload multiple chat images
 *
 * @param files - Array of image files to upload
 * @param userId - User ID for organizing uploads
 * @param options - Upload validation options
 * @returns Array of upload results
 */
export async function uploadMultipleChatImages(
  files: File[],
  userId: string,
  options?: UploadOptions
): Promise<UploadImageResult[]> {
  const uploads = files.map((file) => uploadChatImage(file, userId, options))
  return Promise.all(uploads)
}

/**
 * Delete a chat image from Bunny CDN
 *
 * @param path - The storage path of the image to delete
 */
export async function deleteChatImage(path: string): Promise<void> {
  try {
    const { deleteFromBunnyStorage } = await import("./storage")
    await deleteFromBunnyStorage(path)
  } catch (error) {
    console.error("[BunnyUpload] Error deleting image:", error)
    throw error
  }
}

/**
 * Convert a File to base64 string (for previews)
 *
 * @param file - The file to convert
 * @returns Promise resolving to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
