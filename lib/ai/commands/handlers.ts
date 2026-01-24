/**
 * Command Handlers for Odonto GPT
 *
 * Implements handlers for each slash command
 */

import { CommandHandler, CommandResult, CommandRegistry, SETUP_QUESTIONS } from './types'
import { memoryService } from '../memory'
import { createClient } from '@supabase/supabase-js'

// Admin client for database operations
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * /help - Show available commands
 */
const helpHandler: CommandHandler = {
  name: 'help',
  description: 'Mostra os comandos disponiveis',
  usage: '/help',
  handler: async (): Promise<CommandResult> => {
    const helpText = `## Comandos Disponiveis

| Comando | Descricao |
|---------|-----------|
| \`/setup\` | Configura seu perfil academico |
| \`/help\` | Mostra esta mensagem de ajuda |
| \`/style [direto\\|didatico\\|hibrido]\` | Altera o modo de resposta |
| \`/memory\` | Mostra suas memorias salvas |
| \`/memory clear\` | Limpa suas memorias |
| \`/profile\` | Mostra seu perfil atual |

**Dica:** Use \`/setup\` para configurar seu perfil e receber respostas mais personalizadas!`

    return {
      success: true,
      message: helpText,
      skipAI: true,
    }
  },
}

/**
 * /setup - Interactive profile setup
 */
const setupHandler: CommandHandler = {
  name: 'setup',
  description: 'Configura seu perfil academico de forma interativa',
  usage: '/setup',
  handler: async (args, userId): Promise<CommandResult> => {
    // Get current profile
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const conversationCount = profile?.conversation_count || 0

    // Determine setup level based on conversation count
    let setupLevel = 1
    if (conversationCount >= 15) setupLevel = 3
    else if (conversationCount >= 5) setupLevel = 2

    // Get questions for current level
    const questions = SETUP_QUESTIONS.filter((q) => q.level <= setupLevel)

    // Build setup prompt for the AI
    const setupPrompt = `O aluno solicitou configurar o perfil usando /setup.

NIVEL DE SETUP: ${setupLevel} (baseado em ${conversationCount} conversas)

PERGUNTAS A FAZER (uma por vez, de forma conversacional):
${questions.map((q, i) => `${i + 1}. ${q.question}${q.options ? ` (opcoes: ${q.options.join(', ')})` : ''}`).join('\n')}

DADOS ATUAIS DO PERFIL:
- Universidade: ${profile?.university || 'Nao informado'}
- Semestre: ${profile?.semester || 'Nao informado'}
- Especialidade: ${profile?.specialty_interest || 'Nao informado'}
- Nivel: ${profile?.level || 'Nao informado'}

INSTRUCOES:
1. Cumprimente o aluno e explique que vamos configurar o perfil.
2. Faca as perguntas de forma natural e conversacional.
3. Quando o aluno responder, use a ferramenta \`updateStudentProfile\` para salvar.
4. Ao final, confirme as informacoes salvas e ofereca ajuda.`

    return {
      success: true,
      message: 'Iniciando configuracao do perfil...',
      followUp: setupPrompt,
      skipAI: false,
    }
  },
}

/**
 * /style - Change response style
 */
const styleHandler: CommandHandler = {
  name: 'style',
  description: 'Altera o modo de resposta do tutor',
  usage: '/style [direto|didatico|hibrido]',
  examples: ['/style direto', '/style didatico'],
  handler: async (args, userId): Promise<CommandResult> => {
    const validStyles = ['direto', 'didatico', 'hibrido', 'direct', 'didactic', 'hybrid']
    const styleMap: Record<string, string> = {
      direto: 'direct',
      direct: 'direct',
      didatico: 'didactic',
      didactic: 'didactic',
      hibrido: 'hybrid',
      hybrid: 'hybrid',
    }

    if (args.length === 0) {
      // Show current style
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('response_preference')
        .eq('id', userId)
        .single()

      const currentStyle = profile?.response_preference || 'hybrid'
      const styleNames: Record<string, string> = {
        direct: 'Direto',
        didactic: 'Didatico',
        hybrid: 'Hibrido',
      }

      return {
        success: true,
        message: `**Modo atual:** ${styleNames[currentStyle] || 'Hibrido'}

Para alterar, use:
- \`/style direto\` - Respostas objetivas
- \`/style didatico\` - Perguntas guiadas
- \`/style hibrido\` - Adaptativo (recomendado)`,
        skipAI: true,
      }
    }

    const requestedStyle = args[0].toLowerCase()

    if (!validStyles.includes(requestedStyle)) {
      return {
        success: false,
        message: `Estilo "${requestedStyle}" nao reconhecido. Use: direto, didatico ou hibrido`,
        skipAI: true,
      }
    }

    const normalizedStyle = styleMap[requestedStyle]

    await memoryService.updateUserProfile(userId, {
      responsePreference: normalizedStyle as 'direct' | 'didactic' | 'hybrid',
    })

    const styleDescriptions: Record<string, string> = {
      direct: 'Agora responderei de forma **direta e objetiva**.',
      didactic: 'Agora usarei **perguntas guiadas** para te ajudar a pensar.',
      hybrid: 'Agora adaptarei meu estilo ao **tipo de pergunta**.',
    }

    return {
      success: true,
      message: `Modo de resposta alterado para **${requestedStyle}**. ${styleDescriptions[normalizedStyle]}`,
      skipAI: true,
    }
  },
}

