'use server'

import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { executeProviderChat } from '@/lib/ai/adapters'
import type { AIProvider } from '@/types/avatar'
import type { ChatMessageParam } from '@/types/ai-provider'

export async function sendChatMessage(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const message = (formData.get('message') as string) || ''
  const files = (formData.getAll('files') as File[]) || []
  const rawProviders = (formData.get('providers') as string) || '[]'
  const roundRobin = formData.get('roundRobin') === 'true'

  let clientProviders: AIProvider[] = []
  try {
    clientProviders = JSON.parse(rawProviders)
  } catch {
    clientProviders = []
  }

  // Save user message
  const userMsg = await prisma.chatMessage.create({
    data: {
      userId: user.id,
      role: 'user',
      content: message || '📎 File upload',
      metadata: { files: files.map((f) => f.name) },
    },
  })

  // Build context from user data
  const context = await buildUserContext(user.id)

  // Process files
  let fileContents = ''
  for (const file of files) {
    try {
      const text = await extractFileContent(file)
      fileContents += `\n[File: ${file.name}]\n${text}\n`
    } catch {
      fileContents += `\n[File: ${file.name}] (Unable to parse file text)\n`
    }
  }

  // Fetch recent conversation history from DB for multi-turn context
  const recentHistory = await prisma.chatMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })
  const chronologicalHistory = recentHistory.reverse()

  // Call AI with fallback / round-robin
  const response = await callAIWithProviders({
    clientProviders,
    roundRobin,
    context,
    message,
    fileContents,
    history: chronologicalHistory.map((h) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    })),
  })

  // Save AI response
  const aiMsg = await prisma.chatMessage.create({
    data: {
      userId: user.id,
      role: 'assistant',
      content: response,
    },
  })

  return { success: true, messageId: aiMsg.id, response }
}

// ─── Helpers ────────────────────────────────────────────────

async function buildUserContext(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patientProfile: true,
        settings: true,
      },
    })

    const recentFood = await prisma.userFoodLog.findMany({
      where: { userId },
      orderBy: { consumedAt: 'desc' },
      take: 5,
    })

    const recentExercises = await prisma.userExerciseLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      take: 5,
    })

    const context = {
      name: user?.name,
      gender: user?.gender,
      dob: user?.dob,
      patientProfile: user?.patientProfile,
      recentFoodLogs: recentFood,
      recentExerciseLogs: recentExercises,
    }

    return JSON.stringify(context, null, 2)
  } catch (err) {
    console.error('[buildUserContext] Error:', err)
    return '{}'
  }
}

async function extractFileContent(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const text = new TextDecoder().decode(buffer)
  return text.slice(0, 10000)
}

interface CallAIOptions {
  clientProviders: AIProvider[]
  roundRobin: boolean
  context: string
  message: string
  fileContents: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
}

async function callAIWithProviders(opts: CallAIOptions): Promise<string> {
  const { clientProviders, roundRobin, context, message, fileContents, history } = opts

  // 1. Build candidates list from client-configured providers
  let candidates: AIProvider[] = clientProviders.filter((p) => p.enabled && !p.rateLimited)

  // 2. If no client providers, check environment variables as fallbacks
  if (candidates.length === 0) {
    if (process.env.GROQ_API_KEY) {
      candidates.push({
        id: 'env-groq',
        name: 'Groq (Env)',
        icon: '/images/avatars/providers/groq.png',
        model: 'llama-3.3-70b-versatile',
        apiKey: process.env.GROQ_API_KEY,
        providerKey: 'groq',
        enabled: true,
      })
    }
    if (process.env.OPENAI_API_KEY) {
      candidates.push({
        id: 'env-openai',
        name: 'OpenAI (Env)',
        icon: '/images/avatars/providers/openai.png',
        model: 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY,
        providerKey: 'openai',
        enabled: true,
      })
    }
    if (process.env.ANTHROPIC_API_KEY) {
      candidates.push({
        id: 'env-anthropic',
        name: 'Anthropic (Env)',
        icon: '/images/avatars/providers/anthropic.png',
        model: 'claude-3-5-sonnet-20241022',
        apiKey: process.env.ANTHROPIC_API_KEY,
        providerKey: 'anthropic',
        enabled: true,
      })
    }
    if (process.env.GEMINI_API_KEY) {
      candidates.push({
        id: 'env-gemini',
        name: 'Google Gemini (Env)',
        icon: '/images/avatars/providers/google.png',
        model: 'gemini-1.5-flash',
        apiKey: process.env.GEMINI_API_KEY,
        providerKey: 'google',
        enabled: true,
      })
    }
  }

  if (candidates.length === 0) {
    return 'Hello! PersoCare AI is active, but no AI providers are configured. Please add an API key (such as Groq, OpenAI, or Gemini) in the AI Configuration page.'
  }

  // Construct system prompt and message list
  const systemPrompt = `You are PersoCare AI, a knowledgeable, empathetic, and supportive personal health and wellness assistant.

USER CONTEXT:
${context}

${fileContents ? `ADDITIONAL FILE CONTENT:\n${fileContents}\n` : ''}

Instructions:
- Be empathetic, supportive, and clear.
- Use the user's health context (e.g. food logs, profile) when relevant.
- If medical symptoms or prescription advice are requested, provide helpful general health info and ALWAYS advise consulting a licensed medical professional or their primary doctor for specific diagnosis and prescription changes.
- Keep answers concise and helpful (2-4 sentences or clear bullet points where appropriate).
- Answer in the user's language (English or Bengali).`

  const messages: ChatMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(0, -1).map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: 'user', content: message },
  ]

  let lastError: any = null

  // Iterate over candidate providers (or just the first if round robin is disabled)
  const executionList = roundRobin ? candidates : [candidates[0]]

  for (const provider of executionList) {
    try {
      const response = await executeProviderChat(provider, messages)
      if (response && response.trim().length > 0) {
        return response
      }
    } catch (err: any) {
      console.error(`[sendMessage] Provider ${provider.name || provider.model} failed:`, err)
      lastError = err
      // Continue to next provider if available
    }
  }

  return `I received your message: "${message}". However, I encountered an issue connecting to the configured AI model (${lastError?.message || 'unknown error'}). Please check your provider API key or model settings in the AI Config page.`
}
