import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { DAY_NAMES, MONTH_NAMES, dayNumber, fmtMin, monthIndex, weekdayOf } from '../lib/schedule.js'
import { DOTS } from './BigCalendar.jsx'
import { Icon, btnSm, btnSm2 } from './ui.jsx'

const when = (l) =>
  l.date
    ? `${dayNumber(l.date)} ${MONTH_NAMES[monthIndex(l.date)]}, ${DAY_NAMES[weekdayOf(l.date)]} (ერთჯერადი)`
    : `ყოველ ${DAY_NAMES[l.weekday].replace(/ი$/, '')}ს`

// AI-ს შემოთავაზებული დაკავებული დრო. კალენდარში მხოლოდ დადასტურების შემდეგ ემატება, ყველა ერთი დაჭერით.
export default function LessonProposals({ lessons, setLessons, onDone, onCancel }) {
  const [removed, setRemoved] = useState(() => new Set())
  const [state, setState] = useState('idle') // idle | saving | added | cancelled | error
  const shown = lessons.filter((_, i) => !removed.has(i))
  const open = state === 'idle' || state === 'saving' || state === 'error'

  async function add() {
    setState('saving')
    const { data, error } = await supabase.from('events').insert(shown).select()
    if (error) return setState('error')
    setLessons((list) => [...list, ...data])
    setState('added')
    onDone?.()
  }

  if (!lessons.length) return null
  return (
    <div className="rounded-3xl bg-white p-4 shadow-card" data-proposals>
      <ul className="space-y-2">
        {lessons.map((l, i) => !removed.has(i) && (
          <li key={i} className="flex items-center gap-3 rounded-2xl bg-bg px-3 py-2.5">
            <i className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOTS.lesson}`} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold">{l.title} · {fmtMin(l.start_min)}–{fmtMin(l.end_min)}</span>
              <span className="block truncate text-[13px] text-muted">{when(l)}</span>
            </span>
            {open && shown.length > 1 && (
              <button type="button" onClick={() => setRemoved(new Set([...removed, i]))} aria-label="ამოშლა" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-quiet hover:bg-fill hover:text-ink">
                <Icon name="x" className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {state === 'added' && <span className="mr-auto flex items-center gap-1.5 text-[14px] font-semibold text-brand-deep"><Icon name="check" className="h-4 w-4" strokeWidth={3} />დაემატა განრიგში</span>}
        {state === 'cancelled' && <span className="mr-auto text-[14px] text-muted">გაუქმდა</span>}
        {state === 'error' && <span className="mr-auto text-[14px] font-medium text-coral">ვერ დაემატა, სცადე თავიდან</span>}
        {open && (
          <>
            <button type="button" onClick={() => (onCancel ? onCancel() : setState('cancelled'))} className={btnSm2}>გაუქმება</button>
            <button type="button" disabled={state === 'saving'} onClick={add} className={btnSm}>
              {shown.length > 1 ? `ყველას დამატება (${shown.length})` : 'დამატება'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
