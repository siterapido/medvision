'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { motion } from "framer-motion"
import { FadeIn } from "@/components/ui/animations"
import { ArrowRight, Sparkles, Mail, Phone, Lock } from "lucide-react"
import { AgentHeroVisual } from "@/components/landing/agent-hero-visual"

export function TrialHeroSection() {
  const [formData, setFormData] = useState({
    email: '',
    whatsapp: '',
    password: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    // WhatsApp validation (basic - allows 10-15 digits)
    if (!formData.whatsapp) {
      newErrors.whatsapp = 'WhatsApp é obrigatório'
    } else if (!/^[0-9\s\-\+\(\)]{10,}$/.test(formData.whatsapp.replace(/[^\d\+\-\s\(\)]/g, ''))) {
      newErrors.whatsapp = 'WhatsApp inválido'
    }

    // Password validation (minimum 6 characters)
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo de 6 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      // Here you would normally send the data to your backend
      setSubmitted(true)
      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = '/register'
      }, 2000)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numbers, spaces, hyphens, plus, parentheses
    const filtered = value.replace(/[^\d\s\-\+\(\)]/g, '')
    setFormData(prev => ({
      ...prev,
      whatsapp: filtered
    }))
    if (errors.whatsapp) {
      setErrors(prev => ({
        ...prev,
        whatsapp: ''
      }))
    }
  }

  return (
    <section id="hero-section" className="relative w-full min-h-[85vh] md:min-h-[90vh] flex items-center justify-center py-20 md:py-32 px-4 md:px-6 overflow-hidden z-10">
      <div className="container mx-auto">
        {/* Logo Mobile */}
        <div className="flex justify-start md:hidden mb-8">
          <Logo variant="white" width={140} height={30} />
        </div>

        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center max-w-7xl mx-auto">

          {/* Left Column - Trial Signup Form */}
          <div className="space-y-4 md:space-y-8 text-center lg:text-left order-1 relative z-10">
            <div className="flex justify-center lg:justify-start mb-6 hidden md:flex">
              <Logo variant="white" width={160} height={35} />
            </div>

            <FadeIn delay={0.1} direction="up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold mb-2 md:mb-4 backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                <span>7 Dias Grátis, Sem Cartão</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
                Sua IA especializada<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  em Odontologia
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.2} direction="up">
              <div className="space-y-3">
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                  Inteligência artificial específica para odontologia com base em livros e artigos científicos.
                </p>
                <p className="text-base text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  <span className="text-emerald-400 font-semibold">Teste 7 dias grátis</span> e veja como 2.000+ estudantes já transformaram seus estudos.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.3} direction="up">
              <form onSubmit={handleSubmit} className="space-y-4 mt-8 max-w-lg mx-auto lg:mx-0">
                {/* Email Input */}
                <div className="relative">
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus-within:border-emerald-500/50 focus-within:bg-slate-900/80 transition-all">
                    <Mail className="w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      name="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none text-sm"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1 ml-4">{errors.email}</p>
                  )}
                </div>

                {/* WhatsApp Input */}
                <div className="relative">
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus-within:border-emerald-500/50 focus-within:bg-slate-900/80 transition-all">
                    <Phone className="w-5 h-5 text-slate-500" />
                    <input
                      type="tel"
                      name="whatsapp"
                      placeholder="(11) 99999-9999"
                      value={formData.whatsapp}
                      onChange={handleWhatsAppChange}
                      className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none text-sm"
                    />
                  </div>
                  {errors.whatsapp && (
                    <p className="text-red-400 text-xs mt-1 ml-4">{errors.whatsapp}</p>
                  )}
                </div>

                {/* Password Input */}
                <div className="relative">
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus-within:border-emerald-500/50 focus-within:bg-slate-900/80 transition-all">
                    <Lock className="w-5 h-5 text-slate-500" />
                    <input
                      type="password"
                      name="password"
                      placeholder="Crie uma senha"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none text-sm"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs mt-1 ml-4">{errors.password}</p>
                  )}
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={submitted}
                  className="w-full rounded-full py-4 text-base font-semibold shadow-[0_10px_40px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all border-0 text-white disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{
                    background: submitted
                      ? 'linear-gradient(135deg, #059669 0%, #0d9488 100%)'
                      : 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)'
                  }}
                  whileHover={!submitted ? { scale: 1.05 } : {}}
                  whileTap={!submitted ? { scale: 0.95 } : {}}
                >
                  {submitted ? (
                    <span className="flex items-center justify-center gap-2">
                      ✓ Iniciando seu teste...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Iniciar 7 Dias Grátis
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </motion.button>

                <p className="text-xs text-slate-500 text-center">
                  Sem compromisso. Cancele a qualquer momento.
                </p>
              </form>
            </FadeIn>

            {/* Social Proof */}
            <FadeIn delay={0.4} direction="up">
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-400">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0F192F] bg-slate-200 bg-cover bg-center" style={{ backgroundImage: `url(https://api.dicebear.com/9.x/avataaars/svg?seed=${i})` }} />
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-[#0F192F] bg-slate-800 flex items-center justify-center text-xs font-bold text-white">+2k</div>
                </div>
                <span>Dentistas já usam Odonto GPT</span>
              </div>
            </FadeIn>
          </div>

          {/* Right Column - Hero Visual */}
          <div className="order-2 lg:order-2 relative z-0 flex justify-center lg:justify-end mt-12 lg:mt-0">
            <FadeIn delay={0.2} className="w-full max-w-[280px] sm:max-w-md lg:max-w-2xl">
              <AgentHeroVisual />
            </FadeIn>
          </div>

        </div>
      </div>
    </section>
  )
}
