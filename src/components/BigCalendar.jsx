import { useEffect, useRef, useState } from 'react'
import { todayISO } from '../lib/match.js'
import { addDays, addMonths, dayNumber, eventsOn, fmtMin, layoutDay, monthIndex, startOfMonth, startOfWeek, weekdayOf, yearOf } from '../lib/schedule.js'
import { dayLong, dayShort, monthLong, monthShort, tr, useLang } from '../lib/i18n.js'
import { Icon, Segmented } from './ui.jsx'

const ROW = 40 // ერთი საათის სიმაღლე (px)
const HOURS = Array.from({ length: 24 }, (_, h) => h)

// ფერები: ლექცია (ლურჯი), სამუშაო (ქარვისფერი), პირადი (იისფერი), ShiftMate-ზე აყვანილი ცვლა (მწვანე),
// დამსაქმებლის ცვლა, რომელზეც ჯერ არავინ აიყვანეს (ნაცრისფერი)
export const TONES = {
  lecture: 'bg-[#e6edfd] text-[#2a4fae]',
  work: 'bg-[#fdf0d5] text-[#8a5a14]',
  personal: 'bg-[#ebe6f7] text-[#4b3a8a]',
  job: 'bg-[#e2f9ed] text-[#0a7a45] ring-1 ring-inset ring-[#2fd07f]',
  open: 'bg-fill text-muted ring-1 ring-inset ring-dashed ring-field',
}
export const DOTS = { lecture: 'bg-[#3d6ee0]', work: 'bg-[#c98a1e]', personal: 'bg-[#7a64c4]', job: 'bg-[#2fd07f]', open: 'bg-quiet' }
const BARS = { lecture: 'max-sm:bg-[#3d6ee0]', work: 'max-sm:bg-[#c98a1e]', personal: 'max-sm:bg-[#7a64c4]', job: 'max-sm:bg-[#2fd07f]', open: 'max-sm:bg-quiet' }
export const kindOf = (e) => e.tone ?? (e.kind === 'work' ? 'job' : e.type ?? 'lecture')
const tone = (e) => TONES[kindOf(e)] ?? TONES.lecture

const monthTitle = (date) => `${monthLong(monthIndex(date))} ${yearOf(date)}`
const short = (date) => `${dayNumber(date)} ${monthShort(monthIndex(date))}`

