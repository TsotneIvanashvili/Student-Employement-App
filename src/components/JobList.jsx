import { matchJob } from '../lib/match.js'
import JobCard from './JobCard.jsx'

export default function JobList({ jobs, free, onlyFit, setOnlyFit, onGoCalendar }) {
  const hasSchedule = free.size > 0
  const [kind, setKind] = [onlyFit.kind, (k) => setOnlyFit({ ...onlyFit, kind: k })]
  const rows = jobs
    .map((job) => matchJob(job, free))
    .filter((m) => m.shifts.length > 0)
    .filter((m) => !onlyFit.on || !hasSchedule || m.fitting.length > 0)
    .filter((m) => kind === 'all' || m.job.kind === kind)
    .sort((a, b) => b.fitting.length - a.fitting.length || b.job.pay - a.job.pay)

  const chip = (active) => `rounded-full px-3 py-1.5 text-sm font-medium ${active ? 'bg-ink text-white' : 'bg-white text-muted'}`

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">ვაკანსიები <span className="font-normal text-quiet">{rows.length}</span></h2>
        <button onClick={() => setOnlyFit({ ...onlyFit, on: !onlyFit.on })} className={chip(onlyFit.on)}>მხოლოდ შესაფერისი</button>
      </div>
      <div className="mb-3 flex gap-2">
        {[['all', 'ყველა'], ['recurring', 'მუდმივი'], ['gig', '1–2 დღიანი']].map(([k, label]) => (
          <button key={k} onClick={() => setKind(k)} className={chip(kind === k)}>{label}</button>
        ))}
      </div>

      {!hasSchedule && (
        <div className="mb-3 rounded-3xl bg-brand-soft p-4 text-sm">
          <p>ჯერ თავისუფალი საათები მონიშნე და აქ მხოლოდ შენთვის შესაფერისი ვაკანსიები დარჩება.</p>
          <button onClick={onGoCalendar} className="mt-3 rounded-xl bg-brand px-4 py-2 font-semibold text-white">კალენდარის შევსება</button>
        </div>
      )}
      {hasSchedule && rows.length === 0 && (
        <p className="rounded-3xl bg-white p-4 text-sm text-muted">შენს თავისუფალ საათებში ჯერ არცერთი ცვლა არ ჯდება.</p>
      )}

      <ul className="space-y-3">
        {rows.map(({ job }) => (
          <li key={job.id}><JobCard job={job} free={free} /></li>
        ))}
      </ul>
    </section>
  )
}
