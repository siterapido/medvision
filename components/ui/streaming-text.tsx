'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface StreamingTextProps {
  text: string
  className?: string
  delay?: number
  speed?: number
  cursor?: boolean
  onComplete?: () => void
}

export function StreamingText({ 
  text, 
  className, 
  delay = 0, 
  speed = 40,
  cursor = true,
  onComplete 
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [started, setStarted] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setStarted(true)
    }, delay)

    return () => clearTimeout(startTimeout)
  }, [delay])

  useEffect(() => {
    if (!started) return

    let currentIndex = 0
    // Reset if text changes
    setDisplayedText('')
    setIsComplete(false)

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText((prev) => prev + text[currentIndex])
        currentIndex++
      } else {
        clearInterval(interval)
        setIsComplete(true)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed, started, onComplete])

  return (
    <span className={cn("inline-block", className)}>
      {displayedText}
      {cursor && !isComplete && (
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          className="inline-block w-[2px] h-[1em] bg-primary ml-1 align-middle"
        />
      )}
    </span>
  )
}
