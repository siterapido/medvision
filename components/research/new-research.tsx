"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ResearchAgentChat } from "./research-agent-chat"

interface NewResearchButtonProps {
    userId: string
}

export function NewResearchButton({ userId }: NewResearchButtonProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)

    const handleComplete = (researchId: string) => {
        // Wait a bit for user to see success state
        setTimeout(() => {
            setOpen(false)
            router.refresh() // Revalidate to show new research
        }, 1500)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-full shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Pesquisa
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 bg-slate-950 border-slate-800">
                <DialogTitle className="sr-only">Nova Pesquisa Científica</DialogTitle>
                <ResearchAgentChat userId={userId} onComplete={handleComplete} />
            </DialogContent>
        </Dialog>
    )
}
