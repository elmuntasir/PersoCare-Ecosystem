import type { ProviderAdapter } from '@/types/ai-provider'

export const ollamaAdapter: ProviderAdapter = {
  id: 'ollama',
  label: 'Ollama (local)',
  requiresApiKey: false,
  requiresBaseUrl: true,
  defaultBaseUrl: 'http://localhost:11434',
  async listModels({ baseUrl }) {
    const targetUrl = (baseUrl || 'http://localhost:11434').replace(/\/$/, '')
    const res = await fetch(`${targetUrl}/api/tags`)
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Ollama error (${res.status}): ${errText}`)
    }
    const data = await res.json()
    return (data.models || []).map((m: any) => ({
      id: m.model || m.name,
      displayName: m.name || m.model,
      capabilities: m.details?.family
        ? [m.details.family, m.details.parameter_size].filter(Boolean)
        : undefined,
      raw: m,
    }))
  },
  async generateChatResponse({ baseUrl, model, messages }) {
    const targetUrl = (baseUrl || 'http://localhost:11434').replace(/\/$/, '')
    const res = await fetch(`${targetUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3.2',
        messages,
        stream: false,
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Ollama chat error (${res.status}): ${errText}`)
    }
    const data = await res.json()
    return data.message?.content || ''
  },
}
