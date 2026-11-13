import { useEffect, useRef, useState } from 'react'
import { todayISO } from '../lib/match.js'
import {
  DAY_NAMES, MONTH_NAMES, addDays, addMonths, dayNumber, eventsOn, fmtMin, layoutDay, monthIndex, startOfMonth, startOfWeek, weekdayOf, yearOf,
} from '../lib/schedule.js'
import { Icon, Segmented } from './ui.jsx'

const ROW = 44 // ერთი საათის სიმაღლე (px)
const HOURS = Array.from({ length: 24 }, (_, h) => h)
const SHORT = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი']

// ფერები მოვლენის ტიპის მიხედვით: ლექცია, სამუშაო, თავისუფალი ცვლა (დამსაქმებლისთვის)
export const TONES = {
  lesson: 'bg-[#e6edfd] border-[#3d6ee0] text-[#173a85]',
  work: 'bg-[#ddf3e6] border-[#1f9d5a] text-[#0e4a2a]',
  open: 'bg-[#fdf0da] border-[#d98a14] text-[#5f3a05]',
}
const tone = (e) => TONES[e.tone ?? e.kind] ?? TONES.lesson

const monthTitle = (date) => `${MONTH_NAMES[monthIndex(date)]} ${yearOf(date)}`
const short = (date) => `${dayNumber(date)} ${MONTH_NAMES[monthIndex(date)].slice(0, 3)}`

// კალენდარი: დღე / კვირა / თვე. onSlot(date, hour) — ცარიელ ადგილზე დაჭერა, onEvent(occurrence) — მოვლენაზე.
export default function BigCalendar({ events, onSlot, onEvent }) {
  const today = todayISO()
  const [view, setView] = useState(() => (window.innerWidth < 768 ? 'day' : 'week'))
  const [anchor, setAnchor] = useState(today)

  const step = (dir) => setAnchor((a) => (view === 'month' ? addMonths(a, dir) : addDays(a, view === 'week' ? 7 * dir : dir)))
  const weekStart = startOfWeek(anchor)
  const title =
    view === 'day' ? `${dayNumber(anchor)} ${MONTH_NAMES[monthIndex(anchor)]} ${yearOf(anchor)}`
    : view === 'week' ? `${short(weekStart)} – ${short(addDays(weekStart, 6))} ${yearOf(addDays(weekStart, 6))}`
    : monthTitle(anchor)

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white" data-tour="calendar">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <button onClick={() => step(-1)} aria-label="წინა" className="grid h-9 w-9 place-items-center rounded-lg border border-line hover:bg-fill"><Icon name="back" className="h-4 w-4" strokeWidth={2.5} /></button>
          <button onClick={() => step(1)} aria-label="შემდეგი" className="grid h-9 w-9 place-items-center rounded-lg border border-line hover:bg-fill"><Icon name="chevron" className="h-4 w-4" strokeWidth={2.5} /></button>
          <button onClick={() => setAnchor(today)} className="h-9 rounded-lg border border-line px-3 text-[14px] font-medium hover:bg-fill">დღეს</button>
        </div>
        <h2 className="order-last w-full text-center text-[18px] font-semibold sm:order-none sm:w-auto sm:text-[20px]">{title}</h2>
        <div className="w-full sm:w-auto">
          <Segmented value={view} onChange={setView} options={[['day', 'დღე'], ['week', 'კვირა'], ['month', 'თვე']]} />
        </div>
      </header>

      {view === 'month' ? (
        <Month anchor={anchor} today={today} events={events} onSlot={onSlot} onEvent={onEvent} onMore={(d) => { setAnchor(d); setView('day') }} />
      ) : (
        <TimeGrid days={view === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)) : [anchor]} today={today} events={events} onSlot={onSlot} onEvent={onEvent} />
      )}
    </section>
  )
}

