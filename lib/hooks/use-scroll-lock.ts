'use client'

import { useEffect, useCallback } from 'react'

/**
 * Hook to lock body scroll when modals/dialogs are open
 * Preserves scroll position and prevents layout shift
 *
 * @param isLocked - Whether scroll should be locked
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (isLocked) {
      const scrollY = window.scrollY
      const scrollX = window.scrollX

      // Store original styles
      const originalStyle = {
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        width: document.body.style.width,
        overflow: document.body.style.overflow,
      }

      // Lock body scroll
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = `-${scrollX}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'

      return () => {
        // Restore original styles
        document.body.style.position = originalStyle.position
        document.body.style.top = originalStyle.top
        document.body.style.left = originalStyle.left
        document.body.style.width = originalStyle.width
        document.body.style.overflow = originalStyle.overflow

        // Restore scroll position
        window.scrollTo(scrollX, scrollY)
      }
    }
  }, [isLocked])
}

/**
 * Alternative: returns lock/unlock functions for manual control
 */
export function useScrollLockManual() {
  const lock = useCallback(() => {
    if (typeof window === 'undefined') return

    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    // Store scroll position for unlock
    document.body.dataset.scrollY = String(scrollY)
  }, [])

  const unlock = useCallback(() => {
    if (typeof window === 'undefined') return

    const scrollY = Number(document.body.dataset.scrollY || '0')

    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    document.body.style.overflow = ''
    delete document.body.dataset.scrollY

    window.scrollTo(0, scrollY)
  }, [])

  return { lock, unlock }
}
