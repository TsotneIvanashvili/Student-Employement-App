import { useState } from 'react'
import { chat } from '../lib/ollama.js'
import { splitJobRefs } from '../lib/prompt.js'
import JobCard from './JobCard.jsx'

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
    <section className="flex min-h-[calc(100dvh-10rem)] flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">AI ასისტენტი</h2>
          {import.meta.env.DEV && (
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1 w-28 rounded-lg border border-line bg-white px-2 py-0.5 text-xs text-muted"
              aria-label="Ollama model"
            />
          )}
        </div>
        <div className="flex rounded-full bg-white p-1 text-sm shadow-sm">
          {['ka', 'en'].map((l) => (
            <button key={l} onClick={() => setLang(l)} className={`rounded-full px-3 py-1 font-semibold ${lang === l ? 'bg-ink text-white' : 'text-muted'}`}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-3 text-[15px]">
        {messages.length === 0 && (
          <div className="rounded-3xl bg-white p-4 text-muted shadow-sm">
            <p>
              {hasSchedule
                ? `${matchCount} ვაკანსია ერგება შენს თავისუფალ საათებს. სთხოვე რჩევა ან დასვი კითხვა.`
                : 'ჯერ კალენდარში თავისუფალი საათები მონიშნე, რომ შენზე მორგებული რჩევა მოგცე.'}
            </p>
            {import.meta.env.DEV && lang === 'ka' && <p className="mt-2 text-xs text-quiet">llama3.2 ქართულად შეიძლება უხეშად წეროს. EN უფრო სტაბილურია.</p>}
          </div>
        )}
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <p key={i} className="ml-10 whitespace-pre-wrap rounded-3xl rounded-br-md bg-brand px-4 py-3 text-white">{m.content}</p>
          ) : (
            <AssistantMessage key={i} content={m.content} jobs={jobs} free={free} />
          ),
        )}
        {error && (
          <p className="rounded-3xl bg-coral/10 p-4 text-sm text-coral">
            {import.meta.env.DEV ? (
              <>Ollama-სთან კავშირი ვერ დამყარდა. ტერმინალში გაუშვი <code>ollama serve</code> და <code>ollama pull {model}</code>.</>
            ) : (
              <>AI ასისტენტი დროებით მიუწვდომელია. სცადე ცოტა ხანში.<br /><span className="text-xs">{error}</span></>
            )}
          </p>
        )}
      </div>

      <div className="sticky bottom-20 mt-4 space-y-2 bg-bg pt-2">
        <button
          onClick={() => send(RECOMMEND[lang])}
          disabled={!hasSchedule || loading}
          className="w-full rounded-2xl bg-brand-soft py-3 text-sm font-semibold text-brand disabled:opacity-50"
        >
          შემირჩიე სამსახური
        </button>
        <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lang === 'en' ? 'Ask something…' : 'დაწერე კითხვა…'}
            className="min-w-0 flex-1 rounded-2xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-brand"
          />
          <button disabled={loading} aria-label="გაგზავნა" className="rounded-2xl bg-brand px-5 font-semibold text-white disabled:opacity-50">
            ↑
          </button>
        </form>
      </div>
    </section>
  )
}

// AI-ს ტექსტი + რეკომენდებული ვაკანსიების ბარათები (ბოლო ხაზიდან "JOBS: ...")
function AssistantMessage({ content, jobs, free }) {
  const { text, refs } = splitJobRefs(content)
  const cards = refs.map((r) => jobs.find((j) => j.id.startsWith(r))).filter(Boolean)
  return (
    <div className="mr-6 space-y-2">
      <p className="whitespace-pre-wrap rounded-3xl rounded-bl-md bg-white px-4 py-3 shadow-sm">{text || '…'}</p>
      {cards.map((job) => <JobCard key={job.id} job={job} free={free} compact />)}
    </div>
  )
}
