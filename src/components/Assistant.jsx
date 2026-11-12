import { useState } from 'react'
import { chat } from '../lib/ollama.js'
import { splitJobRefs } from '../lib/prompt.js'
import JobCard from './JobCard.jsx'
import { Icon, Segmented, Title } from './ui.jsx'

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
    <section className="flex min-h-[calc(100%-7rem)] flex-col">
      <Title
        eyebrow="AI · Groq"
        action={
          <div className="mb-1.5 w-24">
            <Segmented value={lang} onChange={setLang} options={[['ka', 'ქა'], ['en', 'EN']]} />
          </div>
        }
      >
        ასისტენტი
      </Title>
      {import.meta.env.DEV && (
        <input value={model} onChange={(e) => setModel(e.target.value)} className="mb-2 w-28 rounded-lg bg-white px-2 py-0.5 text-xs text-muted" aria-label="Ollama model" />
      )}

      <div className="flex-1 space-y-2.5 text-[16px]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center px-6 pb-4 pt-6 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-[20px] bg-gradient-to-br from-brand to-[#0b5e36] text-white shadow-lg shadow-brand/30"><Icon name="ai" className="h-8 w-8" /></span>
            <p className="mt-4 text-[17px] font-semibold">
              {hasSchedule ? `${matchCount} ვაკანსია ერგება შენს დროს` : 'ჯერ თავისუფალი საათები მონიშნე'}
            </p>
            <p className="mt-1 text-[15px] text-muted">
              {hasSchedule ? 'შემირჩიე სამსახური, ან დასვი კითხვა ვაკანსიებზე.' : 'კალენდარის მიხედვით შეგირჩევ შენზე მორგებულ ვაკანსიებს.'}
            </p>
          </div>
        )}
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end"><p className="max-w-[80%] whitespace-pre-wrap rounded-[20px] rounded-br-[6px] bg-brand px-4 py-2.5 text-white">{m.content}</p></div>
          ) : (
            <AssistantMessage key={i} content={m.content} jobs={jobs} free={free} />
          ),
        )}
        {error && (
          <p className="rounded-[20px] bg-coral/10 p-4 text-[15px] text-coral">
            {import.meta.env.DEV ? (
              <>Ollama-სთან კავშირი ვერ დამყარდა. ტერმინალში გაუშვი <code>ollama serve</code> და <code>ollama pull {model}</code>.</>
            ) : (
              <>AI ასისტენტი დროებით მიუწვდომელია. სცადე ცოტა ხანში.<br /><span className="text-xs">{error}</span></>
            )}
          </p>
        )}
      </div>

      <div className="sticky bottom-[84px] mt-4 space-y-2 bg-bg/90 pb-1 pt-2 backdrop-blur">
        {messages.length === 0 && (
          <button
            onClick={() => send(RECOMMEND[lang])}
            disabled={!hasSchedule || loading}
            className="w-full rounded-full bg-white py-3 text-[15px] font-semibold text-brand shadow-sm disabled:opacity-50"
          >
            ✨ შემირჩიე სამსახური
          </button>
        )}
        <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-4 pr-1.5 shadow-sm">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lang === 'en' ? 'Message' : 'შეტყობინება'}
            className="min-w-0 flex-1 bg-transparent text-[16px] outline-none"
          />
          <button disabled={loading || !input.trim()} aria-label="გაგზავნა" className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white disabled:opacity-40">
            <Icon name="send" className="h-5 w-5" strokeWidth={2.5} />
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
    <div className="mr-8 space-y-2">
      <p className="whitespace-pre-wrap rounded-[20px] rounded-bl-[6px] bg-white px-4 py-2.5">{text || '…'}</p>
      {cards.map((job) => <JobCard key={job.id} job={job} free={free} compact />)}
    </div>
  )
}
