# ivy — 藤学

女儿 Ivy 的语文学习助手（PWA · 语音查字 · 笔顺动画）

- **域名：** [ivy.leavingme.cn](https://ivy.leavingme.cn)
- **设备：** iPad Safari（添加到主屏幕）
- **目标用户：** Ivy，二年级

## 命名

- **ivy** = 项目代号（域名 / GitHub / 部署）
- **藤学** = Ivy（常春藤）+ 学习，向上攀、长得快，寓意螺旋式成长
- 跟 leavingme.cn 同源品牌（字体、Canvas 背景、技术栈一致）

## v0.1 范围（极简）

**一句话：** Ivy 说话 → iPad 展示这个字的笔顺动画。

### 核心交互
```
嘿 Siri，ivy 愁字       →  ivy.leavingme.cn/?q=愁  →  大字 + 笔顺动画
藤学 "想"              →  /?q=想
```

### 两条路径
1. **iOS Shortcut（主路径）** —— "嘿 Siri，ivy [字]" 通过 URL Scheme 唤起；Siri 中文识别 100% 准
2. **Web Speech API（兜底）** —— 首页按住麦克风按钮，iPad Safari 识别 → 启发式提取单字 → 跳转

### UI（极简）
- `/` 首页：大字 logo "ivy 藤学" + 一个圆形麦克风按钮 + Shortcut 配对指引
- `/?q=愁` 字页：大字 + 拼音（懒加载） + hanzi-writer 笔顺动画 + 重听按钮

### 数据
- **笔顺动画：** [hanzi-writer](https://hanziwriter.org/) + [hanzi-writer-data](https://www.npmjs.com/package/hanzi-writer-data)（MIT，9000+ 字，懒加载）
- **拼音：** 集成到字页（CDN 或静态 JSON，v0.1 暂缓）

### PWA
- manifest.json（独立窗口、theme color、icons）
- iOS 添加到主屏幕的 apple-touch-icon + apple-mobile-web-app-capable meta
- 离线缓存：hanzi-writer-data 走 Service Worker cache-first

## 不做的事（v0.1）

- ❌ 识字 / 组词 / 释义（Ivy 已不需要）
- ❌ 看图写话（频次低 + 隐私敏感）
- ❌ 错字本 / 复习曲线 / 家长后台
- ❌ AI 引导作文 / AI 润色
- ❌ 用户账号体系

## 技术栈

- Next.js 16（App Router）+ TypeScript strict
- Tailwind v4（@theme inline）
- hanzi-writer + hanzi-writer-data（前端）
- 字体：Work Sans（display） + Anthropic Sans（body，CDN woff2）
- 背景：dot pattern radial-gradient（与 leavingme.cn 同源）
- 部署：Vercel

## 目录

```
ivy/
├── app/                  # Next.js App Router
│   ├── layout.tsx        # PWA meta + 字体
│   ├── page.tsx          # 首页（语音按钮 + Shortcut 指引）
│   ├── globals.css       # @theme inline + dot pattern
│   └── manifest.ts       # PWA manifest (Next 13+ API)
├── components/
│   ├── StrokeWriter.tsx  # hanzi-writer 集成（笔顺动画）
│   ├── VoiceButton.tsx   # Web Speech API + 单字提取
│   └── BackgroundDots.tsx # Canvas / CSS dot pattern
├── public/
│   ├── icon-192.png      # PWA icon
│   ├── icon-512.png      # PWA icon
│   └── apple-touch-icon.png
├── docs/
│   ├── 00-eval.md        # MVP 痛点评估（已存档）
│   └── 01-v0.1-spec.md   # v0.1 产品规格（待写）
├── .agents/skills/
├── AGENTS.md             # Agent entry point
├── package.json
├── next.config.mjs
├── tsconfig.json
└── postcss.config.mjs
```

## 后续版本（v0.2+ 候选）

- 拼音显示（部编版二年级字表）
- 部首 / 笔画数显示
- 组词卡片（与 leavingme.cn 同款字体）
- AI 出"造句挑战"
- 错字本（localStorage）
- 奖章 / 进度激励
