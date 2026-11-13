import { buildSystemPrompt } from './prompt.js'

// ლოკალურად: Vite-ის proxy /ollama -> http://127.0.0.1:11434 (იხ. vite.config.js)
// ონლაინ: Vercel-ის ფუნქცია /api/chat -> Groq (იხ. api/chat.js), ინსტრუქციას სერვერი აწყობს.
const URL = import.meta.env.DEV ? '/ollama/api/chat' : '/api/chat'

// context: { lang, free }; jobs მხოლოდ ლოკალურ რეჟიმს სჭირდება.
// აბრუნებს ტექსტს ნაწილ-ნაწილ (streaming), onToken-ით.
export async function chat({ model, context, jobs, messages, onToken, signal }) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      import.meta.env.DEV
        ? { model, stream: true, messages: [{ role: 'system', content: buildSystemPrompt(context, jobs) }, ...messages] }
        : { context, messages },
    ),
    signal,
  })
  if (!res.ok) throw new Error(`AI ${res.status}: ${await res.text()}`)

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
      full += data.message?.content ?? ''
      onToken(full)
    }
  }
  return full
}
