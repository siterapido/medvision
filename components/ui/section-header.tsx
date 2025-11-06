import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ComponentType } from "react"

type IconType = ComponentType<{ className?: string }>

interface SectionHeaderProps {
  label?: string
  icon?: IconType
  title: string
  description?: string
  align?: "center" | "left"
  className?: string
  badgeClassName?: string
}

export function SectionHeader({
  label,
  icon: Icon,
  title,
  description,
  align = "center",
  className,
  badgeClassName,
}: SectionHeaderProps) {
  const isCenter = align === "center"

  return (
    <div className={cn(isCenter ? "text-center" : "text-left", "space-y-4", className)}>
      {label ? (
        <Badge
          className={cn(
            "inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 text-white border-primary/20 px-4 py-1.5 mb-2",
            badgeClassName
          )}
        >
          {Icon ? <Icon className="h-4 w-4" /> : null}
          {label}
        </Badge>
      ) : null}

      <h2 className={cn("text-3xl md:text-5xl font-bold text-balance", isCenter ? "" : "")}>{title}</h2>

      {description ? (
        <p
          className={cn(
            "text-lg md:text-xl text-muted-foreground text-balance",
            isCenter ? "max-w-3xl mx-auto" : "max-w-3xl"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}
