# Add Manual Character Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用文字输入替换首页固定的“愁”试用链接，让没有麦克风的用户输入一个汉字查看笔顺。

**Architecture:** 新增一个客户端组件负责输入状态、单汉字校验和路由跳转；首页只替换原固定链接，不改变语音入口、Shortcut 指引或字页。使用浏览器原生 input 和 Next.js `useRouter`，不新增依赖。

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4。

## Global Constraints

- 只接受一个 CJK 汉字，正则使用 `/^[一-鿿]$/`。
- 非法输入只显示本地错误，不调用 LLM。
- 保持原首页简洁布局。
- 不新增依赖。
- 修改后运行 `npx tsc --noEmit` 和 `npm run build`。

---

### Task 1: Add manual character input component

**Files:**
- Create: `components/CharacterInput.tsx`
- Modify: `app/page.tsx:1-4,85-91`

**Interfaces:**
- Produces: `CharacterInput` React component with no required props.
- Consumes: `useRouter` and native input/button behavior.

- [ ] **Step 1: Create `components/CharacterInput.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
```

- [ ] **Step 2: Replace the fixed link on the home page**

In `app/page.tsx`, import `CharacterInput` and replace the `Link` block from lines 86-91 with:

```tsx
{/* Manual fallback */}
<CharacterInput />
```

Remove the now-unused `Link` only if it is no longer used by the character page. It remains used by the character-page back link, so keep it.

- [ ] **Step 3: Run static verification**

```bash
npx tsc --noEmit
npm run build
```

Expected: both pass and `/api/extract-char` remains listed as a dynamic route.

- [ ] **Step 4: Check the exact validation behavior**

Expected behavior:

- Empty input → `请输入一个汉字`, no navigation.
- `愁` → navigates to `/?q=%E 愁` equivalent URL encoding.
- `愁啊` → native `maxLength=1` prevents normal typing beyond one character; pasted invalid content is rejected by `/^[一-鿿]$/`.
- `a` or `1` → `请输入一个汉字`, no navigation.
- Pressing Enter behaves like clicking “查看笔顺”.
