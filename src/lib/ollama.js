import { buildSystemPrompt } from './prompt.js'

// ლოკალურად: Vite-ის proxy /ollama -> http://127.0.0.1:11434 (იხ. vite.config.js)
// ონლაინ: Vercel-ის ფუნქცია /api/chat -> Groq (იხ. api/chat.js)
const URL = import.meta.env.DEV ? '/ollama/api/chat' : '/api/chat'

// აბრუნებს ტექსტს ნაწილ-ნაწილ (streaming), onToken-ით.
// context: { lang, hours, busy } — ონლაინ სისტემურ ინსტრუქციას სერვერი აწყობს.
export async function chat({ model, context, messages, onToken, signal }) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      import.meta.env.DEV
        ? { model, stream: true, messages: [{ role: 'system', content: buildSystemPrompt(context) }, ...messages] }
        : { context, messages },
    ),
    signal,
  })
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (!line.trim()) continue
      const data = JSON.parse(line)
      if (data.error) throw new Error(data.error)
      const token = data.message?.content ?? ''
      full += token
      onToken(full)
    }
  }
  return full
}
