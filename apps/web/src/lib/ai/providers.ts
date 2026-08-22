import { AIProvider } from '@/types/avatar'

const STORAGE_KEY = 'persocare_ai_providers'

export function getProviders(): AIProvider[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveProviders(providers: AIProvider[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(providers))
}

export function addProvider(provider: Omit<AIProvider, 'id'>): AIProvider[] {
  const providers = getProviders()
  const newProvider: AIProvider = { ...provider, id: crypto.randomUUID() }
  const updated = [...providers, newProvider]
  saveProviders(updated)
  return updated
}

export function removeProvider(id: string): AIProvider[] {
  const providers = getProviders()
  const updated = providers.filter((p) => p.id !== id)
  saveProviders(updated)
  return updated
}

export function toggleProvider(id: string): AIProvider[] {
  const providers = getProviders()
  const updated = providers.map((p) =>
    p.id === id ? { ...p, enabled: !p.enabled } : p
  )
  saveProviders(updated)
  return updated
}

export function getActiveProviders(): AIProvider[] {
  return getProviders().filter((p) => p.enabled && !p.rateLimited)
}

export function markRateLimited(id: string): AIProvider[] {
  const providers = getProviders()
  const updated = providers.map((p) =>
    p.id === id ? { ...p, rateLimited: true } : p
  )
  saveProviders(updated)
  return updated
}

export function resetAllRateLimits(): AIProvider[] {
  const providers = getProviders()
  const updated = providers.map((p) => ({ ...p, rateLimited: false }))
  saveProviders(updated)
  return updated
}
