import { useState } from 'react'
import { chat } from '../lib/ollama.js'
import { splitReply } from '../lib/prompt.js'
import { freeSlots } from '../lib/schedule.js'
import LessonProposals from './LessonProposals.jsx'
import JobCard from './JobCard.jsx'
import { Icon, Segmented, Title, card, chip } from './ui.jsx'

const RECOMMEND = {
  ka: 'ჩემი გრაფიკით რომელი სამსახური მირჩევ?',
  en: 'Which job do you recommend for my schedule?',
}

export default function Assistant({ profile, jobs, busy, setLessons, matchCount }) {
  const free = freeSlots(busy)
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
        context: { lang, free: [...free] },
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
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-soft text-brand-deep"><Icon name="ai" className="h-9 w-9" /></span>
            <p className="mt-4 text-[20px] font-semibold">{matchCount} ვაკანსია ერგება შენს დროს</p>
            <p className="mt-1 max-w-md text-[15px] text-muted">
              შეგირჩევ საუკეთესოს, ჩაგიწერ დაკავებულ დროს განრიგში, ან მიპასუხებ ვაკანსიებზე.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {[RECOMMEND[lang], lang === 'en' ? 'Which one pays the most?' : 'რომელი იხდის ყველაზე მეტს?', lang === 'en' ? 'I work Mon to Fri, 10 to 6. Add it to my calendar' : 'ორშაბათიდან პარასკევამდე 10-დან 6-მდე ვმუშაობ, ჩამიწერე'].map((q) => (
                <button key={q} disabled={loading} onClick={() => send(q)} className={`${chip} disabled:opacity-50`}>{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end"><p className="max-w-[80%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-brand px-4 py-3 font-medium text-on-brand">{m.content}</p></div>
          ) : (
            <AssistantMessage key={i} content={m.content} jobs={jobs} busy={busy} setLessons={setLessons} />
          ),
        )}
        {error && (
          <p className="rounded-2xl bg-coral-soft p-4 text-[15px] font-semibold text-coral">
            {import.meta.env.DEV ? (
              <>Ollama-სთან კავშირი ვერ დამყარდა. ტერმინალში გაუშვი <code>ollama serve</code> და <code>ollama pull {model}</code>.</>
            ) : (
              <>{error.includes('429') ? 'ასისტენტი ახლა დატვირთულია. სცადე ერთ წუთში.' : 'ასისტენტი დროებით მიუწვდომელია. სცადე ცოტა ხანში.'}</>
            )}
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input) }}
        className="sticky bottom-24 mt-5 flex items-center gap-2 rounded-full bg-white py-1.5 pl-5 pr-1.5 shadow-card ring-1 ring-line lg:bottom-6"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={lang === 'en' ? 'Ask about jobs…' : 'დაწერე კითხვა…'}
          className="min-w-0 flex-1 bg-transparent text-[16px] outline-none"
        />
        <button disabled={loading || !input.trim()} aria-label="გაგზავნა" className="grid h-10 w-10 place-items-center rounded-full bg-brand text-on-brand disabled:opacity-40">
          <Icon name="send" className="h-5 w-5" strokeWidth={2.8} />
        </button>
      </form>
    </section>
  )
}

// AI-ს ტექსტი + ვაკანსიების ბარათები ("JOBS: ...") + ლექციის დამატების დადასტურება ("LESSON: {...}")
function AssistantMessage({ content, jobs, busy, setLessons }) {
  const { text, refs, lessons } = splitReply(content)
  const cards = refs.map((r) => jobs.find((j) => j.id.startsWith(r))).filter(Boolean)
  return (
    <div className="mr-8 space-y-2">
      <p className="whitespace-pre-wrap rounded-3xl rounded-bl-lg bg-white px-4 py-3 shadow-card">{text || '…'}</p>
      <LessonProposals lessons={lessons} setLessons={setLessons} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{cards.map((job) => <JobCard key={job.id} job={job} busy={busy} compact />)}</div>
    </div>
  )
}
