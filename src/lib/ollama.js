import { formatShift } from './match.js'

// Vite-ის proxy: /ollama -> http://127.0.0.1:11434 (იხ. vite.config.js)
const URL = '/ollama/api/chat'

export function buildSystemPrompt({ user, matches, lang }) {
  const language = lang === 'en' ? 'English' : 'Georgian (ქართული)'
  const jobs = matches.slice(0, 6).map((m) => ({
    title: m.job.title,
    company: m.job.company,
    district: m.job.district,
    pay_gel_per_hour: m.job.pay,
    shifts_that_fit: m.fitting.map((s) => formatShift(s, lang)),
  }))
  return [
    'You are a job assistant for university students in Tbilisi.',
    `Always answer in ${language}. Be short and friendly.`,
    'The jobs below were already checked by code: their listed shifts do NOT overlap the student\'s lectures.',
    'Recommend only jobs from this list. Never invent jobs, companies, pay, contacts or shifts.',
    'When recommending, pick at most 3 jobs and say which shifts fit and how many hours per week that is.',
    `The student wants about ${user.hours} hours of work per week.`,
    jobs.length
      ? `Matching jobs (JSON): ${JSON.stringify(jobs)}`
      : 'No job currently fits the student\'s schedule. Say so and suggest freeing some hours or checking again later.',
  ].join('\n')
}

// აბრუნებს ტექსტს ნაწილ-ნაწილ (streaming), onToken-ით.
export async function chat({ model, system, messages, onToken, signal }) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
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
