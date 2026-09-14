'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function CharacterInput() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    const char = value.trim()
    if (!/^[一-鿿]$/.test(char)) {
      setError('请输入一个汉字')
      return
    }
    router.push(`/?q=${encodeURIComponent(char)}`)
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="flex w-full max-w-sm flex-col items-center gap-2"
    >
      <div className="flex w-full gap-2">
        <label htmlFor="character-input" className="sr-only">
          输入一个汉字
        </label>
        <input
          id="character-input"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError('')
          }}
          maxLength={1}
          placeholder="输入一个汉字"
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-center text-lg text-foreground outline-none placeholder:text-muted/60 focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black transition hover:brightness-110 active:scale-95"
        >
          查看笔顺
        </button>
      </div>
      <p className="h-5 text-xs text-red-300" role="alert">
        {error}
      </p>
    </form>
  )
}
