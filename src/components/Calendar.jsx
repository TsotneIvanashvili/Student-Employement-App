import { useRef } from 'react'
import { DAYS, FIRST_HOUR, LAST_HOUR, slotKey } from '../lib/match.js'

const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i)

function slotAt(x, y) {
  const el = document.elementFromPoint(x, y)?.closest('[data-slot]')
  return el ? { day: Number(el.dataset.day), hour: Number(el.dataset.hour) } : null
}

// free: თავისუფალი საათები (Set of 'day-hour').
// selectedShifts: { key -> 'fit' | 'conflict' } არჩეული ვაკანსიის ცვლებისთვის
export default function Calendar({ free, setFree, selectedShifts, selectedJob, onClearJob }) {
  const paint = useRef(null) // { mode, day, hour } | null

  // გადასმისას შუალედური საათებიც მოინიშნება (იმავე დღეში)
  function apply(day, hour, mode) {
    const from = paint.current?.day === day ? paint.current.hour : hour
    paint.current = { mode, day, hour }
    setFree((prev) => {
      const next = new Set(prev)
      for (let h = Math.min(from, hour); h <= Math.max(from, hour); h++) {
        const key = slotKey(day, h)
        mode === 'add' ? next.add(key) : next.delete(key)
      }
      return next
    })
  }

  function onPointerDown(e) {
    const s = slotAt(e.clientX, e.clientY)
    if (!s) return
    paint.current = null
    apply(s.day, s.hour, free.has(slotKey(s.day, s.hour)) ? 'remove' : 'add')
  }

  function onPointerMove(e) {
    if (!paint.current) return
    const s = slotAt(e.clientX, e.clientY)
    if (!s || (s.day === paint.current.day && s.hour === paint.current.hour)) return
    apply(s.day, s.hour, paint.current.mode)
  }

  const stop = () => (paint.current = null)

  function cellClass(key) {
    const mark = selectedShifts[key]
    if (mark === 'fit') return 'bg-ink'
    if (mark === 'conflict') return 'bg-coral'
    if (free.has(key)) return 'bg-brand'
    return 'bg-bg'
  }

  return (
    <section className="rounded-[22px] bg-white p-3.5">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <p className="text-[13px] text-muted">შეეხე ან გადაუსვი თითი საათებს</p>
        <button onClick={() => setFree(new Set())} className="shrink-0 text-[15px] font-medium text-brand">გასუფთავება</button>
      </div>

      {selectedJob && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-ink px-3 py-2 text-sm text-white">
          <span>ნაჩვენებია: <b>{selectedJob.title}</b></span>
          <button onClick={onClearJob} className="px-2 text-lg leading-none text-white/70" aria-label="დახურვა">×</button>
        </div>
      )}

      <div
        data-tour="calendar"
        className="grid touch-none select-none gap-[3px]"
        style={{ gridTemplateColumns: `30px repeat(${DAYS.length}, 1fr)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stop}
        onPointerCancel={stop}
        onPointerLeave={stop}
      >
        <div />
        {DAYS.map((d) => (
          <div key={d} className="pb-1 text-center text-xs font-semibold text-muted">{d}</div>
        ))}
        {HOURS.map((h) => [
          <div key={`h${h}`} className="pr-1 text-right text-[11px] leading-8 text-quiet">{h}</div>,
          ...DAYS.map((_, day) => {
            const key = slotKey(day, h)
            return (
              <div
                key={key}
                data-slot
                data-day={day}
                data-hour={h}
                role="button"
                aria-label={`${DAYS[day]} ${h}:00`}
                className={`h-8 rounded-[7px] transition-colors duration-150 ${cellClass(key)}`}
              />
            )
          }),
        ])}
      </div>

      <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-2 px-1 text-xs text-muted">
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-brand" />თავისუფალი</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-ink" />ცვლა ერგება</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-coral" />ცვლა არ ჯდება</span>
      </div>
    </section>
  )
}
