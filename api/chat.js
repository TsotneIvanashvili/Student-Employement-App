// Vercel-ის სერვერული ფუნქცია: ბრაუზერის მოთხოვნას Ollama Cloud-ს გადასცემს.
// API გასაღები მხოლოდ სერვერზეა (Vercel → Settings → Environment Variables → OLLAMA_API_KEY).
const MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:120b'
const MAX_MESSAGES = 20
const MAX_CHARS = 6000

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed')
  if (!process.env.OLLAMA_API_KEY) return res.status(500).send('OLLAMA_API_KEY is not set on the server')

  const { messages } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const valid =
    Array.isArray(messages) &&
    messages.length <= MAX_MESSAGES &&
    messages.every((m) => ['system', 'user', 'assistant'].includes(m.role) && String(m.content).length <= MAX_CHARS)
  if (!valid) return res.status(400).send('Invalid messages')

  const upstream = await fetch('https://ollama.com/api/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, stream: true }),
  })
  if (!upstream.ok) return res.status(upstream.status).send(await upstream.text())

  res.setHeader('Content-Type', 'application/x-ndjson')
  for await (const chunk of upstream.body) res.write(chunk)
  res.end()
}
