// Vercel-ის სერვერული ფუნქცია: სისტემურ ინსტრუქციას აწყობს და მოთხოვნას Groq-ს გადასცემს.
// API გასაღები მხოლოდ სერვერზეა (Vercel → Settings → Environment Variables → GROQ_API_KEY).
// პასუხს Ollama-ს ფორმატში (NDJSON) აბრუნებს, ამიტომ ბრაუზერის კოდი ლოკალურსა და ონლაინს შორის არ იცვლება.
import { buildSystemPrompt } from '../src/lib/prompt.js'
import { SUPABASE_URL, SUPABASE_KEY } from '../src/lib/config.js'

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
const MAX_MESSAGES = 20
const MAX_CHARS = 6000

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed')
  if (!process.env.GROQ_API_KEY) return res.status(500).send('GROQ_API_KEY is not set on the server')

  // მხოლოდ შესული მომხმარებლები: ტოკენს Supabase ამოწმებს, რომ უცხომ AI-ს ლიმიტი ვერ დახარჯოს
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '')
  if (!token) return res.status(401).send('Sign in required')
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } })
  if (!userRes.ok) return res.status(401).send('Sign in required')

  // ლიმიტი თითო მომხმარებელზე (20 შეტყობინება 10 წუთში, 150 დღეში), რომ ერთმა ანგარიშმა საერთო AI ლიმიტი ვერ დახარჯოს.
  // ბაზა თვლის (ai_allow). ბაზის ხარვეზისას AI არ ითიშება: ეს ხარჯის კონტროლია, არა დაცვა.
  const quota = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ai_allow`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (quota.ok && (await quota.json()) === false) return res.status(429).send('Too many requests')
  if (!quota.ok) console.error('ai_allow failed', quota.status)

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).send('Invalid request')
  }
  const { messages, context } = body ?? {}
  // სისტემურ ინსტრუქციას მხოლოდ სერვერი აწყობს: ბრაუზერიდან 'system' როლი არ მიიღება
  const valid =
    Array.isArray(messages) &&
    messages.length <= MAX_MESSAGES &&
    messages.every((m) => ['user', 'assistant'].includes(m.role) && String(m.content).length <= MAX_CHARS) &&
    ['ka', 'en'].includes(context?.lang) &&
    Array.isArray(context?.free) &&
    context.free.length <= 200 &&
    context.free.every((k) => /^[0-6]-\d{1,2}$/.test(k))
  if (!valid) return res.status(400).send('Invalid request')

  // ვაკანსიებს სერვერი თავად იღებს ბაზიდან, ბრაუზერს არ ენდობა
  const jobsRes = await fetch(`${SUPABASE_URL}/rest/v1/jobs?select=*&is_open=eq.true`, { headers: { apikey: SUPABASE_KEY } })
  if (!jobsRes.ok) return res.status(502).send('Could not load jobs')
  const jobs = await jobsRes.json()

  const system = buildSystemPrompt({ lang: context.lang, free: context.free }, jobs)

  const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: system }, ...messages],
      stream: true,
      temperature: 0.3,
      reasoning_effort: 'low',
    }),
  })
  if (!upstream.ok) {
    console.error('Groq error', upstream.status, await upstream.text())
    return res.status(upstream.status === 429 ? 429 : 502).send(upstream.status === 429 ? 'Too many requests' : 'AI is unavailable')
  }

  // Groq აბრუნებს SSE-ს ("data: {...}"), ვაქცევთ NDJSON-ად ({"message":{"content":"..."}})
  res.setHeader('Content-Type', 'application/x-ndjson')
  const decoder = new TextDecoder()
  let buffer = ''
  for await (const chunk of upstream.body) {
    buffer += decoder.decode(chunk, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (!line.startsWith('data: ') || line === 'data: [DONE]') continue
      const content = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content
      if (content) res.write(JSON.stringify({ message: { content } }) + '\n')
    }
  }
  res.end()
}
