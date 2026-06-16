'use client'

import { useEffect, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'

interface StrokeWriterProps {
  char: string
  /** size in px (square) */
  size?: number
  /** auto-loop the animation */
  loop?: boolean
  /** show outline (faded character behind animation) */
  showOutline?: boolean
}

export function StrokeWriter({
  char,
  size = 320,
  loop = true,
  showOutline = true,
}: StrokeWriterProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const writerRef = useRef<HanziWriter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    // Reset DOM (HanziWriter doesn't re-init cleanly on the same div)
    containerRef.current.innerHTML = ''

    try {
      // HanziWriter.create() is synchronous — it returns the writer immediately
      // and loads character data in the background. Use the success/error
      // callbacks in options to know when the data is ready.
      const writer = HanziWriter.create(containerRef.current, char, {
        width: size,
        height: size,
        padding: 16,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 250,
        delayBetweenLoops: 1500,
        strokeColor: '#f0f0f0',
        radicalColor: '#fbbf24',
        outlineColor: 'rgba(240, 240, 240, 0.25)',
        drawingColor: '#fbbf24',
        showOutline,
        showCharacter: false,
        showHintAfterMisses: 2,
        highlightOnComplete: true,
        onLoadCharDataSuccess: () => {
          setLoading(false)
          if (loop) {
            writer.loopCharacterAnimation()
          } else {
            writer.animateCharacter()
          }
        },
        onLoadCharDataError: (err: unknown) => {
          console.error('[StrokeWriter] char data load failed:', err)
          setError(`没找到"${char}"的笔顺数据`)
          setLoading(false)
        },
      })
      writerRef.current = writer
    } catch (err) {
      console.error('[StrokeWriter] create failed:', err)
      setError(`"${char}" 不是有效汉字`)
      setLoading(false)
    }

    return () => {
      // HanziWriter doesn't have dispose — clearing innerHTML is sufficient
      if (containerRef.current) containerRef.current.innerHTML = ''
      writerRef.current = null
    }
  }, [char, size, loop, showOutline])

  const replay = () => {
    writerRef.current?.animateCharacter()
  }

  return (
    <div className="relative inline-flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Loading skeleton */}
        {loading && !error && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/5 animate-pulse"
            style={{ width: size, height: size }}
          >
            <span className="text-muted text-sm">笔顺加载中…</span>
          </div>
        )}
        {/* Error fallback */}
        {error && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10"
            style={{ width: size, height: size }}
          >
            <span className="text-2xl">{char}</span>
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}
        {/* HanziWriter mounts here */}
        <div
          ref={containerRef}
          style={{ width: size, height: size }}
          className="touch-manipulation"
        />
      </div>

      {/* Controls */}
      {!loading && !error && (
        <button
          onClick={replay}
          className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm text-foreground/80 active:bg-white/10"
        >
          ↻ 再看一次
        </button>
      )}
    </div>
  )
}
