import { cn } from "@/lib/utils"
import React from "react"

interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode
    from?: string
    to?: string
    via?: string
    animate?: boolean
}

export function GradientText({
    children,
    className,
    from = "from-cyan-400",
    to = "to-blue-500",
    via,
    animate = false,
    ...props
}: GradientTextProps) {
    return (
        <span
            className={cn(
                "bg-clip-text text-transparent bg-gradient-to-r",
                from,
                to,
                via,
                animate && "animate-shimmer bg-[length:200%_auto]",
                className
            )}
            {...props}
        >
            {children}
        </span>
    )
}
