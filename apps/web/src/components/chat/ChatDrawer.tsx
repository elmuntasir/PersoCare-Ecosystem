'use client'

import { useState, useRef, useEffect } from 'react'
import { useAvatar } from '@/contexts/AvatarContext'
import { SpriteSheetAnimation } from '@/components/ui/SpriteSheetAnimation'
import { getSpriteSheetPath, getFallbackSpriteSheetPath, getAnimationConfig, CHARACTERS } from '@/lib/avatar/registry'
import type { AnimationName } from '@/types/avatar'
import { sendChatMessage } from '@/actions/chat/sendMessage'
import { X, Send, Paperclip, Bot, Loader2, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export function ChatDrawer() {
  const { mode, character, toggleChat, providers, roundRobinEnabled } = useAvatar()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isMinimized, setIsMinimized] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load chat history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch('/api/chat/history')
        const data = await res.json()
        setMessages(data.messages || [])
      } catch (err) {
        console.error('Failed to load chat history:', err)
      }
    }
    loadHistory()
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (!isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isMinimized])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() && files.length === 0) return

    const userMessage = input.trim() || '📎 See attached files'
    setLoading(true)

    const fd = new FormData()
    fd.append('message', userMessage)
    for (const file of files) {
      fd.append('files', file)
    }
    fd.append('providers', JSON.stringify(providers || []))
    fd.append('roundRobin', roundRobinEnabled ? 'true' : 'false')


    // Add user message optimistically
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])
    setInput('')
    setFiles([])

    try {
      const result = await sendChatMessage(fd)
      const assistantMessage: Message = {
        id: result.messageId || `temp-${Date.now()}`,
        role: 'assistant',
        content: result.response,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: any) {
      console.error(err)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error connecting to the AI. Please try again.',
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const characterData = CHARACTERS.find((c) => c.id === character) || CHARACTERS[0]
  const [chatAnimation, setChatAnimation] = useState<AnimationName>('idle')

  // Avatar stays idle by default and triggers natural actions periodically
  useEffect(() => {
    if (mode !== 'fun') return

    const availableActions: AnimationName[] = ['walk', 'chase', 'eat']
    let timeoutId: NodeJS.Timeout

    const scheduleNextAction = () => {
      // Idle for 8 to 15 seconds
      const idleDuration = Math.random() * 7000 + 8000
      timeoutId = setTimeout(() => {
        const randomAction = availableActions[Math.floor(Math.random() * availableActions.length)]
        setChatAnimation(randomAction)

        // Action duration (3-5 seconds), then return to idle
        const actionDuration = randomAction === 'chase' ? 3500 : 3000
        timeoutId = setTimeout(() => {
          setChatAnimation('idle')
          scheduleNextAction()
        }, actionDuration)
      }, idleDuration)
    }

    scheduleNextAction()
    return () => clearTimeout(timeoutId)
  }, [mode, character])

  const currentAnim = chatAnimation
  const avatarSrc = mode === 'fun' ? getSpriteSheetPath(character, currentAnim) : null
  const fallbackSrc = mode === 'fun' ? getFallbackSpriteSheetPath(character, currentAnim) : undefined
  const avatarConfig = mode === 'fun' ? getAnimationConfig(character, currentAnim) : null

  return (
    <div
      className={`bg-white rounded-2xl shadow-2xl border border-[var(--sage-200)] w-96 max-w-[calc(100vw-2rem)] transition-all duration-300 mb-3 select-none flex flex-col relative ${
        isMinimized ? 'h-14 overflow-hidden' : 'h-[540px] max-h-[75vh]'
      }`}
    >
      {/* Single Unified Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--sage-200)] bg-[var(--paper)] rounded-t-2xl shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {mode === 'fun' && avatarSrc && avatarConfig ? (
            /* Frameless native animated avatar (64px) with no background or circle */
            <div className="w-16 h-16 shrink-0 flex items-center justify-center -my-2 select-none pointer-events-none">
              <SpriteSheetAnimation
                key={`${character}-${currentAnim}`}
                spriteSheetUrl={avatarSrc}
                fallbackUrl={fallbackSrc}
                frameWidth={avatarConfig.frameWidth}
                frameHeight={avatarConfig.frameHeight}
                columns={avatarConfig.columns}
                rows={avatarConfig.rows}
                totalFrames={avatarConfig.totalFrames}
                fps={avatarConfig.fps}
                loop={avatarConfig.loop}
                timings={avatarConfig.timings}
                className="w-full h-full object-contain filter drop-shadow-md"
                autoplay={true}
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-[var(--teal-900)] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-5 h-5" strokeWidth={1.8} />
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-semibold text-sm text-[var(--teal-900)] truncate">PersoCare AI</span>
              {mode === 'fun' && (
                <span className="text-[10px] font-mono text-[var(--teal-900)] bg-emerald-100/80 px-2 py-0.2 rounded-full shrink-0 font-medium">
                  {characterData.name}
                </span>
              )}
            </div>
            {mode === 'fun' && (
              <span className="text-[10px] text-[var(--ink-soft)] capitalize font-body leading-none mt-0.5">
                {currentAnim === 'idle' ? 'resting · ready to help' : `${currentAnim}ing...`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg hover:bg-[var(--sage-200)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isMinimized ? 'rotate-180' : ''}`}
              strokeWidth={1.8}
            />
          </button>
          <button
            type="button"
            onClick={toggleChat}
            className="p-1.5 rounded-lg hover:bg-[var(--sage-200)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 select-text custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center py-10 px-4 text-[var(--ink-soft)]">
                <div className="w-12 h-12 rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)] flex items-center justify-center mx-auto mb-3 text-[var(--teal-900)]">
                  <Bot className="w-6 h-6 opacity-60" strokeWidth={1.6} />
                </div>
                <p className="text-sm font-semibold text-[var(--teal-900)]">Ask me anything!</p>
                <p className="text-xs text-[var(--ink-soft)] mt-1 max-w-[240px] mx-auto leading-relaxed">
                  I can provide wellness insights, review meals, exercises, and answer questions.
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-2xs ${
                    msg.role === 'user'
                      ? 'bg-[var(--teal-900)] text-white rounded-br-xs'
                      : 'bg-[var(--paper)] border border-[var(--sage-200)] text-[var(--ink)] rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p
                    className={`text-[9px] font-mono mt-1 ${
                      msg.role === 'user' ? 'text-white/60 text-right' : 'text-[var(--ink-soft)]/70'
                    }`}
                  >
                    {msg.createdAt ? format(new Date(msg.createdAt), 'hh:mm a') : ''}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[var(--paper)] border border-[var(--sage-200)] rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[var(--coral)] animate-spin" strokeWidth={2} />
                  <span className="text-xs text-[var(--ink-soft)] font-body">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-[var(--sage-200)] p-3 bg-white rounded-b-2xl shrink-0"
          >
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl hover:bg-[var(--paper)] border border-transparent hover:border-[var(--sage-200)] text-[var(--ink-soft)] hover:text-[var(--teal-900)] transition-colors shrink-0 cursor-pointer"
                aria-label="Attach file"
              >
                <Paperclip className="w-4 h-4" strokeWidth={1.8} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                accept="image/*,.pdf,.doc,.docx,.txt,.csv"
              />
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask PersoCare AI..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-3 py-2 font-body text-xs focus-visible:outline-2 focus-visible:outline-[var(--coral)] min-h-[38px] max-h-[80px] text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              <button
                type="submit"
                disabled={loading || (!input.trim() && files.length === 0)}
                className="p-2 rounded-xl bg-[var(--coral)] text-white hover:bg-[var(--coral)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-xs cursor-pointer"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" strokeWidth={1.8} />
              </button>
            </div>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-[var(--sage-200)]/60">
                {files.map((f, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono bg-[var(--paper)] border border-[var(--sage-200)] px-2 py-0.5 rounded-md flex items-center gap-1 text-[var(--ink)]"
                  >
                    📎 <span className="truncate max-w-[120px]">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-[var(--ink-soft)] hover:text-rose-600 font-bold ml-0.5 cursor-pointer"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </form>
        </>
      )}
    </div>
  )
}
