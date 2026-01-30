'use client'

import { useState, useEffect } from 'react'

/**
 * Hook seguro para detectar se estamos em mobile
 * Evita hydration mismatch retornando false no SSR
 */
export function useIsMobile(breakpoint = 768): boolean {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < breakpoint)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [breakpoint])

    return isMobile
}

/**
 * Hook para detectar se estamos no cliente (após hidratação)
 */
export function useIsClient(): boolean {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    return isClient
}
