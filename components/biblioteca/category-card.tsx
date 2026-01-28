"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface CategoryCardProps {
    title: string
    description: string
    icon: LucideIcon
    href: string
    colorClass: string
    count?: number
}

export function CategoryCard({ title, description, icon: Icon, href, colorClass, count }: CategoryCardProps) {
    return (
        <Link href={href}>
            <motion.div
                whileHover={{ y: -5 }}
                className="group relative overflow-hidden rounded-3xl p-6 h-full glass-card border-white/5 hover:border-white/10 transition-all duration-300"
            >
                <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity", colorClass)} />

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                        <div className={cn("p-3 rounded-2xl bg-white/5 border border-white/10 text-white", colorClass.replace('bg-', 'text-'))}>
                            <Icon className="w-6 h-6" />
                        </div>
                        {count !== undefined && (
                            <span className="text-xs font-medium text-muted-foreground bg-muted/20 px-2 py-1 rounded-full border border-white/5">
                                {count} itens
                            </span>
                        )}
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {title}
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-grow">
                        {description}
                    </p>

                    <div className="flex items-center text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors mt-auto">
                        Acessar
                        <ArrowRight className="w-3.5 h-3.5 ml-2 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </div>
                </div>
            </motion.div>
        </Link>
    )
}
