'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, BOTTOM_NAV_ITEMS } from '@/lib/constants/navigation'
import { UserProfile } from './user-profile'
import { ThemeToggle } from './theme-toggle'
import { Menu, X, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Logo } from '@/components/logo'

export function MobileNav({ user }: { user: any }) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = React.useState(false)

    // All items we want in the top bar horizontal scroll
    // Prioritize main ones, but maybe we can fit more since they are just icons
    const topBarItems = [...NAV_ITEMS]

    const isActive = (href: string) => {
        if (pathname.startsWith(href)) return true
        return false
    }

    return (
        <>
            {/* Top Navigation Bar - Floating Island Style */}
            <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 lg:hidden w-auto max-w-[90%]">
                <nav className="bg-background/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 px-2.5 py-1.5 flex items-center gap-3 rounded-[2rem] shadow-lg shadow-black/5">

                    {/* App Icon */}
                    <div className="pl-1 flex items-center justify-center">
                        <div className="bg-primary/10 p-1 rounded-full">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-[1px] bg-border/50" />

                    {/* Center Icons - Like Agent Menu */}
                    <div className="flex items-center gap-1">
                        {topBarItems.map((item) => {
                            const active = isActive(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300",
                                        active
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "w-4 h-4 transition-transform duration-300",
                                        active ? "scale-100" : "scale-90"
                                    )} strokeWidth={active ? 2.5 : 2} />
                                </Link>
                            )
                        })}
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-[1px] bg-border/50" />

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
                        <Menu className="w-4 h-4" strokeWidth={2} />
                    </button>
                </nav>
            </div >

            {/* Content Spacer for Fixed Header - Increased spacing since it floats lower */}
            < div className="h-24 lg:hidden" />

            {/* Full Screen Menu Overlay */}
            <AnimatePresence>
                {
                    isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: "-100%" }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-0 z-[60] bg-background lg:hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border/50">
                                <Logo variant="auto" width={120} height={40} />
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-3 rounded-full bg-muted/50 hover:bg-muted transition-colors border border-border/50"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                                {/* User Profile Card */}
                                <div className="p-1 rounded-3xl bg-card border border-border/50 shadow-sm overflow-hidden">
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
                                                "flex flex-col items-center justify-center p-4 py-8 rounded-3xl border border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 gap-4 group",
                                                isActive(item.href) && "border-primary bg-primary/5"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-4 rounded-full bg-muted/50 transition-colors group-hover:bg-background group-hover:shadow-sm",
                                                isActive(item.href) && "bg-primary/20 text-primary"
                                            )}>
                                                <item.icon className="w-7 h-7" />
                                            </div>
                                            <span className="font-medium text-sm text-center">{item.label}</span>
                                        </Link>
                                    ))}
                                </div>

                                {/* Theme Toggle */}
                                <div className="flex items-center justify-between p-5 rounded-3xl bg-card border border-border/50 shadow-sm">
                                    <span className="font-medium px-2">Aparência</span>
                                    <ThemeToggle collapsed={false} />
                                </div>

                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </>
    )
}
