import { matchJob } from '../lib/match.js'
import { Badge, Icon, card } from './ui.jsx'

export const openJob = (id) => (window.location.hash = `#job/${id}`)

const initials = (name) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
const TINTS = ['bg-brand text-white', 'bg-sky text-white', 'bg-sun text-ink', 'bg-coral text-white', 'bg-mint text-white', 'bg-ink text-white']
const tint = (name) => TINTS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % TINTS.length]

export function CompanyLogo({ name, size = 'h-12 w-12 text-[15px]' }) {
  return <span className={`grid shrink-0 place-items-center rounded-2xl font-black ${size} ${tint(name)}`}>{initials(name)}</span>
}

// ვაკანსიის ბარათი: სიაში და AI-ს რეკომენდაციებში. დაჭერით ვაკანსიის გვერდი იხსნება.
export default function JobCard({ job, free, compact = false }) {
  const m = free ? matchJob(job, free) : null
  return (
    <button
      onClick={() => openJob(job.id)}
      className={`${card} flex w-full items-center gap-3 text-left shadow-[0_3px_0_var(--color-line)] transition hover:border-brand/40 active:translate-y-[3px] active:shadow-none ${compact ? 'p-3' : 'p-4'}`}
    >
      <CompanyLogo name={job.company} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate text-[16px] font-extrabold">{job.title}</h3>
          <span className="shrink-0 text-[16px] font-black text-brand">{Number(job.pay)} ₾<span className="text-[12px] font-bold text-muted">/სთ</span></span>
        </div>
        <p className="truncate text-[14px] font-semibold text-muted">{job.company} · {job.district}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {job.kind === 'gig' && <Badge tone="amber">⚡ 1–2 დღიანი</Badge>}
          {m && m.shifts.length > 0 && (
            <Badge tone={m.fitting.length ? 'green' : 'red'}>
              {m.fitting.length ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} /> : null}
              {m.fitting.length}/{m.shifts.length} ცვლა ერგება
            </Badge>
          )}
        </div>
      </div>
      {!compact && <Icon name="chevron" className="hidden h-5 w-5 shrink-0 text-quiet sm:block" strokeWidth={2.5} />}
    </button>
  )
}
