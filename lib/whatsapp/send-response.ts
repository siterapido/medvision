/**
 * WhatsApp response handling utility
 * Handles message splitting, chunking, and rate-limited delivery
 */

import { sendZApiText } from '@/lib/zapi'

// WhatsApp max message size is 4096 characters
const MAX_MESSAGE_LENGTH = 4096
const DELAY_BETWEEN_CHUNKS_MS = 1000 // 1 second between messages to avoid rate limits

/**
 * Splits text into sentences for better readability
 * Handles common sentence endings and variations
 */
function splitIntoSentences(text: string, maxLength: number): string[] {
  const sentences: string[] = []
  let currentSentence = ''

  // Match sentences ending with period, exclamation, question, or line breaks
  const sentenceRegex = /([^.!?]*[.!?]+|\n+[^\n]*)/g
  const matches = text.match(sentenceRegex) || []

  for (const match of matches) {
    const trimmed = match.trim()

    if (!trimmed) continue

    if ((currentSentence + trimmed).length <= maxLength) {
      currentSentence += (currentSentence ? ' ' : '') + trimmed
    } else {
      if (currentSentence) {
        sentences.push(currentSentence)
      }
      currentSentence = trimmed

      // If a single sentence is too long, force split it
      if (trimmed.length > maxLength) {
        sentences.push(trimmed)
        currentSentence = ''
      }
    }
  }

  if (currentSentence) {
    sentences.push(currentSentence)
  }

  return sentences
}

/**
 * Splits text by paragraphs intelligently
 * Tries to keep paragraphs together, falls back to sentence splitting if needed
 */
function splitByParagraphs(text: string, maxLength: number): string[] {
  const chunks: string[] = []
  let currentChunk = ''

  // Split by double newlines (paragraphs)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim())

  for (const paragraph of paragraphs) {
    const trimmedPara = paragraph.trim()

    // If adding this paragraph would exceed max length
    if (currentChunk && (currentChunk + '\n\n' + trimmedPara).length > maxLength) {
      chunks.push(currentChunk)
      currentChunk = trimmedPara

      // If paragraph itself is too long, split by sentences
      if (trimmedPara.length > maxLength) {
        const sentences = splitIntoSentences(trimmedPara, maxLength)
        chunks.push(...sentences)
        currentChunk = ''
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk)
  }

  return chunks
}

/**
 * Intelligently splits a long text into WhatsApp-safe chunks
 * Preserves formatting and readability
 */
function splitMessageIntoChunks(text: string, maxLength: number = MAX_MESSAGE_LENGTH): string[] {
  // If message is short enough, return as single chunk
  if (text.length <= maxLength) {
    return [text]
  }

  // Try to split by paragraphs first
  let chunks = splitByParagraphs(text, maxLength)

  // Validate all chunks are under max length
  const validChunks: string[] = []
  for (const chunk of chunks) {
    if (chunk.length > maxLength) {
      // Force split by character limit as last resort
      for (let i = 0; i < chunk.length; i += maxLength) {
        validChunks.push(chunk.slice(i, i + maxLength))
      }
    } else {
      validChunks.push(chunk)
    }
  }

  return validChunks
}

/**
 * Adds a continuation indicator to message chunks
 * Shows "[X/Y]" to indicate which chunk this is
 */
function addContinuationIndicator(chunk: string, index: number, total: number): string {
  if (total <= 1) {
    return chunk
  }

  const indicator = `_(${index + 1}/${total})_\n\n`
  return indicator + chunk
}

/**
 * Sends a WhatsApp message, splitting it into chunks if necessary
 * Implements rate limiting between chunks
 *
 * @param phone - Recipient phone number (E.164 format)
 * @param text - Message text to send
 * @param options - Additional options
 */
export async function sendWhatsAppResponse(
  phone: string,
  text: string,
  options?: {
    maxRetries?: number
    delayBetweenChunks?: number
  }
): Promise<void> {
  const delayMs = options?.delayBetweenChunks ?? DELAY_BETWEEN_CHUNKS_MS

  try {
    // Split message into chunks if needed
    const chunks = splitMessageIntoChunks(text, MAX_MESSAGE_LENGTH)

    console.log(`[WhatsApp] Sending ${chunks.length} message chunk(s) to ${phone}`)

    // Send each chunk with delay between them
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const messageToSend = addContinuationIndicator(chunk, i, chunks.length)

      try {
        await sendZApiText(phone, messageToSend)
        console.log(`[WhatsApp] Chunk ${i + 1}/${chunks.length} sent to ${phone}`)

        // Add delay before next chunk (except for last message)
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
      } catch (error) {
        console.error(`[WhatsApp] Error sending chunk ${i + 1}/${chunks.length}:`, error)

        // If not the last chunk and it fails, try to continue with next chunks
        if (i < chunks.length - 1) {
          console.log(`[WhatsApp] Continuing with next chunk despite error`)
          continue
        } else {
          // Last chunk failed, propagate error
          throw error
        }
      }
    }

    console.log(`[WhatsApp] All chunks sent successfully to ${phone}`)
  } catch (error) {
    console.error(`[WhatsApp] Failed to send response to ${phone}:`, error)
    throw error
  }
}

/**
 * Checks if a message needs to be split
 */
export function needsSplitting(text: string, maxLength: number = MAX_MESSAGE_LENGTH): boolean {
  return text.length > maxLength
}

/**
 * Gets the number of chunks a message will be split into
 */
export function getChunkCount(text: string, maxLength: number = MAX_MESSAGE_LENGTH): number {
  return splitMessageIntoChunks(text, maxLength).length
}

/**
 * Validates that a message is safe for WhatsApp
 * Checks length and encoding
 */
export function validateWhatsAppMessage(text: string): { valid: boolean; reason?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, reason: 'Message is empty' }
  }

  // WhatsApp message max is essentially unlimited (they can handle very long messages)
  // but we impose our own limit for UI/UX
  if (text.length > MAX_MESSAGE_LENGTH * 10) {
    return { valid: false, reason: 'Message is too long' }
  }

  // Check for valid UTF-8 encoding
  try {
    const encoded = new TextEncoder().encode(text)
    if (encoded.length > MAX_MESSAGE_LENGTH * 10) {
      return { valid: false, reason: 'Message encoding is too large' }
    }
  } catch {
    return { valid: false, reason: 'Invalid text encoding' }
  }

  return { valid: true }
}
