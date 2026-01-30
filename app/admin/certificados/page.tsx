"use client"

import { useEffect, useState } from 'react'
import { Award, Check, X, Eye, MoreHorizontal, Download, FileText, User, BookOpen, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CertificateRequest {
    id: string
    status: string
    request_date: string
    user_id: string
    course_id: string
    profile: {
        name: string
        email: string
    }
    course: {
        title: string
    }
}

interface IssuedCertificate {
    id: string
    issue_date: string
    hours: number
    certificate_url: string
    profile: {
        name: string
        email: string
    }
    course: {
        title: string
    }
}

export default function AdminCertificadosPage() {
    const [requests, setRequests] = useState<CertificateRequest[]>([])
    const [issuedCerts, setIssuedCerts] = useState<IssuedCertificate[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isIssuing, setIsIssuing] = useState(false)

    // Issuance Form State
    const [selectedRequest, setSelectedRequest] = useState<CertificateRequest | null>(null)
    const [hours, setHours] = useState(20)
    const [certUrl, setCertUrl] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Import server action dynamically or use from a separate file if client component
            const { getCertificateTemplates } = await import('@/app/actions/certificates')

            const [reqsRes, certsRes, tmplData] = await Promise.all([
                fetch('/api/admin/certificate-requests').catch(() => ({ ok: false, json: async () => [] })),
                fetch('/api/admin/certificates').catch(() => ({ ok: false, json: async () => [] })),
                getCertificateTemplates().catch(() => [])
            ])

            if (reqsRes.ok) setRequests(await reqsRes.json())
            if (certsRes.ok) setIssuedCerts(await certsRes.json())
            setTemplates(tmplData || [])
        } catch (error) {
            console.error('Error fetching admin data:', error)
            toast.error("Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    const handleIssueCertificate = async () => {
        if (!selectedRequest || !certUrl) {
            toast.error("Informe a URL do certificado")
            return
        }

        setIsIssuing(true)
        try {
            // 1. Create certificate record
            const certRes = await fetch('/api/admin/certificates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: selectedRequest.user_id,
                    course_id: selectedRequest.course_id,
                    hours,
                    certificate_url: certUrl
                })
            })

            if (!certRes.ok) throw new Error("Erro ao emitir certificado")

            // 2. Update request status
            const reqRes = await fetch('/api/admin/certificate-requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedRequest.id,
                    status: 'approved',
                    admin_notes: 'Certificado emitido com sucesso'
                })
            })

            if (!reqRes.ok) throw new Error("Erro ao atualizar solicitação")

            toast.success("Certificado emitido e solicitação aprovada!")
            setSelectedRequest(null)
            setCertUrl('')
            fetchData()
        } catch (error) {
            console.error('Error issuing certificate:', error)
            toast.error("Erro ao emitir certificado")
        } finally {
            setIsIssuing(false)
        }
    }

    const handleRejectRequest = async (requestId: string) => {
        try {
            const res = await fetch('/api/admin/certificate-requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: requestId,
                    status: 'rejected',
                    admin_notes: 'Solicitação rejeitada pelo administrador'
                })
            })

            if (res.ok) {
                toast.success("Solicitação rejeitada")
                fetchData()
            }
        } catch (error) {
            toast.error("Erro ao rejeitar solicitação")
        }
    }

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold">Gestão de Certificados</h1>
                    <p className="text-muted-foreground mt-1">
                        Gera e gerencia modelos e certificados emitidos.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => window.location.href = '/admin/certificados/templates/new'}>
                        <FileText className="mr-2 h-4 w-4" />
                        Novo Modelo
                    </Button>
                    <Award className="h-10 w-10 text-primary opacity-20" />
                </div>
            </div>

            <Tabs defaultValue="templates" className="w-full">
                <TabsList className="grid w-full max-w-[600px] grid-cols-3">
                    <TabsTrigger value="templates">Modelos</TabsTrigger>
                    <TabsTrigger value="requests">Solicitações</TabsTrigger>
                    <TabsTrigger value="issued">Emitidos</TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Modelos de Certificado</CardTitle>
                            <CardDescription>Gerencie os templates disponíveis para os cursos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                                </div>
                            ) : templates.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Carga Horária</TableHead>
                                            <TableHead>Validade</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {templates.map((tmpl) => (
                                            <TableRow key={tmpl.id}>
                                                <TableCell className="font-medium">{tmpl.name}</TableCell>
                                                <TableCell>{tmpl.hours} horas</TableCell>
                                                <TableCell>{tmpl.validity_period_days ? `${tmpl.validity_period_days} dias` : 'Vitalício'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" variant="ghost" asChild>
                                                        <a href={`/admin/certificados/templates/${tmpl.id}`}>
                                                            Editar
                                                        </a>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="py-10 text-center text-muted-foreground">
                                    Nenhum modelo criado.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="requests" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Solicitações Pendentes</CardTitle>
                            <CardDescription>Estudantes aguardando a emissão de seus certificados.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                                </div>
                            ) : requests.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Estudante</TableHead>
                                            <TableHead>Curso</TableHead>
                                            <TableHead>Data Solicitação</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requests.map((req) => (
                                            <TableRow key={req.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{req.profile?.name}</span>
                                                        <span className="text-xs text-muted-foreground">{req.profile?.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{req.course?.title}</TableCell>
                                                <TableCell>{new Date(req.request_date).toLocaleDateString('pt-BR')}</TableCell>
                                                <TableCell>
                                                    <Badge variant={req.status === 'pending' ? 'outline' : req.status === 'approved' ? 'default' : 'destructive'}>
                                                        {req.status === 'pending' ? 'Pendente' : req.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {req.status === 'pending' && (
                                                        <div className="flex justify-end gap-2">
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button size="sm" variant="default" onClick={() => setSelectedRequest(req)}>
                                                                        Emitir
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Emitir Certificado</DialogTitle>
                                                                        <DialogDescription>
                                                                            Preencha os detalhes para {req.profile?.name} no curso {req.course?.title}.
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <div className="grid gap-4 py-4">
                                                                        <div className="grid gap-2">
                                                                            <Label htmlFor="hours">Carga Horária (horas)</Label>
                                                                            <Input id="hours" type="number" value={hours} onChange={e => setHours(parseInt(e.target.value))} />
                                                                        </div>
                                                                        <div className="grid gap-2">
                                                                            <Label htmlFor="url">URL do Certificado (PDF)</Label>
                                                                            <Input id="url" placeholder="https://..." value={certUrl} onChange={e => setCertUrl(e.target.value)} />
                                                                        </div>
                                                                    </div>
                                                                    <DialogFooter>
                                                                        <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancelar</Button>
                                                                        <Button onClick={handleIssueCertificate} disabled={isIssuing}>
                                                                            {isIssuing ? "Processando..." : "Emitir Certificado"}
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRejectRequest(req.id)}>
                                                                Rejeitar
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="py-10 text-center text-muted-foreground">
                                    Nenhuma solicitação encontrada.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="issued" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Certificados Emitidos</CardTitle>
                            <CardDescription>Histórico de todos os certificados gerados pelo sistema.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                                </div>
                            ) : issuedCerts.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Estudante</TableHead>
                                            <TableHead>Curso</TableHead>
                                            <TableHead>Horas</TableHead>
                                            <TableHead>Data Emissão</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {issuedCerts.map((cert) => (
                                            <TableRow key={cert.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{cert.profile?.name}</span>
                                                        <span className="text-xs text-muted-foreground">{cert.profile?.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{cert.course?.title}</TableCell>
                                                <TableCell>{cert.hours}h</TableCell>
                                                <TableCell>{new Date(cert.issue_date).toLocaleDateString('pt-BR')}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" variant="ghost" asChild>
                                                        <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="h-4 w-4 mr-2" />
                                                            Visualizar
                                                        </a>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="py-10 text-center text-muted-foreground">
                                    Nenhum certificado emitido ainda.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
