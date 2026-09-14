import Link from 'next/link'
import { VoiceButton } from '@/components/VoiceButton'

const practiceChars = ['春', '森', '晴', '想', '梦']

const gardenRooms = [
  {
    name: '拼音屋',
    hint: '读音',
    color: 'bg-[#eaf7ff] text-[#22657a] border-[#99d7ea]',
    icon: 'cloud',
  },
  {
    name: '跟写台',
    hint: '练笔',
    color: 'bg-[#fff1d6] text-[#7d5623] border-[#efc879]',
    icon: 'pencil',
  },
  {
    name: '词语篮',
    hint: '组词',
    color: 'bg-[#f2edff] text-[#6251a7] border-[#c7b7f0]',
    icon: 'basket',
  },
  {
    name: '错字本',
    hint: '复习',
    color: 'bg-[#ffe9ee] text-[#8a4252] border-[#efb1bf]',
    icon: 'book',
  },
] as const

function LeafMark() {
  return (
    <svg viewBox="0 0 88 88" aria-hidden="true" className="h-14 w-14">
      <path
        d="M45 78C22 68 12 47 18 23c24-6 45 5 55 29-6 13-15 22-28 26Z"
        fill="#3f9b63"
      />
      <path
        d="M29 30c16 12 27 27 33 45M28 54c13-5 25-3 36 6"
        fill="none"
        stroke="#dcf5c4"
        strokeLinecap="round"
        strokeWidth="5"
      />
      <path
        d="M33 15c11 4 19 11 23 23"
        fill="none"
        stroke="#83c65d"
        strokeLinecap="round"
        strokeWidth="8"
      />
    </svg>
  )
}

function RoomIcon({ type }: { type: (typeof gardenRooms)[number]['icon'] }) {
  if (type === 'cloud') {
    return (
      <svg viewBox="0 0 96 72" aria-hidden="true" className="h-14 w-16">
        <path
          d="M24 54h48c12 0 19-7 19-17 0-9-7-16-17-16h-2C68 11 59 5 48 5 34 5 24 15 23 29 12 30 5 38 5 48c0 9 7 16 19 16Z"
          fill="#8ed8ef"
        />
        <path d="M24 54h48c12 0 19-7 19-17" fill="none" stroke="#2f88a2" strokeLinecap="round" strokeWidth="5" opacity=".45" />
        <path d="M32 35h31M41 47h22" stroke="#fff7dc" strokeLinecap="round" strokeWidth="6" />
      </svg>
    )
  }

  if (type === 'pencil') {
    return (
      <svg viewBox="0 0 96 72" aria-hidden="true" className="h-14 w-16">
        <path d="M23 52 63 12l17 17-40 40-22 5Z" fill="#f5c55c" />
        <path d="m63 12 8-8 17 17-8 8Z" fill="#f07b61" />
        <path d="m18 74 5-22 17 17Z" fill="#8f5b39" />
        <path d="M29 48 66 11M41 61l37-37" stroke="#7d5623" strokeLinecap="round" strokeWidth="5" opacity=".4" />
      </svg>
    )
  }

  if (type === 'basket') {
    return (
      <svg viewBox="0 0 96 72" aria-hidden="true" className="h-14 w-16">
        <path d="M21 31h54l-7 35H28Z" fill="#caa7f0" />
        <path d="M31 32c2-17 12-26 28-26 14 0 24 9 26 26" fill="none" stroke="#7359b2" strokeLinecap="round" strokeWidth="7" />
        <path d="M21 31h54M31 43h34M35 56h26" stroke="#7359b2" strokeLinecap="round" strokeWidth="5" opacity=".55" />
        <circle cx="34" cy="26" r="7" fill="#ffcb65" />
        <circle cx="52" cy="24" r="8" fill="#ff8c9c" />
        <circle cx="67" cy="27" r="7" fill="#7ccd68" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 96 72" aria-hidden="true" className="h-14 w-16">
      <path d="M22 10h32c12 0 20 8 20 20v34H38c-10 0-16-6-16-16Z" fill="#f5b5c1" />
      <path d="M38 10h36v54H38c-10 0-16-6-16-16V26c0-10 6-16 16-16Z" fill="none" stroke="#8a4252" strokeLinecap="round" strokeWidth="6" />
      <path d="M40 24h21M40 38h18M40 52h24" stroke="#fff7dc" strokeLinecap="round" strokeWidth="5" />
    </svg>
  )
}

function GardenBackdrop() {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,#fff2bc_0%,#c9eef0_43%,#c8e89f_100%)]"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-dots opacity-35 [--background-size-dot-pattern:30px_30px]" />
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 900"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <path d="M-80 650C95 548 238 552 356 637c128 92 265 91 412 1 148-91 326-86 512 19v275H-80Z" fill="#73bd69" />
        <path d="M-70 735c128-80 246-80 354 0 112 83 242 87 389 12 171-87 361-79 607 25v160H-70Z" fill="#389353" />
        <path d="M594 582c-48 88-51 183 2 286 55-104 55-199 0-286Z" fill="#d5a558" opacity=".72" />
        <path d="M300 720c48-22 95-23 142-4M790 705c64-26 126-24 186 7" fill="none" stroke="#9add78" strokeLinecap="round" strokeWidth="18" />
        <g fill="#fff8c4" opacity=".9">
          <path d="M164 195l11 25 25 11-25 11-11 25-11-25-25-11 25-11Z" />
          <path d="M1000 214l8 18 18 8-18 8-8 18-8-18-18-8 18-8Z" />
          <path d="M766 133l6 13 13 6-13 6-6 13-6-13-13-6 13-6Z" />
        </g>
      </svg>
    </>
  )
}

