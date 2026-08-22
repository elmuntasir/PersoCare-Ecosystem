'use client'

import { useEffect, useRef, useCallback } from 'react'

interface FrameTiming {
  frameIndex: number
  duration: number
}

interface SpriteSheetAnimationProps {
  spriteSheetUrl: string
  frameWidth: number
  frameHeight: number
  columns: number
  rows: number
  totalFrames: number
  fps?: number
  loop?: boolean
  timings?: FrameTiming[]
  className?: string
  autoplay?: boolean
  onComplete?: () => void
  onClick?: () => void
}

export function SpriteSheetAnimation({
  spriteSheetUrl,
  frameWidth,
  frameHeight,
  columns,
  fps = 10,
  totalFrames,
  loop = true,
  timings,
  className = '',
  autoplay = true,
  onComplete,
  onClick,
}: SpriteSheetAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const playingRef = useRef(autoplay)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const drawFrame = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current
      const img = imageRef.current
      if (!canvas || !img) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const col = frameIndex % columns
      const row = Math.floor(frameIndex / columns)
      ctx.clearRect(0, 0, frameWidth, frameHeight)
      ctx.drawImage(
        img,
        col * frameWidth,
        row * frameHeight,
        frameWidth,
        frameHeight,
        0,
        0,
        frameWidth,
        frameHeight
      )
    },
    [columns, frameWidth, frameHeight]
  )

  // Load sprite sheet image
  useEffect(() => {
    const img = new Image()
    img.src = spriteSheetUrl
    img.onload = () => {
      imageRef.current = img
      drawFrame(0)
    }
    img.onerror = () =>
      console.warn('[SpriteSheetAnimation] Failed to load sprite sheet:', spriteSheetUrl)

    return () => {
      imageRef.current = null
    }
  }, [spriteSheetUrl, drawFrame])

  // Animation loop
  useEffect(() => {
    if (!playingRef.current || totalFrames === 0) return

    let frameIndex = 0

    const tick = () => {
      drawFrame(frameIndex)

      const duration = timings?.find((t) => t.frameIndex === frameIndex)?.duration ?? 1000 / fps

      frameIndex++

      if (frameIndex >= totalFrames) {
        if (loop) {
          frameIndex = 0
          timeoutRef.current = setTimeout(tick, duration)
        } else {
          playingRef.current = false
          onComplete?.()
        }
      } else {
        timeoutRef.current = setTimeout(tick, duration)
      }
    }

    timeoutRef.current = setTimeout(tick, 1000 / fps)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
    // Re-run when core animation params change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spriteSheetUrl, totalFrames, fps, loop, timings, drawFrame])

  const handleClick = onClick ?? (() => {
    playingRef.current = !playingRef.current
  })

  return (
    <canvas
      ref={canvasRef}
      width={frameWidth}
      height={frameHeight}
      className={className}
      onClick={handleClick}
      style={{
        imageRendering: 'pixelated',
        maxWidth: '100%',
        height: 'auto',
        cursor: 'pointer',
      }}
    />
  )
}
