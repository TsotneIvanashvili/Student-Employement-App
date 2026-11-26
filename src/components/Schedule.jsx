import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { todayISO } from '../lib/match.js'
import { fetchGoogleEvents, startGoogleImport, takeGoogleResult, toLessons } from '../lib/gcal.js'
import { dayNumber, fmtMin, monthIndex, weekdayOf } from '../lib/schedule.js'
import { dayLong, monthLong, tr, useLang } from '../lib/i18n.js'
import BigCalendar, { DOTS } from './BigCalendar.jsx'
import { openJob } from './Jobs.jsx'
import { Icon, RoundAdd, Segmented, Sheet, Title, btn, btn2, input, tap } from './ui.jsx'

const TIMES = Array.from({ length: 49 }, (_, i) => i * 30) // 00:00 … 24:00
const withValue = (list, v) => (list.includes(v) ? list : [...list, v].sort((a, b) => a - b)) // AI-ს ჩაწერილი 13:45-ის მსგავსი დროც ჩანს
const dateLabel = (d) => `${dayLong(weekdayOf(d))}, ${dayNumber(d)} ${monthLong(monthIndex(d))}`
export const TYPE_NAMES = { lecture: ['ლექცია', 'Lecture'], work: ['სამუშაო', 'Work'], personal: ['პირადი', 'Personal'] }
const TYPE_STYLE = { lecture: 'bg-[#e6edfd] text-[#2a4fae]', work: 'bg-[#fdf0d5] text-[#8a5a14]', personal: 'bg-[#ebe6f7] text-[#4b3a8a]' }
const TYPE_RING = { lecture: 'ring-[#2a4fae]', work: 'ring-[#8a5a14]', personal: 'ring-[#4b3a8a]' }

// მაძიებლის კალენდარი: დაკავებული დროის ჩაწერა. თავისუფალი დრო ყველაფერია, რაც აქ არ წერია.
export function StudentSchedule({ busy, setLessons, freeHours, onFillWithAI }) {
  useLang()
  const [sheet, setSheet] = useState(null)

  return (
    <div>
      <Title eyebrow={tr('მონიშნე, როდის ხარ დაკავებული', "Mark when you're busy")} action={<RoundAdd label={tr('დამატება', 'Add')} onClick={() => setSheet({ date: todayISO(), start: 10 * 60 })} />}>
        {tr('ჩემი კალენდარი', 'My calendar')}
      </Title>
      <button data-tour="quickadd" onClick={onFillWithAI} className={`mb-3.5 flex w-full items-center gap-2.5 rounded-[18px] bg-brand-soft px-3.5 py-3 text-left text-[14px] font-semibold text-ink ${tap}`}>
        <Icon name="ai" className="h-5 w-5 shrink-0 text-brand-deep" />
        <span className="flex-1">{tr('AI-ით შევსება', 'Fill with AI')}</span>
        <span className="text-[12px] tabular-nums text-brand-deep">{freeHours} {tr('სთ თავისუფალი', 'h free')}</span>
      </button>
      <GoogleImport busy={busy} setLessons={setLessons} />
      <BigCalendar
        events={busy}
        hint={tr('დააჭირე ცარიელ ადგილს ან მაუსით გადაატარე საათებზე', 'Tap an empty slot, or drag across hours with the mouse')}
        onSlot={(date, hour) => setSheet({ date, start: (hour ?? 10) * 60 })}
        onRange={(date, start, end) => setSheet({ date, start, end })}
        onEvent={(e) => (e.kind === 'work' ? openJob(e.job_id) : setSheet({ date: e.on, event: e }))}
      />
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-[12px] text-muted">
        {['lecture', 'work', 'personal'].map((k) => <Legend key={k} tone={k} text={tr(...TYPE_NAMES[k])} />)}
        <Legend tone="job" text={tr('საათოს სამუშაო', 'Saato job')} />
      </div>
      {sheet && <LessonSheet {...sheet} onClose={() => setSheet(null)} setLessons={setLessons} />}
    </div>
  )
}

