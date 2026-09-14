'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

interface VoiceButtonProps {
  size?: number
  variant?: 'microphone' | 'morning-glory'
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

function MorningGloryIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      className={`h-full w-full drop-shadow-[0_14px_18px_rgba(47,93,54,0.22)] ${active ? 'animate-pulse' : ''}`}
    >
      <defs>
        <radialGradient id="morningGloryBloom" cx="50%" cy="46%" r="54%">
          <stop offset="0" stopColor="#fff7c7" />
          <stop offset="0.32" stopColor="#f7b6cf" />
          <stop offset="0.68" stopColor="#8e8de8" />
          <stop offset="1" stopColor="#5867c9" />
        </radialGradient>
        <linearGradient id="morningGloryStem" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#78c76b" />
          <stop offset="1" stopColor="#2f7c48" />
        </linearGradient>
      </defs>
      <path
        d="M80 87c-10 18-11 36-4 55"
        fill="none"
        stroke="url(#morningGloryStem)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M75 123c-21-16-41-16-60 0 22 15 42 15 60 0Z"
        fill="#65b957"
      />
      <path
        d="M88 127c22-19 44-20 66-2-24 17-46 18-66 2Z"
        fill="#82cf62"
      />
      <path
        d="M37 34c13-20 30-24 43-8 13-16 31-12 43 8 22 4 28 20 13 38 7 23-8 36-32 30-13 17-35 17-48 0-24 6-39-7-32-30-15-18-9-34 13-38Z"
        fill="url(#morningGloryBloom)"
      />
      <path
        d="M46 42c20 9 32 22 34 40M114 42c-20 9-32 22-34 40M80 25v57M34 69c20-4 35 0 46 13M126 69c-20-4-35 0-46 13"
        fill="none"
        stroke="#fff8d5"
        strokeWidth="5"
        strokeLinecap="round"
        opacity=".75"
      />
      <circle cx="80" cy="82" r="19" fill="#fff4a6" />
      <path
        d="M66 83c8 8 19 8 28 0"
        fill="none"
        stroke="#d88838"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {active && (
        <g fill="none" stroke="#fff8c9" strokeLinecap="round" strokeWidth="5" opacity=".9">
          <path d="M34 21c-10-9-20-11-29-4" />
          <path d="M126 21c10-9 20-11 29-4" />
        </g>
      )}
    </svg>
  )
}

