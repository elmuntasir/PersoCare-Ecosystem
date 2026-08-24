export type CharacterId = 'poro' | 'tomo' | 'bulu' | 'gulu'

export type AnimationName = 'idle' | 'chase' | 'sleep' | 'eat' | 'walk'

export interface Character {
  id: CharacterId
  name: string
  emoji: string
  avatarImage?: string
  description: string
  animations: AnimationName[]
}

export interface AnimationDefinition {
  frameWidth: number
  frameHeight: number
  columns: number
  rows: number
  totalFrames: number
  fps: number
  loop: boolean
  timings?: Array<{ frameIndex: number; duration: number }>
}

export interface AnimationConfig {
  [key: string]: AnimationDefinition
}

export type AvatarMode = 'default' | 'fun'

export interface AIProvider {
  id: string
  name: string
  icon: string
  model: string
  apiKey: string
  providerKey?: string
  baseUrl?: string
  contextWindow?: number
  enabled: boolean
  rateLimited?: boolean
}

