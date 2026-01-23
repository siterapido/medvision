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

    // Combine relevant items for the bottom bar
    // We'll prioritize: Home, Chat, Vision, Library. 
    // Others will go into the "More" menu or we just scroll.
    // Let's try a clean fixed bar with Home, Chat, Vision, Library, Menu.

    const mainItems = [
        NAV_ITEMS.find(i => i.href === '/dashboard')!,
        NAV_ITEMS.find(i => i.href === '/dashboard/chat')!,
        NAV_ITEMS.find(i => i.href === '/dashboard/odonto-vision')!,
        NAV_ITEMS.find(i => i.href === '/dashboard/biblioteca')!,
    ]

    const otherItems = [
        ...NAV_ITEMS.filter(i => !mainItems.includes(i)),
        ...BOTTOM_NAV_ITEMS
    ]

    const isActive = (href: string) => {
        if (href === '/dashboard' && pathname === '/dashboard') return true
        if (href !== '/dashboard' && pathname.startsWith(href)) return true
        return false
    }

    return (
        <>
            {/* Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
                {/* Gradient Fade for content above */}
                <div className="absolute -top-12 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />

                <nav className="bg-background/80 backdrop-blur-xl border-t border-border/50 pb-[env(safe-area-inset-bottom)] pt-2 px-2">
                    <div className="flex items-center justify-around">
                        {mainItems.map((item) => {
                            const active = isActive(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 relative group min-w-[64px]",
                                        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute inset-0 bg-primary/10 rounded-xl scale-50 opacity-0 transition-all duration-300",
                                        active && "scale-100 opacity-100"
                                    )} />

                                    <item.icon className={cn(
                                        "w-6 h-6 mb-1 z-10 transition-transform duration-300",
                                        active ? "scale-110" : "group-hover:scale-105"
                                    )} strokeWidth={active ? 2.5 : 2} />

                                    <span className={cn(
                                        "text-[10px] font-medium z-10 transition-colors duration-300",
                                        active ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {item.label}
                                    </span>
                                </Link>
                            )
                        })}

                        {/* Menu Button */}
                        <button
                            onClick={() => setIsOpen(true)}
                            className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 relative group min-w-[64px]",
                                isOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className={cn(
                                "absolute inset-0 bg-primary/10 rounded-xl scale-50 opacity-0 transition-all duration-300",
                                isOpen && "scale-100 opacity-100"
                            )} />
                            <Menu className="w-6 h-6 mb-1 z-10" strokeWidth={2} />
                            <span className="text-[10px] font-medium z-10">Menu</span>
                        </button>
                    </div>
                </nav>
            </div>

            {/* Full Screen Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[60] bg-background lg:hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border/50">
                            <Logo variant="auto" width={120} height={40} />
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">

                            {/* User Profile Card */}
                            <div className="p-4 rounded-2xl bg-card border border-border/50">
                                <UserProfile user={user} collapsed={false} />
                            </div>

                            {/* Navigation Links */}
                            <div className="grid grid-cols-2 gap-3">
                                {otherItems.map((item) => (
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
