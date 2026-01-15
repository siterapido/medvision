
"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { useRouter } from "next/navigation";

export function CopilotNavigation() {
    const router = useRouter();

    useCopilotAction({
        name: "navigateToPage",
        description: "Navigates the user to a specific page in the application.",
        parameters: [
            {
                name: "path",
                type: "string",
                description: "The relative path to navigate to (e.g., '/dashboard/pesquisas', '/dashboard/questionarios/123').",
                required: true,
            },
        ],
        handler: ({ path }) => {
            console.log("Copilot navigating to:", path);
            router.push(path);
            return `Navigating to ${path}`;
        },
    });

    return null;
}
