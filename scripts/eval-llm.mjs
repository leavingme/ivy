#!/usr/bin/env node
/**
 * LLM 提取评测 — 3 个固定用例，控制变量，跑一次就能判断好坏。
 *
 *   node scripts/eval-llm.mjs                      # 测默认模型（deepseek-flash）
 *   LLM_MODEL=MiniMax-M3 node scripts/eval-llm.mjs # 换模型
 *
 * 为什么要固定这 3 个用例：它们覆盖了唯一需要 LLM 判断的三件事。
 *   c1  擅→善   ASR 把词和目标字一起听错成同音字，句子内部自洽 —— 最难的一类
 *   c2  备→被   ASR 把目标字听成同音字，词还留着
 *   c3  无目标字 纯闲聊，必须返回 null 而不是瞎猜
 *
 * 变量控制（改动任一项都会让历史结果不可比，别随手改）：
 *   - prompt 直接读 route.ts，不在这里复制一份
 *   - 请求形状与 route.ts 保持一致：effort=high + tool_choice=auto
 *     effort 必须显式传递，不能依赖厂商默认值。
 *   - 每个用例跑 REPEAT 次，因为 MiniMax 的行为有随机性，单次会骗人
 */
import OpenAI from 'openai'
import { readFileSync } from 'node:fs'

const REPEAT = 3
const CASES = [
  { id: 'c1', text: '善长的善字怎么写', want: '擅', note: '词+目标字一起被听错' },
  { id: 'c2', text: '准备的被字怎么写', want: '备', note: '目标字被听错' },
  { id: 'c3', text: '今天天气真好', want: null, note: '无目标字，应返回 null' },
]

// --- 与 route.ts 共用 prompt 和 effort，避免两处漂移 ---
const route = readFileSync(new URL('../app/api/extract-char/route.ts', import.meta.url), 'utf8')
const SYSTEM_PROMPT = route.match(/const SYSTEM_PROMPT = `([\s\S]*?)`/)[1]

// 思考模式必须显式传，不能落回厂商默认（DeepSeek 默认开会 400 拒绝强制 tool_choice）。
// 从 route.ts 读，保证测试测的就是线上跑的强度。
const EFFORT = route.match(/const REASONING[^=]*= \{ effort: '([^']+)' \}/)?.[1]
if (!EFFORT) {
  console.error('❌ 无法从 route.ts 读到 REASONING.effort —— 思考强度必须显式声明')
  process.exit(1)
}

const SCHEMA = {
  type: 'object',
  properties: {
    char: { type: 'string' },
    confidence: { type: 'number' },
    candidates: { type: 'array', items: { type: 'string' } },
  },
  required: ['char', 'confidence', 'candidates'],
  additionalProperties: false,
}

const model = process.env.LLM_MODEL || 'deepseek-flash'
const isMiniMax = model.toLowerCase().includes('minimax')
const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY || (isMiniMax ? process.env.MINIMAX_CN_API_KEY : process.env.DEEPSEEK_API_KEY),
  baseURL: process.env.LLM_BASE_URL || (isMiniMax ? 'https://api.minimaxi.com/v1' : 'https://api.deepseek.com'),
  timeout: 60000,
})

console.log(`model=${model}  repeat=${REPEAT}  reasoning.effort=${EFFORT}\n`)

// 断言：思考强度是显式关的。开着就会看到 reasoning token，说明有人在 route.ts
// 把它改成了默认值 —— 那种情况下 DeepSeek 会 400，MiniMax 则会静默变慢。
let sawReasoning = false

let pass = 0
for (const c of CASES) {
  const outcomes = []
  const times = []
  for (let i = 0; i < REPEAT; i++) {
    const t = Date.now()
    let got
    try {
      const r = await client.responses.create({
        model,
        instructions: SYSTEM_PROMPT,
        input: `用户说的话(可能含 ASR 错误):\n"""${c.text}"""`,
        reasoning: { effort: EFFORT },
        max_output_tokens: 2000,
        tools: [{ type: 'function', name: 'emit', parameters: SCHEMA, strict: true }],
        tool_choice: 'auto',
      })
      if (r.usage?.output_tokens_details?.reasoning_tokens) sawReasoning = true
      times.push(Date.now() - t)
      const call = (r.output || []).find((o) => o.type === 'function_call')
      if (call) {
        got = JSON.parse(call.arguments).char || null
      } else {
        // 没走工具通道 — 把文本也解析出来，方便判断是「模型偷懒」还是「我们丢了结果」
        const txt = (r.output_text || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim()
        try { got = JSON.parse(txt).char || null } catch { got = `<非JSON:${txt.slice(0, 24)}>` }
      }
    } catch (e) {
      got = `<错误 ${e.status || e.name}>`
    }
    outcomes.push(got)
    if (got === c.want) pass++
  }
  const expect = c.want === null ? 'null' : c.want
  const okCount = outcomes.filter((o) => o === c.want).length
  const mark = okCount === REPEAT ? '✅' : okCount === 0 ? '❌' : '⚠️ '
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / Math.max(times.length, 1))
  console.log(`${mark} ${c.id}  ${c.note}`)
  console.log(`     "${c.text}"  期望=${expect}  得到=${outcomes.map((o) => JSON.stringify(o)).join(' ')}  ${avg}ms`)
}

const total = CASES.length * REPEAT
console.log(`\n合计 ${pass}/${total}`)

if (sawReasoning && EFFORT === 'none') {
  console.log('❌ 传了 effort=none 却出现 reasoning token —— 厂商可能改了 none 的语义，需复核')
  process.exit(1)
}
if (EFFORT !== 'high') {
  console.log(`❌ 当前 effort=${EFFORT}，项目要求统一使用 high`)
  process.exit(1)
}

process.exit(pass === total ? 0 : 1)
