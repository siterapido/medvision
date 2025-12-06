"use client"

import { useState, useCallback } from "react"
import Cropper, { Area, Point } from "react-easy-crop"
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
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Não foi possível obter contexto do canvas")
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

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

/**
 * Cria elemento de imagem a partir de URL
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.src = url
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
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropAreaComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return

    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      onCropComplete(croppedBlob)
    } catch (error) {
      console.error("Erro ao cortar imagem:", error)
    }
  }, [imageSrc, croppedAreaPixels, onCropComplete])

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
          <div className="relative h-[400px] w-full bg-slate-900 rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropAreaComplete}
              objectFit="contain"
              style={{
                containerStyle: {
                  backgroundColor: "#0f172a",
                },
                cropAreaStyle: {
                  border: "2px solid #06b6d4",
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
                },
              }}
            />
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
            disabled={isProcessing || !croppedAreaPixels}
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



