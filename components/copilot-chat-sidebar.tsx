"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { cn } from "@/lib/utils";

interface CopilotChatSidebarProps {
    className?: string;
}

export function CopilotChatSidebar({ className }: CopilotChatSidebarProps) {
    return (
        <div className={cn("flex flex-col h-full bg-background border-l border-border", className)}>
            <CopilotChat
                className="h-full w-full [&_.copilotKitChat]:h-full [&_.copilotKitChat]:border-none [&_.copilotKitChat]:rounded-none [&_.copilotKitChat]:shadow-none"
                labels={{
                    title: "Odonto Suite AI",
                    initial: "Olá! Como posso ajudar você hoje?",
                }}
            />
        </div>
    );
}
