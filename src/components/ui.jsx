// საერთო საშენი ბლოკები: ფერადი, „სქელი“ ღილაკები და ბარათები.

const press = 'transition active:translate-y-[3px] active:shadow-none disabled:opacity-50 disabled:active:translate-y-0'
export const btn = `w-full rounded-2xl bg-brand py-3.5 text-[16px] font-extrabold text-white shadow-[0_4px_0_var(--color-brand-dark)] ${press}`
export const btnMint = `w-full rounded-2xl bg-mint py-3.5 text-[16px] font-extrabold text-white shadow-[0_4px_0_var(--color-mint-dark)] ${press}`
export const btn2 = `w-full rounded-2xl border-2 border-line bg-white py-3 text-[16px] font-extrabold text-ink shadow-[0_3px_0_var(--color-line)] ${press}`
export const btnDark = `w-full rounded-2xl bg-ink py-3.5 text-[16px] font-extrabold text-white shadow-[0_4px_0_#000] ${press}`
export const chip = `rounded-full border-2 border-line bg-white px-3.5 py-1.5 text-[14px] font-bold text-ink shadow-[0_2px_0_var(--color-line)] ${press}`
export const card = 'rounded-3xl border-2 border-line bg-white'
export const input = 'w-full rounded-2xl border-2 border-line bg-white px-4 py-3 text-[16px] outline-none transition placeholder:text-quiet focus:border-brand'
export const label = 'mb-1.5 block text-[14px] font-bold text-muted'

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
        {eyebrow && <p className="text-[15px] font-bold text-muted">{eyebrow}</p>}
        <h1 className="text-[28px] font-black leading-tight tracking-tight lg:text-[34px]">{children}</h1>
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
          className={`whitespace-nowrap rounded-xl px-3 py-2 text-[14px] font-extrabold transition ${value === v ? 'bg-white text-brand shadow-[0_2px_0_var(--color-line)]' : 'text-muted hover:text-ink'}`}
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 animate-fade sm:items-center sm:p-6" onClick={onClose}>
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[32px] bg-bg px-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-3 animate-sheet sm:max-w-md sm:rounded-[32px] sm:pt-5" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line sm:hidden" />
        {children}
      </div>
    </div>
  )
}

export function Switch({ on, onChange, label: aria }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={aria} onClick={() => onChange(!on)} className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${on ? 'bg-mint' : 'bg-line'}`}>
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-7' : 'left-1'}`} />
    </button>
  )
}

export const Badge = ({ tone = 'gray', children }) => {
  const tones = {
    gray: 'bg-fill text-muted',
    green: 'bg-mint-soft text-mint-dark',
    amber: 'bg-amber-soft text-amber',
    red: 'bg-coral-soft text-coral',
    violet: 'bg-brand-soft text-brand',
    sky: 'bg-sky-soft text-sky',
  }
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-extrabold ${tones[tone]}`}>{children}</span>
}

export function Empty({ emoji, title, text, action }) {
  return (
    <div className={`${card} flex flex-col items-center px-6 py-8 text-center`}>
      <p className="text-[40px] leading-none">{emoji}</p>
      <p className="mt-3 text-[18px] font-extrabold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-[15px] text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export const money = (n) => `${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₾`
