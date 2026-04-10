
"use client"

import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Laptop, User, Shield, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function ConfiguracoesPage() {
    const { theme, setTheme } = useTheme()

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">Configurações</h1>
                <p className="text-slate-400">
                    Gerencie suas preferências, aparência e segurança do MedVision.
                </p>
            </div>

            <div className="grid gap-6">
                {/* Aparência */}
                <Card className="border-[#1A2847] bg-[#16243F] shadow-lg">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-[#0891b2]/10 text-[#0891b2]">
                                <Sun className="w-5 h-5 dark:hidden" />
                                <Moon className="w-5 h-5 hidden dark:block" />
                            </div>
                            <div>
                                <CardTitle className="text-white">Aparência</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Personalize como o MedVision se parece para você.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <button
                                onClick={() => setTheme("light")}
                                className={cn(
                                    "flex flex-col items-center justify-between rounded-xl border-2 p-4 hover:bg-[#1A2847] transition-all duration-200",
                                    theme === "light"
                                        ? "border-[#0891b2] bg-[#1A2847]"
                                        : "border-[#24324F] bg-transparent"
                                )}
                            >
                                <div className="space-y-2 rounded-md bg-[#e2e8f0] p-2 w-full aspect-video flex items-center justify-center mb-3">
                                    <div className="space-y-2 w-3/4">
                                        <div className="h-2 w-full bg-white rounded" />
                                        <div className="h-2 w-1/2 bg-white rounded" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                                    <Sun className="h-4 w-4" />
                                    <span>Claro</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setTheme("dark")}
                                className={cn(
                                    "flex flex-col items-center justify-between rounded-xl border-2 p-4 hover:bg-[#1A2847] transition-all duration-200",
                                    theme === "dark"
                                        ? "border-[#0891b2] bg-[#1A2847]"
                                        : "border-[#24324F] bg-transparent"
                                )}
                            >
                                <div className="space-y-2 rounded-md bg-[#0F192F] p-2 w-full aspect-video flex items-center justify-center mb-3 border border-[#24324F]">
                                    <div className="space-y-2 w-3/4">
                                        <div className="h-2 w-full bg-[#1A2847] rounded" />
                                        <div className="h-2 w-1/2 bg-[#1A2847] rounded" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                                    <Moon className="h-4 w-4" />
                                    <span>Escuro</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setTheme("system")}
                                className={cn(
                                    "flex flex-col items-center justify-between rounded-xl border-2 p-4 hover:bg-[#1A2847] transition-all duration-200",
                                    theme === "system"
                                        ? "border-[#0891b2] bg-[#1A2847]"
                                        : "border-[#24324F] bg-transparent"
                                )}
                            >
                                <div className="space-y-2 rounded-md bg-[#131D37] p-2 w-full aspect-video flex items-center justify-center mb-3 border border-[#24324F]">
                                    <div className="space-y-2 w-3/4">
                                        <div className="h-2 w-full bg-[#1A2847] rounded" />
                                        <div className="h-2 w-1/2 bg-[#1A2847] rounded" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                                    <Laptop className="h-4 w-4" />
                                    <span>Sistema</span>
                                </div>
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Conta */}
                <Card className="border-[#1A2847] bg-[#16243F] shadow-lg">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-[#0891b2]/10 text-[#0891b2]">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-white">Conta</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Informações pessoais e dados da conta.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg border border-[#24324F] bg-[#0F192F]/50">
                            <div className="space-y-1">
                                <Label className="text-base text-slate-200">Perfil do Usuário</Label>
                                <p className="text-sm text-slate-400">
                                    Atualize sua foto, nome e especialidade.
                                </p>
                            </div>
                            <Button asChild variant="outline" className="border-[#0891b2] text-[#0891b2] hover:bg-[#0891b2]/10 hover:text-[#0891b2]">
                                <Link href="/dashboard/perfil">Editar Perfil</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Notificações */}
                <Card className="border-[#1A2847] bg-[#16243F] shadow-lg">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-[#0891b2]/10 text-[#0891b2]">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-white">Notificações</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Escolha o que você quer receber.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base text-slate-200">Emails de Marketing</Label>
                                <p className="text-sm text-slate-400">
                                    Receba novidades e ofertas do MedVision.
                                </p>
                            </div>
                            <Switch defaultChecked className="data-[state=checked]:bg-[#0891b2]" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base text-slate-200">Alertas do Sistema</Label>
                                <p className="text-sm text-slate-400">
                                    Notificações importantes sobre sua conta (obrigatório).
                                </p>
                            </div>
                            <Switch defaultChecked disabled className="data-[state=checked]:bg-[#0891b2] opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                {/* Segurança */}
                <Card className="border-[#1A2847] bg-[#16243F] shadow-lg">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-[#0891b2]/10 text-[#0891b2]">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-white">Segurança</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Proteja sua conta e dados.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg border border-[#24324F] bg-[#0F192F]/50">
                            <div className="space-y-1">
                                <Label className="text-base text-slate-200">Senha</Label>
                                <p className="text-sm text-slate-400">
                                    Alterar sua senha de acesso.
                                </p>
                            </div>
                            <Button variant="outline" className="opacity-50 cursor-not-allowed border-slate-700 text-slate-400" disabled>
                                Em breve
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

