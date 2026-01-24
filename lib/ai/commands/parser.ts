/**
 * Command Parser for Odonto GPT
 *
 * Parses slash commands from user messages
 */

import { ParsedCommand } from './types'

/**
 * Check if a message is a command
 */
export function isCommand(message: string): boolean {
  return message.trim().startsWith('/')
}

/**
 * Parse a command from a message
 * Returns null if the message is not a valid command
 */
export function parseCommand(message: string): ParsedCommand | null {
  const trimmed = message.trim()

  if (!trimmed.startsWith('/')) {
    return null
  }

  // Remove the leading slash
  const withoutSlash = trimmed.slice(1)

  // Split by whitespace, keeping the first part as command
  const parts = withoutSlash.split(/\s+/)
  const command = parts[0]?.toLowerCase()

  if (!command) {
    return null
  }

  const args = parts.slice(1)
  const rawArgs = withoutSlash.slice(command.length).trim()

  return {
    command,
    args,
    rawArgs,
  }
}

/**
 * List of valid commands
 */
export const VALID_COMMANDS = [
  'setup',
  'help',
  'style',
  'memory',
  'clear',
  'profile',
] as const

export type ValidCommand = (typeof VALID_COMMANDS)[number]

/**
 * Check if a command is valid
 */
export function isValidCommand(command: string): command is ValidCommand {
  return VALID_COMMANDS.includes(command as ValidCommand)
}

/**
 * Get command suggestions for invalid commands
 */
export function getCommandSuggestions(input: string): string[] {
  const inputLower = input.toLowerCase()

  return VALID_COMMANDS.filter((cmd) => {
    // Check if starts with same letters
    if (cmd.startsWith(inputLower)) return true
    // Check Levenshtein distance for typos
    if (levenshteinDistance(cmd, inputLower) <= 2) return true
    return false
  })
}

/**
 * Simple Levenshtein distance for typo detection
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}
