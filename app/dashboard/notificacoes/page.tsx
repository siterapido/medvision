"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Bell, CheckCircle2, Info, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
    id: string
    type: "info" | "success" | "warning"
    title: string
    message: string
    timestamp: Date
    read: boolean
}

export default function NotificacoesPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])

    // Mock notifications - em produção, buscar do banco
    useEffect(() => {
        setNotifications([
            {
                id: "1",
                type: "success",
                title: "Bem-vindo ao Odonto GPT!",
                message: "Sua conta foi criada com sucesso. Explore todos os recursos disponíveis.",
                timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
                read: false,
            },
        ])
    }, [])

    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
    }

    const deleteNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
    }

    const getIcon = (type: Notification["type"]) => {
        switch (type) {
            case "success":
                return CheckCircle2
            case "warning":
                return AlertCircle
            default:
                return Info
        }
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 },
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Bell className="h-7 w-7 text-foreground" />
                            {notifications.some((n) => !n.read) && (
                                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary border-2 border-background animate-pulse" />
                            )}
                        </div>
                        <h1 className="text-3xl font-heading font-semibold text-foreground">
                            Notificações
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Acompanhe suas atualizações e novidades
                    </p>
                </div>

                {/* Notifications List */}
                {notifications.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center min-h-[400px] space-y-4"
                    >
                        <div className="relative">
                            <Bell className="h-16 w-16 text-muted-foreground/30" />
                            <div className="absolute inset-0 bg-primary/5 blur-3xl -z-10 rounded-full" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-lg font-medium text-foreground">
                                Nenhuma notificação
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Você está em dia! Não há notificações pendentes.
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="space-y-3"
                    >
                        {notifications.map((notification) => {
                            const Icon = getIcon(notification.type)
                            return (
                                <motion.div
                                    key={notification.id}
                                    variants={itemVariants}
                                    className={cn(
                                        "group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300",
                                        "hover:bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5",
                                        !notification.read && "border-primary/30 bg-primary/5"
                                    )}
                                >
                                    <div className="flex items-start gap-4 p-5">
                                        {/* Icon */}
                                        <div
                                            className={cn(
                                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                                notification.type === "success" &&
                                                "bg-green-500/10 text-green-600 dark:text-green-400",
                                                notification.type === "warning" &&
                                                "bg-orange-500/10 text-orange-600 dark:text-orange-400",
                                                notification.type === "info" &&
                                                "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                            )}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 space-y-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-foreground truncate">
                                                    {notification.title}
                                                </h3>
                                                {!notification.read && (
                                                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground/60">
                                                {formatTimestamp(notification.timestamp)}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!notification.read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all"
                                                    title="Marcar como lida"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteNotification(notification.id)}
                                                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                                                title="Excluir"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </motion.div>
                )}
            </div>
        </div >
    )
}

function formatTimestamp(date: Date): string {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Agora"
    if (diffInMinutes < 60) return `Há ${diffInMinutes}m`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `Há ${diffInHours}h`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return "Ontem"
    if (diffInDays < 7) return `Há ${diffInDays} dias`

    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}
