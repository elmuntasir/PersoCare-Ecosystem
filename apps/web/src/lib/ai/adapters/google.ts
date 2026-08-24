import type { ProviderAdapter } from '@/types/ai-provider'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const googleAdapter: ProviderAdapter = {
  id: 'google',
  label: 'Google (Gemini)',
  requiresApiKey: true,
  requiresBaseUrl: false,
  async listModels({ apiKey }) {
    if (!apiKey) throw new Error('Google Gemini API key is required')
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
    )
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Google Gemini error (${res.status}): ${errText}`)
    }
    const data = await res.json()
    return (data.models || [])
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => ({
        id: m.name.replace(/^models\//, ''),
        displayName: m.displayName || m.name.replace(/^models\//, ''),
        contextWindow: m.inputTokenLimit,
        maxOutputTokens: m.outputTokenLimit,
        capabilities: m.supportedGenerationMethods,
        raw: m,
      }))
  },
  async generateChatResponse({ apiKey, model, messages }) {
    if (!apiKey) throw new Error('Google Gemini API key is required')
    const genAI = new GoogleGenerativeAI(apiKey)
    const genModel = genAI.getGenerativeModel({ model: model || 'gemini-1.5-flash' })

    const systemMsg = messages.find((m) => m.role === 'system')?.content || ''
    const lastUserMsg = messages.filter((m) => m.role === 'user').pop()?.content || ''

    const prompt = systemMsg
      ? `System Context:\n${systemMsg}\n\nUser Request:\n${lastUserMsg}`
      : lastUserMsg

    const result = await genModel.generateContent(prompt)
    return result.response.text()
  },
}
