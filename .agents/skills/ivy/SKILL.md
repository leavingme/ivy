---
name: ivy
description: PWA project for Ivy's Chinese stroke-order learning. iPad Safari quirks, hanzi-writer integration, Vercel deployment, PWA manifest configuration.
---

# ivy — Project Skill

## When to load

Load this skill before:
- Touching any PWA-related code (manifest, service worker, iOS meta)
- Integrating hanzi-writer (stroke animation library)
- Working on voice input (Web Speech API + single-character extraction)
- Deploying to Vercel or configuring the `ivy.leavingme.cn` domain
- Touching iPad-specific UX (touch events, safe area, viewport units)

## Project basics

- **Domain:** ivy.leavingme.cn (CNAME → Vercel)
- **Stack:** Next.js 16 App Router · Tailwind v4 · TypeScript strict · hanzi-writer 3.7+ · Vercel
- **Brand:** Same as leavingme.cn — Work Sans display + Anthropic Sans body + dot pattern background
- **Target device:** iPad Safari (PWA mode after Add to Home Screen)

## PWA on iPad Safari — the hard-won gotchas

### 1. Service Worker support is limited

iPad Safari DOES support Service Workers since iOS 11.3, but:
- The SW must be registered from a **secure context** (HTTPS or localhost)
- `navigator.serviceWorker.ready` resolves but push notifications / background sync are NOT supported
- Cache API works fine — use it for hanzi-writer-data JSON files

### 2. iOS meta tags are MANDATORY for "Add to Home Screen"

Without these, the app opens in Safari as a regular tab — no standalone mode:

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">  <!-- redundant but safer -->
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="ivy 藤学">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">  <!-- MUST be 180×180 PNG, no transparency -->
```

In Next.js 13+ App Router, set these in `app/layout.tsx` metadata.

### 3. `100vh` is broken on iOS Safari

The address bar changes the viewport height dynamically. Use `100dvh` instead:

```css
.full-height {
  height: 100vh;      /* fallback */
  height: 100dvh;     /* dynamic viewport height — handles address bar show/hide */
}
```

For PWA mode (after add to home screen), the address bar is gone, so `100vh` is fine. But during onboarding it matters.

### 4. Safe-area insets

iPad Pro has rounded corners; notch-less iPads still need safe-area padding for the home indicator:

```css
.safe-top { padding-top: env(safe-area-inset-top); }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
```

### 5. Touch event quirks

- `touch-action: manipulation` prevents double-tap zoom
- `-webkit-tap-highlight-color: transparent` removes the gray tap flash
- `user-select: none` on UI elements; `user-select: text` only on content areas

## hanzi-writer integration

### Install

```bash
npm install hanzi-writer hanzi-writer-data
```

- `hanzi-writer` is ~30 KB (10 KB gzipped), vanilla JS, works in any modern browser
- `hanzi-writer-data` is 31.5 MB unpacked, but the data is **lazy-loaded per character** — never import the whole package
- License: MIT (both)

### Basic usage (React)

```tsx
'use client'
import HanziWriter from 'hanzi-writer'
import { useEffect, useRef } from 'react'

export function StrokeWriter({ char }: { char: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const writer = HanziWriter.create(ref.current, char, {
      width: 300,
      height: 300,
      padding: 20,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 200,
      showCharacter: false,
      showOutline: true,
      strokeColor: '#333',
      radicalColor: '#168F16',
    })
    writer.loopCharacterAnimation()
    return () => writer.dispose?.()  // cleanup on unmount
  }, [char])

  return <div ref={ref} />
}
```

### Data loading — IMPORTANT

`HanziWriter.create()` needs character data. Default is to fetch from a CDN. For production / offline-first, load data from the npm package:

```tsx
import charData from 'hanzi-writer-data/愁.json'  // ⚠️ imports ONE character only
```

Vite/webpack will create a per-character JSON chunk. **Do not** do `import data from 'hanzi-writer-data'` (that imports 31.5 MB).

### Quiz mode (handwriting practice)

```tsx
writer.quiz({
  onMistake: (strokeData) => console.log('mistake', strokeData),
  onCorrectStroke: (strokeData) => console.log('correct stroke', strokeData),
  onComplete: ({ totalMistakes }) => console.log('done!', totalMistakes),
})
```

Quiz uses pointer events — works on iPad touch.

## Voice input (Web Speech API)

### iPad Safari quirks

- `window.SpeechRecognition` is undefined in Safari; use `window.webkitSpeechRecognition` with feature detect
- **MUST be triggered by user gesture** (click / touch) — browsers won't allow page-load auto-start
- Chinese model: depends on iOS keyboard languages installed. iPad with Simplified Chinese keyboard enabled should work
- `continuous: false` is more reliable than `continuous: true` on iOS

### Pattern

```tsx
const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
if (!SR) return  // feature-detect; show fallback