function Month({ anchor, today, events, onSlot, onEvent, onMore }) {
  const first = startOfWeek(startOfMonth(anchor))
  const month = monthIndex(anchor)
  const last = addDays(addMonths(anchor, 1), -1)
  const days = []
  for (let d = first; d <= last || days.length % 7; d = addDays(d, 1)) days.push(d)
  return (
    <div>
      <div className="grid grid-cols-7 border-b border-line">
        {DAY_NAMES.map((d, i) => (
          <p key={d} className={`py-2 text-center text-[12px] font-medium sm:text-[13px] ${i > 4 ? 'text-quiet' : 'text-muted'}`}>
            <span className="hidden sm:inline">{d}</span><span className="sm:hidden">{SHORT[i]}</span>
          </p>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const list = eventsOn(events, d)
          const inMonth = monthIndex(d) === month
          return (
            <div
              key={d}
              onClick={() => onSlot?.(d, null)}
              className={`min-h-[84px] border-b border-r border-line p-1 sm:min-h-[112px] sm:p-1.5 [&:nth-child(7n)]:border-r-0 ${onSlot ? 'cursor-pointer hover:bg-bg' : ''}`}
            >
              <span className={`mb-1 inline-grid h-7 w-7 place-items-center rounded-full text-[13px] font-medium sm:text-[14px] ${d === today ? 'bg-coral text-white' : inMonth ? 'text-ink' : 'text-quiet/60'}`}>
                {dayNumber(d)}
              </span>
              <div className="space-y-1">
                {list.slice(0, 2).map((e) => (
                  <button
                    key={e.id}
                    onClick={(ev) => { ev.stopPropagation(); onEvent?.(e) }}
                    className={`block w-full truncate rounded-[5px] border-l-[3px] px-1 py-0.5 text-left text-[10px] font-medium sm:px-1.5 sm:text-[12px] ${tone(e)}`}
                  >
                    {e.title}
                  </button>
                ))}
                {list.length > 2 && (
                  <button onClick={(ev) => { ev.stopPropagation(); onMore(d) }} className="px-1 text-[11px] font-medium text-muted hover:text-ink sm:text-[12px]">
                    + კიდევ {list.length - 2}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TimeGrid({ days, today, events, onSlot, onEvent }) {
  const scroller = useRef(null)
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 8 * ROW - 8
  }, [days.length])

  return (
    <div>
      <div className="grid border-b border-line" style={{ gridTemplateColumns: `52px repeat(${days.length}, minmax(0, 1fr))` }}>
        <div />
        {days.map((d) => (
          <div key={d} className={`flex flex-col items-center py-2 ${d === today ? 'bg-bg' : ''}`}>
            <span className="text-[12px] font-medium text-muted">{days.length > 1 ? SHORT[weekdayOf(d)] : DAY_NAMES[weekdayOf(d)]}</span>
            <span className={`mt-0.5 grid h-7 w-7 place-items-center rounded-full text-[14px] font-semibold ${d === today ? 'bg-coral text-white' : ''}`}>{dayNumber(d)}</span>
          </div>
        ))}
      </div>
      <div ref={scroller} data-scroller className="max-h-[68vh] overflow-y-auto">
        <div className="grid" style={{ gridTemplateColumns: `52px repeat(${days.length}, minmax(0, 1fr))` }}>
          <div>
            {HOURS.map((h) => (
              <div key={h} className="relative border-b border-line text-right" style={{ height: ROW }}>
                <span className="absolute -top-2 right-2 bg-white px-0.5 text-[11px] text-quiet">{h === 0 ? '' : fmtMin(h * 60)}</span>
              </div>
            ))}
          </div>
          {days.map((d) => (
            <div
              key={d}
              data-day-col={d}
              className={`relative border-l border-line ${d === today ? 'bg-bg/70' : ''} ${onSlot ? 'cursor-pointer' : ''}`}
              onClick={(ev) => onSlot?.(d, Math.min(23, Math.floor(ev.nativeEvent.offsetY / ROW)))}
            >
              {HOURS.map((h) => <div key={h} className="pointer-events-none border-b border-line" style={{ height: ROW }} />)}
              {layoutDay(eventsOn(events, d)).map((e) => (
                <button
                  key={e.id}
                  onClick={(ev) => { ev.stopPropagation(); onEvent?.(e) }}
                  className={`absolute overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-left leading-tight ${tone(e)}`}
                  style={{
                    top: (e.start_min / 60) * ROW + 1,
                    height: ((e.end_min - e.start_min) / 60) * ROW - 2,
                    left: `calc(${(e.col / e.cols) * 100}% + 2px)`,
                    width: `calc(${100 / e.cols}% - 4px)`,
                  }}
                >
                  <span className="block truncate text-[12px] font-semibold">{e.title}</span>
                  <span className="block truncate text-[11px] opacity-75">{fmtMin(e.start_min)}–{fmtMin(e.end_min)}</span>
                  {e.subtitle && <span className="block truncate text-[11px] opacity-75">{e.subtitle}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
