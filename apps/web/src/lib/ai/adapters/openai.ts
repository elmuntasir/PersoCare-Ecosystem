import type { ProviderAdapter } from '@/types/ai-provider'

export const openaiAdapter: ProviderAdapter = {
  id: 'openai',
  label: 'OpenAI',
  requiresApiKey: true,
  requiresBaseUrl: false,
  async listModels({ apiKey }) {
    if (!apiKey) throw new Error('OpenAI API key is required')
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`OpenAI error (${res.status}): ${errText}`)
    }
    const data = await res.json()
    const models = (data.data || [])
      .filter((m: any) => m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3') || m.id.includes('chat'))
      .map((m: any) => ({
        id: m.id,
        displayName: m.id,
        raw: m,
      }))
    return models.length > 0 ? models : data.data.map((m: any) => ({ id: m.id, displayName: m.id }))
  },
  async generateChatResponse({ apiKey, model, messages, temperature = 0.7 }) {
    if (!apiKey) throw new Error('OpenAI API key is required')
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages,
        temperature,
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`OpenAI chat error (${res.status}): ${errText}`)
    }
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  },
}
