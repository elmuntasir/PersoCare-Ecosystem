import type { ProviderAdapter } from '@/types/ai-provider'

export const customAdapter: ProviderAdapter = {
  id: 'custom',
  label: 'Custom (OpenAI-compatible)',
  requiresApiKey: false,
  requiresBaseUrl: true,
  async listModels({ apiKey, baseUrl }) {
    if (!baseUrl) throw new Error('Base URL is required for custom provider')
    const cleanBase = baseUrl.replace(/\/$/, '')
    const url = cleanBase.endsWith('/v1') ? `${cleanBase}/models` : `${cleanBase}/v1/models`

    const headers: Record<string, string> = {}
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    let res = await fetch(url, { headers })
    if (!res.ok && !cleanBase.endsWith('/v1')) {
      res = await fetch(`${cleanBase}/models`, { headers })
    }

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Custom provider error (${res.status}): ${errText}`)
    }

    const data = await res.json()
    const list = data.data || data.models || []
    return list.map((m: any) => ({
      id: m.id || m.name,
      displayName: m.id || m.name,
      raw: m,
    }))
  },
  async generateChatResponse({ apiKey, baseUrl, model, messages, temperature = 0.7 }) {
    if (!baseUrl) throw new Error('Base URL is required for custom provider')
    const cleanBase = baseUrl.replace(/\/$/, '')
    const url = cleanBase.endsWith('/v1')
      ? `${cleanBase}/chat/completions`
      : `${cleanBase}/v1/chat/completions`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Custom provider chat error (${res.status}): ${errText}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  },
}
