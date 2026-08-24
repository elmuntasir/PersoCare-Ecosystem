'use client'

import { useAvatar } from '@/contexts/AvatarContext'
import { CHARACTERS } from '@/lib/avatar/registry'
import { FunAvatar } from '@/components/avatar/FunAvatar'
import { PROVIDER_ICONS } from '@/lib/avatar/registry'
import type { AnimationName } from '@/types/avatar'
import { Sparkles, User as UserIcon, MessageCircle } from 'lucide-react'

const ANIMATIONS: AnimationName[] = ['idle', 'walk', 'chase', 'sleep', 'eat']

const ANIMATION_LABELS: Record<AnimationName, string> = {
  idle: '😌 Idle',
  walk: '🚶 Walk',
  chase: '🏃 Chase',
  sleep: '😴 Sleep',
  eat: '🍴 Eat',
}

interface AvatarSectionProps {
  userAvatar?: string | null
  username?: string | null
}

export function AvatarSection({ userAvatar, username }: AvatarSectionProps) {
  const {
    mode,
    setMode,
    character,
    setCharacter,
    animation,
    setAnimation,
    providers,
    chatbot,
    activateChat,
    toggleChat,
  } = useAvatar()

  return (
    <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--sage-200)]/60">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-700 border border-violet-200 flex items-center justify-center shrink-0">
            <UserIcon className="w-6 h-6" strokeWidth={1.8} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-2xl text-[var(--teal-900)]">Avatar</h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 font-semibold">
                Personalization
              </span>
            </div>
            <p className="text-xs text-[var(--ink-soft)] font-body mt-0.5">
              {username ? `Customise assistant personality for ${username}` : "Choose your AI assistant's appearance and animations"}
            </p>
          </div>
        </div>

        {/* Mode Switch */}
        <div className="bg-[var(--paper)] rounded-2xl border border-[var(--sage-200)] p-1 inline-flex gap-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('default')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-body transition-all cursor-pointer ${
              mode === 'default'
                ? 'bg-[var(--teal-900)] text-white shadow-xs'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            Default
          </button>
          <button
            type="button"
            onClick={() => setMode('fun')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-body transition-all flex items-center gap-1 cursor-pointer ${
              mode === 'fun'
                ? 'bg-[var(--teal-900)] text-white shadow-xs'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fun Mode</span>
          </button>
        </div>
      </div>

      {/* Main Avatar Preview */}
      {mode === 'default' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)]">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-violet-300 flex items-center justify-center shadow-xs shrink-0">
              <img
                src={userAvatar || '/images/avatars/gulu-avatar.png'}
                alt={username || 'Default Avatar'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/images/avatars/gulu-avatar.png'
                }}
              />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-display font-semibold text-lg text-[var(--teal-900)]">
                {username ? username : 'Standard AI Avatar'}
              </h3>
              <p className="text-xs text-[var(--ink-soft)] font-body max-w-md">
                Active default profile avatar. You can toggle to Fun Mode anytime to switch to animated sprites.
              </p>
            </div>
          </div>

          {/* Connected Model Providers Preview */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--teal-900)] font-body">
              Configured Model Personas
            </h4>
            {providers.length === 0 ? (
              <p className="text-xs text-[var(--ink-soft)] italic bg-white p-3 rounded-xl border border-[var(--sage-200)]">
                No external models configured yet. Use the AI Config section below to add your keys.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {providers.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--sage-200)] bg-white text-center shadow-2xs"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--paper)] border border-[var(--sage-200)] flex items-center justify-center p-1.5">
                      <img
                        src={p.icon ?? PROVIDER_ICONS.default}
                        alt={p.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-xs font-medium text-[var(--ink)] truncate w-full">{p.name}</p>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                        p.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {p.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-5 p-6 rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)]">
            <FunAvatar className="w-44 h-44" />

            {/* Animation Selector */}
            <div className="flex flex-wrap gap-2 justify-center">
              {ANIMATIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAnimation(a)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer ${
                    animation === a
                      ? 'bg-[var(--teal-900)] text-white border-transparent shadow-xs'
                      : 'border-[var(--sage-200)] bg-white text-[var(--ink-soft)] hover:border-[var(--teal-900)] hover:text-[var(--teal-900)]'
                  }`}
                >
                  {ANIMATION_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          {/* Character selection */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--teal-900)] font-body">
              Select Mascot Character
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CHARACTERS.map((c) => {
                const isActive = character === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCharacter(c.id)}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      isActive
                        ? 'border-[var(--coral)] bg-[var(--coral)]/5 shadow-xs ring-1 ring-[var(--coral)]'
                        : 'border-[var(--sage-200)] bg-white hover:border-[var(--teal-900)]/40 hover:bg-[var(--paper)]'
                    }`}
                  >
                    {c.avatarImage ? (
                      <div className="w-9 h-9 mx-auto mb-1 flex items-center justify-center">
                        <img src={c.avatarImage} alt={c.name} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <span className="text-2xl block mb-1">{c.emoji}</span>
                    )}
                    <p className="text-xs font-bold text-[var(--ink)] leading-tight">{c.name}</p>
                    <p className="text-[10px] text-[var(--ink-soft)] line-clamp-1 mt-0.5">{c.description}</p>
                    {isActive && (
                      <span className="mt-2 inline-block text-[9px] px-2 py-0.5 rounded-full bg-[var(--coral)] text-white font-mono font-semibold">
                        Selected
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Assistant Activation Card */}
      <div className="p-5 rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--teal-900)] text-white flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-[var(--teal-900)]">
              Floating AI Assistant
            </h4>
            <p className="text-xs text-[var(--ink-soft)] font-body mt-0.5">
              {chatbot.hasBeenActivated
                ? 'Your AI assistant is active! Click the floating button at bottom right anytime.'
                : 'Activate the floating chatbot to access assistant advice across all pages.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={chatbot.hasBeenActivated ? toggleChat : activateChat}
            className={`px-5 py-2 rounded-full text-xs font-semibold font-body flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              chatbot.hasBeenActivated
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                : 'bg-[var(--coral)] text-white hover:bg-[var(--coral)]/90'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" strokeWidth={2} />
            <span>{chatbot.hasBeenActivated ? (chatbot.isOpen ? 'Close Chat' : 'Open Chat') : 'Activate Chat'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
