import { matchJob } from '../lib/schedule.js'
import JobCard from './JobCard.jsx'
import { Empty, Segmented, Switch, Title, btn, card } from './ui.jsx'

// ფილტრები + ვაკანსიების სია. დალაგება: ჯერ მეტი შესაფერისი ცვლა, მერე ანაზღაურება.
export function filterJobs(jobs, busy, { on, kind }) {
  return jobs
    .map((job) => matchJob(job, busy))
    .filter((m) => m.shifts.length > 0)
    .filter((m) => !on || m.fitting.length > 0)
    .filter((m) => kind === 'all' || m.job.kind === kind)
    .sort((a, b) => b.fitting.length - a.fitting.length || b.job.pay - a.job.pay)
}

export default function JobList({ jobs, busy, onlyFit, setOnlyFit, onGoCalendar }) {
  const hasSchedule = busy.some((e) => e.kind === 'lesson')
  const rows = filterJobs(jobs, busy, onlyFit)

  return (
    <section>
      <Title eyebrow={`${rows.length} ვაკანსია`}>ვაკანსიები</Title>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented value={onlyFit.kind} onChange={(kind) => setOnlyFit({ ...onlyFit, kind })} options={[['all', 'ყველა'], ['recurring', 'მუდმივი'], ['gig', '⚡ 1–2 დღიანი']]} />
        {(
          <label className={`${card} flex items-center justify-between gap-3 px-4 py-2`}>
            <span className="text-[15px] font-medium">მხოლოდ ჩემს თავისუფალ დროში</span>
            <Switch on={onlyFit.on} onChange={(on) => setOnlyFit({ ...onlyFit, on })} label="მხოლოდ შესაფერისი" />
          </label>
        )}
      </div>

      {!hasSchedule && (
        <div className="mb-5">
          <Empty
            emoji="🗓️"
            title="ჯერ ლექციები ჩაწერე"
            text="განრიგში ჩაწერე, როდის არ გცალია, და აქ დარჩება მხოლოდ ის ვაკანსიები, რომლებიც ლექციებს არ ეჯახება."
            action={<button onClick={onGoCalendar} className={`${btn} px-6`}>განრიგზე გადასვლა</button>}
          />
        </div>
      )}
      {rows.length === 0 && <Empty emoji="🔍" title="ვერაფერი მოიძებნა" text="შენს თავისუფალ დროში არცერთი ცვლა არ ჯდება. გამორთე ფილტრი, რომ ყველა ვაკანსია ნახო." />}

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {rows.map(({ job }) => (
          <li key={job.id}><JobCard job={job} busy={busy} /></li>
        ))}
      </ul>
    </section>
  )
}
