'use client'

import { useMemo } from 'react'
import { useAvatar } from '@/contexts/AvatarContext'
import { SpriteSheetAnimation } from '@/components/ui/SpriteSheetAnimation'
import { getSpriteSheetPath, getAnimationConfig, CHARACTERS } from '@/lib/avatar/registry'
import type { AnimationName } from '@/types/avatar'

interface FunAvatarProps {
  className?: string
  overrideAnimation?: AnimationName
  showLabel?: boolean
}

export function FunAvatar({ className = '', overrideAnimation, showLabel = true }: FunAvatarProps) {
  const { character, animation } = useAvatar()
  const currentAnimation = overrideAnimation ?? animation
  const config = getAnimationConfig(character, currentAnimation)
  const spriteSheet = getSpriteSheetPath(character, currentAnimation)

  const characterData = useMemo(
    () => CHARACTERS.find((c) => c.id === character),
    [character]
  )

  if (!config || !characterData) return null

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <SpriteSheetAnimation
        spriteSheetUrl={spriteSheet}
        frameWidth={config.frameWidth}
        frameHeight={config.frameHeight}
        columns={config.columns}
        rows={config.rows}
        totalFrames={config.totalFrames}
        fps={config.fps}
        loop={config.loop}
        timings={config.timings}
        className="w-full h-auto"
        autoplay={true}
      />
      {showLabel && (
        <div className="mt-1 text-xs font-mono text-[var(--ink-soft)]">
          {characterData.name} · {currentAnimation}
        </div>
      )}
    </div>
  )
}
