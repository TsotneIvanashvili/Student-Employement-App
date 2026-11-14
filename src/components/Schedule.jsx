import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { chat } from '../lib/ollama.js'
import { splitReply } from '../lib/prompt.js'
import { DAY_NAMES, MONTH_NAMES, dayNumber, fmtMin, freeSlots, monthIndex, weekdayOf } from '../lib/schedule.js'
import BigCalendar, { DOTS } from './BigCalendar.jsx'
import LessonProposals from './LessonProposals.jsx'
import { openJob } from './JobCard.jsx'
import { Icon, Segmented, Sheet, Title, btn, btn2, btnSm, card, input, label } from './ui.jsx'

const TIMES = Array.from({ length: 49 }, (_, i) => i * 30) // 00:00 … 24:00
const withValue = (list, v) => (list.includes(v) ? list : [...list, v].sort((a, b) => a - b)) // AI-ს ჩაწერილი 13:45-ის მსგავსი დროც ჩანს
const dateLabel = (d) => `${DAY_NAMES[weekdayOf(d)]}, ${dayNumber(d)} ${MONTH_NAMES[monthIndex(d)]}`
const weeklyLabel = (d) => `ყოველ ${DAY_NAMES[weekdayOf(d)].replace(/ი$/, '')}ს`

// მაძიებლის განრიგი: დაკავებული დროის დამატება კალენდარზე. თავისუფალი დრო ყველაფერია, რაც აქ არ წერია.
export function StudentSchedule({ busy, setLessons, matchCount, onSeeJobs }) {
  const [sheet, setSheet] = useState(null)
  const lessons = busy.filter((e) => e.kind === 'lesson')

  return (
    <div>
      <Title eyebrow="მონიშნე, როდის ხარ დაკავებული. დანარჩენი დრო თავისუფალია">ჩემი განრიგი</Title>
      <QuickAdd busy={busy} setLessons={setLessons} />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1 text-[14px]" data-tour="matches">
        <p className="text-muted">
          {lessons.length === 0 ? 'ჯერ არაფერი ჩაგიწერია, ამიტომ ყველა ვაკანსია გერგება.' : <>შენს თავისუფალ დროს ერგება <button onClick={onSeeJobs} className="font-semibold text-brand-deep underline underline-offset-4">{matchCount} ვაკანსია</button></>}
        </p>
        <div className="flex items-center gap-4 text-[13px] text-muted">
          <Legend tone="lesson" text="დაკავებული" />
          <Legend tone="work" text="სამუშაო" />
        </div>
      </div>
      <BigCalendar
        events={busy}
        hint="გადაატარე მაუსი საათებზე ან დააჭირე დღეს"
        onSlot={(date, hour) => setSheet({ date, start: (hour ?? 10) * 60 })}
        onRange={(date, start, end) => setSheet({ date, start, end })}
        onEvent={(e) => (e.kind === 'work' ? openJob(e.job_id) : setSheet({ date: e.on, event: e }))}
      />
      {sheet && <LessonSheet {...sheet} onClose={() => setSheet(null)} setLessons={setLessons} />}
    </div>
  )
}

// სიტყვებით ჩაწერა: ასისტენტი ტექსტს დაკავებულ დროდ აქცევს, კალენდარში დადასტურების შემდეგ ემატება
function QuickAdd({ busy, setLessons }) {
  const [text, setText] = useState('')
  const [state, setState] = useState({ status: 'idle' }) // idle | loading | done | error

  async function submit(e) {
    e.preventDefault()
    if (!text.trim() || state.status === 'loading') return
    setState({ status: 'loading' })
    try {
      const full = await chat({
        model: 'llama3.2',
        context: { lang: 'ka', free: [...freeSlots(busy)] },
        jobs: [],
        messages: [{ role: 'user', content: `ჩამიწერე განრიგში, როდის ვარ დაკავებული: ${text.trim()}` }],
        onToken: () => {},
      })
      const { text: reply, lessons } = splitReply(full)
      setState({ status: 'done', reply, lessons, key: Date.now() })
    } catch (err) {
      setState({ status: 'error', busy: String(err.message).includes('429') })
    }
  }

  return (
    <div className="mb-4" data-tour="quickadd">
      <form onSubmit={submit} className={`${card} flex items-center gap-2 py-2 pl-4 pr-2`}>
        <Icon name="ai" className="h-6 w-6 shrink-0 text-brand-deep" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          aria-label="დაკავებული დრო სიტყვებით"
          placeholder="დაწერე სიტყვებით: ორშაბათიდან პარასკევამდე 10-დან 6-მდე ვმუშაობ"
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-quiet"
        />
        <button disabled={!text.trim() || state.status === 'loading'} className={`${btnSm} shrink-0 disabled:opacity-40`}>
          {state.status === 'loading' ? 'ვწერ…' : 'ჩაწერა'}
        </button>
      </form>
      {state.status === 'error' && (
        <p className="mt-2 px-1 text-[14px] font-medium text-coral">{state.busy ? 'ასისტენტი ახლა დატვირთულია. სცადე ერთ წუთში.' : 'ასისტენტი ვერ გამოეხმაურა. სცადე თავიდან ან მონიშნე კალენდარზე.'}</p>
      )}
      {state.status === 'done' && (
        <div className="mt-2 space-y-2">
          {state.lessons.length === 0 && <p className="rounded-2xl bg-brand-soft px-4 py-3 text-[15px]">{state.reply || 'ვერ გავიგე. დაწერე დღე და საათები, მაგალითად: სამშაბათს 13:00–16:00 ლექცია.'}</p>}
          <LessonProposals key={state.key} lessons={state.lessons} setLessons={setLessons} onDone={() => setText('')} onCancel={() => setState({ status: 'idle' })} />
        </div>
      )}
    </div>
  )
}

