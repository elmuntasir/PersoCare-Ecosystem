export interface ModelInfo {
  id: string
  displayName: string
  contextWindow?: number
  maxOutputTokens?: number
  capabilities?: string[]
  raw?: unknown
}

export interface ChatMessageParam {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ProviderAdapter {
  id: string
  label: string
  requiresApiKey: boolean
  requiresBaseUrl: boolean
  defaultBaseUrl?: string
  listModels: (opts: { apiKey?: string; baseUrl?: string }) => Promise<ModelInfo[]>
  generateChatResponse?: (opts: {
    apiKey?: string
    baseUrl?: string
    model: string
    messages: ChatMessageParam[]
    temperature?: number
  }) => Promise<string>
}
