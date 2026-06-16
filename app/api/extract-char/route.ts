import { NextRequest, NextResponse } from 'next/server'

/**
 * Extract a single target Chinese character from natural-language speech.
 *
 * Uses MiniMax-M3 (or fallback to local rule-based extractor on failure).
 * Server-side only — API key never leaves the server.
 *
 * POST /api/extract-char
 * Body: { text: string, alternatives?: string[] }
 * Returns: { char: string, confidence: number, source: 'llm' | 'rule' }
 */

const SYSTEM_PROMPT = `从用户的话里提取他们想查的目标汉字。

只返回 JSON: {"char": "讯", "confidence": 0.95}

规则:
- "X的Y" 取 Y
- 比较句("哪个难写")默认取最后提到的字
- 跳过"的/字/怎么"等辅助词
- 完全无目标字时 char 返回空字符串`

interface ExtractRequest {
  text: string
  alternatives?: string[]
}

interface ExtractResponse {
  char: string | null
  confidence: number
  source: 'llm' | 'rule' | 'fallback'
  /** echo the raw model output for debugging */
  raw?: string
}

/** Rule-based fallback used when LLM is unavailable or fails. */
function extractSingleChar(text: string): string | null {
  const deIdx = text.lastIndexOf('的')
  if (deIdx >= 0) {
    const after = text.slice(deIdx + 1).replace(/[的了呢啊吧嘛呢呀哦哈]/g, '').trim()
    const cjkAfter = after.match(/[\u4e00-\u9fff]/)
    if (cjkAfter) return cjkAfter[0]
    return null
  }
  const cleaned = text
    .replace(/(怎么写|字怎么写|字的笔顺|的笔顺|的写法|怎么读|怎么念|是什么意思|啥意思|是什么字|念什么|读什么|怎么念|怎么|呢|啊|吧|什么)/g, '')
    .replace(/(帮我查|帮我看一下|我想知道|我想看|给我看看|我想学|那个字|这个字|查一下|查下|看一下|看看这个|看下|看一下|查一)/g, '')
    .replace(/字$/g, '')
    .replace(/[的了呢啊吧嘛呢呀哦哈]/g, '')
    .trim()
  const m = cleaned.match(/[\u4e00-\u9fff](?![\u4e00-\u9fff])/)
  return m ? m[0] : null
}

export async function POST(req: NextRequest) {
  let body: ExtractRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const text = (body.text ?? '').trim()
  if (!text) {
    return NextResponse.json<ExtractResponse>({
      char: null,
      confidence: 0,
      source: 'rule',
    })
  }

  // Read API key — support both naming conventions
  const apiKey = process.env.MINIMAX_API_KEY || process.env.MINIMAX_CN_API_KEY
  const baseUrl = process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com/v1'
  const model = process.env.MINIMAX_MODEL || 'MiniMax-M3'

  // If no key configured, fall back to rules
  if (!apiKey) {
    const char = extractSingleChar(text)
    return NextResponse.json<ExtractResponse>({
      char,
      confidence: char ? 0.5 : 0,
      source: 'rule',
    })
  }

  // Build user prompt — include alternatives if available
  const altText = body.alternatives && body.alternatives.length > 0
    ? `\n候选 ASR 结果(选最可能正确的):\n${body.alternatives.map((a, i) => `  ${i + 1}. ${a}`).join('\n')}`
    : ''

  const userPrompt = `用户说的话(可能含 ASR 错误):
"""${text}"""${altText}

提取目标汉字,只返回 JSON:`

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 200,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      throw new Error(`LLM ${response.status}: ${await response.text().catch(() => '')}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? ''

    // Parse model JSON output
    let parsed: { char?: string | null; confidence?: number } = {}
    try {
      parsed = JSON.parse(content)
    } catch {
      // Try to extract JSON from a possibly noisy response
      const m = content.match(/\{[\s\S]*\}/)
      if (m) parsed = JSON.parse(m[0])
    }

    const char = typeof parsed.char === 'string' && /[\u4e00-\u9fff]/.test(parsed.char)
      ? parsed.char
      : null

    return NextResponse.json<ExtractResponse>({
      char,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
      source: 'llm',
      raw: content.slice(0, 200),
    })
  } catch (err) {
    // LLM failed — fall back to rule-based extraction
    console.error('[extract-char] LLM failed, falling back to rule:', err)
    const char = extractSingleChar(text)
    return NextResponse.json<ExtractResponse>({
      char,
      confidence: char ? 0.5 : 0,
      source: 'fallback',
    })
  }
}

// Block other methods
export async function GET() {
  return NextResponse.json({ error: 'POST only' }, { status: 405 })
}
