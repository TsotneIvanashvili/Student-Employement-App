import { useEffect, useRef } from 'react'
import { DAYS, FIRST_HOUR, LAST_HOUR, slotKey } from '../lib/match.js'

const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i)

// selectedShifts: { key -> 'fit' | 'conflict' } არჩეული ვაკანსიის ცვლებისთვის
export default function Calendar({ busy, setBusy, selectedShifts }) {
  const paint = useRef(null) // { mode: 'add' | 'remove', day, hour } | null

  useEffect(() => {
    const stop = () => (paint.current = null)
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [])

  // სწრაფი გადათრევისას შუალედური საათებიც მოინიშნება (იმავე დღეში)
  function apply(day, hour, mode) {
    const from = paint.current?.day === day ? paint.current.hour : hour
    paint.current = { mode, day, hour }
    setBusy((prev) => {
      const next = new Set(prev)
      for (let h = Math.min(from, hour); h <= Math.max(from, hour); h++) {
        const key = slotKey(day, h)
        mode === 'add' ? next.add(key) : next.delete(key)
      }
      return next
    })
  }

  function cellClass(key) {
    const mark = selectedShifts[key]
    if (mark === 'conflict') return 'bg-red-500 text-white'
    if (busy.has(key)) return 'bg-navy text-white'
    if (mark === 'fit') return 'bg-accent/25 ring-1 ring-inset ring-accent'
    return 'bg-white hover:bg-mist'
  }

  return (
    <section data-tour="calendar" className="rounded-3xl border border-line bg-white p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">ჩემი კვირა</h2>
          <p className="text-sm text-muted">მონიშნე ლექციები: დააჭირე უჯრას ან გადაათრიე.</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-navy" />ლექცია</span>
          <span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-accent/25 ring-1 ring-accent" />ცვლა ერგება</span>
          <span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-red-500" />ცვლა ეჯახება</span>
          <button onClick={() => setBusy(new Set())} className="rounded-lg border border-line px-3 py-1 hover:bg-mist">
            გასუფთავება
          </button>
        </div>
      </div>

      <div className="select-none overflow-x-auto">
        <div className="grid min-w-[560px] gap-px rounded-xl bg-line" style={{ gridTemplateColumns: `56px repeat(${DAYS.length}, 1fr)` }}>
          <div className="bg-white" />
          {DAYS.map((d) => (
            <div key={d} className="bg-white py-2 text-center text-sm font-semibold">{d}</div>
          ))}
          {HOURS.map((h) => (
            <Row key={h} hour={h} cellClass={cellClass} busy={busy} paint={paint} apply={apply} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Row({ hour, cellClass, busy, paint, apply }) {
  return (
    <>
      <div className="bg-white pr-2 pt-1 text-right text-xs text-quiet">{String(hour).padStart(2, '0')}:00</div>
      {DAYS.map((_, day) => {
        const key = slotKey(day, hour)
        return (
          <button
            key={key}
            aria-label={`${DAYS[day]} ${hour}:00`}
            onMouseDown={() => {
              paint.current = null
              apply(day, hour, busy.has(key) ? 'remove' : 'add')
            }}
            onMouseEnter={() => paint.current && apply(day, hour, paint.current.mode)}
            className={`h-8 text-[10px] transition-colors ${cellClass(key)}`}
          />
        )
      })}
    </>
  )
}
