# Next Steps for ivy 藤学

> Created 2026-06-16 after v0.1 code complete + GitHub push.
> Read this first if you (or a future Hermes session) come back to this project.

## ✅ Completed (v0.1 code shipped)

- [x] `/data/workspace/ivy/` Next.js 16 + Tailwind v4 + TypeScript strict PWA
- [x] 首页 `/`: voice button (Web Speech API) + iOS Shortcut setup hint + try-it link
- [x] 字页 `/?q=愁`: hanzi-writer 笔顺动画 + loop + "再看一次" replay button
- [x] PWA: manifest.webmanifest + apple-mobile-web-app-capable + auto-generated /icon
- [x] Brand-aligned: Work Sans + Anthropic Sans + dot pattern (same as leavingme.cn)
- [x] `npm run build` passes (5 static pages)
- [x] Browser-verified: 首页 + 字页 animations render correctly
- [x] GitHub: https://github.com/leavingme/ivy (branch `main`, 2 commits)

## ⏸️ Pending — human action required

### 1. Vercel deployment (user does in dashboard)

`vercel login` requires GUI browser interaction; Hermes can't do it.

**Steps (~5 min):**
1. https://vercel.com/leavingme → Add New → Project
2. Import `leavingme/ivy`
3. Framework: Next.js (auto-detect)
4. Root: `./`
5. No env vars needed
6. Deploy
7. Project Settings → Domains → add `ivy.leavingme.cn`
8. Add DNS CNAME at leavingme.cn's registrar:
   - host: `ivy`, value: `cname.vercel-dns.com`
9. SSL auto-issued within minutes

### 2. iPad PWA validation (user does on real iPad)

Once deployed, on iPad Safari:
- Visit `https://ivy.leavingme.cn` → confirm logo + voice button render
- Tap mic → grant permission → say a character → confirm redirect to stroke page
- Share menu → "Add to Home Screen" → launch from home icon → confirm standalone mode

### 3. iOS Shortcut setup (user does, ~5 min)

In iOS Shortcuts app:
1. New shortcut named "ivy"
2. Action: "Open URL"
3. URL: `https://ivy.leavingme.cn/?q={Shortcut Input}`
4. Save

Test: "Hey Siri, ivy 愁字" → should open ivy.leavingme.cn/?q=愁.

## 🚀 v0.2 candidates (when v0.1 is validated)

User said "yes" once testing on real iPad succeeds. Pick from this list:

- **拼音显示** — load pinyin JSON for 部编版 grade-2 characters
- **字朗读 (TTS)** — `speechSynthesis.speak(new SpeechSynthesisUtterance(char))`
- **手写跟写 (quiz mode)** — hanzi-writer `quiz()` API; user draws on iPad, app validates stroke order
- **字表收藏** — localStorage list of "我看过的字"
- **错字本** — localStorage list of "我标错的字"
- **笔画数 / 部首** — display alongside the character

Tech notes for v0.2:
- Pinyin source: https://github.com/pwxcoo/chinese-xinhua (CC BY-SA)
- Speech synthesis: zero-dep, browser-native
- Quiz mode: hanzi-writer has `quiz()` method already imported

## 🛑 Known limitations

- **No backend** — v0.1 is pure static. Cannot track usage across devices.
- **No real handwriting recognition** — hanzi-writer quiz validates stroke *order/direction*, not actual character recognition.
- **iPad Safari Web Speech** requires user gesture + permission; first-time users must grant mic access.
- **No offline mode** — hanzi-writer-data fetches per character; SW cache can be added in v0.2.
- **No analytics** — no telemetry; no idea how often Ivy uses it without her telling us.

## 📂 Key files

- `app/page.tsx` — routes between homepage and character page based on `?q=`
- `components/StrokeWriter.tsx` — hanzi-writer integration (per-char lazy load)
- `components/VoiceButton.tsx` — Web Speech API + `extractSingleChar()` heuristic
- `app/layout.tsx` — PWA meta tags + Work Sans font preload
- `app/manifest.ts` — PWA manifest (name, icons, theme)
- `app/icon.tsx` — dynamic icon (Next.js OG ImageResponse)
- `.agents/skills/ivy/SKILL.md` — iPad Safari + hanzi-writer integration gotchas

## 🔧 Useful commands

```bash
cd /data/workspace/ivy
npm install
npm run dev      # localhost:3000
npm run build    # production build (verifies everything compiles)
```
