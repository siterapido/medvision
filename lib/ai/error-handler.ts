/**
 * AI Error Handler - Typed error handling for AI SDK errors
 *
 * Provides structured error handling for common AI SDK errors.
 */

export interface HandledError {
  message: string
  type: string
  statusCode?: number
  retryAfter?: number
  details?: any
}

/**
 * Handle AI SDK errors with property-based detection
 *
 * Converts AI SDK errors into user-friendly messages and structured data.
 * Uses duck typing instead of instanceof for better compatibility.
 */
export function handleAIError(error: unknown): HandledError {
  // Check if it's an error object
  if (!error || typeof error !== 'object') {
    return {
      message: 'Erro inesperado. Tente novamente.',
      type: 'unknown_error',
      details: error,
    }
  }

  const err = error as any

  // API Call Errors (has statusCode and url properties)
  if ('statusCode' in err && typeof err.statusCode === 'number') {
    console.error('[AI Error] API Call Error:', {
      statusCode: err.statusCode,
      message: err.message,
      url: err.url,
      responseHeaders: err.responseHeaders,
    })

    if (err.statusCode === 429) {
      return {
        message: 'Muitas requisições. Aguarde um momento antes de tentar novamente.',
        type: 'rate_limit',
        statusCode: 429,
        retryAfter: err.responseHeaders?.['retry-after']
          ? parseInt(err.responseHeaders['retry-after'])
          : undefined,
      }
    }

    if (err.statusCode === 401 || err.statusCode === 403) {
      return {
        message: 'Erro de autenticação. Verifique a configuração da API key.',
        type: 'auth_error',
        statusCode: err.statusCode,
      }
    }

    if (err.statusCode === 400) {
      return {
        message: 'Requisição inválida. Verifique os parâmetros.',
        type: 'bad_request',
        statusCode: 400,
        details: err.message,
      }
    }

    if (err.statusCode >= 500) {
      return {
        message: 'Erro no servidor do provedor de IA. Tente novamente em alguns instantes.',
        type: 'server_error',
        statusCode: err.statusCode,
      }
    }

    return {
      message: `Erro do provedor: ${err.message}`,
      type: 'api_error',
      statusCode: err.statusCode,
    }
  }

  // Invalid Tool Arguments Error (has toolName and toolArgs)
  if ('toolName' in err && 'toolArgs' in err) {
    console.error('[AI Error] Invalid Tool Arguments:', {
      tool: err.toolName,
      args: err.toolArgs,
      cause: err.cause,
    })

    return {
      message: `Erro ao executar ${err.toolName}. Argumentos inválidos fornecidos pelo modelo.`,
      type: 'tool_args_error',
      details: {
        tool: err.toolName,
        cause: err.cause,
      },
    }
  }

  // Validation Error (has value property)
  if ('value' in err && err.message?.includes('validation')) {
    console.error('[AI Error] Validation Error:', {
      value: err.value,
    })

    return {
      message: 'Erro ao validar resposta do modelo. Estrutura inválida gerada.',
      type: 'validation_error',
      details: {
        value: err.value,
      },
    }
  }

  // Generic Error
  console.error('[AI Error] Unknown Error:', error)

  if (error instanceof Error) {
    return {
      message: error.message,
      type: 'unknown_error',
      details: error.stack,
    }
  }

  return {
    message: 'Erro inesperado. Tente novamente.',
    type: 'unknown_error',
    details: error,
  }
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: HandledError): boolean {
  return ['rate_limit', 'server_error'].includes(error.type)
}

/**
 * Get retry delay based on error type
 */
export function getRetryDelay(error: HandledError): number {
  if (error.type === 'rate_limit' && error.retryAfter) {
    return error.retryAfter * 1000
  }

  if (error.type === 'server_error') {
    return 5000 // 5 seconds
  }

  return 0
}
