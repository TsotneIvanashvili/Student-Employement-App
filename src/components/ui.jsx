import { useRef, useState } from 'react'
import { money } from '../lib/i18n.js'

// საერთო საშენი ბლოკები. ზომები და ფერები Claude Design-ის ShiftMate მაკეტიდანაა:
// ბარათი 24px, ღილაკი 16px, დაჭერისას 0.96-მდე პატარავდება.

const press = 'transition duration-150 ease-out active:scale-[0.96] disabled:pointer-events-none disabled:opacity-45'
export const btn = `w-full rounded-2xl bg-brand px-4 py-4 text-[15px] font-semibold text-on-brand hover:bg-brand-dark ${press}`
export const btn2 = `w-full rounded-2xl bg-fill px-4 py-4 text-[15px] font-semibold text-ink hover:bg-line ${press}`
export const btnDark = `w-full rounded-2xl bg-ink px-4 py-4 text-[15px] font-semibold text-white hover:bg-black ${press}`
export const btnDanger = `rounded-2xl bg-coral-soft px-5 py-4 text-[15px] font-semibold text-[#b42323] ${press}`
export const btnSm = `rounded-[14px] bg-brand px-4 py-2.5 text-[14px] font-semibold text-on-brand hover:bg-brand-dark ${press}`
export const btnSm2 = `rounded-[14px] bg-fill px-4 py-2.5 text-[14px] font-semibold text-ink hover:bg-line ${press}`
export const chip = `rounded-full px-3.5 py-2.5 text-[13px] font-semibold ${press}`
export const card = 'rounded-3xl bg-white shadow-card'
export const tap = press
export const input = 'w-full rounded-2xl border border-field bg-white px-4 py-3.5 text-[16px] text-ink outline-none transition placeholder:text-quiet focus:border-brand-deep focus:ring-4 focus:ring-brand-soft'
export const label = 'mb-1.5 block text-[13px] font-medium text-muted'
export { money }

export const ICONS = {
  home: 'M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z',
  calendar: 'M7 3v3m10-3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z',
  jobs: 'M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1M4 7h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm-1 6h18',
  ai: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0',
  inbox: 'M4 13l2.5-7.5A1 1 0 0 1 7.4 5h9.2a1 1 0 0 1 .9.5L20 13M4 13v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6M4 13h4l1.5 3h5L16 13h4',
  plus: 'M12 5v14M5 12h14',
  bolt: 'M13 3L4 14h7l-1 7 9-11h-7z',
  shield: 'M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6zm-3 9l2 2 4-4',
  wallet: 'M4 7a2 2 0 0 1 2-2h12v4M4 7v10a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2zm12 7h.01',
  check: 'M5 12l5 5 9-10',
  back: 'M15 5l-7 7 7 7',
  chevron: 'M9 6l6 6-6 6',
  send: 'M12 19V5m-6 6l6-6 6 6',
  doc: 'M7 3h7l5 5v13H7zm7 0v5h5',
  phone: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm3 15h2',
  logout: 'M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 8l-4 4 4 4M6 12h10',
  share: 'M12 15V3m-4 4l4-4 4 4M6 11H5v10h14V11h-1',
  pin: 'M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11zm0-9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  clock: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  x: 'M6 6l12 12M18 6L6 18',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16l-4.35-4.35',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  lock: 'M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zm2 0V7a4 4 0 1 1 8 0v4',
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  edit: 'M4 20h4L19 9l-4-4L4 16zm9.5-13.5l4 4',
  mail: 'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm-1 1l9 6 9-6',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z',
  briefcase: 'M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1M4 7h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm-1 6h18',
  help: 'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14m0 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
}

export function Icon({ name, className = 'h-6 w-6', strokeWidth = 2 }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

export function Title({ eyebrow, children, action }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 px-1">
      <div className="min-w-0">
        {eyebrow && <p className="text-[14px] text-muted">{eyebrow}</p>}
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] lg:text-[32px]">{children}</h1>
      </div>
      {action}
    </div>
  )
}

