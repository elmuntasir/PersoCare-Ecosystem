'use client'

import { AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { PageTransition } from '@/components/layout/PageTransition'

interface PageAnimationShellProps {
  children: ReactNode
  className?: string
}

export function PageAnimationShell({
  children,
  className = 'flex-1 min-h-0',
}: PageAnimationShellProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <PageTransition key={pathname} className={className}>
        {children}
      </PageTransition>
    </AnimatePresence>
  )
}
