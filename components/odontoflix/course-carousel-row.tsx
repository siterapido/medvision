"use client"

import { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CourseCard } from "./course-card"
import { OdontoFlixCourse } from "@/lib/odontoflix/types"
import { cn } from "@/lib/utils"

interface CourseCarouselRowProps {
    title: string
    courses: OdontoFlixCourse[]
    className?: string
}

export function CourseCarouselRow({ title, courses, className }: CourseCarouselRowProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [showLeftArrow, setShowLeftArrow] = useState(false)
    const [showRightArrow, setShowRightArrow] = useState(true)

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
            setShowLeftArrow(scrollLeft > 0)
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
        }
    }

    useEffect(() => {
        checkScroll()
        window.addEventListener('resize', checkScroll)
        return () => window.removeEventListener('resize', checkScroll)
    }, [courses])

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current
            const scrollAmount = direction === "left" ? -clientWidth * 0.8 : clientWidth * 0.8
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
        }
    }

    if (courses.length === 0) return null

    return (
        <div className={cn("group/row relative space-y-3", className)}>
            <h2 className="px-4 text-xl font-bold text-white transition-colors duration-300 md:px-10 group-hover/row:text-cyan-400 md:text-2xl">
                {title}
            </h2>

            <div className="relative">
                {/* Left Arrow */}
                {showLeftArrow && (
                    <button
                        onClick={() => scroll("left")}
                        className="absolute left-0 top-0 bottom-0 z-40 hidden w-12 items-center justify-center bg-slate-950/60 text-white backdrop-blur-sm transition-all hover:bg-slate-950/80 md:flex md:w-16"
                        aria-label="Anterior"
                    >
                        <ChevronLeft className="h-8 w-8 transition-transform hover:scale-125" />
                    </button>
                )}

                {/* Scroll Container */}
                <div
                    ref={scrollRef}
                    onScroll={checkScroll}
                    className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth px-4 pb-4 md:px-10"
                >
                    {courses.map((course, idx) => (
                        <div key={course.id} className="w-[280px] flex-shrink-0 md:w-[320px]">
                            <CourseCard course={course} priority={idx < 4} />
                        </div>
                    ))}
                </div>

                {/* Right Arrow */}
                {showRightArrow && (
                    <button
                        onClick={() => scroll("right")}
                        className="absolute right-0 top-0 bottom-0 z-40 hidden w-12 items-center justify-center bg-slate-950/60 text-white backdrop-blur-sm transition-all hover:bg-slate-950/80 md:flex md:w-16"
                        aria-label="Próximo"
                    >
                        <ChevronRight className="h-8 w-8 transition-transform hover:scale-125" />
                    </button>
                )}
            </div>

            <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </div>
    )
}
