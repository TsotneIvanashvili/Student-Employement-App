// iOS-ის სტილის მცირე საშენი ბლოკები, რომელსაც ყველა ეკრანი იყენებს.

export const btn = 'w-full rounded-2xl bg-brand py-4 text-[17px] font-semibold text-white transition active:scale-[0.98] active:opacity-90 disabled:opacity-50'
export const btn2 = 'w-full rounded-2xl bg-fill py-4 text-[17px] font-semibold text-ink transition active:scale-[0.98] disabled:opacity-50'
export const btnDark = 'w-full rounded-2xl bg-ink py-4 text-[17px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50'
export const input = 'w-full bg-transparent px-4 py-3.5 text-[17px] outline-none placeholder:text-quiet'
export const card = 'rounded-[22px] bg-white'

export const ICONS = {
  calendar: 'M7 3v3m10-3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z',
  jobs: 'M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1M4 7h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm-1 6h18',
  ai: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0',
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
}

export function Icon({ name, className = 'h-6 w-6', strokeWidth = 1.8 }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

// დიდი სათაური, როგორც iOS-ის აპებში
export function Title({ eyebrow, children, action }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 pl-1 pr-12 pt-2">
      <div className="min-w-0">
        {eyebrow && <p className="truncate text-[15px] font-medium text-muted">{eyebrow}</p>}
        <h1 className="text-[32px] font-bold leading-tight tracking-tight">{children}</h1>
      </div>
      {action}
    </div>
  )
}

// ჩაჯგუფებული სია (iOS Settings-ის მსგავსად)
export function Group({ title, footer, children, className = '' }) {
  return (
    <section className={`mb-6 ${className}`}>
      {title && <h2 className="mb-1.5 px-4 text-[13px] font-medium uppercase tracking-wide text-muted">{title}</h2>}
      <div className={`${card} divide-y divide-line overflow-hidden`}>{children}</div>
      {footer && <p className="mt-1.5 px-4 text-[13px] text-muted">{footer}</p>}
    </section>
  )
}

export function Row({ icon, iconBg = 'bg-brand', label, value, onClick, chevron = !!onClick, danger }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-fill">
      {icon && <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white ${iconBg}`}><Icon name={icon} className="h-[18px] w-[18px]" strokeWidth={2} /></span>}
      <span className={`min-w-0 flex-1 text-[17px] ${danger ? 'text-coral' : ''}`}>{label}</span>
      {value !== undefined && <span className="shrink-0 text-[17px] text-muted">{value}</span>}
      {chevron && <Icon name="chevron" className="h-4 w-4 shrink-0 text-quiet" strokeWidth={2.5} />}
    </Tag>
  )
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="grid rounded-[10px] bg-fill p-0.5" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map(([v, label]) => (
        <button
          type="button"
          key={v}
          onClick={() => onChange(v)}
          className={`rounded-[8px] px-2 py-1.5 text-[13px] font-semibold transition ${value === v ? 'bg-white shadow-sm' : 'text-muted'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ქვემოდან ამოსული ფურცელი (bottom sheet). ტელეფონის ჩარჩოს შიგნით ჩანს.
export function Sheet({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40 animate-fade" onClick={onClose}>
      <div className="w-full rounded-t-[28px] bg-bg px-4 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-2 animate-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-quiet/40" />
        {children}
      </div>
    </div>
  )
}

export const Badge = ({ tone = 'gray', children }) => {
  const tones = {
    gray: 'bg-fill text-ink',
    green: 'bg-brand-soft text-brand',
    amber: 'bg-amber-soft text-amber',
    red: 'bg-coral/10 text-coral',
    dark: 'bg-ink text-white',
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}

export const money = (n) => `${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₾`

export function Switch({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${on ? 'bg-brand' : 'bg-fill'}`}>
      <span className={`absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-[2px]'}`} />
    </button>
  )
}
