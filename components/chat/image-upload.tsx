"use client"

import { useCallback, useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { X, Upload, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react"
import Image from "next/image"
import { uploadChatImage, type UploadImageResult } from "@/lib/bunny/upload"

export type UploadedImage = {
  file: File
  preview: string
  url?: string
  path?: string
  uploading?: boolean
  error?: string
}

type ImageUploadProps = {
  onImagesChange: (images: UploadedImage[]) => void
  images: UploadedImage[]
  maxFiles?: number
  disabled?: boolean
  userId?: string
}

export function ImageUpload({
  onImagesChange,
  images,
  maxFiles = 3,
  disabled = false,
  userId = "",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || acceptedFiles.length === 0) return

      // Create preview URLs
      const newImages: UploadedImage[] = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        uploading: true,
      }))

      // Add to state immediately for preview
      onImagesChange([...images, ...newImages])
      setIsUploading(true)

      // Upload each file
      const uploadPromises = newImages.map(async (img) => {
        try {
          const result: UploadImageResult = await uploadChatImage(img.file, userId)

          if (result.success && result.url) {
            return {
              ...img,
              url: result.url,
              path: result.path,
              uploading: false,
            }
          } else {
            return {
              ...img,
              error: result.error || "Erro ao fazer upload",
              uploading: false,
            }
          }
        } catch (error) {
          return {
            ...img,
            error: error instanceof Error ? error.message : "Erro ao fazer upload",
            uploading: false,
          }
        }
      })

      const uploadedImages = await Promise.all(uploadPromises)

      // Update state with upload results
      const updatedImages = [...images]
      uploadedImages.forEach((uploadedImg) => {
        const index = updatedImages.findIndex((img) => img.file.name === uploadedImg.file.name)
        if (index !== -1) {
          updatedImages[index] = uploadedImg
        }
      })

      onImagesChange(updatedImages)
      setIsUploading(false)
    },
    [images, onImagesChange, disabled, userId]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles,
    multiple: true,
    disabled: disabled || isUploading,
  })

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  // Clean up preview URLs
  useEffect(() => {
    return () => {
      images.forEach((image) => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview)
        }
      })
    }
  }, [images])

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      {images.length < maxFiles && !disabled && (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer
            ${
              isDragActive
                ? "border-primary bg-primary/5"
                : isDragReject
                  ? "border-red-500/50 bg-red-500/5"
                  : "border-slate-700/50 hover:border-primary/50 hover:bg-slate-800/50"
            }
            ${isUploading ? "opacity-50 pointer-events-none" : ""}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            {isUploading ? (
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            ) : (
              <div
                className={`
                w-10 h-10 flex items-center justify-center rounded-full
                ${isDragActive ? "bg-primary/20" : "bg-slate-800"}
              `}
              >
                <Upload
                  className={`w-5 h-5 ${isDragActive ? "text-primary" : "text-slate-400"}`}
                />
              </div>
            )}

            <div>
              <p
                className={`text-sm font-medium ${isDragActive ? "text-primary" : "text-slate-300"}`}
              >
                {isDragActive
                  ? "Solte as imagens aqui"
                  : isDragReject
                    ? "Tipo de arquivo não suportado"
                    : "Arraste imagens ou clique para selecionar"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PNG, JPG, GIF, WebP até 10MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden bg-slate-900/50 border border-slate-700/50"
            >
              <Image
                src={image.preview}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
              />

              {/* Upload Overlay */}
              {image.uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                    <p className="text-xs text-white">Enviando...</p>
                  </div>
                </div>
              )}

              {/* Error Overlay */}
              {image.error && !image.uploading && (
                <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-3">
                  <div className="text-center space-y-1">
                    <AlertCircle className="w-6 h-6 text-white mx-auto" />
                    <p className="text-xs text-white">{image.error}</p>
                  </div>
                </div>
              )}

              {/* Remove Button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  disabled={image.uploading}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Success Indicator */}
              {image.url && !image.uploading && !image.error && (
                <div className="absolute top-2 left-2 p-1.5 rounded-lg bg-green-500/80">
                  <ImageIcon className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Count */}
      {images.length > 0 && images.length < maxFiles && (
        <p className="text-xs text-slate-500 text-center">
          {images.length} de {maxFiles} imagens
        </p>
      )}
    </div>
  )
}
