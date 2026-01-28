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
import { Sparkles, Brain, BookOpen, GraduationCap, Microscope, Scan, FileText, WalletCards, BrainCircuit } from "lucide-react"

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

                <div className="flex items-center space-x-2">
                    <FormField
                        control={form.control}
                        name="generateFlashcards"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 w-full">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base text-white">Gerar Flashcards Automaticamente</FormLabel>
                                    <FormDescription>
                                        Criar decks de estudo baseados no resumo.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="h-5 w-5 rounded border-white/10 bg-white/10 text-primary focus:ring-primary"
                                    />
                                </FormControl>
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

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="scope"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">Escopo da Busca</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white capitalize">
                                            <SelectValue placeholder="Selecione o escopo" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                                        <SelectItem value="comprehensive">Abrangente (Web + Acadêmico)</SelectItem>
                                        <SelectItem value="scholar">Google Scholar</SelectItem>
                                        <SelectItem value="pubmed">PubMed / Medline</SelectItem>
                                        <SelectItem value="recent">Artigos Recentes (2024-2026)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">Idioma das Fontes</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white capitalize">
                                            <SelectValue placeholder="Selecione o idioma" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                                        <SelectItem value="both">Português + Inglês (Recomendado)</SelectItem>
                                        <SelectItem value="pt">Apenas Português</SelectItem>
                                        <SelectItem value="en">Apenas Inglês</SelectItem>
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

// --- Report/Vision Form ---
const reportFormSchema = z.object({
    examType: z.string().min(3, "Tipo de exame obrigatório"),
    patientContext: z.string().optional(),
    clinicalNotes: z.string().optional(),
    focusArea: z.string().optional(),
})

export type ReportFormValues = z.infer<typeof reportFormSchema>

