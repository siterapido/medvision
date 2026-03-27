'use client'

import { useState, useEffect } from 'react'
import {
  Layers,
  GitBranch,
  Sparkles,
  Database,
  Shield,
  Plug,
  Terminal,
  Rocket,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { DocSection } from './table-of-contents'

const ICON_MAP: Record<string, LucideIcon> = {
  Layers,
  GitBranch,
  Sparkles,
  Database,
  Shield,
  Plug,
  Terminal,
  Rocket,
}

interface DocsSidebarProps {
  sections: DocSection[]
}

export function DocsSidebar({ sections }: DocsSidebarProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-10% 0% -80% 0%', threshold: 0 }
    )

    sections.forEach((section) => {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-56 shrink-0">
        <div className="sticky top-8">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-3">
            Conteúdo
          </p>
          <nav className="space-y-0.5">
            {sections.map((section) => {
              const Icon = ICON_MAP[section.icon] ?? Layers
              const isActive = activeId === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => scrollTo(section.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary pl-[10px]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{section.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile accordion */}
      <div className="md:hidden mb-8 border border-border/30 rounded-xl overflow-hidden">
        <Accordion type="single" collapsible>
          <AccordionItem value="nav" className="border-0">
            <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
              Navegar nas seções
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-1 px-3 pb-2">
                {sections.map((section) => {
                  const Icon = ICON_MAP[section.icon] ?? Layers
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollTo(section.id)}
                      className="flex items-center gap-2 text-sm text-left px-3 py-2 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{section.label}</span>
                    </button>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  )
}