function PlaceholderRoom({
  room,
}: {
  room: (typeof gardenRooms)[number]
}) {
  return (
    <div
      className={`relative flex min-h-[154px] flex-col justify-between overflow-hidden rounded-[8px] border-2 p-4 shadow-[0_14px_28px_rgba(55,82,49,0.12)] ${room.color}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[1.65rem] font-black leading-none tracking-normal">{room.name}</p>
          <p className="mt-2 text-sm font-bold opacity-70">{room.hint}</p>
        </div>
        <RoomIcon type={room.icon} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2" aria-hidden="true">
        <span className="h-10 rounded-[8px] border border-current/10 bg-white/38" />
        <span className="h-10 rounded-[8px] border border-current/10 bg-white/48" />
        <span className="h-10 rounded-[8px] border border-current/10 bg-white/38" />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="inline-flex h-8 w-fit items-center rounded-full border border-current/15 bg-white/52 px-3 text-xs font-black">
          小苗先种下
        </div>
        <svg viewBox="0 0 92 36" aria-hidden="true" className="h-8 w-20 opacity-75">
          <path d="M4 30c16-11 32-11 48 0 13-8 25-8 36-1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="7" opacity=".28" />
          <path d="M21 26c-2-11 2-18 11-21 8 4 11 11 8 22" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="5" opacity=".42" />
        </svg>
      </div>
    </div>
  )
}

function MagicGardenHome() {
  return (
    <main className="full-height safe-top safe-bottom relative isolate overflow-hidden text-[#24412e]">
      <GardenBackdrop />

      <section className="relative z-10 mx-auto grid h-full w-full max-w-[1220px] grid-rows-[auto_1fr] gap-4 px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LeafMark />
            <div>
              <p className="font-display text-[12px] font-black uppercase leading-none tracking-[0.18em] text-[#3e7b4a]">
                ivy
              </p>
              <h1 className="mt-1 font-display text-[clamp(2.45rem,5.2vw,4.9rem)] font-black leading-none tracking-normal text-[#24452f]">
                魔法花园
              </h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#3e7b4a]/15 bg-[#fff9dd]/72 px-4 py-2 text-sm font-black text-[#3f6d45] shadow-sm backdrop-blur sm:flex">
            今天也长高一点点
          </div>
        </header>

        <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-[1.05fr_1.2fr]">
          <section className="relative overflow-hidden rounded-[8px] border-2 border-[#75b667] bg-[#fff8dd]/82 p-5 shadow-[0_18px_36px_rgba(55,82,49,0.16)] backdrop-blur">
            <div className="relative grid h-full min-h-[430px] grid-rows-[auto_1fr_auto]">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.14em] text-[#4d8a55]">Today's patch</p>
                <h2 className="mt-2 max-w-[9em] font-display text-[clamp(2.3rem,5vw,4.2rem)] font-black leading-[0.95] tracking-normal text-[#2a5637]">
                  先挑一朵字花
                </h2>
              </div>

              <div className="relative grid place-items-center py-4">
                <svg aria-hidden="true" viewBox="0 0 520 260" className="absolute inset-x-0 bottom-0 mx-auto h-[78%] max-h-[260px] w-[92%] max-w-[520px]">
                  <path d="M31 188c69-37 137-38 204-2 76-42 159-39 254 9" fill="none" stroke="#c9dc78" strokeLinecap="round" strokeWidth="28" opacity=".65" />
                  <path d="M54 216c58-24 116-24 175 0 75-30 151-28 229 6" fill="none" stroke="#7fc96a" strokeLinecap="round" strokeWidth="22" opacity=".75" />
                  <path d="M101 238c87-22 183-22 289 0" fill="none" stroke="#4b9b58" strokeLinecap="round" strokeWidth="19" opacity=".65" />
                  <path d="M259 23l8 18 18 8-18 8-8 18-8-18-18-8 18-8Z" fill="#fff4ad" opacity=".9" />
                  <path d="M430 72l6 13 13 6-13 6-6 13-6-13-13-6 13-6Z" fill="#fff4ad" opacity=".8" />
                </svg>
                <div className="relative grid w-full max-w-[500px] grid-cols-5 items-end gap-2">
                  {practiceChars.map((char, index) => (
                    <Link
                      key={char}
                      href={`/?q=${encodeURIComponent(char)}`}
                      className="garden-flower-link group flex min-h-[118px] flex-col items-center justify-end gap-2 rounded-[8px] border-2 border-[#5e9b54]/18 bg-white/52 p-2 shadow-sm transition hover:-translate-y-1 hover:bg-white/76 active:scale-95"
                      style={{ animationDelay: `${index * -0.35}s` }}
                    >
                      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#ffd96f] font-display text-[2.35rem] font-black leading-none text-[#2f6a3c] shadow-[inset_0_-5px_0_rgba(169,113,31,0.14)] group-hover:bg-[#ffe58e]">
                        {char}
                      </span>
                      <span aria-hidden="true" className="h-8 w-2 rounded-full bg-[#53a95a]" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="relative flex items-end justify-between gap-3">
                <div className="rounded-[8px] border-2 border-[#5e9b54]/16 bg-white/56 px-4 py-3 text-sm font-bold leading-relaxed text-[#456a42]">
                  今日字花，轻轻一点看笔顺。
                </div>
                <div className="garden-sway garden-voice shrink-0">
                  <VoiceButton size={88} variant="morning-glory" />
                </div>
              </div>
            </div>
          </section>

          <section className="grid min-h-0 grid-rows-[auto_1fr] gap-4">
            <div className="rounded-[8px] border-2 border-[#8fcbd3] bg-[#effbfb]/82 p-5 shadow-[0_18px_36px_rgba(55,82,49,0.12)] backdrop-blur">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-[#397e88]">Garden map</p>
                  <h2 className="mt-2 font-display text-[clamp(2rem,3.7vw,3.7rem)] font-black leading-none tracking-normal text-[#285b64]">
                    花园小屋
                  </h2>
                </div>
                <Link
                  href="/?q=愁"
                  className="flex h-12 items-center justify-center rounded-full border-2 border-[#397e88]/15 bg-white/72 px-5 font-display text-2xl font-black leading-none text-[#285b64] shadow-sm transition hover:-translate-y-0.5 hover:bg-white active:scale-95"
                >
                  愁
                </Link>
              </div>
            </div>

            <div className="grid min-h-0 grid-cols-2 gap-4">
              {gardenRooms.map((room) => (
                <PlaceholderRoom key={room.name} room={room} />
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

export { MagicGardenHome }
