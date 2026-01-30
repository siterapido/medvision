
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface UseImageUploadReturn {
    uploadImage: (file: File) => Promise<string | null>
    isUploading: boolean
    error: string | null
}

export function useImageUpload(): UseImageUploadReturn {
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const uploadImage = async (file: File): Promise<string | null> => {
        setIsUploading(true)
        setError(null)

        try {
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `chat-uploads/${fileName}`

            // Upload the file
            const { error: uploadError } = await supabase.storage
                .from('public-assets') // Adjust bucket name if needed
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            // Get public URL
            const { data } = supabase.storage
                .from('public-assets')
                .getPublicUrl(filePath)

            return data.publicUrl
        } catch (err) {
            console.error("Error uploading image:", err)
            setError(err instanceof Error ? err.message : "Failed to upload image")
            return null
        } finally {
            setIsUploading(false)
        }
    }

    return { uploadImage, isUploading, error }
}