/**
 * /memory - Show or manage memories
 */
const memoryHandler: CommandHandler = {
  name: 'memory',
  description: 'Mostra ou gerencia suas memorias salvas',
  usage: '/memory [clear]',
  handler: async (args, userId): Promise<CommandResult> => {
    // Check for clear subcommand
    if (args[0]?.toLowerCase() === 'clear') {
      const cleared = await memoryService.clearUserMemories(userId, ['long_term', 'fact'])

      if (cleared) {
        return {
          success: true,
          message: 'Todas as suas memorias foram apagadas. Seu perfil foi mantido.',
          skipAI: true,
        }
      }

      return {
        success: false,
        message: 'Erro ao limpar memorias. Tente novamente.',
        skipAI: true,
      }
    }

    // Show memories
    const memories = await memoryService.getRecentMemories(userId, ['long_term', 'fact'], 10)

    if (memories.length === 0) {
      return {
        success: true,
        message: `Voce ainda nao tem memorias salvas.

Conforme conversamos, vou memorizar informacoes importantes sobre voce para personalizar suas respostas.

Use \`/memory clear\` para apagar memorias a qualquer momento.`,
        skipAI: true,
      }
    }

    const memoryList = memories
      .map((m, i) => `${i + 1}. ${m.content}${m.topic ? ` _(${m.topic})_` : ''}`)
      .join('\n')

    return {
      success: true,
      message: `## Suas Memorias (${memories.length})

${memoryList}

---
Use \`/memory clear\` para apagar todas as memorias.`,
      skipAI: true,
    }
  },
}

/**
 * /profile - Show current profile
 */
const profileHandler: CommandHandler = {
  name: 'profile',
  description: 'Mostra seu perfil atual',
  usage: '/profile',
  handler: async (_, userId): Promise<CommandResult> => {
    const context = await memoryService.getUserContext(userId)

    if (!context.profile) {
      return {
        success: true,
        message: `Voce ainda nao configurou seu perfil.

Use \`/setup\` para configurar e receber respostas personalizadas!`,
        skipAI: true,
      }
    }

    const p = context.profile
    const styleNames: Record<string, string> = {
      direct: 'Direto',
      didactic: 'Didatico',
      hybrid: 'Hibrido',
    }

    const profileText = `## Seu Perfil

| Campo | Valor |
|-------|-------|
| Universidade | ${p.university || '_Nao informado_'} |
| Semestre | ${p.semester || '_Nao informado_'} |
| Especialidade | ${p.specialty || '_Nao informado_'} |
| Nivel | ${p.level || '_Nao informado_'} |
| Modo de Resposta | ${styleNames[p.responsePreference || 'hybrid']} |
| Conversas | ${p.conversationCount || 0} |

---
Use \`/setup\` para atualizar seu perfil.`

    return {
      success: true,
      message: profileText,
      skipAI: true,
    }
  },
}

/**
 * /clear - Clear session context
 */
const clearHandler: CommandHandler = {
  name: 'clear',
  description: 'Limpa o contexto da sessao atual',
  usage: '/clear',
  handler: async (_, userId, sessionId): Promise<CommandResult> => {
    if (sessionId) {
      // Clear short-term memories for this session
      await memoryService.clearUserMemories(userId, ['short_term'])
    }

    return {
      success: true,
      message: 'Contexto da sessao limpo. Podemos comecar uma nova conversa!',
      skipAI: true,
    }
  },
}

/**
 * Command Registry
 */
export const COMMANDS: CommandRegistry = {
  help: helpHandler,
  setup: setupHandler,
  style: styleHandler,
  memory: memoryHandler,
  profile: profileHandler,
  clear: clearHandler,
}

/**
 * Execute a command
 */
export async function executeCommand(
  command: string,
  args: string[],
  userId: string,
  sessionId?: string
): Promise<CommandResult> {
  const handler = COMMANDS[command]

  if (!handler) {
    // Try to suggest similar commands
    const suggestions = Object.keys(COMMANDS).filter((cmd) =>
      cmd.startsWith(command.charAt(0))
    )

    return {
      success: false,
      message: `Comando "/${command}" nao encontrado.${
        suggestions.length > 0
          ? ` Voce quis dizer: ${suggestions.map((s) => `/${s}`).join(', ')}?`
          : ''
      }

Use \`/help\` para ver os comandos disponiveis.`,
      skipAI: true,
    }
  }

  try {
    return await handler.handler(args, userId, sessionId)
  } catch (error) {
    console.error(`[Commands] Error executing /${command}:`, error)
    return {
      success: false,
      message: `Erro ao executar comando /${command}. Tente novamente.`,
      skipAI: true,
    }
  }
}
