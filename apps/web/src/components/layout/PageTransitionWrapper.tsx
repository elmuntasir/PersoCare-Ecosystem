'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRole } from '@/contexts/RoleContext'
import type { ReactNode } from 'react'

interface PageTransitionWrapperProps {
  children: ReactNode
}

const variants = {
  idle: {
    scale: 1,
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      type: 'spring' as const,
      stiffness: 320,
      damping: 28,
      mass: 0.75,
    },
  },
  out: {
    scale: 0.965,
    opacity: 0.55,
    filter: 'blur(1.5px)',
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 1, 1] as [number, number, number, number],
    },
  },
  in: {
    scale: 1,
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      type: 'spring' as const,
      stiffness: 320,
      damping: 28,
      mass: 0.75,
    },
  },
}

export function PageTransitionWrapper({ children }: PageTransitionWrapperProps) {
  const { switchPhase } = useRole()

  return (
    <motion.div
      animate={switchPhase}
      variants={variants}
      initial={false}
      className="flex-1 flex flex-col min-w-0 h-full overflow-hidden origin-top"
      style={{ willChange: 'transform, opacity, filter' }}
    >
      {children}
    </motion.div>
  )
}
