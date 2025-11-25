"use client"

import { useState } from "react"
import Image from "next/image"
import { Logo } from "@/components/logo"

interface CourseThumbnailProps {
    src?: string | null
    alt: string
    className?: string
    priority?: boolean
}

export function CourseThumbnail({ src, alt, className, priority = false }: CourseThumbnailProps) {
    const [hasError, setHasError] = useState(false)

    if (!src || hasError) {
        return (
            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${className}`}>
                <Logo variant="white" width={140} height={40} />
            </div>
        )
    }

    return (
        <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            className={className}
            priority={priority}
            unoptimized
            onError={() => setHasError(true)}
        />
    )
}