// მრგვალი „+“ ღილაკი სათაურის გვერდით
export const RoundAdd = ({ onClick, label: aria, tour }) => (
  <button type="button" onClick={onClick} aria-label={aria} data-tour={tour} className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-on-brand ${press}`}>
    <Icon name="plus" className="h-[22px] w-[22px]" strokeWidth={2.5} />
  </button>
)

// გადამრთველი, რომლის თეთრი ფონი არჩეულ ვარიანტზე სრიალებს
export function Segmented({ value, onChange, options, size = 'md' }) {
  const i = Math.max(0, options.findIndex(([v]) => v === value))
  const n = options.length
  return (
    <div className={`relative flex w-full bg-line ${size === 'sm' ? 'rounded-xl p-[3px]' : 'rounded-2xl p-1'}`}>
      <span
        className={`absolute bg-white shadow-[0_1px_2px_rgba(21,24,30,.12)] transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${size === 'sm' ? 'inset-y-[3px] left-[3px] rounded-[9px]' : 'inset-y-1 left-1 rounded-xl'}`}
        style={{ width: `calc((100% - ${size === 'sm' ? 6 : 8}px) / ${n})`, transform: `translateX(${i * 100}%)` }}
      />
      {options.map(([v, text]) => (
        <button
          type="button"
          key={v}
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`relative min-w-0 flex-1 truncate font-semibold text-ink ${size === 'sm' ? 'py-[7px] text-[12px]' : 'py-3 text-[14px]'}`}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

// ტელეფონზე ქვემოდან ამოდის და სახელურით ქვემოთ ჩამოწევით იხურება; კომპიუტერზე შუაში ჩნდება
export function Sheet({ onClose, children }) {
  const [dy, setDy] = useState(0)
  const drag = useRef(null)
  const down = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { y0: e.clientY, last: [[e.timeStamp, 0]] }
  }
  const move = (e) => {
    if (!drag.current) return
    let d = e.clientY - drag.current.y0
    if (d < 0) d = -((-d * 300 * 0.55) / (300 + 0.55 * -d)) // ზემოთ წევისას რეზინივით ეწინააღმდეგება
    drag.current.last = [...drag.current.last.slice(-4), [e.timeStamp, d]]
    setDy(d)
  }
  const up = () => {
    const g = drag.current
    drag.current = null
    if (!g) return
    const [a, b] = [g.last[0], g.last[g.last.length - 1]]
    const v = b[0] > a[0] ? (b[1] - a[1]) / (b[0] - a[0]) : 0 // პიქსელი მილიწამში
    if (b[1] + v * 250 > 160 && onClose) onClose()
    else setDy(0)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 animate-fade sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[90dvh] w-full flex-col rounded-t-[32px] bg-white shadow-[0_-10px_40px_rgba(21,24,30,.18)] animate-sheet sm:max-w-md sm:rounded-[28px]"
        style={{ transform: dy ? `translateY(${dy}px)` : undefined, transition: drag.current ? 'none' : 'transform 460ms cubic-bezier(0.32,0.72,0,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} className="shrink-0 cursor-grab touch-none pb-3.5 pt-2.5 sm:hidden">
          <div className="mx-auto h-[5px] w-11 rounded-full bg-field" />
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pb-[max(env(safe-area-inset-bottom),2rem)] sm:p-6">{children}</div>
      </div>
    </div>
  )
}

export function Switch({ on, onChange, label: aria }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={aria} onClick={() => onChange(!on)} className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors duration-200 ${on ? 'bg-brand-dark' : 'bg-field'}`}>
      <span className={`absolute left-[3px] top-[3px] h-[26px] w-[26px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.25)] transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

export const Badge = ({ tone = 'gray', children }) => {
  const tones = {
    gray: 'bg-fill text-muted',
    green: 'bg-brand-soft text-brand-deep',
    amber: 'bg-amber-soft text-amber',
    red: 'bg-coral-soft text-[#b42323]',
    violet: 'bg-violet-soft text-violet',
    sky: 'bg-sky-soft text-sky',
    dark: 'bg-ink text-white',
  }
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ${tones[tone]}`}>{children}</span>
}

// ინიციალები: სახელიდან ან კომპანიიდან
export const initials = (name) => (name || '?').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
const TINTS = [['#d8e8e6', '#123b36'], ['#efe3cd', '#4a3208'], ['#ebe6f7', '#33255c'], ['#e9ebf8', '#2c3880'], ['#eef1f0', '#15181e']]
export const tint = (name) => TINTS[[...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length]
export function Avatar({ name, size = 46, radius = 14, className = '' }) {
  const [bg, fg] = tint(name)
  return (
    <span className={`grid shrink-0 place-items-center font-semibold ${className}`} style={{ width: size, height: size, borderRadius: radius, background: bg, color: fg, fontSize: Math.round(size * 0.32) }}>
      {initials(name)}
    </span>
  )
}

// −  მნიშვნელობა  +  (საათები, ანაზღაურება)
export function Stepper({ label: text, value, onDown, onUp, small }) {
  const b = `grid shrink-0 place-items-center text-[22px] leading-none text-ink transition active:scale-90 ${small ? 'h-11 w-8' : 'h-11 w-11'}`
  return (
    <div className={`rounded-2xl bg-bg ${small ? 'px-1.5 py-2 text-center' : 'px-3 py-2.5'}`}>
      <div className={`text-[12px] text-muted ${small ? 'text-[11px]' : ''}`}>{text}</div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={onDown} aria-label="−" className={b}>−</button>
        <span className={`font-bold tabular-nums ${small ? 'text-[16px]' : 'text-[18px]'}`}>{value}</span>
        <button type="button" onClick={onUp} aria-label="+" className={b}>+</button>
      </div>
    </div>
  )
}

export function Empty({ icon, title, text, action }) {
  return (
    <div className={`${card} flex flex-col items-center px-6 py-9 text-center`}>
      {icon && <span className="mb-3 grid h-14 w-14 place-items-center rounded-[18px] bg-brand-soft text-brand-deep"><Icon name={icon} className="h-7 w-7" /></span>}
      <p className="text-[16px] font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-[14px] text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export const Stars = ({ value, count }) =>
  value ? (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-fill px-2.5 py-1 text-[12px] font-semibold text-muted">
      ★ {Number(value).toFixed(1)}{count != null && <span className="font-medium text-quiet">({count})</span>}
    </span>
  ) : null
