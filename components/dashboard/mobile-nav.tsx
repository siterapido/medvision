'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, BOTTOM_NAV_ITEMS } from '@/lib/constants/navigation'
import { UserProfile } from './user-profile'
import { ThemeToggle } from './theme-toggle'
import { Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Logo } from '@/components/logo'

export function MobileNav({ user }: { user: any }) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = React.useState(false)

    // All items we want in the top bar horizontal scroll
    // Prioritize main ones, but maybe we can fit more since they are just icons
    const topBarItems = [
        ...NAV_ITEMS.filter(i => ['Início', 'Chat', 'Odonto Vision', 'Biblioteca'].includes(i.label)),
        // We can add others if needed, but let's keep the core 4 + Menu for the rest
    ]

    const isActive = (href: string) => {
        if (href === '/dashboard' && pathname === '/dashboard') return true
        if (href !== '/dashboard' && pathname.startsWith(href)) return true
        return false
    }

    return (
        <>
            {/* Top Navigation Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 lg:hidden text-foreground">
                <nav className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 h-14 flex items-center justify-between shadow-sm">
                    {/* Logo - Small Symbol */}
                    <Logo variant="symbol" width={28} height={28} />

                    {/* Center Icons - Like Agent Menu */}
                    <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-full border border-border/20">
                        {topBarItems.map((item) => {
                            const active = isActive(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300",
                                        active
                                            ? "bg-background text-primary shadow-sm"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "w-[16px] h-[16px] transition-transform duration-300",
                                        active ? "scale-100" : "scale-90"
                                    )} strokeWidth={active ? 2.5 : 2} />

                                    {active && (
                                        <motion.div
                                            layoutId="activeNavTab"
                                            className="absolute inset-0 rounded-full border border-primary/10"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Menu Button */}
                    <button
                        onClick={() => setIsOpen(true)}
                        className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300",
                            isOpen
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        <Menu className="w-5 h-5" strokeWidth={2} />
                    </button>
                </nav>
            </div>

            {/* Content Spacer for Fixed Header */}
            <div className="h-14 lg:hidden" />

            {/* Full Screen Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: "-100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[60] bg-background lg:hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border/50 h-14">
                            <Logo variant="auto" width={120} height={40} />
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">

                            {/* User Profile Card */}
                            <div className="p-4 rounded-2xl bg-card border border-border/50">
                                <UserProfile user={user} collapsed={false} />
                            </div>

                            {/* Navigation Links - Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {[...NAV_ITEMS, ...BOTTOM_NAV_ITEMS].map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 rounded-2xl border border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 gap-3",
                                            isActive(item.href) && "border-primary bg-primary/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-3 rounded-full bg-muted/50",
                                            isActive(item.href) && "bg-primary/20 text-primary"
                                        )}>
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <span className="font-medium text-sm text-center">{item.label}</span>
                                    </Link>
                                ))}
                            </div>

                            {/* Theme Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50">
                                <span className="font-medium">Aparência</span>
                                <ThemeToggle collapsed={false} />
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
