"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { getUserCertificates } from "@/app/actions/certificates"
import { CertificateRenderer, CertificateData } from "@/components/certificates/certificate-renderer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, ExternalLink, Award, Clock, Calendar, FileCheck } from "lucide-react"
import Link from "next/link"

type CertificateWithRelations = {
    id: string
    code: string
    issue_date: string
    expiry_date: string | null
    status: string
    metadata: {
        student_name: string
        course_title: string
        hours: number
    }
    template: {
        id: string
        name: string
        background_url: string | null
        signatures: {
            name: string
            role: string
            imageUrl?: string
        }[]
    } | null
    course: {
        title: string
    } | null
}

export default function CertificadosPage() {
    const [certificates, setCertificates] = useState<CertificateWithRelations[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCertificate, setSelectedCertificate] = useState<CertificateWithRelations | null>(null)

    useEffect(() => {
        async function loadCertificates() {
            try {
                const data = await getUserCertificates()
                setCertificates(data as CertificateWithRelations[])
            } catch (error) {
                console.error("Erro ao carregar certificados:", error)
            } finally {
                setLoading(false)
            }
        }
        loadCertificates()
    }, [])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
    }

    const getCertificateData = (cert: CertificateWithRelations): CertificateData => ({
        studentName: cert.metadata?.student_name || "Estudante",
        courseTitle: cert.metadata?.course_title || cert.course?.title || "Curso",
        hours: cert.metadata?.hours || 0,
        date: formatDate(cert.issue_date),
        code: cert.code,
        backgroundUrl: cert.template?.background_url || undefined,
        signatures: cert.template?.signatures || []
    })

    if (loading) {
        return (
            <div className="flex-1 p-6">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl font-bold mb-6">Meus Certificados</h1>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-6">
                                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Award className="w-6 h-6 text-emerald-500" />
                            Meus Certificados
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Visualize e baixe seus certificados de conclusão
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href="/palestra-ia">
                                <Award className="w-4 h-4 mr-2" />
                                Palestra IA - 20h
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/consultorio-do-futuro">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Obter Novo Certificado
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Certificates List */}
                {certificates.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <FileCheck className="w-12 h-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Nenhum certificado ainda</h3>
                            <p className="text-muted-foreground mb-4 max-w-md">
                                Complete um curso ou adquira um certificado para vê-lo aqui.
                            </p>
                            <Button asChild>
                                <Link href="/consultorio-do-futuro">
                                    Ver Cursos Disponíveis
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {certificates.map((cert) => (
                            <Card
                                key={cert.id}
                                className="cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => setSelectedCertificate(cert)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg line-clamp-2">
                                            {cert.metadata?.course_title || cert.course?.title || "Certificado"}
                                        </CardTitle>
                                        <Badge variant={cert.status === 'active' ? 'default' : 'secondary'}>
                                            {cert.status === 'active' ? 'Ativo' : 'Expirado'}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        Código: {cert.code}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        <span>{cert.metadata?.hours || 0} horas</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="w-4 h-4" />
                                        <span>Emitido em {formatDate(cert.issue_date)}</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="w-full mt-2"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setSelectedCertificate(cert)
                                        }}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Visualizar
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Certificate Preview Modal */}
                {selectedCertificate && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedCertificate(null)}
                    >
                        <div
                            className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">
                                    {selectedCertificate.metadata?.course_title || "Certificado"}
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedCertificate(null)}
                                >
                                    Fechar
                                </Button>
                            </div>
                            <div className="flex justify-center mb-4">
                                <CertificateRenderer
                                    data={getCertificateData(selectedCertificate)}
                                    scale={0.9}
                                />
                            </div>
                            <div className="flex justify-center gap-4">
                                <Button onClick={() => window.print()}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Imprimir / Salvar PDF
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
