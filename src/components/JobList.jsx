import { matchJob } from '../lib/match.js'
import JobCard from './JobCard.jsx'
import { Empty, Segmented, Switch, Title, btn, card } from './ui.jsx'

// ფილტრები + ვაკანსიების სია. დალაგება: ჯერ მეტი შესაფერისი ცვლა, მერე ანაზღაურება.
export function filterJobs(jobs, free, { on, kind }) {
  const hasSchedule = free.size > 0
  return jobs
    .map((job) => matchJob(job, free))
    .filter((m) => m.shifts.length > 0)
    .filter((m) => !on || !hasSchedule || m.fitting.length > 0)
    .filter((m) => kind === 'all' || m.job.kind === kind)
    .sort((a, b) => b.fitting.length - a.fitting.length || b.job.pay - a.job.pay)
}

export default function JobList({ jobs, free, onlyFit, setOnlyFit, onGoCalendar }) {
  const hasSchedule = free.size > 0
  const rows = filterJobs(jobs, free, onlyFit)

  return (
    <section>
      <Title eyebrow={`${rows.length} ვაკანსია`}>ვაკანსიები</Title>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented value={onlyFit.kind} onChange={(kind) => setOnlyFit({ ...onlyFit, kind })} options={[['all', 'ყველა'], ['recurring', 'მუდმივი'], ['gig', '⚡ 1–2 დღიანი']]} />
        {hasSchedule && (
          <label className={`${card} flex items-center justify-between gap-3 px-4 py-2`}>
            <span className="text-[15px] font-bold">მხოლოდ ჩემს თავისუფალ დროში</span>
            <Switch on={onlyFit.on} onChange={(on) => setOnlyFit({ ...onlyFit, on })} label="მხოლოდ შესაფერისი" />
          </label>
        )}
      </div>

      {!hasSchedule && (
        <div className="mb-5">
          <Empty
            emoji="🗓️"
            title="ჯერ თავისუფალი დრო მონიშნე"
            text="მერე აქ დარჩება მხოლოდ ის ვაკანსიები, რომლებიც შენს ლექციებს არ ეჯახება."
            action={<button onClick={onGoCalendar} className={`${btn} px-6`}>კალენდარზე გადასვლა</button>}
          />
        </div>
      )}
      {hasSchedule && rows.length === 0 && <Empty emoji="🔍" title="ვერაფერი მოიძებნა" text="შენს თავისუფალ საათებში არცერთი ცვლა არ ჯდება. სცადე მეტი საათის მონიშვნა." />}

      <ul className="grid gap-3 md:grid-cols-2">
        {rows.map(({ job }) => (
          <li key={job.id}><JobCard job={job} free={free} /></li>
        ))}
      </ul>
    </section>
  )
}