export function ReportForm({ onSubmit, isLoading }: { onSubmit: (data: ReportFormValues) => void, isLoading: boolean }) {
    const form = useForm<ReportFormValues>({
        resolver: zodResolver(reportFormSchema),
        defaultValues: {
            examType: "",
            patientContext: "",
            clinicalNotes: "",
            focusArea: "",
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="examType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Tipo de Exame de Imagem</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Selecione o tipo..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                    <SelectItem value="radiografia_panoramica">Radiografia Panorâmica</SelectItem>
                                    <SelectItem value="radiografia_periapical">Radiografia Periapical</SelectItem>
                                    <SelectItem value="tomografia">Tomografia Computadorizada (CBCT)</SelectItem>
                                    <SelectItem value="foto_intraoral">Fotografia Intraoral</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="clinicalNotes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Observações Clínicas / Queixa Principal</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Ex: Paciente relata dor no dente 36 ao mastigar. Histórico de endodontia prévia."
                                    className="bg-white/5 border-white/10 text-white min-h-[100px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="focusArea"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Área de Foco (Opcional)</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ex: Região apical do dente 36"
                                    className="bg-white/5 border-white/10 text-white"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="rounded-lg border border-dashed border-white/20 bg-white/5 p-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
                            <Scan className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-400">Arraste a imagem do exame aqui ou clique para selecionar</p>
                        <Button variant="outline" size="sm" type="button" className="mt-2 border-white/10 text-white hover:bg-white/10">
                            Selecionar Arquivo
                        </Button>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-sky-500/20 gap-2"
                >
                    {isLoading ? "Analisando..." : "Gerar Laudo Vision"}
                    <Scan className="h-4 w-4" />
                </Button>
            </form>
        </Form>
    )
}

// --- Flashcards Form ---
const flashcardsFormSchema = z.object({
    topic: z.string().min(3, "O tema deve ter pelo menos 3 caracteres"),
    specialty: z.string().optional(),
    quantity: z.number().min(5).max(50).default(15),
    difficulty: z.enum(["facil", "medio", "dificil"]),
    includeHints: z.boolean().default(false),
})

export type FlashcardsFormValues = z.infer<typeof flashcardsFormSchema>

export function FlashcardsForm({ onSubmit, isLoading }: { onSubmit: (data: FlashcardsFormValues) => void, isLoading: boolean }) {
    const form = useForm<FlashcardsFormValues>({
        resolver: zodResolver(flashcardsFormSchema),
        defaultValues: {
            topic: "",
            quantity: 15,
            difficulty: "medio",
            includeHints: false,
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
                            <FormLabel className="text-white">Tema do Deck</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ex: Anatomia dental, Periodontia, Endodontia..."
                                    className="bg-white/5 border-white/10 text-white"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>Seja específico para obter flashcards mais relevantes.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Especialidade (Opcional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Selecione uma especialidade" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                    <SelectItem value="endodontia">Endodontia</SelectItem>
                                    <SelectItem value="periodontia">Periodontia</SelectItem>
                                    <SelectItem value="ortodontia">Ortodontia</SelectItem>
                                    <SelectItem value="implantodontia">Implantodontia</SelectItem>
                                    <SelectItem value="protese">Prótese Dentária</SelectItem>
                                    <SelectItem value="cirurgia">Cirurgia Bucomaxilofacial</SelectItem>
                                    <SelectItem value="dentistica">Dentística</SelectItem>
                                    <SelectItem value="odontopediatria">Odontopediatria</SelectItem>
                                    <SelectItem value="radiologia">Radiologia Odontológica</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">Nº de Cards</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={5}
                                        max={50}
                                        className="bg-white/5 border-white/10 text-white"
                                        {...field}
                                        onChange={e => field.onChange(parseInt(e.target.value))}
                                    />
                                </FormControl>
                                <FormDescription>Entre 5 e 50 cards</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">Dificuldade</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white capitalize">
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                                        <SelectItem value="facil">Fácil / Básico</SelectItem>
                                        <SelectItem value="medio">Médio / Graduação</SelectItem>
                                        <SelectItem value="dificil">Difícil / Residência</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <FormField
                        control={form.control}
                        name="includeHints"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 w-full">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base text-white">Incluir Dicas</FormLabel>
                                    <FormDescription>
                                        Adiciona dicas para ajudar na memorização.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="h-5 w-5 rounded border-white/10 bg-white/10 text-primary focus:ring-primary"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-orange-500/20 gap-2"
                >
                    {isLoading ? "Gerando..." : "Gerar Deck de Flashcards"}
                    <WalletCards className="h-4 w-4" />
                </Button>
            </form>
        </Form>
    )
}

// --- Mind Map Form ---
const mindMapFormSchema = z.object({
    topic: z.string().min(3, "O tema deve ter pelo menos 3 caracteres"),
    depth: z.enum(["2", "3", "4"]),
    maxNodes: z.number().min(10).max(50).default(25),
    layout: z.enum(["hierarchical", "radial"]),
    specialty: z.string().optional(),
})

export type MindMapFormValues = z.infer<typeof mindMapFormSchema>

export function MindMapForm({ onSubmit, isLoading }: { onSubmit: (data: MindMapFormValues) => void, isLoading: boolean }) {
    const form = useForm<MindMapFormValues>({
        resolver: zodResolver(mindMapFormSchema),
        defaultValues: {
            topic: "",
            depth: "3",
            maxNodes: 25,
            layout: "hierarchical",
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
                            <FormLabel className="text-white">Tema Central</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ex: Sistema estomatognático, Oclusão dentária..."
                                    className="bg-white/5 border-white/10 text-white"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>O tema será o nó central do mapa.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Especialidade (Opcional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Selecione uma especialidade" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                    <SelectItem value="anatomia">Anatomia</SelectItem>
                                    <SelectItem value="fisiologia">Fisiologia</SelectItem>
                                    <SelectItem value="patologia">Patologia Oral</SelectItem>
                                    <SelectItem value="farmacologia">Farmacologia</SelectItem>
                                    <SelectItem value="materiais">Materiais Dentários</SelectItem>
                                    <SelectItem value="saude_publica">Saúde Pública</SelectItem>
                                </SelectContent>
                            </Select>
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
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                            <SelectValue placeholder="Níveis" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                                        <SelectItem value="2">2 níveis (Simples)</SelectItem>
                                        <SelectItem value="3">3 níveis (Recomendado)</SelectItem>
                                        <SelectItem value="4">4 níveis (Detalhado)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="layout"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">Layout</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                            <SelectValue placeholder="Tipo" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                                        <SelectItem value="hierarchical">Hierárquico</SelectItem>
                                        <SelectItem value="radial">Radial</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="maxNodes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Máximo de Nós</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min={10}
                                    max={50}
                                    className="bg-white/5 border-white/10 text-white"
                                    {...field}
                                    onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                            </FormControl>
                            <FormDescription>Entre 10 e 50 conceitos no mapa</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-teal-500/20 gap-2"
                >
                    {isLoading ? "Gerando..." : "Gerar Mapa Mental"}
                    <BrainCircuit className="h-4 w-4" />
                </Button>
            </form>
        </Form>
    )
}
