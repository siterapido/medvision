/**
 * Vercel Blob Storage Utilities
 *
 * This module provides utilities for file storage using Vercel Blob.
 * Used for chat attachments and uploads (images, documents).
 *
 * Note: Bunny CDN is still used for course videos and media.
 */

import { put, del, list, head, type PutBlobResult } from '@vercel/blob'

/**
 * Upload a file to Vercel Blob storage
 * @param file - File or Blob to upload
 * @param pathname - The path/name for the file in storage
 * @param options - Additional options
 * @returns The blob result with URL and metadata
 */
export async function uploadFile(
  file: File | Blob,
  pathname: string,
  options?: {
    access?: 'public' | 'private'
    addRandomSuffix?: boolean
    contentType?: string
  }
): Promise<PutBlobResult> {
  const blob = await put(pathname, file, {
    access: options?.access ?? 'public',
    addRandomSuffix: options?.addRandomSuffix ?? true,
    contentType: options?.contentType,
  })
  return blob
}

/**
 * Upload a file from a base64 string
 * @param base64 - Base64 encoded file content (with or without data URL prefix)
 * @param pathname - The path/name for the file in storage
 * @param contentType - MIME type of the file
 * @returns The blob result with URL and metadata
 */
export async function uploadBase64(
  base64: string,
  pathname: string,
  contentType: string
): Promise<PutBlobResult> {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:[\w/+-]+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')

  const blob = await put(pathname, buffer, {
    access: 'public',
    addRandomSuffix: true,
    contentType,
  })
  return blob
}

/**
 * Delete a file from Vercel Blob storage
 * @param url - The URL of the blob to delete
 */
export async function deleteFile(url: string): Promise<void> {
  await del(url)
}

/**
 * Delete multiple files from Vercel Blob storage
 * @param urls - Array of URLs to delete
 */
export async function deleteFiles(urls: string[]): Promise<void> {
  await del(urls)
}

/**
 * List files in Vercel Blob storage
 * @param options - List options (prefix, limit, cursor)
 * @returns List of blobs and cursor for pagination
 */
export async function listFiles(options?: {
  prefix?: string
  limit?: number
  cursor?: string
}) {
  const result = await list({
    prefix: options?.prefix,
    limit: options?.limit ?? 100,
    cursor: options?.cursor,
  })
  return result
}

/**
 * Get file metadata from Vercel Blob storage
 * @param url - The URL of the blob
 * @returns The blob metadata or null if not found
 */
export async function getFileMetadata(url: string) {
  try {
    const metadata = await head(url)
    return metadata
  } catch {
    return null
  }
}

/**
 * Generate a unique pathname for chat attachments
 * @param userId - The user ID
 * @param sessionId - The chat session ID
 * @param filename - Original filename
 * @returns A structured pathname
 */
export function generateChatAttachmentPath(
  userId: string,
  sessionId: string,
  filename: string
): string {
  const timestamp = Date.now()
  const extension = filename.split('.').pop() || 'bin'
  const baseName = filename.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_')
  return `chat/${userId}/${sessionId}/${timestamp}-${baseName}.${extension}`
}

/**
 * Check if a URL is a Vercel Blob URL
 * @param url - The URL to check
 * @returns true if it's a Vercel Blob URL
 */
export function isVercelBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname.includes('vercel-storage.com') ||
           parsed.hostname.includes('blob.vercel-storage.com')
  } catch {
    return false
  }
}
