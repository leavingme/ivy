import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { ReasoningEffort } from 'openai/resources/shared'

/**
 * Extract a single target Chinese character from natural-language speech.
 *
 * Both DeepSeek and MiniMax go through the OpenAI SDK's Responses API so the
 * request/response shape is identical. The only per-vendor difference —
 * how to turn thinking off — lives in PROFILES below.
 *
 * POST /api/extract-char
 * Body: { text: string, alternatives?: string[] }
 * Returns: { char, confidence, candidates, source }
 */

/**
 * Always pass the effort explicitly. DeepSeek and MiniMax have different
 * vendor defaults, so relying on either default makes the two profiles diverge.
 * With high reasoning, use tool_choice: auto; DeepSeek rejects a forced named
 * tool while thinking is enabled.
 */
const REASONING: { effort: ReasoningEffort } = { effort: 'high' }

const PROFILES: Record<string, { baseURL: string; apiKeyEnv: string }> = {
  deepseek: { baseURL: 'https://api.deepseek.com', apiKeyEnv: 'DEEPSEEK_API_KEY' },
  minimax: { baseURL: 'https://api.minimaxi.com/v1', apiKeyEnv: 'MINIMAX_CN_API_KEY' },
}

const SYSTEM_PROMPT = `从用户的话里提取他们想查的目标汉字。

输入来自语音识别,可能有错别字。判断办法:看 "X的Y字怎么写" 里的 X 是不是真实存在的词,不是就换成最可能的真词,再取出目标字。
- "善长的善字怎么写" -> "擅长" -> 擅
- "纯天的纯字怎么写" -> "春天" -> 春
- "准备的被字怎么写" -> "准备" -> 备
X 本身就是词时不要改。

完全无目标字时 char 返回空字符串。`

const EXTRACT_TOOL = {
  type: 'function' as const,
  name: 'emit',
  description: '按置信度从高到低输出目标汉字候选',
  strict: true,
  parameters: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        char: { type: 'string', description: '单个汉字' },
        confidence: { type: 'number', description: '0 到 1,该字是目标字的可能性' },
      },
      required: ['char', 'confidence'],
      additionalProperties: false,
    },
  },
}


interface ExtractRequest {
  text: string
  alternatives?: string[]
}

interface ExtractResponse {
  candidates: Array<{ char: string; confidence: number | null }>
  source: 'llm' | 'rule'
}

const CJK = /[一-鿿]/

function empty(source: 'llm' | 'rule'): ExtractResponse {
  return { candidates: [], source }
}

function inputCandidates(text: string): string[] {
  return [...new Set(text.match(/[一-鿿]/g) ?? [])].slice(0, 5)
}

interface ParsedExtraction {
  char?: string | null
  confidence?: number
  candidates?: Array<{ char?: string; confidence?: number }>
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

export async function POST(req: NextRequest) {
  let body: ExtractRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const text = (body.text ?? '').trim()
  if (!text) return NextResponse.json(empty('rule'))

  const model = process.env.LLM_MODEL || 'deepseek-flash'
  const profile = PROFILES[model.toLowerCase().includes('minimax') ? 'minimax' : 'deepseek']
  const apiKey = process.env.LLM_API_KEY || process.env[profile.apiKeyEnv]

  if (!apiKey) {
    console.error('[extract-char] no API key set')
    return NextResponse.json(empty('rule'))
  }

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.LLM_BASE_URL || profile.baseURL,
    timeout: 8000, // a hung LLM would otherwise freeze the button on "thinking"
    maxRetries: 1, // MiniMax returns 529 overloaded_error under load
  })

  // Feed ASR alternatives so the model can pick a better reading than top-1
  const altText =
    body.alternatives && body.alternatives.length > 1
      ? `\n\n其它语音识别候选(选最可能正确的):\n${body.alternatives.map((a, i) => `  ${i + 1}. ${a}`).join('\n')}`
      : ''

  try {
    const response = await client.responses.create({
      model,
      instructions: SYSTEM_PROMPT,
      input: `用户说的话(可能含 ASR 错误):\n"""${text}"""${altText}`,
      reasoning: REASONING,
      max_output_tokens: 2000,
      tools: [EXTRACT_TOOL],
      tool_choice: 'auto',
    })

    // Prefer the structured tool result; reasoning mode may return text JSON instead.
    const call = response.output.find((o) => o.type === 'function_call')
    const parsed = call
      ? (JSON.parse(call.arguments) as ParsedExtraction | Array<{ char?: string; confidence?: number }>)
      : parseTextExtraction(response.output_text)

    const candidates = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.candidates)
        ? parsed.candidates
        : parsed?.char
          ? [{ char: parsed.char, confidence: parsed.confidence }]
          : []
    const validCandidates = candidates
      .filter((candidate) => typeof candidate?.char === 'string' && CJK.test(candidate.char))
      .map((candidate) => ({
        char: candidate.char!,
        confidence: typeof candidate.confidence === 'number' ? candidate.confidence : null,
      }))
      .filter((candidate, index, all) => all.findIndex((item) => item.char === candidate.char) === index)
      .slice(0, 5)

    if (!validCandidates.length) {
      const fallbackCandidates = inputCandidates(text).map((char) => ({ char, confidence: null }))
      return NextResponse.json<ExtractResponse>({
        candidates: fallbackCandidates,
        source: 'llm',
      })
    }

    return NextResponse.json<ExtractResponse>({
      candidates: validCandidates,
      source: 'llm',
    })
  } catch (err) {
    // LLM failed — caller prompts the user to retry
    console.error('[extract-char] LLM failed:', err)
    return NextResponse.json(empty('rule'))
  }
}

// Block other methods
export async function GET() {
  return NextResponse.json({ error: 'POST only' }, { status: 405 })
}
