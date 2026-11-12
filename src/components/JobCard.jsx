import { matchJob } from '../lib/match.js'

export const openJob = (id) => (window.location.hash = `#job/${id}`)

// პატარა ბარათი: ვაკანსიების სიაში და AI-ს რეკომენდაციებში. დაჭერით ვაკანსიის გვერდი იხსნება.
export default function JobCard({ job, free, compact = false }) {
  const m = free ? matchJob(job, free) : null
  return (
    <button onClick={() => openJob(job.id)} className={`w-full rounded-3xl bg-white text-left shadow-sm active:scale-[0.99] ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold">{job.title}</h3>
          <p className="truncate text-sm text-muted">{job.company} · {job.district}</p>
        </div>
        <span className="shrink-0 rounded-full bg-bg px-2.5 py-1 text-sm font-bold">{Number(job.pay)} ₾/სთ</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
        {job.kind === 'gig' && <span className="rounded-full bg-brand-soft px-2.5 py-1 text-brand">1–2 დღიანი</span>}
        {m && (
          <span className={`rounded-full px-2.5 py-1 ${m.fitting.length ? 'bg-mint-soft text-mint' : 'bg-coral/10 text-coral'}`}>
            {m.fitting.length}/{m.shifts.length} ცვლა ერგება
          </span>
        )}
      </div>
    </button>
  )
}
