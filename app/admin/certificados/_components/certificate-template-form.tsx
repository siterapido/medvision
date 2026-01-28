"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { CertificateRenderer } from "@/components/certificates/certificate-renderer"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Trash, Save, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { certificateTemplateSchema, type CertificateTemplateFormData } from "@/lib/validations/certificate"
import { createCertificateTemplate, updateCertificateTemplate } from "@/app/actions/certificates"

interface CertificateTemplateFormProps {
    initialData?: any
    courses: { id: string; title: string }[]
}

export function CertificateTemplateForm({ initialData, courses }: CertificateTemplateFormProps) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)

    const form = useForm<CertificateTemplateFormData>({
        resolver: zodResolver(certificateTemplateSchema),
        defaultValues: initialData || {
            name: "",
            description: "",
            hours: 20,
            background_url: "",
            signatures: [{ name: "", role: "", imageUrl: "" }],
            layout_config: {},
            validity_period_days: null,
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "signatures",
    })

    // Watch for preview
    const watchAllFields = form.watch()

    async function onSubmit(data: CertificateTemplateFormData) {
        setSaving(true)
        try {
            let result
            if (initialData?.id) {
                result = await updateCertificateTemplate(initialData.id, data)
            } else {
                result = await createCertificateTemplate(data)
            }

            if (result.success) {
                toast.success(initialData ? "Modelo atualizado!" : "Modelo criado!")
                router.push("/admin/certificados")
            } else {
                toast.error(result.error || "Erro ao salvar modelo")
            }
        } catch (error) {
            toast.error("Erro inesperado")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* FORM SIDE */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-semibold">
                        {initialData ? "Editar Modelo" : "Novo Modelo"}
                    </h2>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Modelo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Certificado Padrão 2024" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="hours"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Carga Horária (Padrão)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="validity_period_days"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Validade (Dias)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Deixe vazio para vitalício"
                                                {...field}
                                                value={field.value || ''}
                                                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="course_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vincular a Curso (Opcional)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um curso..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhum</SelectItem>
                                            {courses.map(course => (
                                                <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="background_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL da Imagem de Fundo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://..." {...field} />
                                    </FormControl>
                                    <FormDescription>Recomendado: 1920x1080px Landscape</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Separator />

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Assinaturas</h3>
                                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", role: "", imageUrl: "" })}>
                                    <Plus className="mr-2 h-4 w-4" /> Adicionar
                                </Button>
                            </div>

                            {fields.map((field, index) => (
                                <Card key={field.id}>
                                    <CardContent className="pt-6 grid gap-4 relative">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>

                                        <FormField
                                            control={form.control}
                                            name={`signatures.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nome do Assinante</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`signatures.${index}.role`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Cargo</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`signatures.${index}.imageUrl`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>URL da Assinatura</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Button type="submit" disabled={saving} className="w-full">
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {initialData ? "Salvar Alterações" : "Criar Modelo"}
                        </Button>
                    </form>
                </Form>
            </div>

            {/* PREVIEW SIDE */}
            <div className="relative">
                <div className="sticky top-10 w-full">
                    <h3 className="text-lg font-medium mb-4">Pré-visualização</h3>
                    <CertificateRenderer
                        data={{
                            studentName: "Nome do Estudante",
                            courseTitle: "Nome do Curso",
                            hours: watchAllFields.hours,
                            date: new Date().toLocaleDateString('pt-BR'),
                            code: "XXXXX-YYYYY",
                            backgroundUrl: watchAllFields.background_url,
                            signatures: watchAllFields.signatures?.map(s => ({
                                name: s.name,
                                role: s.role,
                                imageUrl: s.imageUrl
                            }))
                        }}
                        scale={0.8}
                    />
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                        * Pré-visualização aproximada. O layout final pode variar.
                    </p>
                </div>
            </div>
        </div>
    )
}
