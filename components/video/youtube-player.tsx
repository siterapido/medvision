'use client'

import { useState, useRef, useEffect, memo, useCallback } from 'react'
import { Play, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface YouTubePlayerProps {
  videoId: string
  title: string
  className?: string
  thumbnailQuality?: 'default' | 'hqdefault' | 'mqdefault' | 'sddefault'
  aspect?: 'portrait' | 'landscape' | 'square'
  playButtonSize?: 'sm' | 'md' | 'lg' | 'xl'
  controls?: 0 | 1
  autoPlayOnLoad?: boolean
  hideOverlayControls?: boolean
}

export const YouTubePlayer = memo(function YouTubePlayer({ 
  videoId, 
  title, 
  className,
  thumbnailQuality = 'hqdefault',
  aspect = 'landscape',
  playButtonSize = 'xl',
  controls = 1,
  autoPlayOnLoad = false,
  hideOverlayControls = false
}: YouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${thumbnailQuality}.jpg`

  const aspectClass = (
    aspect === 'portrait' ? 'aspect-[9/16]' :
    aspect === 'square' ? 'aspect-square' :
    'aspect-video'
  )

  const buttonSizeClass = (
    playButtonSize === 'sm' ? 'w-16 h-16' :
    playButtonSize === 'lg' ? 'w-24 h-24' :
    playButtonSize === 'xl' ? 'w-28 h-28' :
    'w-20 h-20'
  )

  const iconSizeClass = (
    playButtonSize === 'sm' ? 'h-6 w-6' :
    playButtonSize === 'lg' ? 'h-10 w-10' :
    playButtonSize === 'xl' ? 'h-12 w-12' :
    'h-8 w-8'
  )

  // Create and mount the YouTube iframe with desired parameters
  const createIframe = useCallback((autoplay: boolean, mute: boolean) => {
    setIsLoading(true)
    const iframe = document.createElement('iframe')
    const originParam = typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : ''
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=${mute ? 1 : 0}&rel=0&modestbranding=1&controls=${controls}&enablejsapi=1&playsinline=1&iv_load_policy=3&loop=1&playlist=${videoId}${originParam}`
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
    iframe.allowFullscreen = true
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
    iframe.loading = 'lazy'
    iframe.className = 'absolute inset-0 w-full h-full rounded-xl'
    iframeRef.current = iframe
    containerRef.current?.appendChild(iframe)

    iframe.onload = () => {
      setIsLoading(false)
      setIsPlaying(true)
    }
  }, [videoId, controls])

  const handlePlay = useCallback(() => {
    if (!iframeRef.current) {
      // Create iframe when user clicks play
      createIframe(true, isMuted)
    } else {
      // If iframe exists, send play command
      iframeRef.current.contentWindow?.postMessage(
        '{"event":"command","func":"playVideo","args":""}',
        '*'
      )
      setIsPlaying(true)
    }
  }, [createIframe, isMuted])

  const handlePause = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        '{"event":"command","func":"pauseVideo","args":""}',
        '*'
      )
      setIsPlaying(false)
    }
  }, [])

  const toggleMute = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        `{"event":"command","func":"${isMuted ? 'unMute' : 'mute'}","args":""}`,
        '*'
      )
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        containerRef.current.requestFullscreen()
      }
    }
  }, [])

  const handleMouseEnter = useCallback(() => {
    setShowControls(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 2000)
  }, [])

  useEffect(() => {
    // Autoplay on load (muted) - desabilitado por padrão para melhorar performance
    // Agora o iframe só é criado quando o usuário clica no play
    if (autoPlayOnLoad && !iframeRef.current) {
      // Delay para não bloquear renderização inicial
      const timer = setTimeout(() => {
        setIsMuted(true)
        createIframe(true, true)
      }, 100)

      return () => {
        clearTimeout(timer)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [autoPlayOnLoad, createIframe])

  return (
    <div 
      className={cn(
        'relative group bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-primary/25',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        ref={containerRef}
        className={cn("relative w-full bg-gray-900 rounded-xl overflow-hidden", aspectClass)}
      >
        {/* Thumbnail or iframe */}
        {!isPlaying ? (
          <div className="relative w-full h-full">
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <button
                onClick={handlePlay}
                disabled={isLoading}
                className="absolute inset-0 w-full h-full flex items-center justify-center group"
                aria-label="Reproduzir vídeo"
              >
                <div className={cn("bg-primary/90 rounded-full flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:bg-primary", buttonSizeClass)}>
                  {isLoading ? (
                    <Loader2 className={cn("text-white animate-spin", iconSizeClass)} />
                  ) : (
                    <Play className={cn("text-white fill-white ml-1", iconSizeClass)} />
                  )}
                </div>
              </button>
            </div>
          </div>
        ) : null}

        {/* Video controls */}
        {(!hideOverlayControls && (showControls || !isPlaying)) && (
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3 bg-black/60 backdrop-blur-sm rounded-lg transform transition-all duration-300">
            <div className="flex items-center gap-3">
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className="text-white hover:text-primary transition-colors"
                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? (
                  <div className="w-3 h-3 bg-white rounded-sm" />
                ) : (
                  <Play className="h-4 w-4 fill-white" />
                )}
              </button>
              
              <button
                onClick={toggleMute}
                className="text-white hover:text-primary transition-colors"
                aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-primary transition-colors"
                aria-label="Tela cheia"
              >
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Video title overlay */}
        <div className="absolute top-4 left-4 right-4">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
            <h3 className="text-white text-sm font-medium line-clamp-2">
              {title}
            </h3>
          </div>
        </div>

        {/* Ativar som overlay (always available while muted) */}
        {isMuted && (
          <div className="absolute top-4 right-4 z-20">
            <button
              type="button"
              onClick={toggleMute}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors"
              aria-label="Ativar som"
            >
              <Volume2 className="h-4 w-4" />
              <span className="text-xs font-medium">Ativar som</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
})
