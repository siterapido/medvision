"use client"

import * as React from "react"
import { UnavailablePage } from "@/components/unavailable-page"

export default function BibliotecaLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <UnavailablePage
                title="Biblioteca Digital"
                description="Nossa biblioteca está passando por uma atualização completa para oferecer a melhor experiência de estudo. Em breve ela estará disponível com novos recursos."
            />
            {children}
        </>
    )
}
