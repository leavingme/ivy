# AGENTS.md - ivy（藤学）

This folder is home. Treat it that way.

## Project

**ivy** is a PWA for the user's daughter Ivy — elementary-school Chinese stroke-order practice via voice. One tap, one character, one animation.

- **Domain:** [ivy.leavingme.cn](https://ivy.leavingme.cn)
- **Repo:** leavingme/ivy
- **Stack:** Next.js 16 (App Router) · Tailwind v4 · TypeScript · hanzi-writer · Vercel
- **Brand:** 同源 leavingme.cn（Work Sans + Anthropic Sans + dot pattern）
- **Target:** iPad Safari PWA (added to home screen)

## First run

```bash
cp .env.example .env.local   # add MINIMAX_API_KEY
pnpm install
pnpm run build
pnpm run dev    # localhost:3000
```

`.env.local` requires **`MINIMAX_API_KEY`** (the LLM that powers `/api/extract-char`).
Same value works for both `MINIMAX_API_KEY` (preferred) and `MINIMAX_CN_API_KEY` (alias).
No `.env.local` = LLM calls fall back to local rule-based extraction (still works, less accurate).

## Every session

- **Working directory matters.** This file is only loaded when cwd is `/data/workspace/ivy`. Run `cd /data/workspace/ivy` first.
- **Read `.agents/skills/ivy/SKILL.md`** before doing anything non-trivial (PWA / iPad Safari quirks / hanzi-writer integration / Vercel deployment).

## Memory

Project context intentionally **light** here — most decisions live in `/data/workspace/MEMORY.md` (Hermes long-term memory). The skill captures iPad-specific gotchas and hanzi-writer integration patterns that are too detailed for MEMORY.md.

## Coding Tasks

- Coding work goes through Claude Code CLI (`claude -p`). Hermes coordinates and reviews.
- After every change: `npm run build` must pass. For UI changes, take a screenshot via Playwright + iPad viewport.
- TypeScript strict mode is on. Don't silence errors with `any` — fix the type.
- Test on **real iPad Safari** before declaring a PWA feature done. iPad Safari 兼容性 ≠ Chrome.

## Safety

- **API keys stay server-side** — `MINIMAX_API_KEY` is read only in `app/api/*` route handlers, never in client components. Never `NEXT_PUBLIC_*` it.
- **No database** — all user state lives in localStorage / URL query / Service Worker cache. Don't add a backend persistence layer.
- **Voice privacy** — audio goes to Apple ASR (browser-native), never to our server. Only the ASR *text* (e.g. "讯字怎么写") hits our API, not the audio.
- **PWA icon 隐私** — PWA 用 ivy 字母/logo，不要上传 Ivy 的真实照片到 public/。
- **iPad-only PWA** — designed for iPad Safari PWA mode; not tested on Android/iPhone Chrome PWA.
