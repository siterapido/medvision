'use client'

import { useCallback, useRef } from 'react'

const SOUND_API = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'

interface UseSoundNotificationReturn {
    playSuccess: () => void
}

export function useSoundNotification(): UseSoundNotificationReturn {
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const playSuccess = useCallback(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio(SOUND_API)
            audioRef.current.volume = 0.4
        }
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
    }, [])

    return { playSuccess }
}