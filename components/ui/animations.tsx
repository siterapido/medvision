'use client'

import { motion, HTMLMotionProps, Variants } from "motion/react"
import { ReactNode } from "react"

// --- Fade In ---
interface FadeInProps extends HTMLMotionProps<"div"> {
  children: ReactNode
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  distance?: number
  className?: string
  once?: boolean
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  direction = 'up',
  distance = 20,
  className,
  once = true,
  ...props
}: FadeInProps) {
  const directions = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  }

  const initial = { 
    opacity: 0, 
    ...directions[direction] 
  }

  const animate = { 
    opacity: 1, 
    x: 0, 
    y: 0 
  }

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once, margin: "-50px" }}
      transition={{ 
        duration, 
        delay, 
        ease: [0.21, 0.47, 0.32, 0.98] // Smooth custom easing
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// --- Stagger Container ---
interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  children: ReactNode
  delay?: number
  staggerDelay?: number
  className?: string
  viewportOnce?: boolean
}

export function StaggerContainer({
  children,
  delay = 0,
  staggerDelay = 0.1,
  className,
  viewportOnce = true,
  ...props
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: viewportOnce, margin: "-50px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// --- Stagger Item (Child) ---
// Must be direct child of StaggerContainer to work automatically with variants
export function StaggerItem({ children, className, ...props }: HTMLMotionProps<"div">) {
  const variants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        mass: 1
      }
    },
  }

  return (
    <motion.div variants={variants} className={className} {...props}>
      {children}
    </motion.div>
  )
}

// --- Scale In ---
export function ScaleIn({ children, delay = 0, className, ...props }: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ 
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// --- Hover Card Effect ---
// Useful for wrapping cards that need pop effect
export function HoverCard({ children, className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}
