// საერთო საშენი ბლოკები: ღილაკები, ბარათები, ველები.

const press = 'transition active:scale-[0.98] disabled:opacity-50'
export const btn = `w-full rounded-2xl bg-brand py-3.5 text-[15px] font-semibold text-on-brand hover:bg-brand-dark ${press}`
export const btnMint = btn
export const btn2 = `w-full rounded-2xl bg-fill py-3.5 text-[15px] font-semibold text-ink hover:bg-line ${press}`
export const btnDark = `w-full rounded-2xl bg-ink py-3.5 text-[15px] font-semibold text-white hover:bg-black ${press}`
// პატარა ღილაკები (ბარათებში, სათაურის გვერდით)
export const btnSm = `rounded-xl bg-brand px-4 py-2 text-[14px] font-semibold text-on-brand hover:bg-brand-dark ${press}`
export const btnSm2 = `rounded-xl bg-fill px-4 py-2 text-[14px] font-semibold text-ink hover:bg-line ${press}`
export const chip = `rounded-full bg-fill px-3.5 py-2 text-[14px] font-medium text-ink hover:bg-line ${press}`
export const card = 'rounded-3xl bg-white shadow-card'
export const input = 'w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition placeholder:text-quiet focus:border-brand-deep focus:ring-4 focus:ring-brand-soft'
export const label = 'mb-1.5 block text-[13px] font-medium text-muted'

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
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="text-[14px] text-muted">{eyebrow}</p>}
        <h1 className="text-[28px] font-bold leading-tight tracking-tight lg:text-[34px]">{children}</h1>
      </div>
      {action}
    </div>
  )
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-grid w-full rounded-2xl bg-fill p-1 sm:w-auto" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(([v, text]) => (
        <button
          type="button"
          key={v}
          onClick={() => onChange(v)}
          className={`flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-[14px] font-semibold transition sm:px-4 ${value === v ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

// ტელეფონზე ქვემოდან ამოდის, კომპიუტერზე ეკრანის შუაში ჩნდება
export function Sheet({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade sm:items-center sm:p-6" onClick={onClose}>
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-white px-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-3 animate-sheet sm:max-w-md sm:rounded-[28px] sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line sm:hidden" />
        {children}
      </div>
    </div>
  )
}

export function Switch({ on, onChange, label: aria }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={aria} onClick={() => onChange(!on)} className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${on ? 'bg-brand' : 'bg-line'}`}>
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-7' : 'left-1'}`} />
    </button>
  )
}

export const Badge = ({ tone = 'gray', children }) => {
  const tones = {
    gray: 'bg-fill text-muted',
    green: 'bg-brand-soft text-brand-deep',
    amber: 'bg-amber-soft text-amber',
    red: 'bg-coral-soft text-coral',
    violet: 'bg-[#ebe6f7] text-[#4b3a8a]',
    sky: 'bg-sky-soft text-sky',
  }
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ${tones[tone]}`}>{children}</span>
}

export function Empty({ icon, title, text, action }) {
  return (
    <div className={`${card} flex flex-col items-center px-6 py-10 text-center`}>
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand-deep"><Icon name={icon} className="h-7 w-7" /></span>
      <p className="mt-3 text-[17px] font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-[15px] text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export const money = (n) => `${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₾`
