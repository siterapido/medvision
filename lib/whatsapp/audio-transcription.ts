/**
 * Serviço de transcrição de áudio via OpenAI Whisper
 *
 * Transcreve mensagens de áudio do WhatsApp para texto
 */

import OpenAI from "openai"

// Lazy-initialized OpenAI client to avoid build-time errors
let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

/**
 * Transcreve um arquivo de áudio para texto
 *
 * @param audioUrl - URL do arquivo de áudio (fornecido pelo Z-API)
 * @returns Texto transcrito
 * @throws Error se a transcrição falhar
 */
export async function transcribeAudio(audioUrl: string): Promise<string> {
  console.log("[AudioTranscription] Iniciando transcrição:", audioUrl)

  try {
    // 1. Baixar o áudio do Z-API
    const response = await fetch(audioUrl, {
      headers: {
        // Alguns serviços podem requerer User-Agent
        "User-Agent": "OdontoGPT/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    const audioBlob = new Blob([audioBuffer], { type: "audio/ogg" })

    // Criar File object para a API do OpenAI
    const audioFile = new File([audioBlob], "audio.ogg", { type: "audio/ogg" })

    console.log("[AudioTranscription] Áudio baixado, tamanho:", audioBuffer.byteLength)

    // 2. Enviar para Whisper API
    const transcription = await getOpenAI().audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "pt", // Português brasileiro
    })

    const text = transcription.text
    console.log("[AudioTranscription] Transcrição concluída:", text.substring(0, 100))

    return text
  } catch (error) {
    console.error("[AudioTranscription] Erro:", error)

    // Re-throw com mensagem mais descritiva
    if (error instanceof Error) {
      throw new Error(`Erro na transcrição de áudio: ${error.message}`)
    }
    throw new Error("Erro desconhecido na transcrição de áudio")
  }
}

/**
 * Verifica se a transcrição de áudio está habilitada
 */
export function isAudioTranscriptionEnabled(): boolean {
  return !!process.env.OPENAI_API_KEY
}
