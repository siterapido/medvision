"use client"

import { useState, useCallback, useRef } from "react"
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Loader2, ZoomIn, ZoomOut } from "lucide-react"

interface ImageCropDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  onCropComplete: (croppedImage: Blob) => void
  aspect?: number
  isProcessing?: boolean
}

/**
 * Cria uma imagem cortada a partir da área selecionada
 */
async function getCroppedImg(
  imgEl: HTMLImageElement,
  pixelCrop: PixelCrop,
  zoom: number
): Promise<Blob> {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Não foi possível obter contexto do canvas")
  }

  const scaleX = imgEl.naturalWidth / (imgEl.width * zoom)
  const scaleY = imgEl.naturalHeight / (imgEl.height * zoom)

  const cropX = pixelCrop.x * scaleX
  const cropY = pixelCrop.y * scaleY
  const cropW = pixelCrop.width * scaleX
  const cropH = pixelCrop.height * scaleY

  canvas.width = cropW
  canvas.height = cropH

  ctx.drawImage(imgEl, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error("Falha ao criar blob da imagem"))
      }
    }, "image/jpeg", 0.95)
  })
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspect = 16 / 9,
  isProcessing = false,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [zoom, setZoom] = useState(1)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleConfirm = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return

    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop, zoom)
      onCropComplete(croppedBlob)
    } catch (error) {
      console.error("Erro ao cortar imagem:", error)
    }
  }, [completedCrop, zoom, onCropComplete])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-[#0F192F] border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">
            Ajustar Imagem
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Posicione e redimensione a imagem para criar a miniatura perfeita
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Área de crop */}
          <div className="relative h-[400px] w-full bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center [&_.ReactCrop__crop-selection]:border-cyan-500 [&_.ReactCrop__crop-selection]:border-2 [&_.ReactCrop__drag-handle]:bg-cyan-500 [&_.ReactCrop__drag-handle]:w-3 [&_.ReactCrop__drag-handle]:h-3">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              className="max-h-full"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Imagem para corte"
                className="max-h-[380px] object-contain"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              />
            </ReactCrop>
          </div>

          {/* Controle de zoom */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <ZoomOut className="h-4 w-4 text-slate-400" />
                Zoom
              </label>
              <span className="text-sm text-slate-400">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <Slider
                value={[zoom]}
                onValueChange={(values) => setZoom(values[0])}
                min={1}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="border-slate-600 text-white hover:bg-slate-700"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing || !completedCrop}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Confirmar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
