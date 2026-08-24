'use client'

import { useEffect, useRef } from 'react'

interface FrameTiming {
  frameIndex: number
  duration: number
}

interface SpriteSheetAnimationProps {
  spriteSheetUrl: string
  fallbackUrl?: string
  /** Source frame size – kept for API compat, not used in CSS sprite rendering */
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

/**
 * Renders a sprite-sheet animation using CSS background-image + background-position.
 * This avoids all canvas sizing / object-fit issues and is GPU-accelerated.
 *
 * background-size trick:
 *   `${cols * 100}% ${rows * 100}%` scales the sheet so that exactly one frame
 *   fits inside the container, regardless of container size.
 *
 * background-position trick:
 *   `${col/(cols-1)*100}% ${row/(rows-1)*100}%` selects the correct frame cell.
 */
export function SpriteSheetAnimation({
  spriteSheetUrl,
  fallbackUrl,
  columns,
  rows,
  totalFrames,
  fps = 10,
  loop = true,
  timings,
  className = '',
  autoplay = true,
  onComplete,
  onClick,
}: SpriteSheetAnimationProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const div = divRef.current
    if (!div) return

    // Apply background-size once — scales full sheet so one frame = container
    div.style.backgroundSize = `${columns * 100}% ${rows * 100}%`
    div.style.backgroundRepeat = 'no-repeat'

    // Try primary url; fall back on error
    let currentUrl = spriteSheetUrl
    const applyUrl = (url: string) => {
      div.style.backgroundImage = `url("${url}")`
    }
    applyUrl(currentUrl)

    const checkFallback = () => {
      if (fallbackUrl && currentUrl !== fallbackUrl) {
        currentUrl = fallbackUrl
        applyUrl(fallbackUrl)
      }
    }

    const probe = new Image()
    probe.onerror = checkFallback
    probe.src = currentUrl

    const setFrame = (idx: number) => {
      const col = idx % columns
      const row = Math.floor(idx / columns)
      const xPct = columns > 1 ? (col / (columns - 1)) * 100 : 0
      const yPct = rows > 1 ? (row / (rows - 1)) * 100 : 0
      div.style.backgroundPosition = `${xPct.toFixed(4)}% ${yPct.toFixed(4)}%`
    }

    setFrame(0) // always show frame 0 immediately

    if (!autoplay || totalFrames <= 1) return

    let frameIndex = 0
    let lastTime = 0

    const getFrameDuration = (idx: number) =>
      timings?.find((t) => t.frameIndex === idx)?.duration ?? 1000 / fps

    const tick = (ts: number) => {
      if (lastTime === 0) lastTime = ts
      const elapsed = ts - lastTime
      const duration = getFrameDuration(frameIndex)

      if (elapsed >= duration) {
        lastTime = ts - (elapsed % duration)
        frameIndex++

        if (frameIndex >= totalFrames) {
          if (loop) {
            frameIndex = 0
          } else {
            setFrame(totalFrames - 1)
            onComplete?.()
            return // stop RAF
          }
        }

        setFrame(frameIndex)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      probe.onerror = null
    }
  }, [spriteSheetUrl, fallbackUrl, columns, rows, totalFrames, fps, loop, timings, autoplay, onComplete])

  return (
    <div
      ref={divRef}
      className={className}
      onClick={onClick}
      style={{
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${columns * 100}% ${rows * 100}%`,
        backgroundPosition: '0% 0%',
      }}
    />
  )
}