const recognition = new SR()
recognition.lang = 'zh-CN'
recognition.interimResults = false
recognition.maxAlternatives = 1

recognition.onresult = (event: any) => {
  const text = event.results[0][0].transcript  // e.g. "愁字怎么写"
  const char = extractSingleChar(text)          // → "愁"
  router.push(`/?q=${encodeURIComponent(char)}`)
}

recognition.start()  // MUST be in a click handler
```

### Single-character extraction (heuristic)

User speech → 启发式剥离 → 单字：

- Strip common suffixes: `怎么写`, `字怎么写`, `字的笔顺`, `的写法`, `怎么读`
- Strip particles: `的`, `了`, `呢`, `啊`, `吧`, `嘛`
- If result is 1 char → use it
- If result is >1 char → fall back to "let user tap a character"

Simple regex version:

```ts
function extractSingleChar(text: string): string | null {
  const cleaned = text
    .replace(/(怎么写|字怎么写|字的笔顺|的写法|怎么读|怎么念|是什么意思)/g, '')
    .replace(/[的了呢啊吧嘛呢]/g, '')
    .trim()
  // Match a single CJK Unified Ideograph
  const m = cleaned.match(/[\u4e00-\u9fff]/)
  return m ? m[0] : null
}
```

## iOS Shortcut (primary voice path)

Siri → Shortcut → "Open URL `https://ivy.leavingme.cn/?q={input}"`

Shortcut template (in docs once finalized):

1. Add "ivy 藤学" shortcut
2. Trigger: "Hey Siri, ivy 愁字" (the Shortcut name = "ivy", param = the character)
3. Action: "Open URL" → `https://ivy.leavingme.cn/?q={Shortcut Input}`

User configures this once. URL receives `q` param → 字页 reads `searchParams.get('q')` → renders.

## Vercel deployment

### Setup

```bash
# One-time
vercel link
# Creates .vercel/project.json with projectId

# Add custom domain
vercel domains add ivy.leavingme.cn
# Then add CNAME in DNS: ivy.leavingme.cn → cname.vercel-dns.com
```

### Env

No env vars needed in v0.1 (Local First, no backend).

### Gotcha

- **Stale Build Cache**: New routes may return 404 until Vercel rebuilds. Force rebuild from dashboard.
- **Cache headers for hanzi-writer-data**: These are static files. Vercel CDN serves them; set `Cache-Control: public, max-age=31536000, immutable` in next.config.

## TypeScript patterns

- Strict mode — no `any` (use `unknown` + narrowing)
- For event handlers: `(e: React.MouseEvent<HTMLButtonElement>) => void`
- For Web Speech API (which isn't in lib.dom): declare module augmentation or use `(window as any)` with a comment

## Files map

```
app/
├── layout.tsx         # PWA meta, 字体, viewport
├── page.tsx           # 首页 (语音按钮) + 字页 (动画) by ?q=
├── globals.css        # @theme inline + dot pattern + safe-area
└── icon.tsx           # Next.js dynamic icon (192, 512)
components/
├── StrokeWriter.tsx   # hanzi-writer 集成
├── VoiceButton.tsx    # Web Speech API + 单字提取
└── BackgroundDots.tsx # Canvas / CSS dot pattern
public/
├── icon-192.png
├── icon-512.png
└── apple-touch-icon.png  # 180×180, opaque
```

## Related references

(Add reference docs under `references/` as we encounter new gotchas.)
