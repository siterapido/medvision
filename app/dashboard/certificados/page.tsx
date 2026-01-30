"use client"

import * as React from "react"
import { UnavailablePage } from "@/components/unavailable-page"

export default function CertificadosPage() {
    return (
        <UnavailablePage
            title="Meus Certificados"
            description="A emissão de novos certificados está temporariamente suspensa para manutenção do sistema. Seus certificados anteriores continuam salvos com segurança."
        />
    )
}