export function VoiceButton({ size = 200, variant = 'microphone' }: VoiceButtonProps) {
  const router = useRouter()
  const recognitionRef = useRef<any>(null)
  const [state, setState] = useState<'idle' | 'listening' | 'thinking' | 'unsupported'>('idle')
  const [transcript, setTranscript] = useState('')
  const [alternatives, setAlternatives] = useState<string[]>([])
  const [selected, setSelected] = useState<{
    candidates: Array<{ char: string; confidence: number | null }>
    source: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supported = typeof window !== 'undefined' && !!getSpeechRecognition()

  /**
   * Send ASR text + alternatives to the server-side LLM extractor.
   * Returns null if the API fails or can't identify a character.
   */
  async function extractChar(text: string, alternatives: string[] = []): Promise<{
    candidates: Array<{ char: string; confidence: number | null }>
    source: string
  }> {
    try {
      const res = await fetch('/api/extract-char', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, alternatives }),
      })
      if (!res.ok) return { candidates: [], source: 'error' }
      const data = await res.json()
      return {
        candidates: Array.isArray(data?.candidates)
          ? data.candidates.filter((candidate: unknown): candidate is { char: string; confidence: number | null } =>
              typeof candidate === 'object' && candidate !== null && typeof (candidate as { char?: unknown }).char === 'string')
          : [],
        source: data?.source ?? 'unknown',
      }
    } catch {
      return { candidates: [], source: 'fetch-error' }
    }
  }

  const start = () => {
    if (state === 'listening') {
      recognitionRef.current?.stop()
      return
    }

    setError(null)
    setAlternatives([])
    setSelected(null)
    const SR = getSpeechRecognition()
    if (!SR) {
      setState('unsupported')
      return
    }

    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 3   // pass to LLM for disambiguation

    recognition.onstart = () => {
      setState('listening')
      setTranscript('')
    }

    recognition.onresult = async (event: any) => {
      const results = Array.from(event.results[0]) as Array<{ transcript: string }>
      const texts = results.map((r) => r.transcript.trim())
      const top = texts[0]
      setTranscript(top)
      setAlternatives(texts)
      setState('thinking')

      const result = await extractChar(top, texts)
      setSelected(result)
      if (result.candidates.length === 1) {
        router.push(`/?q=${encodeURIComponent(result.candidates[0].char)}`)
      } else if (result.candidates.length === 0) {
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
      recognitionRef.current = null
      setState((current) => (current === 'listening' ? 'idle' : current))
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
        disabled={state === 'thinking'}
        className={`relative flex items-center justify-center transition-all active:scale-95 ${
          variant === 'morning-glory'
            ? 'rounded-[42%] bg-transparent hover:scale-105 disabled:opacity-95'
            : `rounded-full ${
                state === 'listening'
                  ? 'bg-red-500/20 ring-4 ring-red-500/40 animate-pulse'
                  : 'bg-accent/15 ring-2 ring-accent/40 hover:bg-accent/25'
              }`
        }`}
        style={{ width: size, height: size }}
        aria-label={variant === 'morning-glory' ? '点击喇叭花说字' : '按住说话查字'}
      >
        {variant === 'morning-glory' ? (
          <div className="relative h-full w-full">
            <MorningGloryIcon active={state === 'listening' || state === 'thinking'} />
            {state === 'thinking' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/80 border-t-[#5d66d4]" />
              </div>
            )}
          </div>
        ) : state === 'listening' ? (
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

      {variant === 'microphone' && (
        <p className="text-sm text-muted">
          {state === 'idle' && '点一下，说「灵犀的犀怎么写」'}
          {state === 'listening' && '说话中…'}
          {state === 'thinking' && '正在识别…'}
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>
      )}

      {selected && selected.candidates.length > 0 && (
        <div className="w-full max-w-md rounded-lg border border-accent/30 bg-white/75 p-4 text-center text-[#24412e] shadow-sm">
          <p className="text-sm font-bold">你想查哪个字？</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {[...selected.candidates]
              .map((candidate) => candidate.char)
              .filter((char, index, chars) => chars.indexOf(char) === index)
              .map((char) => (
                <button
                  key={char}
                  onClick={() => router.push(`/?q=${encodeURIComponent(char)}`)}
                  className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-[#75b667] bg-[#fff8dd] font-display text-3xl font-black text-[#2a5637] transition hover:-translate-y-0.5 active:scale-95"
                  aria-label={`查询${char}字`}
                >
                  <span className="font-display text-3xl font-black">{char}</span>
                  <span className="mt-1 text-xs text-muted/70">
                    置信度：{Math.round((selected.candidates.find((candidate) => candidate.char === char)?.confidence ?? 0) * 100)}%
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Debug panel: shows ASR alternatives + LLM extraction result */}
      {(alternatives.length > 0 || selected) && (
        <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 p-3 font-mono text-xs">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-white/40">
            Debug · ASR + LLM
          </div>
          {alternatives.length > 0 && (
            <div className="mb-2">
              <div className="mb-1 text-white/50">候选 ({alternatives.length})</div>
              <ol className="space-y-0.5 text-white/80">
                {alternatives.map((alt, i) => (
                  <li key={i} className={i === 0 ? 'text-accent' : 'text-white/50'}>
                    {i + 1}. {alt}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {selected && (
            <div className="border-t border-white/10 pt-2 text-white/70">
              <span className="text-white/50">LLM → </span>
              <span className={selected.candidates[0]?.char ? 'text-accent' : 'text-red-300'}>
                {selected.candidates[0]?.char ?? 'null'}
              </span>
              <span className="text-white/40"> ({selected.source})</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
