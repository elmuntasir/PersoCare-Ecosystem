'use server'

import { PROVIDER_ADAPTERS } from '@/lib/ai/adapters'
import type { ModelInfo } from '@/types/ai-provider'

export async function discoverModels(
  providerKey: string,
  apiKey: string,
  baseUrl?: string
): Promise<ModelInfo[]> {
  const adapter = PROVIDER_ADAPTERS[providerKey]
  if (!adapter) {
    throw new Error(`Unknown provider: ${providerKey}`)
  }

  return adapter.listModels({
    apiKey: apiKey ? apiKey.trim() : undefined,
    baseUrl: baseUrl ? baseUrl.trim() : adapter.defaultBaseUrl,
  })
}
