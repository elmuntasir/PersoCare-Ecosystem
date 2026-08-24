import { Character, AnimationDefinition, AnimationConfig, CharacterId, AnimationName } from '@/types/avatar'

export const CHARACTERS: Character[] = [
  {
    id: 'gulu',
    name: 'Gulu',
    emoji: '🌱',
    avatarImage: '/images/animations/gulu/gulu.png',
    description: 'A sleepy & energetic sprout',
    animations: ['idle', 'walk', 'chase', 'eat', 'sleep'],
  },
  {
    id: 'poro',
    name: 'Poro',
    emoji: '🌱',
    avatarImage: '/images/animations/poro/poro.png',
    description: 'A curious little sprout',
    animations: ['idle', 'walk', 'chase', 'eat', 'sleep'],
  },
  {
    id: 'tomo',
    name: 'Tomo',
    emoji: '🍃',
    avatarImage: '/images/animations/tomo/tomo.png',
    description: 'A gentle leaf friend',
    animations: ['idle', 'walk', 'chase', 'eat', 'sleep'],
  },
  {
    id: 'bulu',
    name: 'Bulu',
    emoji: '🌿',
    avatarImage: '/images/animations/bulu/bulu.png',
    description: 'A playful plant buddy',
    animations: ['idle', 'walk', 'chase', 'eat', 'sleep'],
  },
]


const guluIdleConfig: AnimationDefinition = {
  frameWidth: 512,
  frameHeight: 512,
  columns: 6,
  rows: 3,
  totalFrames: 18,
  fps: 3,
  loop: true,
}

const guluWalkConfig: AnimationDefinition = {
  frameWidth: 512,
  frameHeight: 512,
  columns: 6,
  rows: 3,
  totalFrames: 18,
  fps: 3,
  loop: true,
}

const guluChaseConfig: AnimationDefinition = {
  frameWidth: 512,
  frameHeight: 512,
  columns: 6,
  rows: 3,
  totalFrames: 18,
  fps: 3,
  loop: true,
  timings: [
    { frameIndex: 0, duration: 1000 / 12 },
    { frameIndex: 1, duration: 1000 / 12 },
    { frameIndex: 2, duration: 1000 / 12 },
    { frameIndex: 3, duration: 1000 / 12 },
    { frameIndex: 4, duration: 1000 / 12 },
    { frameIndex: 5, duration: 1000 / 12 },
    { frameIndex: 6, duration: 400 },
    { frameIndex: 7, duration: 300 },
    { frameIndex: 8, duration: 300 },
    { frameIndex: 9, duration: 1000 / 12 },
    { frameIndex: 10, duration: 1000 / 12 },
    { frameIndex: 11, duration: 1000 / 12 },
    { frameIndex: 12, duration: 1000 / 12 },
    { frameIndex: 13, duration: 1000 / 12 },
    { frameIndex: 14, duration: 200 },
    { frameIndex: 15, duration: 300 },
    { frameIndex: 16, duration: 400 },
    { frameIndex: 17, duration: 1200 },
  ],
}

const guluEatConfig: AnimationDefinition = {
  frameWidth: 512,
  frameHeight: 512,
  columns: 6,
  rows: 3,
  totalFrames: 18,
  fps: 3,
  loop: true,
}

export const ANIMATION_CONFIGS: Record<CharacterId, AnimationConfig> = {
  gulu: {
    idle: guluIdleConfig,
    walk: guluWalkConfig,
    chase: guluChaseConfig,
    eat: guluEatConfig,
    sleep: guluIdleConfig,
  },
  poro: {
    idle: guluIdleConfig,
    walk: guluWalkConfig,
    chase: guluChaseConfig,
    eat: guluEatConfig,
    sleep: guluIdleConfig,
  },
  tomo: {
    idle: guluIdleConfig,
    walk: guluWalkConfig,
    chase: guluChaseConfig,
    eat: guluEatConfig,
    sleep: guluIdleConfig,
  },
  bulu: {
    idle: guluIdleConfig,
    walk: guluWalkConfig,
    chase: guluChaseConfig,
    eat: guluEatConfig,
    sleep: guluIdleConfig,
  },
}

export const PROVIDER_ICONS: Record<string, string> = {
  openai: '/images/avatars/providers/openai.png',
  google: '/images/avatars/providers/google.png',
  anthropic: '/images/avatars/providers/anthropic.png',
  groq: '/images/avatars/providers/groq.png',
  ollama: '/images/avatars/providers/default.png',
  custom: '/images/avatars/providers/default.png',
  default: '/images/avatars/providers/default.png',
}

// ─── Character specific animation & sprite sheets resolver ───────────────────

/**
 * Builds the sprite sheet path for a given character + animation.
 * Each character resolves to its OWN folder (e.g. /images/animations/poro/walk.png).
 */
export function getSpriteSheetPath(character: CharacterId, animation: AnimationName): string {
  const animFile = animation === 'sleep' ? 'idle' : animation
  return `/images/animations/${character}/${animFile}.png`
}

/**
 * Fallback sheet used by <SpriteSheetAnimation onError>. Falls back to GULU's
 * sheet for the SAME animation (not always idle), so characters without their
 * own art yet still play the correct animation — just with Gulu's art —
 * instead of collapsing every action into idle.
 */
export function getFallbackSpriteSheetPath(character: CharacterId, animation: AnimationName): string {
  const animFile = animation === 'sleep' ? 'idle' : animation
  return `/images/animations/gulu/${animFile}.png`
}

export function getAnimationConfig(character: CharacterId, animation: AnimationName): AnimationDefinition {
  // Prefer this character's own config for this exact animation.
  const own = ANIMATION_CONFIGS[character]?.[animation]
  if (own) return own
  // Fall back to Gulu's config for the SAME animation — not idle's shape —
  // so the fallback frame dimensions actually match the fallback image above.
  return ANIMATION_CONFIGS.gulu[animation] ?? guluIdleConfig
}