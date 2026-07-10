"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArtifactList } from "@/components/biblioteca/artifact-list"
import { Scan, ImageIcon } from "lucide-react"
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
            className="container mx-auto max-w-5xl min-w-0 space-y-6 px-4 py-6 md:py-8"
        >
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0 space-y-1">
                    <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight text-ink md:text-3xl">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-rule bg-surface md:h-10 md:w-10">
                            <Scan className="h-4 w-4 text-signal md:h-5 md:w-5" aria-hidden />
                        </span>
                        Laudos
                    </h1>
                    <p className="text-sm text-ink-muted">
                        Histórico de análises salvas no Med Vision.
                    </p>
                </div>

                <Button asChild className="w-full sm:w-auto">
                    <Link href={MED_VISION_HREF} className="inline-flex items-center justify-center gap-2">
                        <ImageIcon className="h-4 w-4" aria-hidden />
                        Nova análise
                    </Link>
                </Button>
            </div>

            <ArtifactList
                type="vision"
                variant="dense"
                emptyMessage="Nenhum laudo salvo ainda."
                emptyActionLabel="Ir ao Med Vision"
                onEmptyAction={goToMedVision}
            />
        </div>
    )
}
