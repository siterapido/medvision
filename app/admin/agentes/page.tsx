import { AgentsConfigManager } from "@/components/admin/agents-config-manager"

export default function AgentesPage() {
    return (
        <div className="w-full h-full flex flex-col gap-6 sm:gap-8 p-4 sm:p-6 md:p-8">
            {/* Header */}
            <section className="flex flex-col gap-2 sm:gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
                        Agentes IA
                    </h1>
                    <p className="text-sm sm:text-base text-slate-400 mt-1">
                        Configure os agentes de IA, modelos do OpenRouter e parâmetros avançados
                    </p>
                </div>
            </section>

            {/* Agents Manager */}
            <AgentsConfigManager />
        </div>
    )
}
