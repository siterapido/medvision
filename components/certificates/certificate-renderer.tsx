"use client"

import React from 'react'

export interface CertificateData {
    studentName: string
    courseTitle: string
    hours: number
    date: string
    code?: string
    backgroundUrl?: string
    signatures?: {
        name: string
        role: string
        imageUrl?: string
    }[]
}

interface CertificateRendererProps {
    data: CertificateData
    scale?: number
}

export function CertificateRenderer({ data, scale = 1 }: CertificateRendererProps) {
    return (
        <div
            className="border rounded-lg shadow-xl overflow-hidden relative bg-white text-black print:shadow-none print:border-none"
            style={{
                width: `${800 * scale}px`,
                height: `${566 * scale}px`, // Aspect ratio ~1.414 (A4 Landscape ish)
                fontSize: `${scale}rem` // Scale fonts relatively
            }}
        >
            {/* Background */}
            {data.backgroundUrl ? (
                <img
                    src={data.backgroundUrl}
                    className="absolute inset-0 w-full h-full object-cover print:w-full print:h-full"
                    alt="Certificate Background"
                />
            ) : (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 print:hidden">
                    Sem fundo definido
                </div>
            )}

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-[6%] text-center z-10">
                <div className="space-y-[3%] w-full max-w-[90%] mx-auto mt-[8%]">
                    <h1 className="text-[3em] font-serif font-bold text-slate-900 tracking-wide leading-none">CERTIFICADO</h1>
                    <p className="text-[1.2em] text-slate-600 uppercase tracking-widest">DE CONCLUSÃO</p>

                    <div className="py-[4%] space-y-[1%]">
                        <p className="text-[1.1em] text-slate-700">Certificamos que</p>
                        <p className="text-[2.5em] font-cursive font-bold text-primary py-[1%] break-words leading-tight">
                            {data.studentName}
                        </p>
                        <p className="text-[1.1em] text-slate-700 max-w-[80%] mx-auto">
                            Concluiu com êxito o curso <span className="font-bold">{data.courseTitle}</span>
                            {data.hours > 0 && <span> com carga horária de {data.hours} horas</span>}.
                        </p>
                    </div>

                    <div className="flex justify-center gap-[10%] mt-[8%] pt-[4%]">
                        {data.signatures?.map((sig, i) => (
                            <div key={i} className="flex flex-col items-center gap-[0.5em]">
                                {sig.imageUrl ? (
                                    <img src={sig.imageUrl} className="h-[4em] object-contain" alt="Signature" />
                                ) : (
                                    <div className="h-[4em] w-[8em] border-b border-slate-900 mb-1" />
                                )}
                                <div className="border-t border-slate-400 min-w-[12em] pt-2">
                                    <p className="font-bold text-[1.1em] leading-tight">{sig.name || "Nome do Assinante"}</p>
                                    <p className="text-[0.9em] text-slate-500">{sig.role || "Cargo"}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {data.code && (
                        <div className="absolute bottom-[5%] right-[6%] text-right">
                            <p className="text-[0.7em] text-slate-400">Código: {data.code}</p>
                            <p className="text-[0.7em] text-slate-400">Emitido em: {data.date}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