// კალენდარი: დღე / კვირა / თვე. onSlot(date, hour) — ცარიელ ადგილზე დაჭერა, onRange(date, start, end) — მაუსით
// საათებზე გადატარება (წუთებში), onEvent(occurrence) — მოვლენაზე დაჭერა.
export default function BigCalendar({ events, onSlot, onRange, onEvent, hint }) {
  useLang()
  const today = todayISO()
  const [view, setView] = useState(() => (window.innerWidth < 768 ? 'day' : 'week'))
  const [anchor, setAnchor] = useState(today)

  const step = (dir) => setAnchor((a) => (view === 'month' ? addMonths(a, dir) : addDays(a, view === 'week' ? 7 * dir : dir)))
  const weekStart = startOfWeek(anchor)
  const title =
    view === 'day' ? `${dayNumber(anchor)} ${monthLong(monthIndex(anchor))} ${yearOf(anchor)}`
    : view === 'week' ? `${short(weekStart)} – ${short(addDays(weekStart, 6))} ${yearOf(addDays(weekStart, 6))}`
    : monthTitle(anchor)

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-card" data-tour="calendar">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-fill px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-bold tracking-[-0.01em] sm:text-[20px]">{title}</h2>
          {anchor !== today && (
            <button onClick={() => setAnchor(today)} className="rounded-full bg-brand-soft px-3 py-1 text-[13px] font-semibold text-brand-deep hover:brightness-95">{tr('დღეს', 'Today')}</button>
          )}
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="flex shrink-0 overflow-hidden rounded-xl bg-line">
            <button onClick={() => step(-1)} aria-label={tr('წინა', 'Previous')} className="grid h-10 w-10 place-items-center hover:bg-field"><Icon name="back" className="h-4 w-4" strokeWidth={2.5} /></button>
            <button onClick={() => step(1)} aria-label={tr('შემდეგი', 'Next')} className="grid h-10 w-10 place-items-center hover:bg-field"><Icon name="chevron" className="h-4 w-4" strokeWidth={2.5} /></button>
          </div>
          <div className="flex-1 sm:w-[240px] sm:flex-none">
            <Segmented size="sm" value={view} onChange={setView} options={[['day', tr('დღე', 'Day')], ['week', tr('კვირა', 'Week')], ['month', tr('თვე', 'Month')]]} />
          </div>
        </div>
      </header>

      {view === 'month' ? (
        <Month anchor={anchor} today={today} events={events} onSlot={onSlot} onEvent={onEvent} onMore={(d) => { setAnchor(d); setView('day') }} />
      ) : (
        <TimeGrid days={view === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)) : [anchor]} today={today} events={events} onSlot={onSlot} onRange={onRange} onEvent={onEvent} />
      )}
      {hint && view !== 'month' && <p className="hidden border-t border-fill px-5 py-2.5 text-[13px] text-quiet lg:block">{hint}</p>}
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
      <div className="grid grid-cols-7 border-b border-fill">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <p key={i} className={`py-2 text-center text-[12px] font-semibold sm:text-[13px] ${i > 4 ? 'text-quiet' : 'text-muted'}`}>
            <span className="hidden sm:inline">{dayLong(i)}</span><span className="sm:hidden">{dayShort(i)}</span>
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
              className={`group relative min-h-[76px] border-b border-r border-fill p-1 sm:min-h-[124px] sm:p-1.5 [&:nth-child(7n)]:border-r-0 ${weekdayOf(d) > 4 ? 'bg-bg/50' : ''} ${onSlot ? 'cursor-pointer' : ''}`}
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
                    className={`block h-1.5 w-full overflow-hidden rounded-full text-left transition hover:brightness-95 sm:h-auto sm:rounded-[9px] sm:px-1.5 sm:py-1 ${tone(e)} ${BARS[kindOf(e)] ?? BARS.lecture} max-sm:pointer-events-none`}
                  >
                    <span className="hidden truncate text-[12px] font-semibold leading-tight sm:block">{e.title}</span>
                    <span className="hidden truncate text-[11px] leading-tight opacity-75 sm:block">{fmtMin(e.start_min)}–{fmtMin(e.end_min)}</span>
                  </button>
                ))}
                {list.length > 2 && (
                  <button onClick={(ev) => { ev.stopPropagation(); onMore(d) }} className="w-full rounded-md text-left text-[11px] font-medium leading-none text-muted hover:bg-fill hover:text-ink sm:px-1 sm:text-[12px] sm:leading-normal">
                    +{list.length - 2} <span className="hidden sm:inline">{tr('კიდევ', 'more')}</span>
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

function TimeGrid({ days, today, events, onSlot, onRange, onEvent }) {
  const scroller = useRef(null)
  const drag = useRef(null) // მაუსით მონიშვნა: { date, from } წუთებში
  const dragged = useRef(false)
  const [sel, setSel] = useState(null) // { date, from, to }
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 8 * ROW - 8
  }, [days.length])

  // კურსორის ადგილი სვეტში → წუთები, 30 წუთის სიზუსტით
  const minAt = (ev) => {
    const y = ev.clientY - ev.currentTarget.getBoundingClientRect().top
    return Math.max(0, Math.min(24 * 60, Math.round((y / ROW) * 2) * 30))
  }
  const down = (d) => (ev) => {
    if (!onRange || ev.pointerType !== 'mouse' || ev.button !== 0 || ev.target.closest('button')) return
    drag.current = { date: d, from: minAt(ev) }
    ev.currentTarget.setPointerCapture(ev.pointerId)
  }
  const move = (ev) => {
    if (!drag.current) return
    const to = minAt(ev)
    if (to !== drag.current.from || sel) setSel({ ...drag.current, to })
  }
  const up = (ev) => {
    const start = drag.current
    drag.current = null
    setSel(null)
    if (!start) return
    const to = minAt(ev)
    if (Math.abs(to - start.from) < 30) return // უბრალო დაჭერაა, onClick დაამუშავებს
    dragged.current = true
    onRange(start.date, Math.min(start.from, to), Math.max(start.from, to))
  }
  const click = (d) => (ev) => {
    if (dragged.current) return void (dragged.current = false)
    onSlot?.(d, Math.min(23, Math.floor((ev.clientY - ev.currentTarget.getBoundingClientRect().top) / ROW)))
  }

  return (
    <div>
      <div className="grid border-b border-fill" style={{ gridTemplateColumns: `46px repeat(${days.length}, minmax(0, 1fr))` }}>
        <div />
        {days.map((d) => (
          <div key={d} className="px-1 py-2">
            <div className={`flex flex-col items-center rounded-[10px] py-1.5 ${d === today ? 'bg-ink text-white' : ''}`}>
              <span className={`text-[12px] font-semibold ${d === today ? 'opacity-70' : 'text-muted'}`}>{days.length > 1 ? dayShort(weekdayOf(d)) : dayLong(weekdayOf(d))}</span>
              <span className="text-[16px] font-semibold leading-tight">{dayNumber(d)}</span>
            </div>
          </div>
        ))}
      </div>
      <div ref={scroller} data-scroller className="max-h-[68vh] overflow-y-auto">
        <div className="grid" style={{ gridTemplateColumns: `46px repeat(${days.length}, minmax(0, 1fr))` }}>
          <div>
            {HOURS.map((h) => (
              <div key={h} className="relative text-right" style={{ height: ROW }}>
                <span className="absolute -top-2 right-1.5 bg-white px-0.5 text-[10px] tabular-nums text-muted">{h === 0 ? '' : fmtMin(h * 60)}</span>
              </div>
            ))}
          </div>
          {days.map((d) => (
            <div
              key={d}
              data-day-col={d}
              className={`relative select-none ${onSlot ? 'cursor-pointer hover:bg-bg/60' : ''}`}
              onPointerDown={down(d)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={() => { drag.current = null; setSel(null) }}
              onClick={click(d)}
            >
              {sel?.date === d && sel.to !== sel.from && (
                <div
                  data-selection
                  className="pointer-events-none absolute inset-x-1 z-20 rounded-xl border-2 border-brand-deep bg-brand/25 px-1.5 py-1 text-[12px] font-semibold text-brand-deep"
                  style={{ top: (Math.min(sel.from, sel.to) / 60) * ROW, height: (Math.abs(sel.to - sel.from) / 60) * ROW }}
                >
                  {fmtMin(Math.min(sel.from, sel.to))}–{fmtMin(Math.max(sel.from, sel.to))}
                </div>
              )}
              {HOURS.map((h) => <div key={h} className="pointer-events-none border-t border-fill" style={{ height: ROW }} />)}
              {d === today && <NowLine />}
              {layoutDay(eventsOn(events, d)).map((e) => (
                <button
                  key={e.id}
                  onClick={(ev) => { ev.stopPropagation(); onEvent?.(e) }}
                  className={`absolute flex flex-col justify-start overflow-hidden rounded-[9px] px-1.5 py-1 text-left leading-tight transition active:scale-[0.96] ${tone(e)}`}
                  style={{
                    top: (e.start_min / 60) * ROW + 1,
                    height: ((e.end_min - e.start_min) / 60) * ROW - 2,
                    left: `calc(${(e.col / e.cols) * 100}% + 2px)`,
                    width: `calc(${100 / e.cols}% - 4px)`,
                  }}
                >
                  <span className="block truncate text-[11px] font-semibold">{e.title}</span>
                  <span className="block truncate text-[10px] tabular-nums opacity-80">{fmtMin(e.start_min)}–{fmtMin(e.end_min)}</span>
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
