import { openaiAdapter } from './openai'
import { anthropicAdapter } from './anthropic'
import { googleAdapter } from './google'
import { groqAdapter } from './groq'
import { ollamaAdapter } from './ollama'
import { customAdapter } from './custom'
import type { ProviderAdapter, ChatMessageParam } from '@/types/ai-provider'
import type { AIProvider } from '@/types/avatar'

export const PROVIDER_ADAPTERS: Record<string, ProviderAdapter> = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  google: googleAdapter,
  groq: groqAdapter,
  ollama: ollamaAdapter,
  custom: customAdapter,
}

export async function executeProviderChat(
  provider: AIProvider,
  messages: ChatMessageParam[],
  options?: { temperature?: number }
): Promise<string> {
  // Infer provider key if not explicitly set
  let key = provider.providerKey?.toLowerCase()
  if (!key) {
    const icon = provider.icon || ''
    const name = (provider.name || '').toLowerCase()
    const model = (provider.model || '').toLowerCase()

    if (icon.includes('groq') || name.includes('groq') || model.includes('llama') || model.includes('mixtral') || model.includes('gemma')) {
      key = 'groq'
    } else if (icon.includes('google') || name.includes('gemini') || model.includes('gemini')) {
      key = 'google'
    } else if (icon.includes('claude') || icon.includes('anthropic') || model.includes('claude')) {
      key = 'anthropic'
    } else if (icon.includes('ollama') || model.includes('ollama')) {
      key = 'ollama'
    } else if (provider.baseUrl) {
      key = 'custom'
    } else {
      key = 'openai'
    }
  }

  const adapter = PROVIDER_ADAPTERS[key] || PROVIDER_ADAPTERS.openai
  if (!adapter.generateChatResponse) {
    throw new Error(`Provider adapter ${key} does not support chat generation`)
  }

  return adapter.generateChatResponse({
    apiKey: provider.apiKey,
    baseUrl: provider.baseUrl || adapter.defaultBaseUrl,
    model: provider.model,
    messages,
    temperature: options?.temperature,
  })
}
