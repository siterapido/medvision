"use client"

import { useState, useRef } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Scan,
    Upload,
    X,
    Image as ImageIcon,
    FileText,
    Sparkles,
    Eye,
    Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Laudo form schema
const laudoFormSchema = z.object({
    examType: z.string().min(1, "Selecione o tipo de exame"),
    patientContext: z.string().optional(),
    clinicalNotes: z.string().optional(),
    focusArea: z.string().optional(),
})

export type LaudoFormValues = z.infer<typeof laudoFormSchema>

interface LaudoEditorProps {
    onSubmit: (data: LaudoFormValues, imageFile: File | null) => void
    isLoading: boolean
}

export function LaudoEditor({ onSubmit, isLoading }: LaudoEditorProps) {
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const form = useForm<LaudoFormValues>({
        resolver: zodResolver(laudoFormSchema),
        defaultValues: {
            examType: "",
            patientContext: "",
            clinicalNotes: "",
            focusArea: "",
        },
    })

    const handleFileSelect = (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Arquivo inválido", {
                description: "Por favor, selecione uma imagem (JPEG, PNG, etc.)"
            })
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Arquivo muito grande", {
                description: "O tamanho máximo é 10MB"
            })
            return
        }

        setImageFile(file)

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const files = e.dataTransfer.files
        if (files.length > 0) {
            handleFileSelect(files[0])
        }
    }

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            handleFileSelect(files[0])
        }
    }

    const removeImage = () => {
        setImageFile(null)
        setImagePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleFormSubmit = (data: LaudoFormValues) => {
        if (!imageFile) {
            toast.error("Imagem obrigatória", {
                description: "Por favor, selecione uma imagem para análise."
            })
            return
        }
        onSubmit(data, imageFile)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                {/* Image Upload Area */}
                <div className="space-y-2">
                    <FormLabel className="text-white">Imagem do Exame *</FormLabel>

                    {!imagePreview ? (
                        <div
                            className={cn(
                                "relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                                isDragging
                                    ? "border-sky-500 bg-sky-500/10"
                                    : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10"
                            )}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileInputChange}
                            />
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-sky-500/10 flex items-center justify-center">
                                    <Upload className="h-6 w-6 text-sky-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">
                                        Arraste a imagem aqui ou clique para selecionar
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Radiografia panorâmica, periapical, CBCT ou foto intraoral
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                    <span>JPEG, PNG</span>
                                    <span>•</span>
                                    <span>Máx 10MB</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/20">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full max-h-64 object-contain"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                                onClick={removeImage}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1 text-xs text-white">
                                <ImageIcon className="h-3 w-3" />
                                {imageFile?.name}
                            </div>
                        </div>
                    )}
                </div>

                {/* Exam Type */}
                <FormField
                    control={form.control}
                    name="examType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Tipo de Exame *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Selecione o tipo de exame" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                    <SelectItem value="radiografia_panoramica">Radiografia Panorâmica</SelectItem>
                                    <SelectItem value="radiografia_periapical">Radiografia Periapical</SelectItem>
                                    <SelectItem value="radiografia_interproximal">Radiografia Interproximal (Bite-wing)</SelectItem>
                                    <SelectItem value="tomografia_cbct">Tomografia Computadorizada (CBCT)</SelectItem>
                                    <SelectItem value="foto_intraoral">Fotografia Intraoral</SelectItem>
                                    <SelectItem value="foto_extraoral">Fotografia Extraoral</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Clinical Notes */}
                <FormField
                    control={form.control}
                    name="clinicalNotes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Queixa Principal / Contexto Clínico</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Ex: Paciente relata dor no dente 36 ao mastigar. Histórico de endodontia prévia há 2 anos."
                                    className="bg-white/5 border-white/10 text-white min-h-[100px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription className="text-slate-400">
                                Informações clínicas ajudam a IA a fornecer uma análise mais precisa.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Focus Area */}
                <FormField
                    control={form.control}
                    name="focusArea"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Área de Foco (Opcional)</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ex: Região apical do elemento 36, ATM direita..."
                                    className="bg-white/5 border-white/10 text-white"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={isLoading || !imageFile}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-sky-500/20 gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analisando Imagem...
                        </>
                    ) : (
                        <>
                            <Scan className="h-4 w-4" />
                            Gerar Laudo Vision
                        </>
                    )}
                </Button>
            </form>
        </Form>
    )
}

// Laudo Preview Component (A4-like preview)
interface LaudoPreviewProps {
    data: {
        examType: string
        findings?: Array<{ type: string; zone: string; level: string }>
        technicalAnalysis?: string
        diagnosticHypothesis?: string
        recommendations?: string[]
    }
    imagePreview?: string
}

export function LaudoPreview({ data, imagePreview }: LaudoPreviewProps) {
    const examTypeLabels: Record<string, string> = {
        radiografia_panoramica: "Radiografia Panorâmica",
        radiografia_periapical: "Radiografia Periapical",
        radiografia_interproximal: "Radiografia Interproximal",
        tomografia_cbct: "Tomografia CBCT",
        foto_intraoral: "Fotografia Intraoral",
        foto_extraoral: "Fotografia Extraoral",
    }

    const date = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })

    return (
        <div className="bg-white text-gray-900 rounded-lg shadow-xl overflow-hidden max-w-[210mm] mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-600 to-sky-500 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">ODONTO GPT</h1>
                        <p className="text-sm text-white/80">Laudo de Análise por IA</p>
                    </div>
                    <div className="text-right text-sm">
                        <p className="font-medium">Data: {date}</p>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
                {/* Exam Info */}
                <div className="border-b pb-4">
                    <p className="text-sm text-gray-500">Tipo de Exame</p>
                    <p className="font-medium">{examTypeLabels[data.examType] || data.examType}</p>
                </div>

                {/* Image */}
                {imagePreview && (
                    <div className="border rounded-lg overflow-hidden bg-gray-50">
                        <img
                            src={imagePreview}
                            alt="Exame"
                            className="w-full max-h-48 object-contain"
                        />
                    </div>
                )}

                {/* Placeholder for findings */}
                {data.findings && data.findings.length > 0 ? (
                    <div>
                        <h3 className="font-bold text-sm uppercase text-gray-500 mb-2">Principais Achados</h3>
                        <ul className="space-y-1">
                            {data.findings.map((f, i) => (
                                <li key={i} className="text-sm flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                                    {f.type} - {f.zone}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">O laudo será gerado após a análise da imagem</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t text-xs text-gray-500">
                <p className="italic">Este laudo foi gerado por IA e serve apenas como auxílio diagnóstico.</p>
            </div>
        </div>
    )
}
