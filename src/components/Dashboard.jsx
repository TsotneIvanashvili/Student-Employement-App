import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { todayISO } from '../lib/match.js'
import { DAY_NAMES, MONTH_NAMES, dayNumber, eventsOn, fmtMin, jobEvents, monthIndex, weekdayOf } from '../lib/schedule.js'
import { DOTS } from './BigCalendar.jsx'
import JobCard, { openJob } from './JobCard.jsx'
import { STATUS, STATUS_TONE } from './Applicants.jsx'
import { Badge, Icon, btnDark, card } from './ui.jsx'

// მთავარი გვერდი შესვლის შემდეგ: რა ხდება დღეს და რა არის შემდეგი ნაბიჯი.

export const STATUS_STUDENT = { sent: 'გაგზავნილია', accepted: 'აგიყვანეს', rejected: 'უარი' }
const firstName = (name) => (name || '').trim().split(/\s+/)[0]
const greeting = () => {
  const h = new Date().getHours()
  return h < 5 ? 'გამარჯობა' : h < 12 ? 'დილა მშვიდობისა' : h < 18 ? 'გამარჯობა' : 'საღამო მშვიდობისა'
}
const longDate = (d) => `${DAY_NAMES[weekdayOf(d)]}, ${dayNumber(d)} ${MONTH_NAMES[monthIndex(d)]}`

const Hello = ({ name, sub }) => (
  <div className="mb-5">
    <p className="text-[14px] font-medium text-muted">{sub}</p>
    <h1 className="text-[28px] font-bold leading-tight tracking-tight lg:text-[34px]">{greeting()}, {firstName(name)}</h1>
  </div>
)

// დიდი ფერადი ბლოკი: ერთი მთავარი რიცხვი და ერთი მთავარი ქმედება
function Hero({ tour, big, title, text, action, onAction, icon }) {
  return (
    <section data-tour={tour} className="relative mb-5 overflow-hidden rounded-[28px] bg-brand p-6 text-on-brand sm:p-8">
      <Icon name={icon} className="pointer-events-none absolute -bottom-6 -right-4 h-40 w-40 opacity-10 sm:h-52 sm:w-52" strokeWidth={1.5} />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {big != null && <p className="text-[56px] font-bold leading-none tracking-tight sm:text-[72px]">{big}</p>}
          <p className="mt-1 text-[20px] font-bold leading-snug sm:text-[24px]">{title}</p>
          {text && <p className="mt-1 max-w-md text-[15px] opacity-80">{text}</p>}
        </div>
        <button onClick={onAction} className={`${btnDark} flex shrink-0 items-center justify-center gap-2 px-6 sm:w-auto`}>
          {action}<Icon name="chevron" className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>
    </section>
  )
}

