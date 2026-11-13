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
// წერტილის ფერი (თვის ხედი და ლეგენდა)
export const DOTS = { lesson: 'bg-[#3d6ee0]', work: 'bg-[#1f9d5a]', open: 'bg-[#d98a14]' }
// ტელეფონის თვის ხედში ღონისძიება წვრილ ფერად ზოლად ჩანს
const BARS = { lesson: 'max-sm:bg-[#3d6ee0]', work: 'max-sm:bg-[#1f9d5a]', open: 'max-sm:bg-[#d98a14]' }
const kindOf = (e) => e.tone ?? e.kind ?? 'lesson'
const tone = (e) => TONES[kindOf(e)] ?? TONES.lesson
const dot = (e) => DOTS[kindOf(e)] ?? DOTS.lesson

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
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-semibold sm:text-[22px]">{title}</h2>
          {anchor !== today && (
            <button onClick={() => setAnchor(today)} className="rounded-full bg-fill px-3 py-1 text-[13px] font-medium hover:bg-line">დღეს</button>
          )}
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="flex shrink-0 overflow-hidden rounded-lg border border-line">
            <button onClick={() => step(-1)} aria-label="წინა" className="grid h-9 w-9 place-items-center hover:bg-fill"><Icon name="back" className="h-4 w-4" strokeWidth={2.5} /></button>
            <button onClick={() => step(1)} aria-label="შემდეგი" className="grid h-9 w-9 place-items-center border-l border-line hover:bg-fill"><Icon name="chevron" className="h-4 w-4" strokeWidth={2.5} /></button>
          </div>
          <div className="flex-1 sm:flex-none">
            <Segmented value={view} onChange={setView} options={[['day', 'დღე'], ['week', 'კვირა'], ['month', 'თვე']]} />
          </div>
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
              onClick={() => (window.innerWidth < 640 ? onMore(d) : onSlot?.(d, null))}
              className={`group relative min-h-[76px] border-b border-r border-line p-1 sm:min-h-[124px] sm:p-1.5 [&:nth-child(7n)]:border-r-0 ${weekdayOf(d) > 4 ? 'bg-bg/50' : ''} ${onSlot ? 'cursor-pointer' : ''}`}
            >
              <div className="mb-1 flex items-center justify-between px-0.5">
                <span className={`grid h-6 min-w-6 place-items-center rounded-md px-1 text-[12px] font-semibold sm:text-[13px] ${d === today ? 'bg-ink text-white' : inMonth ? 'text-ink' : 'text-quiet/50'}`}>
                  {dayNumber(d)}
                </span>
                {onSlot && (
                  <span className="hidden h-6 w-6 place-items-center rounded-md text-quiet group-hover:grid group-hover:bg-fill" aria-hidden="true">
                    <Icon name="plus" className="h-4 w-4" />
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {list.slice(0, 2).map((e) => (
                  <button
                    key={e.id}
                    onClick={(ev) => { ev.stopPropagation(); onEvent?.(e) }}
                    title={`${e.title} · ${fmtMin(e.start_min)}–${fmtMin(e.end_min)}`}
                    className={`block h-1.5 w-full overflow-hidden rounded-full text-left transition hover:brightness-95 sm:h-auto sm:rounded-md sm:px-1.5 sm:py-1 ${tone(e)} ${BARS[kindOf(e)] ?? BARS.lesson} max-sm:pointer-events-none`}
                  >
                    <span className="hidden truncate text-[12px] font-semibold leading-tight sm:block">{e.title}</span>
                    <span className="hidden truncate text-[11px] leading-tight opacity-75 sm:block">{fmtMin(e.start_min)}–{fmtMin(e.end_min)}</span>
                  </button>
                ))}
                {list.length > 2 && (
                  <button onClick={(ev) => { ev.stopPropagation(); onMore(d) }} className="w-full rounded-md text-left text-[11px] font-medium leading-none text-muted hover:bg-fill hover:text-ink sm:px-1 sm:text-[12px] sm:leading-normal">
                    +{list.length - 2} <span className="hidden sm:inline">კიდევ</span>
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

// წითელი ხაზი ახლანდელ დროზე (დღევანდელ სვეტში)
function NowLine() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])
  const top = ((now.getHours() * 60 + now.getMinutes()) / 60) * ROW
  return (
    <div className="pointer-events-none absolute inset-x-0 z-10" style={{ top }}>
      <div className="relative h-[2px] bg-coral"><span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-coral" /></div>
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
          <div key={d} className="px-1 py-2">
            <div className={`flex flex-col items-center rounded-xl py-1.5 ${d === today ? 'bg-ink text-white' : ''}`}>
              <span className={`text-[12px] font-medium ${d === today ? 'text-white/70' : 'text-muted'}`}>{days.length > 1 ? SHORT[weekdayOf(d)] : DAY_NAMES[weekdayOf(d)]}</span>
              <span className="text-[16px] font-semibold leading-tight">{dayNumber(d)}</span>
            </div>
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
              className={`relative border-l border-line ${onSlot ? 'cursor-pointer hover:bg-bg/40' : ''}`}
              onClick={(ev) => onSlot?.(d, Math.min(23, Math.floor(ev.nativeEvent.offsetY / ROW)))}
            >
              {HOURS.map((h) => <div key={h} className="pointer-events-none border-b border-dashed border-line" style={{ height: ROW }} />)}
              {d === today && <NowLine />}
              {layoutDay(eventsOn(events, d)).map((e) => (
                <button
                  key={e.id}
                  onClick={(ev) => { ev.stopPropagation(); onEvent?.(e) }}
                  className={`absolute overflow-hidden rounded-lg px-1.5 py-1 text-left leading-tight ring-1 ring-white ${tone(e)}`}
                  style={{
                    top: (e.start_min / 60) * ROW + 1,
                    height: ((e.end_min - e.start_min) / 60) * ROW - 2,
                    left: `calc(${(e.col / e.cols) * 100}% + 2px)`,
                    width: `calc(${100 / e.cols}% - 4px)`,
                  }}
                >
                  <span className="flex items-center gap-1 truncate text-[11px] opacity-80"><i className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot(e)}`} />{fmtMin(e.start_min)}–{fmtMin(e.end_min)}</span>
                  <span className="block truncate text-[12px] font-semibold">{e.title}</span>
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
