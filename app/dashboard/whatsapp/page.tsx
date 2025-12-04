"use client"

import { useEffect } from "react"
import { Loader2, MessageCircle } from "lucide-react"

export default function WhatsAppPage() {
  useEffect(() => {
    // Redireciona para o WhatsApp da Odonto GPT
    // Substitua o número abaixo pelo número real do WhatsApp da Odonto GPT
    const whatsappNumber = "5584986260850" // Formato: código do país + DDD + número sem espaços ou caracteres especiais
    const message = encodeURIComponent("Olá! Vim pelo dashboard da Odonto GPT.")
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`
    
    window.location.href = whatsappUrl
  }, [])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30 animate-pulse">
        <MessageCircle className="h-10 w-10 text-white" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">
          Redirecionando para o WhatsApp...
        </h1>
        <p className="text-sm text-slate-600">
          Você será redirecionado para conversar conosco em instantes.
        </p>
      </div>
      
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
    </div>
  )
}


