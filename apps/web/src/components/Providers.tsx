'use client'

import { ReactNode } from 'react'
import { AvatarProvider } from '@/contexts/AvatarContext'

/**
 * Thin client boundary that wraps all app-level providers.
 * Add future providers here (e.g. ThemeProvider, QueryClientProvider).
 */
export function Providers({ children }: { children: ReactNode }) {
  return <AvatarProvider>{children}</AvatarProvider>
}
