import Link from 'next/link'
import { BackgroundDots } from '@/components/BackgroundDots'
import { StrokeWriter } from '@/components/StrokeWriter'
import { VoiceButton } from '@/components/VoiceButton'

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams
  const char = (params.q ?? '').trim().slice(0, 1) // single char only

  // --- Character page ---
  if (char && /[\u4e00-\u9fff]/.test(char)) {
    return (
      <main className="full-height safe-top safe-bottom relative flex flex-col items-center justify-between overflow-hidden bg-background">
        <BackgroundDots />

        {/* Header */}
        <header className="relative z-10 w-full px-6 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            ← 返回
          </Link>
        </header>

        {/* Character + animation */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 animate-entry">
          <h1
            className="font-display text-9xl font-black leading-none text-accent"
            style={{ fontSize: '120px' }}
          >
            {char}
          </h1>
          <StrokeWriter char={char} size={340} />
        </div>

        {/* Footer hint */}
        <footer className="relative z-10 px-6 pb-8 text-center text-xs text-muted">
          嘿 Siri，说「ivy {char}字」直接打开
        </footer>
      </main>
    )
  }

  // --- Home page ---
  return (
    <main className="full-height safe-top safe-bottom relative flex flex-col items-center justify-center overflow-hidden bg-background">
      <BackgroundDots />

      <div className="relative z-10 flex flex-col items-center gap-12 px-6 animate-entry">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-display text-6xl font-black tracking-tight text-foreground">
            ivy
          </h1>
          <p className="font-body text-base text-muted">藤学 · 说话就能看到笔顺</p>
        </div>

        {/* Voice button */}
        <VoiceButton size={200} />

        {/* Setup hint */}
        <details className="max-w-sm rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
          <summary className="cursor-pointer text-foreground/80">
            📱 配 iOS Shortcut（推荐）
          </summary>
          <ol className="mt-3 space-y-2 text-xs text-muted">
            <li>1. 打开 iPhone/iPad 「快捷指令」App</li>
            <li>2. 新建快捷指令，命名「ivy」</li>
            <li>3. 添加动作：「打开 URL」</li>
            <li>
              4. URL 填入：
              <code className="mt-1 block break-all rounded bg-black/40 p-2 text-[11px] text-accent">
                https://ivy.leavingme.cn/?q={'{Shortcut Input}'}
              </code>
            </li>
            <li>5. 保存。说「嘿 Siri，ivy 愁字」就能用</li>
          </ol>
        </details>

        {/* Try-it link */}
        <Link
          href="/?q=愁"
          className="text-xs text-muted/60 underline-offset-4 hover:text-muted hover:underline"
        >
          没有麦克风？点这儿试一下 →
        </Link>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 left-0 right-0 text-center text-[11px] text-muted/40">
        给 Ivy · 二年级
      </footer>
    </main>
  )
}
