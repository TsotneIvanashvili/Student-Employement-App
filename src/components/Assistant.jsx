import { useEffect, useRef, useState } from 'react'
import { chat } from '../lib/ollama.js'
import { splitReply } from '../lib/prompt.js'
import { freeSlots } from '../lib/schedule.js'
import { getLang, tr, useLang } from '../lib/i18n.js'
import LessonProposals from './LessonProposals.jsx'
import { JobCard, listBox } from './Jobs.jsx'
import { Icon, tap } from './ui.jsx'

// AI ასისტენტი (დიზაინის ვარიანტი B): ჯერ სამი დიდი ქმედება, მერე ჩატი.
// draft: სხვა გვერდიდან გადმოცემული შეტყობინება (მაგ. „AI-ით შევსება“ კალენდრიდან).
export default function Assistant({ jobs, busy, setLessons, draft, onDraftUsed }) {
  const lang = useLang()
  const [model, setModel] = useState('llama3.2')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const field = useRef(null)
  const end = useRef(null)

  useEffect(() => {
    if (!draft) return
    setInput(draft)
    onDraftUsed?.()
    field.current?.focus()
  }, [draft]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (messages.length) end.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [messages.length, loading])

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
        context: { lang: getLang(), free: [...freeSlots(busy)] },
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

  const fillExample = tr('ლექციები მაქვს ორშაბათს, ოთხშაბათს და პარასკევს 10-დან 14-მდე', 'I have lectures on Mon, Wed and Fri from 10 to 14')
  const ACTIONS = [
    { icon: 'calendar', tone: 'bg-sky-soft text-sky', title: tr('შეავსე კალენდარი', 'Fill my calendar'), sub: tr('მითხარი განრიგი სიტყვებით', 'Tell me your timetable in words'), run: () => { setInput(fillExample); field.current?.focus() } },
    { icon: 'briefcase', tone: 'bg-brand-soft text-brand-deep', title: tr('მიპოვე სამუშაო', 'Find me work'), sub: tr('შენს თავისუფალ დროზე მორგებული', 'Matched to your free time'), run: () => send(tr('მიპოვე სამუშაო ჩემს თავისუფალ დროს', 'Find jobs for my free time')) },
    { icon: 'help', tone: 'bg-amber-soft text-amber', title: tr('როგორ მუშაობს?', 'How it works'), sub: tr('კალენდარი, განაცხადი, შეფასება', 'Calendar, applying, ratings'), run: () => send(tr('როგორ მუშაობს ShiftMate?', 'How does ShiftMate work?')) },
  ]

  return (
    <section className="mx-auto flex max-w-3xl flex-col">
      <div className="mb-3 flex items-center gap-2.5 px-1">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand-deep"><Icon name="ai" className="h-5 w-5" /></span>
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">{tr('AI ასისტენტი', 'AI assistant')}</h1>
        {import.meta.env.DEV && <input value={model} onChange={(e) => setModel(e.target.value)} className="ml-auto w-24 rounded-lg bg-white px-2 py-0.5 text-xs text-muted" aria-label="Ollama model" />}
      </div>

      <div className="min-h-[50vh] space-y-2.5 pb-4 text-[15px]">
        <p className="mr-8 rounded-[22px] bg-white px-4 py-3 shadow-card [text-wrap:pretty]">
          {tr('გამარჯობა! შემიძლია შეგივსო კალენდარი, მოგიძებნო შენს დროზე მორგებული ვაკანსია ან აგიხსნა, როგორ მუშაობს ShiftMate.', 'Hi! I can fill in your calendar, find jobs that fit your time, or explain how ShiftMate works.')}
        </p>
        {messages.length === 0 && (
          <div className="space-y-2.5 pt-1.5">
            {ACTIONS.map((a) => (
              <button key={a.title} onClick={a.run} disabled={loading} className={`flex w-full items-center gap-3.5 rounded-[22px] bg-white p-4 text-left shadow-card ${tap}`}>
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-[14px] ${a.tone}`}><Icon name={a.icon} className="h-[22px] w-[22px]" /></span>
                <span className="block flex-1">
                  <span className="block text-[15px] font-semibold">{a.title}</span>
                  <span className="block text-[13px] text-muted">{a.sub}</span>
                </span>
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <p key={i} className="ml-auto max-w-[84%] whitespace-pre-wrap px-0.5 pt-2 text-right font-bold">{m.content}</p>
          ) : (
            <AssistantMessage key={i} content={m.content} jobs={jobs} busy={busy} setLessons={setLessons} />
          ),
        )}
        {error && (
          <p className="rounded-2xl bg-coral-soft p-4 text-[14px] font-semibold text-[#b42323]">
            {import.meta.env.DEV
              ? `Ollama: ollama serve && ollama pull ${model}`
              : error.includes('429')
                ? tr('ასისტენტი ახლა დატვირთულია. სცადე ერთ წუთში.', 'The assistant is busy right now. Try again in a minute.')
                : tr('ასისტენტი დროებით მიუწვდომელია. სცადე ცოტა ხანში.', 'The assistant is unavailable right now. Try again soon.')}
          </p>
        )}
        <div ref={end} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input) }}
        className="glass sticky bottom-[104px] z-10 flex items-center gap-2 rounded-[26px] py-1.5 pl-4 pr-1.5 shadow-[0_0_0_1px_rgba(21,24,30,.08),0_10px_28px_-12px_rgba(21,24,30,.25)] lg:bottom-6"
      >
        <input
          ref={field}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={tr('მიწერე ასისტენტს…', 'Message the assistant…')}
          aria-label={tr('შეტყობინება', 'Message')}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[16px] outline-none placeholder:text-quiet"
          lang={lang}
        />
        <button disabled={loading || !input.trim()} aria-label={tr('გაგზავნა', 'Send')} className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-on-brand ${tap}`}>
          <Icon name="send" className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </form>
    </section>
  )
}

// AI-ს ტექსტი + ვაკანსიების ბარათები („JOBS: …“) + დაკავებული დროის დადასტურება („LESSON: {…}“)
function AssistantMessage({ content, jobs, busy, setLessons }) {
  const { text, refs, lessons } = splitReply(content)
  const cards = refs.map((r) => jobs.find((j) => j.id.startsWith(r))).filter(Boolean)
  return (
    <div className="space-y-2">
      <p className="whitespace-pre-wrap rounded-[22px] bg-white px-4 py-3 shadow-card">{text || <span className="font-bold tracking-[2px] text-muted">···</span>}</p>
      <LessonProposals lessons={lessons} setLessons={setLessons} />
      {cards.length > 0 && <ul className={listBox}>{cards.map((job) => <li key={job.id}><JobCard job={job} busy={busy} /></li>)}</ul>}
    </div>
  )
}
