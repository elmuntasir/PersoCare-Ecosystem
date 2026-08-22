'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CharacterId, AnimationName, AvatarMode, AIProvider } from '@/types/avatar'
import { getProviders } from '@/lib/ai/providers'

interface AvatarContextType {
  mode: AvatarMode
  setMode: (mode: AvatarMode) => void
  character: CharacterId
  setCharacter: (character: CharacterId) => void
  animation: AnimationName
  setAnimation: (animation: AnimationName) => void
  providers: AIProvider[]
  setProviders: (providers: AIProvider[]) => void
  roundRobinEnabled: boolean
  setRoundRobinEnabled: (enabled: boolean) => void
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined)

const STORAGE_KEY = 'persocare_avatar_state'

export function AvatarProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AvatarMode>('default')
  const [character, setCharacter] = useState<CharacterId>('poro')
  const [animation, setAnimation] = useState<AnimationName>('idle')
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [roundRobinEnabled, setRoundRobinEnabled] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        if (data.mode) setMode(data.mode)
        if (data.character) setCharacter(data.character)
        if (data.animation) setAnimation(data.animation)
        if (data.roundRobinEnabled !== undefined) setRoundRobinEnabled(data.roundRobinEnabled)
      }
    } catch {
      // Ignore parse errors
    }
    setProviders(getProviders())
  }, [])

  // Persist avatar state whenever it changes
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ mode, character, animation, roundRobinEnabled })
    )
  }, [mode, character, animation, roundRobinEnabled])

  return (
    <AvatarContext.Provider
      value={{
        mode,
        setMode,
        character,
        setCharacter,
        animation,
        setAnimation,
        providers,
        setProviders,
        roundRobinEnabled,
        setRoundRobinEnabled,
      }}
    >
      {children}
    </AvatarContext.Provider>
  )
}

export function useAvatar(): AvatarContextType {
  const context = useContext(AvatarContext)
  if (!context) throw new Error('useAvatar must be used within AvatarProvider')
  return context
}
