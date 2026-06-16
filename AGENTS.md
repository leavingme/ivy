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
npm install
npm run build
npm run dev    # localhost:3000
```

No `.env.local` needed in v0.1 — 全 Local First，零 API Key。

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

- **No backend in v0.1** — all state lives in localStorage / URL query / Service Worker cache. Don't add a database.
- **No API keys** — voice is Web Speech API (browser-native) or iOS Shortcut (URL scheme). Don't introduce a paid ASR service.
- **PWA icon 隐私** — PWA 用 ivy 字母/logo，不要上传 Ivy 的真实照片到 public/。
