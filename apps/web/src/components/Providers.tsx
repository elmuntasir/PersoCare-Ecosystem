'use client'

import { ReactNode } from 'react'
import { AvatarProvider } from '@/contexts/AvatarContext'
import { RoleProvider } from '@/contexts/RoleContext'
import { FloatingChatButton } from '@/components/chat/FloatingChatButton'

/**
 * Thin client boundary that wraps all app-level providers.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AvatarProvider>
      <RoleProvider>
        {children}
        <FloatingChatButton />
      </RoleProvider>
    </AvatarProvider>
  )
}
