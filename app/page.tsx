import Link from 'next/link'
import { BackgroundDots } from '@/components/BackgroundDots'
import { MagicGardenHome } from '@/components/MagicGardenHome'
import { StrokeWriter } from '@/components/StrokeWriter'

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
  return <MagicGardenHome />
}
