import { useRef } from 'react'
import { DAYS, FIRST_HOUR, LAST_HOUR, slotKey } from '../lib/match.js'
import { Icon, chip } from './ui.jsx'

const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i)
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

// შაბლონი: [სათაური, დღეები, საათები (პირველი, ბოლო ჩათვლით)]
export const preset = (title, days, from, to, icon = 'clock') => ({ title, icon, keys: days.flatMap((d) => range(from, to).map((h) => slotKey(d, h))) })
export const WEEKDAYS = [0, 1, 2, 3, 4]
export const WEEKEND = [5, 6]
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

function slotAt(x, y) {
  const el = document.elementFromPoint(x, y)?.closest('[data-slot]')
  return el ? { day: Number(el.dataset.day), hour: Number(el.dataset.hour) } : null
}

// კვირის ბადე: თითის გადასმით, დღის ან საათის სათაურზე დაჭერით, ან შაბლონებით ინიშნება.
// value: Set of 'day-hour'. marks: { key -> 'fit' | 'conflict' } არჩეული ვაკანსიისთვის.
export default function Calendar({ value, setValue, presets = [], marks = {}, banner, tone = 'mint', unit = 'სთ კვირაში' }) {
  const paint = useRef(null)
  const on = tone === 'mint' ? 'bg-mint' : 'bg-brand'

  function toggleKeys(keys) {
    setValue((prev) => {
      const next = new Set(prev)
      const all = keys.every((k) => next.has(k))
      keys.forEach((k) => (all ? next.delete(k) : next.add(k)))
      return next
    })
  }

  // გადასმისას შუალედური საათებიც მოინიშნება (იმავე დღეში)
  function apply(day, hour, mode) {
    const from = paint.current?.day === day ? paint.current.hour : hour
    paint.current = { mode, day, hour }
    setValue((prev) => {
      const next = new Set(prev)
      for (let h = Math.min(from, hour); h <= Math.max(from, hour); h++) {
        mode === 'add' ? next.add(slotKey(day, h)) : next.delete(slotKey(day, h))
      }
      return next
    })
  }
  function onPointerDown(e) {
    const s = slotAt(e.clientX, e.clientY)
    if (!s) return
    paint.current = null
    apply(s.day, s.hour, value.has(slotKey(s.day, s.hour)) ? 'remove' : 'add')
  }
  function onPointerMove(e) {
    if (!paint.current) return
    const s = slotAt(e.clientX, e.clientY)
    if (!s || (s.day === paint.current.day && s.hour === paint.current.hour)) return
    apply(s.day, s.hour, paint.current.mode)
  }
  const stop = () => (paint.current = null)

  function cellClass(key) {
    if (marks[key] === 'fit') return 'bg-brand'
    if (marks[key] === 'conflict') return 'bg-coral'
    if (value.has(key)) return on
    return 'bg-fill hover:bg-line'
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[15px] font-semibold">
          <span className={tone === 'mint' ? 'text-mint-dark' : 'text-brand'}>{value.size}</span> {unit}
        </p>
        {value.size > 0 && (
          <button type="button" onClick={() => setValue(new Set())} className="text-[14px] font-medium text-muted hover:text-coral">გასუფთავება</button>
        )}
      </div>

      {presets.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2" data-tour="presets">
          {presets.map((p) => {
            const active = p.keys.every((k) => value.has(k))
            return (
              <button type="button" key={p.title} onClick={() => toggleKeys(p.keys)} className={`${chip} ${active ? '!border-mint !bg-mint-soft !text-mint-dark' : ''}`}>
                <span className="flex items-center gap-1.5"><Icon name={active ? 'check' : p.icon} className="h-4 w-4" />{p.title}</span>
              </button>
            )
          })}
        </div>
      )}

      {banner}

      <div
        data-tour="calendar"
        className="grid touch-none select-none gap-1"
        style={{ gridTemplateColumns: `34px repeat(${DAYS.length}, minmax(0, 1fr))` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stop}
        onPointerCancel={stop}
        onPointerLeave={stop}
      >
        <div />
        {DAYS.map((d, day) => (
          <button
            type="button"
            key={d}
            onClick={() => toggleKeys(HOURS.map((h) => slotKey(day, h)))}
            title="მთელი დღის მონიშვნა"
            className={`rounded-lg pb-1 pt-0.5 text-center text-[13px] font-semibold hover:bg-fill ${day > 4 ? 'text-coral' : 'text-muted'}`}
          >
            {d}
          </button>
        ))}
        {HOURS.map((h) => [
          <button
            type="button"
            key={`h${h}`}
            onClick={() => toggleKeys(DAYS.map((_, day) => slotKey(day, h)))}
            title="მთელი მწკრივის მონიშვნა"
            className="rounded-lg pr-1 text-right text-[12px] font-medium text-quiet hover:bg-fill"
          >
            {h}:00
          </button>,
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
                aria-pressed={value.has(key)}
                className={`flex h-8 cursor-pointer items-center justify-center rounded-lg transition-colors duration-100 lg:h-9 ${cellClass(key)}`}
              >
                {marks[key] === 'fit' && <Icon name="check" className="h-4 w-4 text-white" strokeWidth={3} />}
              </div>
            )
          }),
        ])}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] font-medium text-muted">
        <span className="flex items-center gap-1.5"><i className={`h-3.5 w-3.5 rounded ${on}`} />{tone === 'mint' ? 'თავისუფალი' : 'ცვლა'}</span>
        {Object.keys(marks).length > 0 && (
          <>
            <span className="flex items-center gap-1.5"><i className="h-3.5 w-3.5 rounded bg-brand" />ცვლა ერგება</span>
            <span className="flex items-center gap-1.5"><i className="h-3.5 w-3.5 rounded bg-coral" />არ ჯდება</span>
          </>
        )}
        <span className="text-quiet">დააჭირე დღეს ან საათს მთელი მწკრივისთვის</span>
      </div>
    </section>
  )
}
