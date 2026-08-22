import { Character, AnimationDefinition, AnimationConfig, CharacterId, AnimationName } from '@/types/avatar'

export const CHARACTERS: Character[] = [
  {
    id: 'poro',
    name: 'Poro',
    emoji: '🌱',
    description: 'A curious little sprout',
    animations: ['idle', 'chase', 'sleep', 'eat'],
  },
  {
    id: 'tomo',
    name: 'Tomo',
    emoji: '🍃',
    description: 'A gentle leaf friend',
    animations: ['idle', 'chase', 'sleep', 'eat'],
  },
  {
    id: 'bulu',
    name: 'Bulu',
    emoji: '🌿',
    description: 'A playful plant buddy',
    animations: ['idle', 'chase', 'sleep', 'eat'],
  },
  {
    id: 'gulu',
    name: 'Gulu',
    emoji: '🌱',
    description: 'A sleepy little sprout',
    animations: ['idle', 'chase', 'sleep', 'eat'],
  },
]

const defaultIdleConfig: AnimationDefinition = {
  frameWidth: 216,
  frameHeight: 304,
  columns: 6,
  rows: 4,
  totalFrames: 24,
  fps: 12,
  loop: true,
}

const defaultChaseConfig: AnimationDefinition = {
  frameWidth: 1024,
  frameHeight: 1024,
  columns: 6,
  rows: 3,
  totalFrames: 18,
  fps: 12,
  loop: true,
  timings: [
    // Chase 1 – fast
    { frameIndex: 0, duration: 1000 / 12 },
    { frameIndex: 1, duration: 1000 / 12 },
    { frameIndex: 2, duration: 1000 / 12 },
    { frameIndex: 3, duration: 1000 / 12 },
    { frameIndex: 4, duration: 1000 / 12 },
    { frameIndex: 5, duration: 1000 / 12 },
    // Fall – impact
    { frameIndex: 6, duration: 400 },
    // Wake up – slower
    { frameIndex: 7, duration: 300 },
    { frameIndex: 8, duration: 300 },
    // Chase 2 – fast again
    { frameIndex: 9, duration: 1000 / 12 },
    { frameIndex: 10, duration: 1000 / 12 },
    { frameIndex: 11, duration: 1000 / 12 },
    { frameIndex: 12, duration: 1000 / 12 },
    { frameIndex: 13, duration: 1000 / 12 },
    // Slowing down – tired
    { frameIndex: 14, duration: 200 },
    { frameIndex: 15, duration: 300 },
    // Exhausted – sigh, then loop back
    { frameIndex: 16, duration: 400 },
    { frameIndex: 17, duration: 1200 },
  ],
}

const defaultSleepConfig: AnimationDefinition = {
  frameWidth: 512,
  frameHeight: 512,
  columns: 4,
  rows: 4,
  totalFrames: 16,
  fps: 6,
  loop: true,
}

const defaultEatConfig: AnimationDefinition = {
  frameWidth: 512,
  frameHeight: 512,
  columns: 5,
  rows: 4,
  totalFrames: 20,
  fps: 12,
  loop: true,
}

export const ANIMATION_CONFIGS: Record<CharacterId, AnimationConfig> = {
  poro: {
    idle: defaultIdleConfig,
    chase: defaultChaseConfig,
    sleep: defaultSleepConfig,
    eat: defaultEatConfig,
  },
  tomo: {
    idle: defaultIdleConfig,
    chase: defaultChaseConfig,
    sleep: defaultSleepConfig,
    eat: defaultEatConfig,
  },
  bulu: {
    idle: defaultIdleConfig,
    chase: defaultChaseConfig,
    sleep: defaultSleepConfig,
    eat: defaultEatConfig,
  },
  gulu: {
    idle: defaultIdleConfig,
    chase: defaultChaseConfig,
    sleep: defaultSleepConfig,
    eat: defaultEatConfig,
  },
}

export const PROVIDER_ICONS: Record<string, string> = {
  openai: '/images/avatars/providers/openai.png',
  google: '/images/avatars/providers/google.png',
  anthropic: '/images/avatars/providers/anthropic.png',
  groq: '/images/avatars/providers/groq.png',
  default: '/images/avatars/providers/default.png',
}

export function getSpriteSheetPath(character: CharacterId, animation: AnimationName): string {
  if (character === 'gulu' && animation === 'idle') {
    return `/images/animations/${character}/gulu.png`
  }
  return `/images/animations/${character}/${animation}.png`
}

export function getAnimationConfig(character: CharacterId, animation: AnimationName): AnimationDefinition {
  return ANIMATION_CONFIGS[character]?.[animation] ?? ANIMATION_CONFIGS.poro[animation]
}
