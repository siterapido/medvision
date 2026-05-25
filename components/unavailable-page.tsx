"use client"

import Link from "next/link"
import { Lock, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MED_VISION_HREF } from "@/lib/constants/navigation"

interface UnavailablePageProps {
    title: string
    description?: string
}

export function UnavailablePage({
    title,
    description = "Esta funcionalidade está em manutenção ou será liberada em breve. Use o Med Vision para análise de radiografias e tomografias.",
}: UnavailablePageProps) {
    return (
        <section
            data-surface="product"
            className="flex flex-1 flex-col items-center justify-center px-4 py-16 md:py-24"
            aria-labelledby="unavailable-title"
        >
            <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-muted">
                    <Lock className="h-7 w-7 text-muted-foreground" aria-hidden />
                </div>

                <h2
                    id="unavailable-title"
                    className="text-2xl font-semibold tracking-tight text-foreground"
                >
                    {title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {description}
                </p>

                <Button asChild className="mt-8 h-11 w-full rounded-xl gap-2">
                    <Link href={MED_VISION_HREF}>
                        <Eye className="h-4 w-4 shrink-0" aria-hidden />
                        Ir para o Med Vision
                    </Link>
                </Button>
            </div>
        </section>
    )
}
