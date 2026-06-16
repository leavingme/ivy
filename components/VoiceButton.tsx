'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface VoiceButtonProps {
  size?: number
}

/**
 * Heuristic: extract a single Chinese character from natural speech.
 *
 * Examples:
 *   "愁字怎么写"  → "愁"
 *   "查想的笔顺" → "想"
 *   "我"          → "我"
 *   "藤字"        → "藤"
 *
 * If the cleaned result contains more than one CJK character, we return
 * the first one. Caller can decide whether to show "did you mean …".
 */
function extractSingleChar(text: string): string | null {
  // Strip common speech patterns
  const cleaned = text
    .replace(/(怎么写|字怎么写|字的笔顺|的笔顺|的写法|怎么读|怎么念|是什么意思|啥意思|是什么字|念什么|读什么|怎么念)/g, '')
    .replace(/(帮我查|帮我看一下|我想知道|我想看|给我看看|我想学)/g, '')
    .replace(/[的了呢啊吧嘛呢呀哦哈]/g, '')
    .trim()

  // Match first CJK Unified Ideograph
  const m = cleaned.match(/[\u4e00-\u9fff]/)
  return m ? m[0] : null
}

/** Feature-detect Web Speech API (iPad Safari needs webkit prefix). */
function getSpeechRecognition(): any {
  if (typeof window === 'undefined') return null
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  )
}

export function VoiceButton({ size = 200 }: VoiceButtonProps) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'listening' | 'thinking' | 'unsupported'>('idle')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const supported = typeof window !== 'undefined' && !!getSpeechRecognition()

  const start = () => {
    setError(null)
    const SR = getSpeechRecognition()
    if (!SR) {
      setState('unsupported')
      return
    }

    const recognition = new SR()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 3

    recognition.onstart = () => {
      setState('listening')
      setTranscript('')
    }

    recognition.onresult = (event: any) => {
      const results = Array.from(event.results[0]) as Array<{ transcript: string }>
      const texts = results.map((r) => r.transcript)
      const top = texts[0]
      setTranscript(top)
      setState('thinking')

      const char = extractSingleChar(top)
      if (char) {
        // Tiny delay so user sees the "thinking" state
        setTimeout(() => router.push(`/?q=${encodeURIComponent(char)}`), 200)
      } else {
        setError(`没听清哪个字（听到："${top}"），再试一次？`)
        setState('idle')
      }
    }

    recognition.onerror = (event: any) => {
      console.error('[VoiceButton] recognition error:', event.error)
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('需要麦克风权限，去设置里打开')
      } else if (event.error === 'no-speech') {
        setError('没听到声音，再试一次')
      } else {
        setError(`识别失败：${event.error}`)
      }
      setState('idle')
    }

    recognition.onend = () => {
      if (state === 'listening') setState('idle')
    }

    try {
      recognition.start()
    } catch (err) {
      console.error('[VoiceButton] start failed:', err)
      setError('启动失败，重试一下')
      setState('idle')
    }
  }

  if (state === 'unsupported') {
    return (
      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
        <p className="text-sm text-yellow-200">
          这台设备不支持语音识别
        </p>
        <p className="mt-2 text-xs text-yellow-200/70">
          请用 iOS Shortcut：「嘿 Siri，ivy [字]」
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={start}
        disabled={state === 'listening' || state === 'thinking'}
        className={`relative flex items-center justify-center rounded-full transition-all active:scale-95 ${
          state === 'listening'
            ? 'bg-red-500/20 ring-4 ring-red-500/40 animate-pulse'
            : 'bg-accent/15 ring-2 ring-accent/40 hover:bg-accent/25'
        }`}
        style={{ width: size, height: size }}
        aria-label="按住说话查字"
      >
        {state === 'listening' ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-red-500" />
            <span className="text-sm font-medium">听到了…</span>
          </div>
        ) : state === 'thinking' ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            <span className="text-sm">「{transcript}」</span>
          </div>
        ) : (
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        )}
      </button>

      <p className="text-sm text-muted">
        {state === 'idle' && '点一下，说一个字'}
        {state === 'listening' && '说话中…'}
        {state === 'thinking' && '正在识别…'}
      </p>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>
      )}
    </div>
  )
}
