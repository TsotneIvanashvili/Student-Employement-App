import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { DAY_NAMES, MONTH_NAMES, dayNumber, fmtMin, monthIndex, weekdayOf } from '../lib/schedule.js'
import BigCalendar, { DOTS } from './BigCalendar.jsx'
import { openJob } from './JobCard.jsx'
import { Segmented, Sheet, Title, btn, btn2, input, label } from './ui.jsx'

const TIMES = Array.from({ length: 37 }, (_, i) => 6 * 60 + i * 30) // 06:00 … 24:00
const dateLabel = (d) => `${DAY_NAMES[weekdayOf(d)]}, ${dayNumber(d)} ${MONTH_NAMES[monthIndex(d)]}`
const weeklyLabel = (d) => `ყოველ ${DAY_NAMES[weekdayOf(d)].replace(/ი$/, '')}ს`

// სტუდენტის განრიგი: ლექციების დამატება კალენდარზე. თავისუფალი დრო ყველაფერია, რაც აქ არ წერია.
export function StudentSchedule({ busy, setLessons, matchCount, onSeeJobs }) {
  const [sheet, setSheet] = useState(null)
  const lessons = busy.filter((e) => e.kind === 'lesson')

  return (
    <div>
      <Title eyebrow="დააჭირე დღეს ან საათს და ჩაწერე, როდის არ გცალია">ჩემი განრიგი</Title>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3" data-tour="matches">
        <p className="text-[15px]">
          {lessons.length === 0 ? 'ჯერ ლექციები არ დაგიმატებია, ამიტომ ყველა ვაკანსია გერგება.' : <>შენს თავისუფალ დროს ერგება <b>{matchCount} ვაკანსია</b></>}
        </p>
        <div className="flex items-center gap-4 text-[13px] text-muted">
          <Legend tone="lesson" text="ლექცია" />
          <Legend tone="work" text="სამუშაო" />
          <button onClick={onSeeJobs} className="rounded-lg bg-ink px-3 py-1.5 text-[14px] font-medium text-white">ვაკანსიები →</button>
        </div>
      </div>
      <BigCalendar
        events={busy}
        onSlot={(date, hour) => setSheet({ date, start: (hour ?? 10) * 60 })}
        onEvent={(e) => (e.kind === 'work' ? openJob(e.job_id) : setSheet({ date: e.on, event: e }))}
      />
      {sheet && <LessonSheet {...sheet} onClose={() => setSheet(null)} setLessons={setLessons} />}
    </div>
  )
}

const Legend = ({ tone, text }) => (
  <span className="flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-full ${DOTS[tone]}`} />{text}</span>
)

function LessonSheet({ date, start, event, onClose, setLessons }) {
  const s0 = event?.start_min ?? Math.max(6 * 60, Math.min(start, 22 * 60))
  const [form, setForm] = useState({
    title: event?.title ?? 'ლექცია',
    start: s0,
    end: event?.end_min ?? Math.min(s0 + 120, 24 * 60),
    repeat: event ? (event.date ? 'once' : 'weekly') : 'weekly',
  })
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: k === 'title' ? e.target.value : Number(e.target.value) })

  async function run(query, apply) {
    const { data, error } = await query
    if (error) return setError(error.message)
    setLessons((list) => apply(list, data))
    onClose()
  }

  function save(e) {
    e.preventDefault()
    if (form.end <= form.start) return setError('დასასრული დაწყებაზე გვიან უნდა იყოს.')
    const row = { title: form.title.trim() || 'ლექცია', start_min: form.start, end_min: form.end }
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
          <h2 className="text-[22px] font-semibold">{event ? 'ლექციის შეცვლა' : 'როდის არ გცალია?'}</h2>
          <p className="text-[15px] text-muted">{dateLabel(date)}</p>
        </div>
        <label className="block">
          <span className={label}>სახელი</span>
          <input className={input} value={form.title} onChange={set('title')} placeholder="მაგ. მათემატიკა" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={label}>დან</span>
            <select className={input} value={form.start} onChange={set('start')} aria-label="დაწყება">
              {TIMES.slice(0, -1).map((m) => <option key={m} value={m}>{fmtMin(m)}</option>)}
            </select>
          </label>
          <label className="block">
            <span className={label}>მდე</span>
            <select className={input} value={form.end} onChange={set('end')} aria-label="დასრულება">
              {TIMES.slice(1).map((m) => <option key={m} value={m}>{fmtMin(m)}</option>)}
            </select>
          </label>
        </div>
        {!event && (
          <Segmented value={form.repeat} onChange={(repeat) => setForm({ ...form, repeat })} options={[['weekly', weeklyLabel(date)], ['once', 'მხოლოდ ამ დღეს']]} />
        )}
        {event && !event.date && <p className="text-[13px] text-muted">ეს ლექცია {weeklyLabel(date)} მეორდება. ცვლილება ყველა კვირაზე გავრცელდება.</p>}
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