// Google Calendar-დან: ჯერ ჩამონათვალს აჩვენებს (14 დღე), შემოაქვს მხოლოდ მონიშნული
function GoogleImport({ busy, setLessons }) {
  useLang()
  const [state, setState] = useState(null) // null | 'loading' | { rows, picked } | { error } | { done }
  useEffect(() => {
    const r = takeGoogleResult()
    if (!r) return
    if (!r.token) return setState({ error: r.error === 'access_denied' ? tr('Google-მა წვდომა არ მოგვცა.', 'Google did not give access.') : tr('Google-თან დაკავშირება ვერ მოხერხდა. სცადე თავიდან.', 'Could not connect to Google. Try again.') })
    setState('loading')
    fetchGoogleEvents(r.token)
      .then((items) => {
        const rows = toLessons(items, busy.filter((e) => e.kind === 'lesson'))
        setState({ rows, picked: rows.map((_, i) => i) })
      })
      .catch(() => setState({ error: tr('კალენდარი ვერ წავიკითხეთ. სცადე თავიდან.', 'We could not read your calendar. Try again.') }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    const rows = state.rows.filter((_, i) => state.picked.includes(i))
    setState({ ...state, saving: true })
    const { data, error } = await supabase.from('events').insert(rows).select()
    if (error) return setState({ error: tr('ვერ შეინახა. სცადე თავიდან.', 'Could not save. Try again.') })
    setLessons((list) => [...list, ...data])
    setState({ done: data.length })
  }
  const toggle = (i) => setState({ ...state, picked: state.picked.includes(i) ? state.picked.filter((x) => x !== i) : [...state.picked, i] })
  const when = (r) => `${r.date ? dateLabel(r.date) : tr(`ყოველ ${dayLong(r.weekday).replace(/ი$/, '')}ს`, `Every ${dayLong(r.weekday)}`)} · ${fmtMin(r.start_min)}–${fmtMin(r.end_min)}`

  return (
    <>
      <button onClick={startGoogleImport} className={`mb-3.5 flex w-full items-center gap-2.5 rounded-[18px] bg-white px-3.5 py-3 text-left text-[14px] font-semibold text-ink shadow-[0_1px_2px_rgba(21,24,30,.06)] ${tap}`} data-gcal>
        <Icon name="calendar" className="h-5 w-5 shrink-0" />
        <span className="flex-1">{state === 'loading' ? tr('Google Calendar იკითხება…', 'Reading Google Calendar…') : tr('შემოტანა Google Calendar-დან', 'Import from Google Calendar')}</span>
        <span className="text-[12px] text-muted">{tr('არასავალდებულო', 'Optional')}</span>
      </button>
      {state?.error && <p className="-mt-2 mb-3 px-1 text-[14px] font-medium text-coral">{state.error}</p>}
      {state?.done !== undefined && <p className="-mt-2 mb-3 px-1 text-[14px] font-medium text-mint-dark">{tr(`დაემატა ${state.done} ჩანაწერი`, `${state.done} entries added`)}</p>}
      {state?.rows && (
        <Sheet onClose={state.saving ? undefined : () => setState(null)}>
          <h2 className="text-[20px] font-bold">{tr('Google Calendar', 'Google Calendar')}</h2>
          <p className="mt-1 text-[15px] text-muted">{tr('მომდევნო 2 კვირა. განმეორებადი მოვლენები ყოველკვირეულ ლექციად დაემატება.', 'The next 2 weeks. Repeating events are added as weekly lectures.')}</p>
          {state.rows.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-bg p-4 text-[15px]">{tr('ახალი მოვლენა ვერ ვიპოვეთ: ან ცარიელია, ან უკვე დამატებულია.', 'No new events found: it is empty or already added.')}</p>
          ) : (
            <ul className="mt-4 max-h-[50vh] space-y-1.5 overflow-y-auto" data-gcal-rows>
              {state.rows.map((r, i) => (
                <li key={i}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-bg px-3.5 py-3">
                    <input type="checkbox" checked={state.picked.includes(i)} onChange={() => toggle(i)} className="h-5 w-5 accent-[var(--color-ink)]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{r.title}</span>
                      <span className="block text-[13px] text-muted">{when(r)}</span>
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TYPE_STYLE[r.type]}`}>{tr(...TYPE_NAMES[r.type])}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <button disabled={state.saving || !state.picked.length} onClick={save} className={`${btn} mt-5 disabled:opacity-40`} data-gcal-save>
            {state.saving ? tr('ინახება…', 'Saving…') : tr(`დამატება (${state.picked.length})`, `Add (${state.picked.length})`)}
          </button>
        </Sheet>
      )}
    </>
  )
}

export const Legend = ({ tone, text }) => (
  <span className="flex items-center gap-1.5"><i className={`h-2 w-2 rounded-[3px] ${DOTS[tone]}`} />{text}</span>
)

function LessonSheet({ date, start, end, event, onClose, setLessons }) {
  useLang()
  const s0 = event?.start_min ?? Math.min(start, 23 * 60)
  const [form, setForm] = useState({
    title: event?.title ?? '',
    type: event?.type ?? 'lecture',
    start: s0,
    end: event?.end_min ?? end ?? Math.min(s0 + 120, 24 * 60),
    repeat: event ? (event.date ? 'once' : 'weekly') : 'weekly',
  })
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: k === 'title' ? e.target.value : Number(e.target.value) })

  async function run(query, apply) {
    const { data, error } = await query
    if (error) return setError(tr('ვერ შეინახა. სცადე თავიდან.', 'Could not save. Try again.'))
    setLessons((list) => apply(list, data))
    onClose()
  }

  function save(e) {
    e.preventDefault()
    if (form.end <= form.start) return setError(tr('დასასრული დაწყებაზე გვიან უნდა იყოს.', 'The end must be after the start.'))
    const row = { title: form.title.trim() || tr(...TYPE_NAMES[form.type]), type: form.type, start_min: form.start, end_min: form.end }
    if (event) return run(supabase.from('events').update(row).eq('id', event.id).select().single(), (l, d) => l.map((x) => (x.id === d.id ? d : x)))
    const when = form.repeat === 'weekly' ? { weekday: weekdayOf(date) } : { date }
    run(supabase.from('events').insert({ ...row, ...when }).select().single(), (l, d) => [...l, d])
  }
  const removeAll = () => run(supabase.from('events').delete().eq('id', event.id).select().single(), (l) => l.filter((x) => x.id !== event.id))
  const skipThisDay = () =>
    run(supabase.from('events').update({ skip_dates: [...event.skip_dates, date] }).eq('id', event.id).select().single(), (l, d) => l.map((x) => (x.id === d.id ? d : x)))
  const every = tr(`ყოველ ${dayLong(weekdayOf(date)).replace(/ი$/, '')}ს`, `Every ${dayLong(weekdayOf(date))}`)
  const field = 'w-full bg-transparent py-1 text-[18px] font-bold tabular-nums outline-none'

  return (
    <Sheet onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <h2 className="text-[20px] font-bold tracking-[-0.01em]">{event ? tr('შეცვლა', 'Edit busy time') : tr('დაკავებული დრო', 'Busy time')}</h2>
          <p className="text-[14px] text-muted">{dateLabel(date)}</p>
        </div>
        <input className={input} value={form.title} onChange={set('title')} placeholder={tr('მაგ. მათემატიკის ლექცია', 'e.g. Maths lecture')} aria-label={tr('სახელი', 'Name')} />
        <div className="flex gap-2" role="radiogroup" aria-label={tr('ტიპი', 'Type')}>
          {['lecture', 'work', 'personal'].map((k) => (
            <button key={k} type="button" role="radio" aria-checked={form.type === k} onClick={() => setForm({ ...form, type: k })} className={`flex-1 rounded-[14px] px-1 py-3 text-[13px] font-semibold ${tap} ${TYPE_STYLE[k]} ${form.type === k ? `ring-2 ring-inset ${TYPE_RING[k]}` : ''}`}>
              {tr(...TYPE_NAMES[k])}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="block rounded-2xl bg-bg px-3 py-2">
            <span className="block text-[12px] text-muted">{tr('დან', 'From')}</span>
            <select className={field} value={form.start} onChange={set('start')} aria-label={tr('დაწყება', 'Start')}>
              {withValue(TIMES.slice(0, -1), form.start).map((m) => <option key={m} value={m}>{fmtMin(m)}</option>)}
            </select>
          </label>
          <label className="block rounded-2xl bg-bg px-3 py-2">
            <span className="block text-[12px] text-muted">{tr('მდე', 'To')}</span>
            <select className={field} value={form.end} onChange={set('end')} aria-label={tr('დასრულება', 'End')}>
              {withValue(TIMES.slice(1), form.end).map((m) => <option key={m} value={m}>{fmtMin(m)}</option>)}
            </select>
          </label>
        </div>
        {!event && <Segmented value={form.repeat} onChange={(repeat) => setForm({ ...form, repeat })} options={[['weekly', every], ['once', tr('მხოლოდ ამ დღეს', 'Only this day')]]} />}
        {event && !event.date && <p className="text-[13px] text-muted">{tr(`ეს ${every} მეორდება. ცვლილება ყველა კვირაზე გავრცელდება.`, `This repeats ${every.toLowerCase()}. Changes apply to every week.`)}</p>}
        {error && <p className="text-[14px] font-medium text-coral">{error}</p>}
        <button className={btn}>{tr('შენახვა', 'Save')}</button>
        {event && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {!event.date && <button type="button" onClick={skipThisDay} className={btn2}>{tr('ამ დღეს არ მაქვს', 'Not on this day')}</button>}
            <button type="button" onClick={removeAll} className={`${btn2} !bg-coral-soft !text-[#b42323] ${event.date ? 'sm:col-span-2' : ''}`}>
              {event.date ? tr('წაშლა', 'Delete') : tr('ყველა კვირიდან წაშლა', 'Delete from every week')}
            </button>
          </div>
        )}
      </form>
    </Sheet>
  )
}
