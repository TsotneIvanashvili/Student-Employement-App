import { useState } from 'react'
import { chat } from '../lib/ollama.js'
import { splitJobRefs } from '../lib/prompt.js'
import JobCard from './JobCard.jsx'
import { Icon, Segmented, Title, card, chip } from './ui.jsx'

const RECOMMEND = {
  ka: 'ჩემი გრაფიკით რომელი სამსახური მირჩევ?',
  en: 'Which job do you recommend for my schedule?',
}

export default function Assistant({ profile, jobs, free, matchCount }) {
  const hasSchedule = free.size > 0
  const [lang, setLang] = useState('ka')
  const [model, setModel] = useState('llama3.2')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function send(text) {
    if (!text.trim() || loading) return
    const history = [...messages, { role: 'user', content: text }]
    setMessages([...history, { role: 'assistant', content: '' }])
    setInput('')
    setError('')
    setLoading(true)
    try {
      await chat({
        model,
        context: { lang, hours: profile.hours ?? 15, free: [...free] },
        jobs,
        messages: history,
        onToken: (full) => setMessages([...history, { role: 'assistant', content: full }]),
      })
    } catch (e) {
      setMessages(history)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto flex max-w-3xl flex-col">
      <Title
        eyebrow="AI ასისტენტი"
        action={<div className="w-28"><Segmented value={lang} onChange={setLang} options={[['ka', 'ქა'], ['en', 'EN']]} /></div>}
      >
        რა გაინტერესებს?
      </Title>
      {import.meta.env.DEV && (
        <input value={model} onChange={(e) => setModel(e.target.value)} className="mb-2 w-28 rounded-lg bg-white px-2 py-0.5 text-xs text-muted" aria-label="Ollama model" />
      )}

      <div className="min-h-[40vh] space-y-3 text-[16px]">
        {messages.length === 0 && (
          <div className={`${card} flex flex-col items-center px-6 py-8 text-center`}>
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-brand to-sky text-white shadow-[0_4px_0_var(--color-brand-dark)]"><Icon name="ai" className="h-9 w-9" /></span>
            <p className="mt-4 text-[20px] font-black">{hasSchedule ? `${matchCount} ვაკანსია ერგება შენს დროს` : 'ჯერ თავისუფალი საათები მონიშნე'}</p>
            <p className="mt-1 max-w-md text-[15px] font-semibold text-muted">
              {hasSchedule ? 'შეგირჩევ საუკეთესოს, ან მკითხე ნებისმიერი რამ ვაკანსიებზე.' : 'კალენდრის მიხედვით შეგირჩევ შენზე მორგებულ ვაკანსიებს.'}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {[RECOMMEND[lang], lang === 'en' ? 'Which one pays the most?' : 'რომელი იხდის ყველაზე მეტს?', lang === 'en' ? 'Any 1–2 day gigs?' : 'არის 1–2 დღიანი სამუშაო?'].map((q) => (
                <button key={q} disabled={!hasSchedule || loading} onClick={() => send(q)} className={`${chip} disabled:opacity-50`}>{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end"><p className="max-w-[80%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-brand px-4 py-3 font-semibold text-white">{m.content}</p></div>
          ) : (
            <AssistantMessage key={i} content={m.content} jobs={jobs} free={free} />
          ),
        )}
        {error && (
          <p className="rounded-3xl bg-coral-soft p-4 text-[15px] font-semibold text-coral">
            {import.meta.env.DEV ? (
              <>Ollama-სთან კავშირი ვერ დამყარდა. ტერმინალში გაუშვი <code>ollama serve</code> და <code>ollama pull {model}</code>.</>
            ) : (
              <>AI ასისტენტი დროებით მიუწვდომელია. სცადე ცოტა ხანში.<br /><span className="text-xs">{error}</span></>
            )}
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input) }}
        className="sticky bottom-24 mt-5 flex items-center gap-2 rounded-full border-2 border-line bg-white py-1.5 pl-5 pr-1.5 shadow-[0_3px_0_var(--color-line)] lg:bottom-6"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={lang === 'en' ? 'Ask about jobs…' : 'დაწერე კითხვა…'}
          className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold outline-none"
        />
        <button disabled={loading || !input.trim()} aria-label="გაგზავნა" className="grid h-10 w-10 place-items-center rounded-full bg-brand text-white disabled:opacity-40">
          <Icon name="send" className="h-5 w-5" strokeWidth={2.8} />
        </button>
      </form>
    </section>
  )
}

// AI-ს ტექსტი + რეკომენდებული ვაკანსიების ბარათები (ბოლო ხაზიდან "JOBS: ...")
function AssistantMessage({ content, jobs, free }) {
  const { text, refs } = splitJobRefs(content)
  const cards = refs.map((r) => jobs.find((j) => j.id.startsWith(r))).filter(Boolean)
  return (
    <div className="mr-8 space-y-2">
      <p className="whitespace-pre-wrap rounded-3xl rounded-bl-lg border-2 border-line bg-white px-4 py-3">{text || '…'}</p>
      <div className="grid gap-2 sm:grid-cols-2">{cards.map((job) => <JobCard key={job.id} job={job} free={free} compact />)}</div>
    </div>
  )
}
