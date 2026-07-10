'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, BOTTOM_NAV_ITEMS } from '@/lib/constants/navigation'
import { UserProfile } from './user-profile'
import { Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Logo } from '@/components/logo'

export function MobileNav({ user }: { user: any }) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = React.useState(false)

    const topBarItems = [...NAV_ITEMS]

    const isActive = (href: string) => {
        if (pathname.startsWith(href)) return true
        return false
    }

    return (
        <>
            <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 lg:hidden w-auto max-w-[90%]">
                <nav className="bg-surface border border-rule px-2.5 py-1.5 flex items-center gap-3 rounded-2xl shadow-sm">

                    <div className="pl-1 flex items-center justify-center">
                        <Logo width={72} height={20} className="text-ink" />
                    </div>

                    <div className="h-6 w-px bg-border" />

                    <div className="flex items-center gap-1">
                        {topBarItems.map((item) => {
                            const active = isActive(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200",
                                        active
                                            ? "bg-sidebar-accent text-sidebar-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    <item.icon className="w-4 h-4" strokeWidth={active ? 2.5 : 2} />
                                </Link>
                            )
                        })}
                    </div>

                    <div className="h-6 w-px bg-border" />

                    <button
                        onClick={() => setIsOpen(true)}
                        className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200",
                            isOpen
                                ? "bg-sidebar-accent text-sidebar-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        <Menu className="w-4 h-4" strokeWidth={2} />
                    </button>
                </nav>
            </div>

            <div className="h-24 lg:hidden" />

            <AnimatePresence>
                {
                    isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: "-100%" }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-0 z-[60] bg-paper lg:hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-border">
                                <Logo variant="auto" width={120} height={40} className="text-ink" />
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors border border-border"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                                <div className="p-1 rounded-xl bg-surface-raised border border-border overflow-hidden">
                                    <UserProfile user={user} collapsed={false} />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {[...NAV_ITEMS, ...BOTTOM_NAV_ITEMS].map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-4 py-8 rounded-xl border border-border bg-surface-raised hover:border-rule hover:bg-surface transition-colors duration-200 gap-4",
                                                isActive(item.href) && "border-signal/30 bg-sidebar-accent"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-4 rounded-lg bg-muted transition-colors",
                                                isActive(item.href) && "bg-sidebar-accent text-sidebar-foreground"
                                            )}>
                                                <item.icon className="w-7 h-7" />
                                            </div>
                                            <span className="font-medium text-sm text-center text-foreground">{item.label}</span>
                                        </Link>
                                    ))}
                                </div>

                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence>
        </>
    )
}
