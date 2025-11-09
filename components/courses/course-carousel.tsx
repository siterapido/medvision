"use client"

import { Children, Fragment, ReactNode, useMemo, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

type CourseCarouselProps = {
  children: ReactNode
  ariaLabel?: string
  className?: string
}

export function CourseCarousel({ children, ariaLabel, className }: CourseCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const items = useMemo(() => Children.toArray(children), [children])
  const renderedItems = useMemo(
    () => items.map((child, index) => <Fragment key={`carousel-item-${index}`}>{child}</Fragment>),
    [items],
  )
  const handleScroll = (direction: "prev" | "next") => {
    const container = scrollRef.current
    if (!container || container.scrollWidth <= container.clientWidth) return

    const scrollAmount = direction === "next" ? container.clientWidth * 0.7 : -container.clientWidth * 0.7
    container.scrollBy({ left: scrollAmount, behavior: "smooth" })
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className={cn("relative isolate", className)}>
      <div className="relative overflow-hidden rounded-[inherit]">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0F192F] via-[#0F192F]/70 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0F192F] via-[#0F192F]/70 to-transparent" />

        <div
          ref={scrollRef}
          aria-label={ariaLabel}
          className="flex min-w-max gap-5 overflow-x-auto pb-4 px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {renderedItems}
        </div>
      </div>

      <button
        type="button"
        onClick={() => handleScroll("prev")}
        aria-label="Ver cursos anteriores"
        className="group absolute left-0 top-1/2 z-40 -translate-y-1/2 -translate-x-1/2 rounded-full border border-white/30 bg-[#0B1627]/80 p-2 text-white shadow-2xl backdrop-blur transition hover:border-primary/80 hover:bg-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => handleScroll("next")}
        aria-label="Ver próximos cursos"
        className="group absolute right-0 top-1/2 z-40 -translate-y-1/2 translate-x-1/2 rounded-full border border-white/30 bg-[#0B1627]/80 p-2 text-white shadow-2xl backdrop-blur transition hover:border-primary/80 hover:bg-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}
