/**
 * Command System for Odonto GPT
 *
 * Provides slash commands for user interactions:
 * - /setup - Configure profile
 * - /help - Show help
 * - /style - Change response mode
 * - /memory - Manage memories
 * - /profile - Show profile
 * - /clear - Clear session
 */

// Types
export * from './types'

// Parser
export { isCommand, parseCommand, isValidCommand, getCommandSuggestions, VALID_COMMANDS } from './parser'

// Handlers
export { COMMANDS, executeCommand } from './handlers'