const Legend = ({ tone, text }) => (
  <span className="flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-full ${DOTS[tone]}`} />{text}</span>
)

function LessonSheet({ date, start, end, event, onClose, setLessons }) {
  const s0 = event?.start_min ?? Math.min(start, 23 * 60)
  const [form, setForm] = useState({
    title: event?.title ?? 'დაკავებული',
    start: s0,
    end: event?.end_min ?? end ?? Math.min(s0 + 120, 24 * 60),
    repeat: event ? (event.date ? 'once' : 'weekly') : 'weekly',
  })
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: k === 'title' ? e.target.value : Number(e.target.value) })

  async function run(query, apply) {
    const { data, error } = await query
    if (error) return setError('ვერ შეინახა. სცადე თავიდან.')
    setLessons((list) => apply(list, data))
    onClose()
  }

  function save(e) {
    e.preventDefault()
    if (form.end <= form.start) return setError('დასასრული დაწყებაზე გვიან უნდა იყოს.')
    const row = { title: form.title.trim() || 'დაკავებული', start_min: form.start, end_min: form.end }
    if (event) return run(supabase.from('events').update(row).eq('id', event.id).select().single(), (l, d) => l.map((x) => (x.id === d.id ? d : x)))
    const when = form.repeat === 'weekly' ? { weekday: weekdayOf(date) } : { date }
    run(supabase.from('events').insert({ ...row, ...when }).select().single(), (l, d) => [...l, d])
  }
  const removeAll = () => run(supabase.from('events').delete().eq('id', event.id).select().single(), (l) => l.filter((x) => x.id !== event.id))
  const skipThisDay = () =>
    run(supabase.from('events').update({ skip_dates: [...event.skip_dates, date] }).eq('id', event.id).select().single(), (l, d) => l.map((x) => (x.id === d.id ? d : x)))

  return (
    <Sheet onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <h2 className="text-[22px] font-semibold">{event ? 'შეცვლა' : 'როდის ხარ დაკავებული?'}</h2>
          <p className="text-[15px] text-muted">{dateLabel(date)}</p>
        </div>
        <label className="block">
          <span className={label}>სახელი</span>
          <input className={input} value={form.title} onChange={set('title')} placeholder="მაგ. ლექცია, ძირითადი სამსახური" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={label}>დან</span>
            <select className={input} value={form.start} onChange={set('start')} aria-label="დაწყება">
              {withValue(TIMES.slice(0, -1), form.start).map((m) => <option key={m} value={m}>{fmtMin(m)}</option>)}
            </select>
          </label>
          <label className="block">
            <span className={label}>მდე</span>
            <select className={input} value={form.end} onChange={set('end')} aria-label="დასრულება">
              {withValue(TIMES.slice(1), form.end).map((m) => <option key={m} value={m}>{fmtMin(m)}</option>)}
            </select>
          </label>
        </div>
        {!event && (
          <Segmented value={form.repeat} onChange={(repeat) => setForm({ ...form, repeat })} options={[['weekly', weeklyLabel(date)], ['once', 'მხოლოდ ამ დღეს']]} />
        )}
        {event && !event.date && <p className="text-[13px] text-muted">ეს {weeklyLabel(date)} მეორდება. ცვლილება ყველა კვირაზე გავრცელდება.</p>}
        {error && <p className="text-[14px] font-medium text-coral">{error}</p>}
        <button className={btn}>შენახვა</button>
        {event && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {!event.date && <button type="button" onClick={skipThisDay} className={btn2}>ამ დღეს არ მაქვს</button>}
            <button type="button" onClick={removeAll} className={`${btn2} !text-coral ${event.date ? 'sm:col-span-2' : ''}`}>{event.date ? 'წაშლა' : 'ყველა კვირიდან წაშლა'}</button>
          </div>
        )}
      </form>
    </Sheet>
  )
}
