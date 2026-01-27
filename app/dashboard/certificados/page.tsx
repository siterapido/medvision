"use client"

import { useEffect, useState } from 'react'
import { Award, Download, Clock, CheckCircle2, AlertCircle, Search, ExternalLink, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ComingSoonModal } from "@/components/ui/coming-soon-modal"

interface Certificate {
    id: string
    issue_date: string
    hours: number
    certificate_url: string
    status: string
    course: {
        title: string
    }
}

interface Request {
    id: string
    request_date: string
    status: string
    course: {
        title: string
    }
}

interface Course {
    id: string
    title: string
}

export default function CertificadosPage() {
    const [certificates, setCertificates] = useState<Certificate[]>([])
    const [requests, setRequests] = useState<Request[]>([])
    const [availableCourses, setAvailableCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [isRequesting, setIsRequesting] = useState(false)
    const [selectedCourseId, setSelectedCourseId] = useState<string>('')
    const [comingSoonOpen, setComingSoonOpen] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [certsRes, reqsRes, coursesRes] = await Promise.all([
                fetch('/api/certificates'),
                fetch('/api/certificates/request'),
                fetch('/api/certificates/available-courses')
            ])

            if (certsRes.ok) setCertificates(await certsRes.json())
            if (reqsRes.ok) setRequests(await reqsRes.json())
            if (coursesRes.ok) setAvailableCourses(await coursesRes.json())
        } catch (error) {
            console.error('Error fetching data:', error)
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
            const res = await fetch('/api/certificates/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ course_id: selectedCourseId })
            })

            if (res.ok) {
                toast.success("Solicitação enviada com sucesso!")
                setSelectedCourseId('')
                fetchData()
            } else {
                const error = await res.json()
                toast.error(error.error || "Erro ao enviar solicitação")
            }
        } catch (error) {
            toast.error("Erro ao conectar com o servidor")
        } finally {
            setIsRequesting(false)
        }
    }

    return (
        <>
            {/* Coming Soon Modal */}
            <ComingSoonModal
                isOpen={comingSoonOpen}
                onOpenChange={setComingSoonOpen}
                title="Certificados"
                description="Valide suas conquistas com certificados reconhecidos na área odontológica."
                copy="Nossa plataforma de certificação está em desenvolvimento. Em breve você poderá solicitar e gerenciar certificados de todos os cursos completados, comprovando sua especialização e avançando em sua carreira profissional."
                icon={<Award className="h-8 w-8" />}
                primaryButtonText="Me Notificar"
                onPrimaryAction={() => {
                    toast.success("Você será notificado quando Certificados estiver disponível!")
                    setComingSoonOpen(false)
                }}
            />

            <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Certificados</h1>
                    <p className="text-muted-foreground mt-1">
                        Visualização de conquistas e solicitações de novos certificados.
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
                                    {availableCourses.map((course) => (
                                        <SelectItem key={course.id} value={course.id}>
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button variant="outline">Cancelar</Button>
                            <Button onClick={handleRequestCertificate} disabled={isRequesting || !selectedCourseId}>
                                {isRequesting ? "Enviando..." : "Confirmar Solicitação"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="issued" className="w-full">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="issued" className="gap-2">
                        <Award className="h-4 w-4" />
                        Emitidos ({certificates.length})
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="gap-2">
                        <Clock className="h-4 w-4" />
                        Solicitações ({requests.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="issued" className="mt-6">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-[240px] w-full rounded-xl" />
                            ))}
                        </div>
                    ) : certificates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {certificates.map((cert) => (
                                <Card key={cert.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border bg-card">
                                    <div className="h-2 bg-primary" />
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline" className="text-primary border-primary/20">
                                                {cert.hours} Horas
                                            </Badge>
                                            <Award className="h-6 w-6 text-primary" />
                                        </div>
                                        <CardTitle className="text-xl mt-4 group-hover:text-primary transition-colors">
                                            {cert.course?.title}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                                            Emitido em {new Date(cert.issue_date).toLocaleDateString('pt-BR')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardFooter className="pt-4 border-t border-border/50">
                                        <Button variant="outline" className="w-full gap-2 border-primary/20 hover:bg-primary hover:text-white transition-all" asChild>
                                            <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4" />
                                                Baixar Certificado (PDF)
                                            </a>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-16 text-center rounded-3xl bg-muted/20 border-2 border-dashed border-border/50">
                            <Award className="h-20 w-20 text-muted-foreground/10 mb-6" />
                            <h2 className="text-2xl font-semibold">Nenhum certificado emitido</h2>
                            <p className="text-muted-foreground max-w-md mt-2">
                                Comece agora seus estudos e conquiste suas certificações para impulsionar sua carreira.
                            </p>
                        </div>
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
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
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
        </>
    )
}
