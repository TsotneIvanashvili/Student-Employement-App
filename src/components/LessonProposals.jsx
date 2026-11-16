import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { dayNumber, fmtMin, monthIndex, weekdayOf } from '../lib/schedule.js'
import { dayLong, monthLong, tr, useLang } from '../lib/i18n.js'
import { DOTS } from './BigCalendar.jsx'
import { Icon, btnSm, btnSm2 } from './ui.jsx'

const when = (l) =>
  l.date
    ? `${dayNumber(l.date)} ${monthLong(monthIndex(l.date))}, ${dayLong(weekdayOf(l.date))} (${tr('ერთჯერადი', 'once')})`
    : tr(`ყოველ ${dayLong(l.weekday).replace(/ი$/, '')}ს`, `Every ${dayLong(l.weekday)}`)

// AI-ს შემოთავაზებული დაკავებული დრო. პასუხის დასრულებისთანავე თავად ემატება კალენდარში; „გაუქმება“ უკან შლის.
// (ადრე „დამატებას“ ხელით აჭერდა, AI კი წერდა „დავამატე“, ამიტომ ხალხი ფიქრობდა, რომ უკვე დაემატა.)
// live = ახლახან მოსული პასუხი (თავად ემატება). შენახული ძველი პასუხი არასოდეს ემატება თავიდან:
// saved-ში წერია, რა მოხდა (added/removed), ხოლო თუ არაფერი, ხელით „დამატება“ ღილაკი ჩანს.
export default function LessonProposals({ lessons, setLessons, ready, live = true, saved, onSaved }) {
  useLang()
  const [state, setState] = useState(() => (saved && saved.state !== 'saving' ? saved.state : live ? 'saving' : 'pending')) // pending | saving | added | removed | error
  const [ids, setIds] = useState(saved?.ids ?? [])
  const started = useRef(Boolean(saved) || !live)
  const report = (next, nextIds) => {
    setState(next)
    onSaved?.({ state: next, ids: nextIds })
  }

  async function add() {
    setState('saving')
    const { data, error } = await supabase.from('events').insert(lessons).select()
    if (error) return report('error', ids)
    const newIds = data.map((e) => e.id)
    setIds(newIds)
    setLessons((list) => [...list, ...data])
    report('added', newIds)
  }
  async function undo() {
    const { error } = await supabase.from('events').delete().in('id', ids)
    if (error) return report('error', ids)
    setLessons((list) => list.filter((e) => !ids.includes(e.id)))
    report('removed', ids)
  }
  useEffect(() => {
    if (ready && lessons.length && !started.current) {
      started.current = true
      add()
    }
  }, [ready, lessons.length]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!lessons.length || !ready) return null
  return (
    <div className="rounded-[22px] bg-white p-3.5 shadow-card" data-proposals>
      <ul className="space-y-2">
        {lessons.map((l, i) => (
          <li key={i} className={`flex items-center gap-3 rounded-2xl bg-bg px-3 py-2.5 ${state === 'removed' ? 'opacity-50 line-through' : ''}`}>
            <i className={`h-2.5 w-2.5 shrink-0 rounded-[3px] ${DOTS[l.type] ?? DOTS.lecture}`} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold">{l.title} · {fmtMin(l.start_min)}–{fmtMin(l.end_min)}</span>
              <span className="block truncate text-[13px] text-muted">{when(l)}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {state === 'pending' && <span className="mr-auto text-[14px] text-muted">{tr('ჯერ არ დამატებულა', 'Not added yet')}</span>}
        {state === 'pending' && <button type="button" onClick={add} className={btnSm}>{tr('კალენდარში დამატება', 'Add to calendar')}</button>}
        {state === 'saving' && <span className="mr-auto text-[14px] text-muted">{tr('ემატება…', 'Adding…')}</span>}
        {state === 'added' && <span className="mr-auto flex items-center gap-1.5 text-[14px] font-semibold text-mint-dark"><Icon name="check" className="h-4 w-4" strokeWidth={3} />{tr('დაემატა კალენდარში', 'Added to your calendar')}</span>}
        {state === 'removed' && <span className="mr-auto text-[14px] text-muted">{tr('კალენდრიდან ამოიშალა', 'Removed from your calendar')}</span>}
        {state === 'error' && <span className="mr-auto text-[14px] font-medium text-coral">{tr('ვერ შეინახა. სცადე თავიდან.', 'Could not save. Try again.')}</span>}
        {state === 'added' && <button type="button" onClick={undo} className={btnSm2}>{tr('გაუქმება', 'Undo')}</button>}
        {state === 'error' && <button type="button" onClick={ids.length ? undo : add} className={btnSm}>{tr('თავიდან ცდა', 'Try again')}</button>}
      </div>
    </div>
  )
}
