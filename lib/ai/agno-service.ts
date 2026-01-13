
import { AI_CONFIG } from "./config"

const AGNO_SERVICE_URL = process.env.AGNO_SERVICE_URL || "http://localhost:8000/api/v1"

export async function streamAgnoChat(
    message: string,
    userId: string,
    sessionId?: string,
    agentType: string = "auto",
    images: string[] = []
): Promise<ReadableStream> {
    // Determine endpoint based on agent type or let the unifying endpoint handle it
    // We used /chat which routes to specific agents
    const url = `${AGNO_SERVICE_URL}/chat`

    const body = {
        message,
        userId,
        sessionId,
        agentType,
        imageUrl: images.length > 0 ? images[0] : undefined, // Simple support for 1 image for now
    }

    console.log("[AgnoService] Iniciando requisição:", {
        url,
        hasMessage: !!message,
        messageLength: message?.length,
        userId,
        sessionId,
        agentType,
        hasImage: !!body.imageUrl
    })

    let response;
    try {
        console.log("[AgnoService] Fazendo fetch para:", url)
        response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })
        console.log("[AgnoService] Response recebido:", {
            status: response.status,
            ok: response.ok,
            hasBody: !!response.body
        })
    } catch (e) {
        // Catch network errors (e.g., service not running)
        console.error(`[AgnoService] Failed to connect to ${url}:`, e)
        throw new Error(`Failed to connect to AGNO service at ${AGNO_SERVICE_URL}. Is the service running?`)
    }

    if (!response.ok) {
        const errorText = await response.text()
        console.error(`[AgnoService] Error: ${response.status} ${errorText}`)
        throw new Error(`AGNO Service Error: ${errorText}`)
    }

    if (!response.body) {
        console.error("[AgnoService] No response body received")
        throw new Error("No response body received from AGNO service")
    }

    console.log("[AgnoService] Retornando stream com sucesso")
    return response.body
}
