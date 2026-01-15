"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { ReactNode, useMemo } from "react";
import { HttpAgent } from "@ag-ui/client";

import { CopilotNavigation } from "@/components/copilot-navigation";

// Create a simple agent for CopilotKit registration
function createDefaultAgent() {
    return new HttpAgent({
        agentId: "default",
        url: "/api/copilotkit/chat",
    });
}

export function CopilotProvider({ children }: { children: ReactNode }) {
    // Memoize the agents object to avoid re-creating on every render
    const agents = useMemo(() => ({
        default: createDefaultAgent(),
    }), []);

    return (
        <CopilotKit
            runtimeUrl="/api/copilotkit/chat"
            agents__unsafe_dev_only={agents}
        >
            <CopilotNavigation />
            {children}
        </CopilotKit>
    );
}
