'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CharacterId, AnimationName, AvatarMode, AIProvider } from '@/types/avatar'
import { getProviders } from '@/lib/ai/providers'

export interface ChatbotState {
  isActive: boolean
  isOpen: boolean
  hasBeenActivated: boolean // persists across sessions
}

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
  chatbot: ChatbotState
  setChatbot: (state: ChatbotState) => void
  toggleChat: () => void
  activateChat: () => void
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined)

const CHAT_STORAGE_KEY = 'persocare_chatbot_state'
const AVATAR_STORAGE_KEY = 'persocare_avatar_state'

export function AvatarProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AvatarMode>('default')
  const [character, setCharacter] = useState<CharacterId>('poro')
  const [animation, setAnimation] = useState<AnimationName>('idle')
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [roundRobinEnabled, setRoundRobinEnabled] = useState(false)
  const [chatbot, setChatbotState] = useState<ChatbotState>({
    isActive: false,
    isOpen: false,
    hasBeenActivated: false,
  })

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const avatarStored = localStorage.getItem(AVATAR_STORAGE_KEY)
      if (avatarStored) {
        const data = JSON.parse(avatarStored)
        if (data.mode) setMode(data.mode)
        if (data.character) setCharacter(data.character)
        if (data.animation) setAnimation(data.animation)
        if (data.roundRobinEnabled !== undefined) setRoundRobinEnabled(data.roundRobinEnabled)
      }
      const chatStored = localStorage.getItem(CHAT_STORAGE_KEY)
      if (chatStored) {
        const data = JSON.parse(chatStored)
        setChatbotState((prev) => ({ ...prev, ...data }))
      }
    } catch {
      // Ignore parse errors
    }
    setProviders(getProviders())
  }, [])

  // Persist avatar state whenever it changes
  useEffect(() => {
    localStorage.setItem(
      AVATAR_STORAGE_KEY,
      JSON.stringify({ mode, character, animation, roundRobinEnabled })
    )
  }, [mode, character, animation, roundRobinEnabled])

  // Persist chatbot state
  useEffect(() => {
    localStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify({
        isActive: chatbot.isActive,
        hasBeenActivated: chatbot.hasBeenActivated,
        isOpen: chatbot.isOpen,
      })
    )
  }, [chatbot])

  const setChatbot = (state: ChatbotState) => {
    setChatbotState(state)
  }

  const toggleChat = () => {
    setChatbotState((prev) => ({ ...prev, isOpen: !prev.isOpen, isActive: true }))
  }

  const activateChat = () => {
    setChatbotState((prev) => ({ ...prev, isActive: true, hasBeenActivated: true }))
  }

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
        chatbot,
        setChatbot,
        toggleChat,
        activateChat,
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
