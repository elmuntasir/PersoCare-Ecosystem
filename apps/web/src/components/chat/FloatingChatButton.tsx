'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAvatar } from '@/contexts/AvatarContext'
import {
  CHARACTERS,
  getSpriteSheetPath,
  getFallbackSpriteSheetPath,
  getAnimationConfig,
} from '@/lib/avatar/registry'
import { SpriteSheetAnimation } from '@/components/ui/SpriteSheetAnimation'
import { Bot, X } from 'lucide-react'
import { ChatDrawer } from './ChatDrawer'

export function FloatingChatButton() {
  const { mode, character, chatbot, toggleChat } = useAvatar()
  const pathname = usePathname()
  const ringRef = useRef<HTMLSpanElement>(null)

  // Fire a CSS pulse ring every 10 s when chat is closed – no layout movement
  useEffect(() => {
    if (chatbot.isOpen) return
    const ring = ringRef.current
    if (!ring) return

    const fire = () => {
      ring.classList.remove('pulse-active')
      // force reflow so re-adding the class restarts the animation
      void ring.offsetWidth
      ring.classList.add('pulse-active')
    }

    fire() // fire once on mount
    const id = setInterval(fire, 10_000)
    return () => clearInterval(id)
  }, [chatbot.isOpen])

  // Hide chat on sign-in / registration / auth pages and landing page
  const isAuthOrPublicPage =
    !pathname ||
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/register' ||
    pathname.startsWith('/register/') ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname.startsWith('/public-')

  if (isAuthOrPublicPage || !chatbot.hasBeenActivated) return null

  const characterData = CHARACTERS.find((c) => c.id === character) || CHARACTERS[0]

  const renderButton = () => {
    if (mode === 'fun' && characterData) {
      // Show the character's animated idle sprite (transparent bg) instead of
      // a static still image, so the button always reflects the selected character.
      const idleSrc = getSpriteSheetPath(characterData.id, 'idle')
      const fallbackSrc = getFallbackSpriteSheetPath(characterData.id, 'idle')
      const idleConfig = getAnimationConfig(characterData.id, 'idle')

      return (
        <div className="relative w-20 h-20 bg-transparent flex items-center justify-center transition-transform hover:scale-110 drop-shadow-xl select-none">
          {/* subtle glow / pulse without blocking circle */}
          <span
            ref={ringRef}
            className="pulse-ring pointer-events-none absolute inset-0 rounded-full border-2 border-[var(--teal-900)]/40 opacity-0"
            aria-hidden
          />
          {/* Frameless transparent animated avatar */}
          <div className="w-full h-full pointer-events-none select-none">
            <SpriteSheetAnimation
              key={`${characterData.id}-button-idle`}
              spriteSheetUrl={idleSrc}
              fallbackUrl={fallbackSrc}
              frameWidth={idleConfig.frameWidth}
              frameHeight={idleConfig.frameHeight}
              columns={idleConfig.columns}
              rows={idleConfig.rows}
              totalFrames={idleConfig.totalFrames}
              fps={idleConfig.fps}
              loop={idleConfig.loop}
              timings={idleConfig.timings}
              className="w-full h-full object-contain filter drop-shadow-lg"
              autoplay={true}
            />
          </div>
        </div>
      )
    }

    return (
      <div className="relative w-16 h-16 rounded-full bg-[var(--coral)] text-white shadow-xl flex items-center justify-center border-2 border-white flex-shrink-0">
        <span
          ref={ringRef}
          className="pulse-ring pointer-events-none absolute inset-0 rounded-full border-2 border-[var(--coral)]/50 opacity-0"
          aria-hidden
        />
        <Bot className="w-7 h-7" strokeWidth={1.7} />
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
      {chatbot.isOpen && <ChatDrawer />}
      <button
        type="button"
        onClick={toggleChat}
        className="group transition-transform hover:scale-105 active:scale-95 focus:outline-hidden cursor-pointer"
        aria-label={chatbot.isOpen ? 'Close chat' : 'Open chat'}
      >
        {chatbot.isOpen ? (
          <div className="w-14 h-14 rounded-full bg-[var(--ink-soft)] text-white shadow-xl flex items-center justify-center border-2 border-white">
            <X className="w-6 h-6" strokeWidth={1.8} />
          </div>
        ) : (
          renderButton()
        )}
      </button>
    </div>
  )
}