# Unify High Reasoning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 DeepSeek 和 MiniMax 都显式使用 `reasoning.effort: 'high'`，并在思考模式下通过 `tool_choice: 'auto'` 保留结构化工具输出，同时解析文本 JSON 回退结果。

**Architecture:** 保持 OpenAI SDK Responses API 和现有模型配置不变。把调用策略从“思考关闭 + 强制指定工具”改为“显式 high + auto 工具选择”；优先读取 `function_call`，没有工具调用时读取 `response.output_text` 并解析 JSON。回退解析只负责格式兼容，字符校验和响应格式继续由服务端完成。

**Tech Stack:** Next.js 16, TypeScript strict, OpenAI SDK Responses API, Node.js ESM, 现有 `scripts/eval-llm.mjs`。

## Global Constraints

- 思考强度必须显式传递，不能依赖厂商默认值。
- 两个模型统一传 `reasoning: { effort: 'high' }`。
- 不使用强制指定工具，改用 `tool_choice: 'auto'`。
- 解析顺序必须是 `function_call` 优先、文本 JSON 回退。
- 只接受 CJK 字符作为 `char` 和 `candidates`，`candidates` 最多 5 个且不能重复主字符。
- API key 只能在服务端读取，不能进入客户端代码。
- 不新增测试框架；继续使用 3 个固定用例脚本。
- 每次代码修改后运行 `npx tsc --noEmit` 和 `npm run build`。

---

### Task 1: 更新模型调用策略

**Files:**
- Modify: `app/api/extract-char/route.ts:17-30`
- Modify: `app/api/extract-char/route.ts:126-134`

**Interfaces:**
- Consumes: Existing `REASONING`, `EXTRACT_TOOL`, `OpenAI.responses.create` call.
- Produces: Responses requests with `reasoning: { effort: 'high' }` and `tool_choice: 'auto'`.

- [ ] **Step 1: Update the reasoning constant and explanatory comment**

Replace the current `none` rationale with an explicit high-reasoning rationale:

```ts
/**
 * Always pass the effort explicitly. DeepSeek defaults to thinking on, while
 * MiniMax has a different default; relying on either vendor default makes the
 * two model profiles diverge.
 */
const REASONING: { effort: ReasoningEffort } = { effort: 'high' }
```

- [ ] **Step 2: Change tool choice from forced to automatic**

Change the request body from:

```ts
tool_choice: { type: 'function', name: 'emit' },
```

to:

```ts
tool_choice: 'auto',
```

Keep `tools: [EXTRACT_TOOL]` unchanged. DeepSeek rejects a forced named tool while reasoning is enabled; `auto` allows the model to reason and still call the extraction tool.

- [ ] **Step 3: Run the typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 4: Run the production build**

Run:

```bash
npm run build
```

Expected: build completes and lists `ƒ /api/extract-char`.

---

### Task 2: Add text JSON fallback parsing

**Files:**
- Modify: `app/api/extract-char/route.ts:136-159`

**Interfaces:**
- Consumes: `OpenAI.Responses.Response.output`, `response.output_text`.
- Produces: The same `ExtractResponse` shape for either a tool call or valid text JSON.

- [ ] **Step 1: Add a small parser helper before `POST`**

Add this helper after `empty()`:

```ts
interface ParsedExtraction {
  char?: string | null
  confidence?: number
  candidates?: string[]
}

function parseTextExtraction(text: string): ParsedExtraction | null {
  const clean = text.replace(/```(?:json)?/g, '').trim()
  try {
    return JSON.parse(clean) as ParsedExtraction
  } catch {
    const match = clean.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0]) as ParsedExtraction
    } catch {
      return null
    }
  }
}
```

- [ ] **Step 2: Replace the no-tool early return with a fallback path**

Replace the current block:

```ts
const call = response.output.find((o) => o.type === 'function_call')
if (!call) {
  console.error('[extract-char] no function_call in output:', response.output.map((o) => o.type))
  return NextResponse.json(empty('llm'))
}

const parsed = JSON.parse(call.arguments) as {
  char?: string
  confidence?: number
  candidates?: string[]
}
```

with:

```ts
const call = response.output.find((o) => o.type === 'function_call')
const parsed = call
  ? (JSON.parse(call.arguments) as ParsedExtraction)
  : parseTextExtraction(response.output_text)

if (!parsed) {
  console.error('[extract-char] no structured extraction in output:', response.output.map((o) => o.type))
  return NextResponse.json(empty('llm'))
}
```

This keeps the tool path as the primary path and accepts a model-generated JSON object only when Responses returns no function call.

- [ ] **Step 3: Keep response validation unchanged**

Retain the existing `char`, `confidence`, and `candidates` validation. Do not accept arbitrary prose or extract the first Chinese character from prose, because that would turn explanation text into a false lookup.

- [ ] **Step 4: Run typecheck and build**

Run:

```bash
npx tsc --noEmit && npm run build
```

Expected: both commands pass.

---

### Task 3: Align the three-case evaluation script

**Files:**
- Modify: `scripts/eval-llm.mjs:13-18`
- Modify: `scripts/eval-llm.mjs:75-82`
- Modify: `scripts/eval-llm.mjs:86-93`

**Interfaces:**
- Consumes: `REASONING.effort` and `SYSTEM_PROMPT` extracted from `route.ts`.
- Produces: A 3-case regression result that uses `effort=high`, `tool_choice=auto`, and the same text fallback as production.

- [ ] **Step 1: Update the script contract comment**

Replace the `effort=none + 强制 tool_choice` wording with:

```js
 *   - 请求形状与 route.ts 保持一致：effort=high + tool_choice=auto
 *     effort 必须显式传递，不能依赖厂商默认值。
```

- [ ] **Step 2: Keep reading effort from route.ts**

The existing `EFFORT` extraction remains in place. It must now resolve to `high`; do not add a second hardcoded effort value.

- [ ] **Step 3: Change the evaluation request**

Change:

```js
tool_choice: { type: 'function', name: 'emit' },
```

to:

```js
tool_choice: 'auto',
```

The existing script already has a text fallback when no function call is returned. Keep it so the script measures the production behavior rather than discarding valid text JSON.

- [ ] **Step 4: Run both model evaluations**

Run:

```bash
node scripts/eval-llm.mjs
LLM_MODEL=MiniMax-M3 node scripts/eval-llm.mjs
```

Expected: each command prints `reasoning.effort=high`, completes all 3 cases, and reports whether each result came through a tool call or text fallback. Do not require a fixed latency or a single tool/text channel; only the returned `char` values determine the case result.

- [ ] **Step 5: Run final static verification**

Run:

```bash
npx tsc --noEmit
npm run build
```

Expected: both pass.

---

## Verification checklist

- [ ] `route.ts` sends `reasoning: { effort: 'high' }` on every Responses request.
- [ ] `route.ts` sends `tool_choice: 'auto'`, never a forced named tool.
- [ ] Tool output remains the first parsing path.
- [ ] Text JSON output is accepted only when it parses as a JSON object.
- [ ] Non-JSON prose still returns the normal empty LLM result.
- [ ] `scripts/eval-llm.mjs` reads the same prompt and effort as `route.ts`.
- [ ] Both model evaluations finish without an uncaught exception.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run build` passes.
