import { matchJob } from '../lib/schedule.js'
import { Badge, Icon, card } from './ui.jsx'

export const openJob = (id) => (window.location.hash = `#job/${id}`)

const initials = (name) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
const TINTS = ['bg-[#d8e8e6] text-[#123b36]', 'bg-[#efe3cd] text-[#4a3208]', 'bg-[#ebe6f7] text-[#33255c]', 'bg-[#e9ebf8] text-[#2c3880]', 'bg-fill text-ink']
const tint = (name) => TINTS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % TINTS.length]

export function CompanyLogo({ name, size = 'h-12 w-12 text-[15px]' }) {
  return <span className={`grid shrink-0 place-items-center rounded-2xl font-semibold ${size} ${tint(name)}`}>{initials(name)}</span>
}

// ვაკანსიის ბარათი: სიაში და AI-ს რეკომენდაციებში. დაჭერით ვაკანსიის გვერდი იხსნება.
export default function JobCard({ job, busy, compact = false }) {
  const m = busy ? matchJob(job, busy) : null
  return (
    <button
      onClick={() => openJob(job.id)}
      className={`${card} flex w-full items-center gap-3 text-left transition hover:border-brand/40 ${compact ? 'p-3' : 'p-4'}`}
    >
      <CompanyLogo name={job.company} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate text-[16px] font-semibold">{job.title}</h3>
          <span className="shrink-0 text-[16px] font-semibold text-ink">{Number(job.pay)} ₾<span className="text-[12px] font-medium text-muted">/სთ</span></span>
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
