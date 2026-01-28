"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Brain, BookOpen, GraduationCap, Microscope } from "lucide-react"

// --- Summary & Flashcards Form ---
const summaryFormSchema = z.object({
    topic: z.string().min(3, "O tema deve ter pelo menos 3 caracteres"),
    specialty: z.string().optional(),
    depth: z.enum(["basico", "intermediario", "avancado"]),
    format: z.enum(["resumo", "topicos", "esquema"]),
    generateFlashcards: z.boolean().default(true),
})

export type SummaryFormValues = z.infer<typeof summaryFormSchema>

export function SummaryForm({ onSubmit, isLoading }: { onSubmit: (data: SummaryFormValues) => void, isLoading: boolean }) {
    const form = useForm<SummaryFormValues>({
        resolver: zodResolver(summaryFormSchema),
        defaultValues: {
            topic: "",
            depth: "intermediario",
            format: "resumo",
            generateFlashcards: true,
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Tema do Estudo</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ex: Anatomia do Nervo Trigêmeo, Protocolos de Clareamento..."
                                    className="bg-white/5 border-white/10 text-white"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>Seja específico para obter melhores resultados.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="depth"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">Profundidade</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white capitalize">
                                            <SelectValue placeholder="Selecione o nível" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                                        <SelectItem value="basico">Iniciante / Básico</SelectItem>
                                        <SelectItem value="intermediario">Intermediário / Clínico</SelectItem>
                                        <SelectItem value="avancado">Avançado / Especialista</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="format"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">Formato</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white capitalize">
                                            <SelectValue placeholder="Selecione o formato" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                                        <SelectItem value="resumo">Texto Fluido</SelectItem>
                                        <SelectItem value="topicos">Lista de Tópicos</SelectItem>
                                        <SelectItem value="esquema">Esquema Estruturado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 rounded-xl shadow-lg shadow-primary/20 gap-2"
                >
                    {isLoading ? "Gerando..." : "Gerar Resumo Completo"}
                    <Sparkles className="h-4 w-4" />
                </Button>
            </form>
        </Form>
    )
}

// --- Research Form ---
const researchFormSchema = z.object({
    query: z.string().min(10, "A pergunta deve ser mais detalhada"),
    scope: z.enum(["pubmed", "scholar", "recent", "comprehensive"]),
    language: z.enum(["pt", "en", "both"]),
})

export type ResearchFormValues = z.infer<typeof researchFormSchema>

export function ResearchForm({ onSubmit, isLoading }: { onSubmit: (data: ResearchFormValues) => void, isLoading: boolean }) {
    const form = useForm<ResearchFormValues>({
        resolver: zodResolver(researchFormSchema),
        defaultValues: {
            query: "",
            scope: "comprehensive",
            language: "both",
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="query"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Pergunta Científica ou Termo de Busca</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Ex: Qual a eficácia das cerâmicas feldspáticas vs dissilicato de lítio em coroas anteriores? Revisão sistemática dos últimos 5 anos."
                                    className="bg-white/5 border-white/10 text-white min-h-[120px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>Nossa IA pesquisará em bases de dados científicas reais.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-blue-500/20 gap-2"
                >
                    {isLoading ? "Pesquisando..." : "Iniciar Pesquisa Científica"}
                    <Microscope className="h-4 w-4" />
                </Button>
            </form>
        </Form>
    )
}

// --- Exam Form ---
const examFormSchema = z.object({
    topic: z.string().min(3, "O tema deve ter pelo menos 3 caracteres"),
    difficulty: z.enum(["easy", "medium", "hard"]),
    numQuestions: z.number().min(1).max(20),
})

export type ExamFormValues = z.infer<typeof examFormSchema>

export function ExamForm({ onSubmit, isLoading }: { onSubmit: (data: ExamFormValues) => void, isLoading: boolean }) {
    const form = useForm<ExamFormValues>({
        resolver: zodResolver(examFormSchema),
        defaultValues: {
            topic: "",
            difficulty: "medium",
            numQuestions: 10,
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Assunto do Simulado</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ex: Farmacologia na Odontologia, Cirurgia Bucomaxilo..."
                                    className="bg-white/5 border-white/10 text-white"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">Dificuldade</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white capitalize">
                                            <SelectValue placeholder="Selecione a dificuldade" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                                        <SelectItem value="easy">Fácil</SelectItem>
                                        <SelectItem value="medium">Médio / Graduação</SelectItem>
                                        <SelectItem value="hard">Difícil / Concurso / Residência</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="numQuestions"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">Nº de Questões</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={20}
                                        className="bg-white/5 border-white/10 text-white"
                                        {...field}
                                        onChange={e => field.onChange(parseInt(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-amber-500/20 gap-2"
                >
                    {isLoading ? "Criando..." : "Gerar Simulado Prático"}
                    <GraduationCap className="h-4 w-4" />
                </Button>
            </form>
        </Form>
    )
}
