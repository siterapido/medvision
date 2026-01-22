"use client"

import { cn } from "@/lib/utils"

interface CategoryFilterProps {
    categories: string[]
    selectedCategory: string | null
    onCategorySelect: (category: string | null) => void
    className?: string
}

export function CategoryFilter({
    categories,
    selectedCategory,
    onCategorySelect,
    className,
}: CategoryFilterProps) {
    return (
        <div className={cn("flex items-center gap-2 overflow-x-auto no-scrollbar py-4", className)}>
            <button
                onClick={() => onCategorySelect(null)}
                className={cn(
                    "whitespace-nowrap rounded-full px-6 py-2 text-sm font-bold transition-all duration-300",
                    selectedCategory === null
                        ? "bg-white text-slate-950 shadow-lg shadow-white/20"
                        : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                )}
            >
                Tudo
            </button>

            {categories.map((category) => (
                <button
                    key={category}
                    onClick={() => onCategorySelect(category)}
                    className={cn(
                        "whitespace-nowrap rounded-full px-6 py-2 text-sm font-bold transition-all duration-300",
                        selectedCategory === category
                            ? "bg-white text-slate-950 shadow-lg shadow-white/20"
                            : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                    )}
                >
                    {category}
                </button>
            ))}
        </div>
    )
}
