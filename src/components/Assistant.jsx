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
// საუბარი ინახება ამ მოწყობილობაზე (თითო მომხმარებელს თავისი), ამიტომ გვერდების გადართვისას და
// გადატვირთვისას არ იკარგება. გასვლისას იშლება (App.jsx). ბოლო 40 შეტყობინება.
const KEEP = 40
const storeKey = (userId) => `sm_ai_${userId}`
function loadChat(userId) {
  try {
    const list = JSON.parse(localStorage.getItem(storeKey(userId)) || '[]')
    return Array.isArray(list) ? list.filter((m) => m && typeof m.content === 'string' && m.content) : []
  } catch {
    return []
  }
}
function saveChat(userId, list) {
  try {
    if (list.length) localStorage.setItem(storeKey(userId), JSON.stringify(list.slice(-KEEP)))
    else localStorage.removeItem(storeKey(userId))
  } catch {}
}

export default function Assistant({ userId, jobs, busy, setLessons, draft, onDraftUsed }) {
  const lang = useLang()
  const [model, setModel] = useState('llama3.2')
  const [messages, setMessages] = useState(() => loadChat(userId))
  const liveFrom = useRef(messages.length) // ამაზე ძველი პასუხები შენახულიდანაა და თავიდან აღარ ემატება
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
  useEffect(() => {
    if (!loading) saveChat(userId, messages)
  }, [messages, loading, userId])

  async function send(text) {
    if (!text.trim() || loading) return
    const history = [...messages, { role: 'user', content: text }]
    setMessages([...history, { role: 'assistant', content: '' }])
    setInput('')
    setError('')
    setLoading(true)
    saveChat(userId, history)
    let reply = ''
    try {
      await chat({
        model,
        context: { lang: getLang(), free: [...freeSlots(busy)] },
        jobs,
        messages: history,
        onToken: (full) => {
          reply = full
          setMessages([...history, { role: 'assistant', content: full }])
        },
      })
      // სხვა გვერდზე გადასვლის შემთხვევაშიც პასუხი შეინახება და დაბრუნებისას გამოჩნდება
      if (reply) saveChat(userId, [...history, { role: 'assistant', content: reply }])
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
        <h1 className="whitespace-nowrap text-[22px] font-bold tracking-[-0.02em]">{tr('AI ასისტენტი', 'AI assistant')}</h1>
        {messages.length > 0 && !loading && (
          <button onClick={() => { setMessages([]); liveFrom.current = 0; setError('') }} className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-[14px] font-semibold shadow-card hover:bg-fill" aria-label={tr('ახალი საუბარი', 'New chat')}>
            <Icon name="plus" className="h-4 w-4" /><span className="sm:hidden">{tr('ახალი', 'New')}</span><span className="hidden sm:inline">{tr('ახალი საუბარი', 'New chat')}</span>
          </button>
        )}
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
            <AssistantMessage
              key={i}
              content={m.content}
              ready={!loading || i < messages.length - 1}
              live={i >= liveFrom.current}
              saved={m.proposal}
              onSaved={(proposal) => setMessages((list) => list.map((x, j) => (j === i ? { ...x, proposal } : x)))}
              jobs={jobs}
              busy={busy}
              setLessons={setLessons}
            />
          ),
        )}
        {error && (
          <p className="rounded-2xl bg-coral-soft p-4 text-[14px] font-semibold text-[#b42323]">
            {import.meta.env.DEV
              ? `Ollama: ollama serve && ollama pull ${model}`
              : error.includes('429')
                ? tr('ბევრი შეტყობინება გაიგზავნა. სცადე რამდენიმე წუთში.', 'Too many messages for now. Try again in a few minutes.')
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
function AssistantMessage({ content, ready, live, saved, onSaved, jobs, busy, setLessons }) {
  const { text, refs, lessons } = splitReply(content)
  const cards = refs.map((r) => jobs.find((j) => j.id.startsWith(r))).filter(Boolean)
  return (
    <div className="space-y-2">
      <p className="whitespace-pre-wrap rounded-[22px] bg-white px-4 py-3 shadow-card">{text || <span className="font-bold tracking-[2px] text-muted">···</span>}</p>
      <LessonProposals lessons={lessons} setLessons={setLessons} ready={ready} live={live} saved={saved} onSaved={onSaved} />
      {cards.length > 0 && <ul className={listBox}>{cards.map((job) => <li key={job.id}><JobCard job={job} busy={busy} /></li>)}</ul>}
    </div>
  )
}
