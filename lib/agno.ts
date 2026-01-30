/**
 * Agno Configuration and Types
 */

export interface AgentDetails {
    id: string;
    name: string;
    description: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'agent' | 'system' | 'assistant';
    content: string;
    created_at: number;
    isStreaming?: boolean;
    streamingError?: boolean;
    images?: string[];
    agent_id?: string;
    tool_calls?: {
        tool_call_id: string;
        tool_name: string;
        tool_args: any;
        result?: string;
    }[];
}

export interface SessionEntry {
    session_id: string;
    session_name: string;
    created_at: number;
}

export const AGNO_CONFIG = {
    baseUrl: process.env.NEXT_PUBLIC_AGNO_SERVICE_URL || "http://localhost:8000/api/v1"
};

/**
 * Fetch list of agents from the Agno backend
 */
export async function fetchAgents(): Promise<AgentDetails[]> {
    const baseUrl = AGNO_CONFIG.baseUrl.replace(/\/$/, "");
    const agentsUrl = baseUrl.endsWith("/api/v1")
        ? `${baseUrl}/agentes`
        : `${baseUrl}/api/v1/agentes`;

    try {
        const response = await fetch(agentsUrl);
        if (!response.ok) throw new Error("Failed to fetch agents");
        const data = await response.json();
        return (data.agentes || []).map((agent: any) => ({
            id: agent.id,
            name: agent.nome,
            description: agent.descricao,
        }));
    } catch (error) {
        console.error("Error fetching agents:", error);
        return [];
    }
}

/**
 * Check if the Agno backend is available
 */
export async function checkHealth(): Promise<{ ok: boolean }> {
    const baseUrl = AGNO_CONFIG.baseUrl.replace(/\/$/, "");
    const healthUrl = baseUrl.endsWith("/api/v1")
        ? baseUrl.replace("/api/v1", "/health")
        : `${baseUrl}/health`;

    try {
        const response = await fetch(healthUrl);
        return { ok: response.ok };
    } catch (error) {
        return { ok: false };
    }
}
