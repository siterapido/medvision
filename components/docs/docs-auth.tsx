'use client'

import { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'

interface DocsAuthProps {
  onAuthenticate: () => void
  correctPassword: string
}

export function DocsAuth({ onAuthenticate, correctPassword }: DocsAuthProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isLocked) {
      setError('Múltiplas tentativas incorretas. Tente novamente em alguns minutos.')
      return
    }

    if (password === correctPassword) {
      setError('')
      setAttempts(0)
      setPassword('')
      // Salva autenticação na sessão
      sessionStorage.setItem('docs_authenticated', 'true')
      onAuthenticate()
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setPassword('')
      setError('Senha incorreta. Tente novamente.')

      // Bloqueia após 5 tentativas
      if (newAttempts >= 5) {
        setIsLocked(true)
        setTimeout(() => {
          setIsLocked(false)
          setAttempts(0)
        }, 5 * 60 * 1000) // 5 minutos
      }
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-background text-foreground flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-heading font-semibold text-foreground">
            Documentação Protegida
          </h1>
          <p className="text-sm text-muted-foreground">
            Esta documentação é apenas para equipe interna. Digite a senha de acesso para continuar.
          </p>
        </div>

        {/* Auth Form */}
        <GlassCard hoverEffect className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha..."
                  className="w-full px-4 py-2.5 rounded-lg border border-border/40 bg-muted/20 text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:bg-muted/30 transition-all"
                  disabled={isLocked}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted/50 rounded transition-colors"
                  disabled={isLocked}
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                    : <Eye className="h-4 w-4 text-muted-foreground" />
                  }
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Attempts Counter */}
            {attempts > 0 && attempts < 5 && (
              <div className="px-3 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-400">
                {5 - attempts} tentativa{5 - attempts !== 1 ? 's' : ''} restante{5 - attempts !== 1 ? 's' : ''}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLocked || password.length === 0}
              className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {isLocked ? 'Bloqueado temporariamente' : 'Acessar Documentação'}
            </button>
          </form>
        </GlassCard>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60">
          Documentação técnica interna • MedVision v0.1.4
        </p>
      </div>
    </div>
  )
}
