"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArtifactList } from "@/components/biblioteca/artifact-list"
import { Scan, ArrowLeft, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MED_VISION_HREF } from "@/lib/constants/navigation"

export default function LaudosPage() {
    const router = useRouter()

    const goToMedVision = React.useCallback(() => {
        router.push(MED_VISION_HREF)
    }, [router])

    return (
        <div
            data-surface="product"
            className="container mx-auto max-w-[1600px] min-w-0 space-y-8 px-4 py-6 md:py-8"
        >
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div className="flex min-w-0 items-center gap-3 md:gap-4">
                    <Link href={MED_VISION_HREF}>
                        <Button variant="ghost" size="icon" className="shrink-0 rounded-xl" aria-label="Voltar ao Med Vision">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="min-w-0">
                        <h1 className="flex items-center gap-2 font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 md:h-10 md:w-10">
                                <Scan className="h-4 w-4 text-primary md:h-5 md:w-5" aria-hidden />
                            </span>
                            Laudos
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground md:text-base">
                            Histórico integrado às análises do Med Vision. Nova análise com imagem, laudo e aba Radiografia.
                        </p>
                    </div>
                </div>

                <Button
                    asChild
                    className="w-full rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 md:w-auto"
                >
                    <Link href={MED_VISION_HREF} className="inline-flex items-center justify-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Abrir Med Vision
                    </Link>
                </Button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 md:p-5">
                <ArtifactList
                    type="vision"
                    emptyMessage="Nenhum laudo salvo ainda"
                    emptyActionLabel="Ir ao Med Vision"
                    onEmptyAction={goToMedVision}
                />
            </div>
        </div>
    )
}
