"use client"

import { AlertCircle, X } from "lucide-react"
import { useState } from "react"

interface BodySizeAlertProps {
  isVisible?: boolean
  onClose?: () => void
  message?: string
}

export function BodySizeAlert({
  isVisible = false,
  onClose,
  message = "O arquivo ou dados enviados são muito grandes. Por favor, reduza o tamanho e tente novamente.",
}: BodySizeAlertProps) {
  const [visible, setVisible] = useState(isVisible)

  const handleClose = () => {
    setVisible(false)
    onClose?.()
  }

  if (!visible) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-2 fade-in">
      <div className="bg-red-900/90 border border-red-700 rounded-lg p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <AlertCircle className="h-5 w-5 text-red-300 flex-shrink-0" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-100 mb-1">Arquivo muito grande</h3>
            <p className="text-sm text-red-200">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className="ml-2 text-red-300 hover:text-red-100 transition-colors flex-shrink-0"
            aria-label="Fechar alerta"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
