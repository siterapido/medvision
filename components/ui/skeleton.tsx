import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

/** Linha de texto (altura ~1rem, largura total) */
function SkeletonText({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      data-slot="skeleton-text"
      className={cn("h-4 w-full rounded", className)}
      {...props}
    />
  )
}

/** Círculo (ex: avatar placeholder) */
function SkeletonCircle({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      data-slot="skeleton-circle"
      className={cn("rounded-full", className)}
      {...props}
    />
  )
}

/** Retângulo (ex: imagem placeholder) */
function SkeletonRect({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      data-slot="skeleton-rect"
      className={cn("rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton, SkeletonText, SkeletonCircle, SkeletonRect }
