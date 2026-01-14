"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, ArrowRight, Check, Sparkles, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { TopicSelector } from "../components/topic-selector"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function NewSummaryPage() {
    const router = useRouter()
    const supabase = createClient()

    const [step, setStep] = React.useState(1)
    const [topics, setTopics] = React.useState<string[]>([])
    const [complexity, setComplexity] = React.useState("medium")
    const [loading, setLoading] = React.useState(false)

    const handleNext = () => {
        if (topics.length > 0) {
            setStep(2)
        }
    }

    const handleBack = () => {
        setStep(1)
    }

    const handleGenerate = async () => {
        try {
            setLoading(true)

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("User not found")

            // Create summary record
            const { data, error } = await supabase
                .from("summaries")
                .insert({
                    user_id: user.id,
                    title: topics.join(", ").slice(0, 100) + (topics.join(", ").length > 100 ? "..." : ""),
                    status: "generating",
                    complexity_level: complexity,
                })
                .select()
                .single()

            if (error) throw error

            // Also create junction records for topics (optional if we want to query by topic later)
            // For now, we rely on the summary title/content. 
            // Ideally we should insert into 'topics' table and 'summary_topics' table here.
            // Skipping for MVP speed, can be added later as 'topics' are just strings in the wizard.

            // Redirect to viewer which will trigger the generation
            router.push(`/dashboard/resumos/${data.id}?trigger=true`)

        } catch (error) {
            console.error("Error creating summary:", error)
            // Show error toast
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container max-w-3xl mx-auto py-10 space-y-8">
            <div className="flex items-center space-x-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">Novo Resumo Inteligente</h1>
            </div>

            <div className="grid gap-6">
                {/* Progress Steps */}
                <div className="flex items-center justify-between px-10">
                    <div className={`flex flex-col items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? "border-primary bg-primary text-primary-foreground" : "border-muted"}`}>
                            1
                        </div>
                        <span className="text-sm font-medium">Tópicos</span>
                    </div>
                    <div className="h-[2px] flex-1 mx-4 bg-muted" />
                    <div className={`flex flex-col items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? "border-primary bg-primary text-primary-foreground" : "border-muted"}`}>
                            2
                        </div>
                        <span className="text-sm font-medium">Configuração</span>
                    </div>
                </div>

                <Card>
                    {step === 1 && (
                        <>
                            <CardHeader>
                                <CardTitle>Selecione os Tópicos</CardTitle>
                                <CardDescription>
                                    Escolha os temas que você deseja incluir no seu resumo. A IA irá conectar os conceitos.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <TopicSelector selectedTopics={topics} onTopicsChange={setTopics} />

                                {topics.length > 5 && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Muitos tópicos selecionados</AlertTitle>
                                        <AlertDescription>
                                            Para um resumo mais focado, recomendamos selecionar até 5 tópicos principais.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Button onClick={handleNext} disabled={topics.length === 0}>
                                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <CardHeader>
                                <CardTitle>Configuração e Prévia</CardTitle>
                                <CardDescription>
                                    Personalize como seu resumo será gerado.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="complexity">Nível de Detalhe</Label>
                                        <Select value={complexity} onValueChange={setComplexity}>
                                            <SelectTrigger id="complexity">
                                                <SelectValue placeholder="Selecione o nível" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="basic">Básico - Visão geral e conceitos fundamentais</SelectItem>
                                                <SelectItem value="medium">Intermediário - Aprofundamento clínico (Padrão)</SelectItem>
                                                <SelectItem value="advanced">Avançado - Detalhes técnicos e evidências científicas</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Separator />

                                    <div className="rounded-lg border p-4 bg-muted/20">
                                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                            O que será gerado:
                                        </h3>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-500" />
                                                Resumo completo em texto ({topics.length * 500} palavras est.)
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-500" />
                                                ~{topics.length * 5} Flashcards de revisão ativa
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-500" />
                                                Mapa mental estruturado dos tópicos
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="ghost" onClick={handleBack}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                                </Button>
                                <Button onClick={handleGenerate} disabled={loading} className="min-w-[140px]">
                                    {loading ? "Criando..." : "Gerar Resumo 🚀"}
                                </Button>
                            </CardFooter>
                        </>
                    )}
                </Card>
            </div>
        </div>
    )
}
