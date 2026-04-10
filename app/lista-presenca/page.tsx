"use client"

import Link from "next/link"
import { AttendanceForm } from "@/components/auth/attendance-form"
import { Logo } from "@/components/logo"
import { Brain, Sparkles, Shield, GraduationCap, Clock, Gift } from "lucide-react"

export default function AttendancePage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#080D19]">
      {/* ATMOSPHERIC BACKGROUND SYSTEM - Same as Register Page */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Base: Pure deep dark with subtle warm undertone */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 150% 100% at 50% 0%, #0D1628 0%, #080D19 50%, #060A14 100%)
            `
          }}
        />

        {/* Nebula Layer 1: Large diffuse cyan glow - top left */}
        <div
          className="absolute w-[800px] h-[800px] -top-[200px] -left-[200px] opacity-[0.06]"
          style={{
            background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />

        {/* Nebula Layer 2: Subtle purple accent - center right */}
        <div
          className="absolute w-[600px] h-[600px] top-[30%] -right-[150px] opacity-[0.04]"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
            filter: 'blur(120px)',
          }}
        />

        {/* Nebula Layer 3: Deep cyan - bottom */}
        <div
          className="absolute w-[1000px] h-[500px] -bottom-[100px] left-[20%] opacity-[0.05]"
          style={{
            background: 'radial-gradient(ellipse, #0891b2 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />

        {/* Subtle noise texture for depth */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Minimal star field - tiny dots */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(1px 1px at 20% 15%, rgba(255,255,255,0.4) 0%, transparent 100%),
              radial-gradient(1px 1px at 40% 35%, rgba(255,255,255,0.3) 0%, transparent 100%),
              radial-gradient(1px 1px at 60% 20%, rgba(255,255,255,0.35) 0%, transparent 100%),
              radial-gradient(1px 1px at 80% 40%, rgba(255,255,255,0.25) 0%, transparent 100%),
              radial-gradient(1px 1px at 10% 60%, rgba(255,255,255,0.3) 0%, transparent 100%),
              radial-gradient(1px 1px at 30% 80%, rgba(255,255,255,0.35) 0%, transparent 100%),
              radial-gradient(1px 1px at 50% 70%, rgba(255,255,255,0.2) 0%, transparent 100%),
              radial-gradient(1px 1px at 70% 85%, rgba(255,255,255,0.3) 0%, transparent 100%),
              radial-gradient(1px 1px at 90% 55%, rgba(255,255,255,0.25) 0%, transparent 100%),
              radial-gradient(1.5px 1.5px at 25% 45%, rgba(6,182,212,0.6) 0%, transparent 100%),
              radial-gradient(1.5px 1.5px at 75% 65%, rgba(139,92,246,0.5) 0%, transparent 100%)
            `,
            backgroundSize: '100% 100%',
          }}
        />

        {/* Tech Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 0%, transparent 85%)'
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 0%, transparent 90%)'
          }}
        />
      </div>

      {/* Scrollable Content Wrapper */}
      <div className="relative z-10 h-screen overflow-y-auto overflow-x-hidden scrollbar-visible">
        <div className="min-h-screen flex items-center justify-center py-8 px-4">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-block">
                <Logo variant="white" width={160} height={35} />
              </Link>
            </div>

            {/* Attendance Card */}
            <div className="relative">
              {/* Glow effect behind card */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#0891b2]/20 to-[#8b5cf6]/20 rounded-3xl blur-xl opacity-50" />

              <div className="relative bg-[#0F172A]/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/30 mb-4">
                    <GraduationCap className="w-4 h-4 text-[#22d3ee]" />
                    <span className="text-[#22d3ee] text-xs font-semibold">Lista de Presença</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">Confirme sua Presença</h1>
                  <p className="text-slate-400 text-sm">Preencha o formulário e ganhe acesso à aula + bônus</p>
                </div>

                {/* Benefits Banner */}
                <div className="bg-gradient-to-br from-emerald-500/10 via-[#22d3ee]/10 to-purple-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 p-2 rounded-lg mt-0.5">
                      <Clock className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-300">
                        ✓ Presença garantida na aula
                      </p>
                      <p className="text-xs text-emerald-400/70 mt-0.5">
                        Você receberá todas as informações por email e WhatsApp
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-gradient-to-br from-[#22d3ee]/20 to-[#0891b2]/20 p-2 rounded-lg mt-0.5">
                      <Gift className="h-4 w-4 text-[#22d3ee]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#22d3ee]">
                        ✓ 7 dias de MedVision gratuito
                      </p>
                      <p className="text-xs text-[#22d3ee]/70 mt-0.5">
                        Acesso completo à plataforma de IA odontológica
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <AttendanceForm />

                {/* Divider */}
                <div className="mt-8 pt-6 border-t border-slate-800">
                  <p className="text-center text-sm text-slate-400">
                    Já tem uma conta?{" "}
                    <Link
                      href="/login"
                      className="text-[#22d3ee] hover:text-[#67e8f9] font-semibold transition-colors"
                    >
                      Entrar
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Back to home */}
            <div className="mt-6 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#22d3ee] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar para o site
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Dados seguros</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Acesso imediato</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                <span>IA Especializada</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-visible {
          scrollbar-width: thin;
          scrollbar-color: rgba(34, 211, 238, 0.3) rgba(15, 23, 42, 0.3);
        }

        .scrollbar-visible::-webkit-scrollbar {
          width: 8px;
        }

        .scrollbar-visible::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 4px;
        }

        .scrollbar-visible::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.3);
          border-radius: 4px;
          transition: background 0.2s;
        }

        .scrollbar-visible::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.5);
        }

        /* Ensure smooth scrolling */
        .scrollbar-visible {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  )
}
