import { matchJob } from '../lib/match.js'
import { Badge, Icon, card } from './ui.jsx'

export const openJob = (id) => (window.location.hash = `#job/${id}`)

const initials = (name) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
const TINTS = ['bg-[#e3f5eb] text-[#12a05c]', 'bg-[#e6efff] text-[#2f6bff]', 'bg-[#fff1d6] text-[#b86e00]', 'bg-[#f3e8ff] text-[#8b3fd9]', 'bg-[#ffe8e6] text-[#d93a2f]']
const tint = (name) => TINTS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % TINTS.length]

export function CompanyLogo({ name, size = 'h-11 w-11 text-sm' }) {
  return <span className={`grid shrink-0 place-items-center rounded-[13px] font-bold ${size} ${tint(name)}`}>{initials(name)}</span>
}

// ვაკანსიის ბარათი: სიაში და AI-ს რეკომენდაციებში. დაჭერით ვაკანსიის გვერდი იხსნება.
export default function JobCard({ job, free, compact = false }) {
  const m = free ? matchJob(job, free) : null
  return (
    <button onClick={() => openJob(job.id)} className={`${card} flex w-full items-center gap-3 text-left transition active:scale-[0.98] ${compact ? 'p-3' : 'p-3.5'}`}>
      <CompanyLogo name={job.company} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate text-[16px] font-semibold">{job.title}</h3>
          <span className="shrink-0 text-[15px] font-bold">{Number(job.pay)} ₾<span className="text-xs font-medium text-muted">/სთ</span></span>
        </div>
        <p className="truncate text-[13px] text-muted">{job.company} · {job.district}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {job.kind === 'gig' && <Badge tone="amber">⚡ 1–2 დღიანი</Badge>}
          {m && m.shifts.length > 0 && (
            <Badge tone={m.fitting.length ? 'green' : 'red'}>{m.fitting.length}/{m.shifts.length} ცვლა ერგება</Badge>
          )}
        </div>
      </div>
      <Icon name="chevron" className="h-4 w-4 shrink-0 text-quiet" strokeWidth={2.5} />
    </button>
  )
}
