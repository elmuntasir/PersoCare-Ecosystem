import type { ProviderAdapter } from '@/types/ai-provider'

export const anthropicAdapter: ProviderAdapter = {
  id: 'anthropic',
  label: 'Anthropic (Claude)',
  requiresApiKey: true,
  requiresBaseUrl: false,
  async listModels({ apiKey }) {
    if (!apiKey) throw new Error('Anthropic API key is required')
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Anthropic error (${res.status}): ${errText}`)
    }
    const data = await res.json()
    return (data.data || []).map((m: any) => ({
      id: m.id,
      displayName: m.display_name || m.id,
      raw: m,
    }))
  },
  async generateChatResponse({ apiKey, model, messages, temperature = 0.7 }) {
    if (!apiKey) throw new Error('Anthropic API key is required')
    
    // Separate system message if present
    const systemMsg = messages.find((m) => m.role === 'system')?.content || ''
    const chatMsgs = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: systemMsg || undefined,
        messages: chatMsgs,
        temperature,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Anthropic chat error (${res.status}): ${errText}`)
    }
    const data = await res.json()
    return (
      data.content
        ?.filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n') || ''
    )
  },
}
