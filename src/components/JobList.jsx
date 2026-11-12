import { matchJob } from '../lib/match.js'
import JobCard from './JobCard.jsx'
import { Segmented, Switch, Title, card } from './ui.jsx'

export default function JobList({ jobs, free, onlyFit, setOnlyFit, onGoCalendar }) {
  const hasSchedule = free.size > 0
  const rows = jobs
    .map((job) => matchJob(job, free))
    .filter((m) => m.shifts.length > 0)
    .filter((m) => !onlyFit.on || !hasSchedule || m.fitting.length > 0)
    .filter((m) => onlyFit.kind === 'all' || m.job.kind === onlyFit.kind)
    .sort((a, b) => b.fitting.length - a.fitting.length || b.job.pay - a.job.pay)

  return (
    <section>
      <Title eyebrow={`${rows.length} შედეგი`}>ვაკანსიები</Title>
      <div className="mb-4 space-y-2.5">
        <Segmented value={onlyFit.kind} onChange={(kind) => setOnlyFit({ ...onlyFit, kind })} options={[['all', 'ყველა'], ['recurring', 'მუდმივი'], ['gig', '⚡ 1–2 დღიანი']]} />
        {hasSchedule && (
          <div className={`${card} flex items-center justify-between gap-3 px-4 py-2.5`}>
            <span className="text-[16px]">მხოლოდ ჩემს თავისუფალ დროში</span>
            <Switch on={onlyFit.on} onChange={(on) => setOnlyFit({ ...onlyFit, on })} label="მხოლოდ შესაფერისი" />
          </div>
        )}
      </div>

      {!hasSchedule && (
        <div className={`${card} mb-4 p-4`}>
          <p className="text-[15px]">ჯერ თავისუფალი საათები მონიშნე და აქ მხოლოდ შენთვის შესაფერისი ვაკანსიები დარჩება.</p>
          <button onClick={onGoCalendar} className="mt-3 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">კალენდარის შევსება</button>
        </div>
      )}
      {hasSchedule && rows.length === 0 && (
        <p className={`${card} p-4 text-[15px] text-muted`}>შენს თავისუფალ საათებში ჯერ არცერთი ცვლა არ ჯდება.</p>
      )}

      <ul className="space-y-2.5">
        {rows.map(({ job }) => (
          <li key={job.id}><JobCard job={job} free={free} /></li>
        ))}
      </ul>
    </section>
  )
}
