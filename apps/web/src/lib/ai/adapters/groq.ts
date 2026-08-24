import type { ProviderAdapter } from '@/types/ai-provider'

export const groqAdapter: ProviderAdapter = {
  id: 'groq',
  label: 'Groq',
  requiresApiKey: true,
  requiresBaseUrl: false,
  async listModels({ apiKey }) {
    if (!apiKey) throw new Error('Groq API key is required')
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Groq error (${res.status}): ${errText}`)
    }
    const data = await res.json()
    return (data.data || []).map((m: any) => ({
      id: m.id,
      displayName: m.id,
      contextWindow: m.context_window,
      capabilities: m.owned_by ? [m.owned_by] : undefined,
      raw: m,
    }))
  },
  async generateChatResponse({ apiKey, model, messages, temperature = 0.7 }) {
    if (!apiKey) throw new Error('Groq API key is required')
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages,
        temperature,
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Groq chat error (${res.status}): ${errText}`)
    }
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  },
}
