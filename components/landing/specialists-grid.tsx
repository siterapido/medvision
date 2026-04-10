'use client'

import { Card, CardContent } from "@/components/ui/card"
import { HoverCard, FadeIn } from "@/components/ui/animations"
import { Brain, BookOpen, Shield, Zap, PenTool, Eye } from "lucide-react"

const specialists = [
    {
        icon: Brain,
        title: "MedVision",
        desc: "Base de conhecimento com livros e artigos científicos. Seu consultor 24/7.",
        color: "text-purple-400",
        dotColor: "bg-purple-400",
        bg: "bg-purple-500/10",
        gradient: "from-purple-500/20 to-purple-600/5",
        isActive: true,
        badge: null
    },
    {
        icon: Eye,
        title: "Odonto Vision",
        desc: "Analisa radiografias e imagens clínicas para identificar patologias automaticamente.",
        color: "text-cyan-400",
        dotColor: "bg-cyan-400",
        bg: "bg-cyan-500/10",
        gradient: "from-cyan-500/20 to-cyan-600/5",
        isActive: true,
        badge: null
    },
    {
        icon: BookOpen,
        title: "Pesquisador",
        desc: "Busca na literatura científica (PubMed, Scielo) as respostas mais atuais e embasadas.",
        color: "text-blue-400",
        dotColor: "bg-blue-400",
        bg: "bg-blue-500/10",
        gradient: "from-blue-500/20 to-blue-600/5",
        isActive: false,
        badge: "Em Breve"
    },
    {
        icon: Shield,
        title: "Diagnóstico",
        desc: "Cruza sinais e sintomas para gerar hipóteses diagnósticas precisas e diferenciais.",
        color: "text-pink-400",
        dotColor: "bg-pink-400",
        bg: "bg-pink-500/10",
        gradient: "from-pink-500/20 to-pink-600/5",
        isActive: false,
        badge: "Em Breve"
    },
    {
        icon: Zap,
        title: "Emergência",
        desc: "Protocolos rápidos e seguros para situações de urgência na clínica odontológica.",
        color: "text-amber-400",
        dotColor: "bg-amber-400",
        bg: "bg-amber-500/10",
        gradient: "from-amber-500/20 to-amber-600/5",
        isActive: false,
        badge: "Em Breve"
    },
    {
        icon: PenTool,
        title: "Redator Acadêmico",
        desc: "Auxilia na escrita de artigos, TCCs e trabalhos com linguagem técnica adequada.",
        color: "text-emerald-400",
        dotColor: "bg-emerald-400",
        bg: "bg-emerald-500/10",
        gradient: "from-emerald-500/20 to-emerald-600/5",
        isActive: false,
        badge: "Em Breve"
    }
]

export function SpecialistsGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialists.map((agent, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                    <HoverCard className="h-full">
                        <Card className={`shadow-lg shadow-slate-900/20 h-full relative overflow-hidden group bg-[#16243F] border border-[rgba(8,145,178,0.15)] transition-colors ${agent.isActive ? 'hover:border-[rgba(8,145,178,0.3)]' : 'opacity-60 grayscale-[0.5]'}`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${agent.gradient} opacity-0 ${agent.isActive ? 'group-hover:opacity-100' : ''} transition-opacity duration-500`} />

                            {agent.badge && (
                                <div className="absolute top-3 right-3 z-20">
                                    <span className="px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                        {agent.badge}
                                    </span>
                                </div>
                            )}

                            <CardContent className="p-6 relative z-10 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`h-12 w-12 rounded-xl ${agent.bg} flex items-center justify-center transition-transform ${agent.isActive ? 'group-hover:scale-110' : ''} duration-300 ring-1 ring-white/5`}>
                                        <agent.icon className={`h-6 w-6 ${agent.color}`} />
                                    </div>
                                    <div className={`h-2 w-2 rounded-full ${agent.dotColor} ${agent.isActive ? 'animate-pulse' : ''}`} />
                                </div>

                                <h3 className={`text-xl font-bold text-white mb-3 ${agent.isActive ? 'group-hover:text-[#22d3ee]' : ''} transition-colors`}>
                                    {agent.title}
                                </h3>

                                <p className="text-slate-400 text-sm leading-relaxed flex-grow">
                                    {agent.desc}
                                </p>
                            </CardContent>
                        </Card>
                    </HoverCard>
                </FadeIn>
            ))}
        </div>
    )
}
