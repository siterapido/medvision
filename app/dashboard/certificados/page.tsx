"use client"

import { useEffect, useState } from "react"
import { Award, Download, ExternalLink, Calendar, Clock, Plus, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { CertificateRenderer } from "@/components/certificates/certificate-renderer"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function CertificadosPage() {
    const [certificates, setCertificates] = useState<any[]>([])
    const [requests, setRequests] = useState<any[]>([])
    const [availableCourses, setAvailableCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCourseId, setSelectedCourseId] = useState<string>('')
    const [isRequesting, setIsRequesting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Dynamically import server actions to avoid build issues if mixed environment
            const { getUserCertificates, getUserRequests, requestCertificate } = await import('@/app/actions/certificates')

            // We need a way to get available courses for the user to request. 
            // For now, let's fetch all courses or reuse an existing API if available, 
            // or just use what we have. 
            // Let's assume we can fetch courses from client or add another action.
            // Using a simple fetch for courses as fallback or separate action.
            // Use existing action pattern:
            const { getStudentCourses } = await import('@/app/actions/courses').catch(() => ({ getStudentCourses: async () => [] })) // Fallback if action doesn't exist

            // Actually, let's just use the certificates and requests mainly.
            // And fetch all courses.
            const apiCoursesRes = await fetch('/api/certificates/available-courses').catch(() => ({ ok: false, json: async () => [] }))

            const [certsData, reqsData, coursesJson] = await Promise.all([
                getUserCertificates(),
                getUserRequests(),
                apiCoursesRes.ok ? apiCoursesRes.json() : []
            ])

            setCertificates(certsData || [])
            setRequests(reqsData || [])
            setAvailableCourses(coursesJson)
        } catch (error) {
            console.error("Error fetching certificates:", error)
            toast.error("Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    const handleRequestCertificate = async () => {
        if (!selectedCourseId) {
            toast.error("Selecione um curso")
            return
        }
        setIsRequesting(true)

        try {
            const { requestCertificate } = await import('@/app/actions/certificates')
            const result = await requestCertificate(selectedCourseId)

            if (result.success) {
                toast.success("Solicitação enviada com sucesso!")
                setSelectedCourseId('')
                fetchData()
            } else {
                toast.error(result.error || "Erro ao solicitar")
            }
        } catch (error) {
            toast.error("Erro inesperado")
        } finally {
            setIsRequesting(false)
        }
    }

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Meus Certificados</h1>
                    <p className="text-muted-foreground mt-1">
                        Visualize e baixe seus certificados de conclusão.
                    </p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Solicitar Certificado
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Solicitar Novo Certificado</DialogTitle>
                            <DialogDescription>
                                Selecione o curso concluído para o qual você deseja solicitar o certificado.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Select onValueChange={setSelectedCourseId} value={selectedCourseId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um curso" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableCourses.length > 0 ? availableCourses.map((course) => (
                                        <SelectItem key={course.id} value={course.id}>
                                            {course.title}
                                        </SelectItem>
                                    )) : (
                                        <SelectItem value="none" disabled>Nenhum curso disponível para solicitação</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedCourseId('')}>Cancelar</Button>
                            <Button onClick={handleRequestCertificate} disabled={isRequesting || !selectedCourseId}>
                                {isRequesting ? "Enviando..." : "Confirmar Solicitação"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="issued" className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                    <TabsTrigger value="issued">Emitidos</TabsTrigger>
                    <TabsTrigger value="requests">Solicitações</TabsTrigger>
                </TabsList>

                <TabsContent value="issued" className="mt-6">
                    {loading ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
                        </div>
                    ) : certificates.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {certificates.map((cert) => (
                                <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-all group">
                                    <div className="aspect-video relative bg-slate-100 flex items-center justify-center overflow-hidden">
                                        {cert.template?.background_url ? (
                                            <img
                                                src={cert.template.background_url}
                                                alt="Certificate Preview"
                                                className="w-full h-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <Award className="h-16 w-16 text-slate-300" />
                                        )}
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                                    </div>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline" className="border-primary/20 text-primary">
                                                {cert.metadata?.hours || cert.template?.hours || 0} Horas
                                            </Badge>
                                        </div>
                                        <CardTitle className="line-clamp-1 mt-2">{cert.course?.title || cert.metadata?.course_title || "Curso Odonto GPT"}</CardTitle>
                                        <CardDescription className="flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                                            Emitido em {new Date(cert.issue_date).toLocaleDateString('pt-BR')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button className="w-full">
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    Visualizar Certificado
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-[900px] w-full p-0 bg-transparent border-none shadow-none flex justify-center">
                                                <CertificateRenderer
                                                    data={{
                                                        studentName: cert.metadata?.student_name || "Estudante",
                                                        courseTitle: cert.metadata?.course_title || cert.course?.title || "Curso",
                                                        hours: cert.metadata?.hours || cert.template?.hours || 0,
                                                        date: new Date(cert.issue_date).toLocaleDateString('pt-BR'),
                                                        code: cert.code,
                                                        backgroundUrl: cert.template?.background_url,
                                                        signatures: cert.template?.signatures
                                                    }}
                                                    scale={1}
                                                />
                                            </DialogContent>
                                        </Dialog>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                                <Award className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-lg font-medium">Você ainda não possui certificados.</p>
                                <p className="text-sm">Complete cursos para ganhar seus certificados.</p>
                                <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/dashboard/cursos'}>
                                    Ir para Cursos
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="requests" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Solicitações</CardTitle>
                            <CardDescription>Acompanhe o status das suas solicitações de certificados.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                                </div>
                            ) : requests.length > 0 ? (
                                <div className="space-y-4">
                                    {requests.map((req) => (
                                        <div key={req.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                                            <div className="flex gap-4 items-center">
                                                <div className={cn(
                                                    "p-2 rounded-full",
                                                    req.status === 'pending' ? "bg-amber-500/10" :
                                                        req.status === 'approved' ? "bg-green-500/10" : "bg-red-500/10"
                                                )}>
                                                    <Clock className={cn(
                                                        "h-5 w-5",
                                                        req.status === 'pending' ? "text-amber-500" :
                                                            req.status === 'approved' ? "text-green-500" : "text-red-500"
                                                    )} />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium">{req.course?.title}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Solicitado em {new Date(req.request_date).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={req.status === 'pending' ? 'outline' : req.status === 'approved' ? 'default' : 'destructive'}>
                                                {req.status === 'pending' ? 'Pendente' : req.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    Nenhuma solicitação realizada ainda.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
