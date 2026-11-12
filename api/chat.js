// Vercel-ის სერვერული ფუნქცია: ბრაუზერის მოთხოვნას Groq-ს გადასცემს.
// API გასაღები მხოლოდ სერვერზეა (Vercel → Settings → Environment Variables → GROQ_API_KEY).
// პასუხს Ollama-ს ფორმატში (NDJSON) აბრუნებს, ამიტომ ბრაუზერის კოდი ლოკალურსა და ონლაინს შორის არ იცვლება.
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
const MAX_MESSAGES = 20
const MAX_CHARS = 6000

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed')
  if (!process.env.GROQ_API_KEY) return res.status(500).send('GROQ_API_KEY is not set on the server')

  const { messages } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const valid =
    Array.isArray(messages) &&
    messages.length <= MAX_MESSAGES &&
    messages.every((m) => ['system', 'user', 'assistant'].includes(m.role) && String(m.content).length <= MAX_CHARS)
  if (!valid) return res.status(400).send('Invalid messages')

  const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, stream: true, reasoning_effort: 'low' }),
  })
  if (!upstream.ok) return res.status(upstream.status).send(await upstream.text())

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