function Panel({ title, action, onAction, children }) {
  return (
    <section className={`${card} p-5`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold">{title}</h2>
        {action && <button onClick={onAction} className="shrink-0 text-[14px] font-semibold text-brand-deep hover:underline">{action}</button>}
      </div>
      {children}
    </section>
  )
}

const Quiet = ({ children }) => <p className="rounded-2xl bg-bg px-4 py-4 text-[15px] text-muted">{children}</p>

// დღევანდელი განრიგის ერთი ხაზი
const TodayRow = ({ e, onClick }) => (
  <li>
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl bg-bg px-4 py-3 text-left hover:bg-fill">
      <i className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOTS[e.tone ?? e.kind] ?? DOTS.lesson}`} />
      <span className="w-[98px] shrink-0 text-[14px] font-semibold tabular-nums">{fmtMin(e.start_min)}–{fmtMin(e.end_min)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold">{e.title}</span>
        {e.subtitle && <span className="block truncate text-[13px] text-muted">{e.subtitle}</span>}
      </span>
    </button>
  </li>
)

// პირველი ნაბიჯები: ქრება, როცა სამივე შესრულებულია
function Checklist({ steps }) {
  if (steps.every((s) => s.done)) return null
  const next = steps.findIndex((s) => !s.done)
  return (
    <Panel title="პირველი ნაბიჯები">
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={s.title}>
            <button onClick={s.go} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left ${i === next ? 'bg-brand-soft' : 'bg-bg hover:bg-fill'}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[14px] font-bold ${s.done ? 'bg-brand text-on-brand' : 'bg-white text-muted ring-1 ring-line'}`}>
                {s.done ? <Icon name="check" className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[15px] font-semibold ${s.done ? 'text-muted line-through' : ''}`}>{s.title}</span>
                {!s.done && <span className="block text-[13px] text-muted">{s.text}</span>}
              </span>
              {!s.done && <Icon name="chevron" className="h-4 w-4 shrink-0 text-quiet" strokeWidth={2.5} />}
            </button>
          </li>
        ))}
      </ol>
    </Panel>
  )
}

export function SeekerHome({ profile, busy, matches, applications, go, openProfile }) {
  const today = todayISO()
  const hasSchedule = busy.some((e) => e.kind === 'lesson')
  const todayList = eventsOn(busy, today)
  const cvDone = Boolean(profile.cv_experience || profile.cv_skills || profile.cv_path)

  return (
    <div>
      <Hello name={profile.full_name} sub={longDate(today)} />
      {hasSchedule ? (
        <Hero
          tour="matches"
          icon="jobs"
          big={matches.length}
          title="ვაკანსია ერგება შენს თავისუფალ დროს"
          text={matches.length ? 'სიაში მხოლოდ ის ცვლებია, რომლებიც შენს განრიგს არ ეჯახება.' : 'შეამოწმე განრიგი: შესაძლოა ზედმეტი დრო გაქვს დაკავებული.'}
          action={matches.length ? 'ვაკანსიების ნახვა' : 'განრიგის ნახვა'}
          onAction={() => go(matches.length ? 'jobs' : 'calendar')}
        />
      ) : (
        <Hero
          tour="matches"
          icon="calendar"
          title="ჯერ ჩაწერე, როდის ხარ დაკავებული"
          text="ერთი წუთი სჭირდება. მერე გაჩვენებ მხოლოდ იმ სამუშაოს, რომელიც შენს თავისუფალ დროში ჯდება."
          action="განრიგის შევსება"
          onAction={() => go('calendar')}
        />
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Checklist
            steps={[
              { done: hasSchedule, title: 'ჩაწერე დაკავებული დრო', text: 'სწავლა, ძირითადი სამსახური ან სხვა საქმე', go: () => go('calendar') },
              { done: cvDone, title: 'შეავსე სივი', text: 'ერთხელ შეავსებ და ყველა ვაკანსიაზე გამოიყენება', go: openProfile },
              { done: applications.length > 0, title: 'გაგზავნე პირველი განაცხადი', text: 'აირჩიე ვაკანსია და დააჭირე გაგზავნას', go: () => go('jobs') },
            ]}
          />
          <Panel title="დღეს" action="მთელი განრიგი" onAction={() => go('calendar')}>
            {todayList.length === 0 ? (
              <Quiet>დღეს არაფერი გაქვს ჩაწერილი. მთელი დღე თავისუფალი ხარ.</Quiet>
            ) : (
              <ul className="space-y-2">
                {todayList.map((e) => <TodayRow key={e.id} e={e} onClick={() => (e.kind === 'work' ? openJob(e.job_id) : go('calendar'))} />)}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="შენთვის შერჩეული" action={matches.length > 3 ? `ყველა (${matches.length})` : null} onAction={() => go('jobs')}>
            {matches.length === 0 ? (
              <Quiet>ამ წუთას შენს თავისუფალ დროში ვაკანსია არ არის.</Quiet>
            ) : (
              <ul className="space-y-2">
                {matches.slice(0, 3).map(({ job }) => <li key={job.id}><JobCard job={job} busy={busy} compact flat /></li>)}
              </ul>
            )}
          </Panel>
          <Panel title="ჩემი განაცხადები">
            {applications.length === 0 ? (
              <Quiet>ჯერ არცერთი არ გაგიგზავნია.</Quiet>
            ) : (
              <ul className="space-y-2">
                {applications.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <button onClick={() => openJob(a.jobs.id)} className="flex w-full items-center gap-3 rounded-2xl bg-bg px-4 py-3 text-left hover:bg-fill">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold">{a.jobs.title}</span>
                        <span className="block truncate text-[13px] text-muted">{a.jobs.company}</span>
                      </span>
                      <Badge tone={STATUS_TONE[a.status]}>{STATUS_STUDENT[a.status]}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}

const Tile = ({ icon, label, value }) => (
  <div className={`${card} flex min-w-0 items-center gap-3 p-4`}>
    <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-deep sm:grid"><Icon name={icon} className="h-5 w-5" /></span>
    <span className="min-w-0">
      <span className="block text-[24px] font-bold leading-none">{value}</span>
      <span className="mt-1 block text-[12px] font-medium leading-tight text-muted sm:text-[13px]">{label}</span>
    </span>
  </div>
)

export function EmployerHome({ profile, go }) {
  const today = todayISO()
  const [jobs, setJobs] = useState(null)
  useEffect(() => {
    supabase
      .from('jobs')
      .select('*, applications(id, status, created_at, profiles(full_name))')
      .eq('employer_id', profile.id)
      .then(({ data }) => setJobs(data ?? []))
  }, [profile.id])

  const hello = <Hello name={profile.full_name} sub={`${profile.company_name || 'დამსაქმებელი'} · ${longDate(today)}`} />
  if (!jobs) return hello

  const open = jobs.filter((j) => j.is_open)
  const apps = jobs.flatMap((j) => j.applications.map((a) => ({ ...a, job: j }))).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  const fresh = apps.filter((a) => a.status === 'sent')
  const hired = apps.filter((a) => a.status === 'accepted')
  const shifts = eventsOn(
    open.flatMap((job) => {
      const names = job.applications.filter((a) => a.status === 'accepted').map((a) => a.profiles.full_name)
      return jobEvents(job, { tone: names.length ? 'work' : 'open', subtitle: names.length ? names.join(', ') : 'ჯერ არავინ' })
    }),
    today,
  )

  return (
    <div>
      {hello}
      {jobs.length === 0 ? (
        <Hero icon="plus" title="დაამატე პირველი ვაკანსია" text="მონიშნე ცვლის საათები და მას დაინახავენ მხოლოდ ისინი, ვისაც ამ დროს ნამდვილად სცალია." action="ვაკანსიის დამატება" onAction={() => go('plus')} />
      ) : fresh.length ? (
        <Hero icon="inbox" big={fresh.length} title="ახალი განაცხადი გელოდება" text="ნახე სივი და ტელეფონი, აიყვანე ან უთხარი უარი." action="განაცხადების ნახვა" onAction={() => go('inbox')} />
      ) : (
        <Hero icon="inbox" title="ახალი განაცხადი ჯერ არ არის" text="რაც მეტი ცვლა გაქვს გამოქვეყნებული, მით მეტი ადამიანი ნახავს." action="ვაკანსიის დამატება" onAction={() => go('plus')} />
      )}

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Tile icon="jobs" label="ღია ვაკანსია" value={open.length} />
        <Tile icon="users" label="აყვანილი" value={hired.length} />
        <Tile icon="inbox" label="სულ განაცხადი" value={apps.length} />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <Panel title="დღევანდელი ცვლები" action="კალენდარი" onAction={() => go('calendar')}>
          {shifts.length === 0 ? <Quiet>დღეს ცვლა არ არის დაგეგმილი.</Quiet> : <ul className="space-y-2">{shifts.map((e) => <TodayRow key={e.id} e={e} onClick={() => openJob(e.job_id)} />)}</ul>}
        </Panel>
        <Panel title="ბოლო განაცხადები" action={apps.length ? 'ყველა' : null} onAction={() => go('inbox')}>
          {apps.length === 0 ? (
            <Quiet>განაცხადები აქ გამოჩნდება.</Quiet>
          ) : (
            <ul className="space-y-2">
              {apps.slice(0, 5).map((a) => (
                <li key={a.id}>
                  <button onClick={() => go('inbox')} className="flex w-full items-center gap-3 rounded-2xl bg-bg px-4 py-3 text-left hover:bg-fill">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-soft text-[15px] font-bold text-sky">{a.profiles.full_name.slice(0, 1)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{a.profiles.full_name}</span>
                      <span className="block truncate text-[13px] text-muted">{a.job.title}</span>
                    </span>
                    <Badge tone={STATUS_TONE[a.status]}>{STATUS[a.status]}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
