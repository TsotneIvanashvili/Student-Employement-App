import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { todayISO } from '../lib/match.js'
import { addDays, jobEvents } from '../lib/schedule.js'
import { CATEGORIES, catName, dayShort, payText, payUnit, tr, useLang } from '../lib/i18n.js'
import BigCalendar from './BigCalendar.jsx'
import { Legend } from './Schedule.jsx'
import { fmtShift, listBox, openJob } from './Jobs.jsx'
import { ApplicantCard } from './Applicants.jsx'
import { Badge, Empty, Icon, RoundAdd, Segmented, Stepper, Title, btn, card, chip, input, label, tap } from './ui.jsx'

const APP_FIELDS = '*, profiles(full_name, cv_experience, cv_skills, cv_languages, cv_path), jobs!inner(*)'

// ყველა განაცხადი ერთ ადგილას, ყველა ვაკანსიიდან
export function Inbox({ profile, onNew }) {
  useLang()
  const [rows, setRows] = useState(null)
  const [filter, setFilter] = useState('sent')
  const load = () =>
    supabase
      .from('applications')
      .select(APP_FIELDS)
      .eq('jobs.employer_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRows(data ?? [])
        return data ?? []
      })
  useEffect(() => {
    // ახალი განაცხადი თუ არ არის, პირდაპირ ყველას ვაჩვენებთ
    load().then((data) => !data.some((x) => x.status === 'sent') && setFilter('all'))
  }, [profile.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const title = <Title eyebrow={profile.company_name}>{tr('განაცხადები', 'Applications')}</Title>
  if (!rows) return title
  const count = (...s) => rows.filter((r) => s.includes(r.status)).length
  const shown = filter === 'all' ? rows : rows.filter((r) => (filter === 'accepted' ? ['accepted', 'done'] : [filter]).includes(r.status))

  return (
    <section className="mx-auto max-w-3xl">
      {title}
      <div className="mb-3.5">
        <Segmented value={filter} onChange={setFilter} options={[['sent', `${tr('ახალი', 'New')} (${count('sent')})`], ['accepted', `${tr('აყვანილი', 'Hired')} (${count('accepted', 'done')})`], ['all', tr('ყველა', 'All')]]} />
      </div>
      {shown.length === 0 &&
        (rows.length === 0 ? (
          <Empty icon="inbox" title={tr('ჯერ განაცხადი არ შემოსულა', 'No applications yet')} text={tr('დაამატე ვაკანსია და ის ხალხი, ვისაც შენი ცვლის დროს სცალია, განაცხადს გამოგიგზავნის.', 'Post a job and people who are free during your shifts will apply.')} action={<button onClick={onNew} className="rounded-2xl bg-brand px-6 py-3.5 font-semibold text-on-brand">{tr('ვაკანსიის დამატება', 'Post a job')}</button>} />
        ) : (
          <Empty title={tr('აქ ცარიელია', 'Nothing here')} text={tr('ამ ფილტრით განაცხადი არ არის.', 'No applications with this filter.')} />
        ))}
      <ul className={listBox}>{shown.map((r) => <ApplicantCard key={r.id} app={r} job={r.jobs} showJob onChanged={load} />)}</ul>
    </section>
  )
}

// დამსაქმებლის კალენდარი: ცვლები თარიღებზე და ვინ მუშაობს თითოეულში
export function EmployerSchedule({ profile }) {
  useLang()
  const [jobs, setJobs] = useState([])
  useEffect(() => {
    supabase.from('jobs').select('*, applications(status, profiles(full_name))').eq('employer_id', profile.id).eq('is_open', true).then(({ data }) => setJobs(data ?? []))
  }, [profile.id])

  const events = jobs.flatMap((job) => {
    const hired = job.applications.filter((a) => a.status === 'accepted').map((a) => a.profiles.full_name)
    return jobEvents(job, { tone: hired.length ? 'job' : 'open', subtitle: hired.length ? hired.join(', ') : tr('ჯერ არავინ', 'Nobody yet') })
  })

  return (
    <div>
      <Title eyebrow={profile.company_name}>{tr('ცვლების კალენდარი', 'Shift calendar')}</Title>
      <BigCalendar events={events} onEvent={(e) => openJob(e.job_id)} />
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-[12px] text-muted">
        <Legend tone="job" text={tr('თანამშრომელი აყვანილია', 'Someone is hired')} />
        <Legend tone="open" text={tr('ჯერ არავინ', 'Nobody yet')} />
      </div>
    </div>
  )
}

// ჩემი ვაკანსიები
export function MyJobs({ profile, onNew }) {
  useLang()
  const [jobs, setJobs] = useState(null)
  useEffect(() => {
    supabase.from('jobs').select('*, applications(status)').eq('employer_id', profile.id).order('created_at', { ascending: false }).then(({ data }) => setJobs(data ?? []))
  }, [profile.id])

  return (
    <section className="mx-auto max-w-3xl">
      <Title eyebrow={profile.company_name} action={<RoundAdd label={tr('ახალი ვაკანსია', 'New job post')} onClick={onNew} />}>
        {tr('ჩემი ვაკანსიები', 'My job posts')}
      </Title>
      {jobs?.length === 0 && <Empty icon="briefcase" title={tr('ჯერ ვაკანსია არ გაქვს', "You haven't posted a job yet")} text={tr('პირველი ვაკანსიის დამატებას ერთი წუთი სჭირდება.', 'Posting your first job takes a minute.')} action={<button onClick={onNew} className="rounded-2xl bg-brand px-6 py-3.5 font-semibold text-on-brand">{tr('ვაკანსიის დამატება', 'Post a job')}</button>} />}
      <ul data-tour="myjobs" className={jobs?.length ? listBox : ''}>
        {jobs?.map((job) => {
          const fresh = job.applications.filter((a) => a.status === 'sent').length
          return (
            <li key={job.id}>
              <button onClick={() => openJob(job.id)} className={`flex w-full flex-col gap-1 px-4 py-4 text-left transition-colors hover:bg-bg sm:px-5 ${job.is_open ? '' : 'opacity-60'}`}>
                <span className="flex w-full items-baseline justify-between gap-2.5">
                  <span className="truncate text-[17px] font-bold">{job.title}</span>
                  <span className="shrink-0 font-semibold tabular-nums">{payText(job)}</span>
                </span>
                <span className="text-[13px] text-muted">{job.shifts.length ? job.shifts.map(fmtShift).join(' · ') : tr('თავისუფალი გრაფიკი', 'Flexible hours')}</span>
                <span className="mt-1.5 flex flex-wrap gap-1.5">
                  {fresh > 0 ? <Badge tone="violet">{fresh} {tr('ახალი', 'new')}</Badge> : <Badge>{job.applications.length} {tr('განმცხადებელი', job.applications.length === 1 ? 'applicant' : 'applicants')}</Badge>}
                  <Badge>{catName(job.category)}</Badge>
                  {!job.is_open && <Badge tone="red">{tr('დახურული', 'Closed')}</Badge>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const PAY_STEP = { hour: 1, day: 10, fixed: 10 }

// ახალი ვაკანსია: სახელი, სფერო, ანაზღაურება, განრიგი (კვირის დღეები / ერთი თარიღი / თავისუფალი გრაფიკი)
export function NewJob({ profile, onCreated, onCancel }) {
  useLang()
  const [f, setF] = useState({
    title: '', category: 'service', district: '', remote: false, description: '',
    pay: 12, unit: 'hour', when: 'weekly', days: [], date: addDays(todayISO(), 1), start: 17, end: 21,
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }))
  const setTime = (k, dv) => () =>
    setF((x) => {
      const o = { ...x, [k]: clamp(x[k] + dv, k === 'start' ? 0 : 1, k === 'start' ? 23 : 24) }
      if (o.end <= o.start) k === 'start' ? (o.end = o.start + 1) : (o.start = o.end - 1)
      return o
    })
  const toggleDay = (d) => setF((x) => ({ ...x, days: x.days.includes(d) ? x.days.filter((y) => y !== d) : [...x.days, d].sort() }))

  const shifts =
    f.when === 'weekly' ? f.days.map((day) => ({ day, start: f.start, end: f.end }))
    : f.when === 'date' ? [{ date: f.date, start: f.start, end: f.end }]
    : []
  const ready = f.title.trim().length >= 2 && (f.remote || f.district.trim()) && (f.when !== 'weekly' || f.days.length) && (f.when !== 'date' || f.date >= todayISO())

  async function publish(e) {
    e.preventDefault()
    if (!ready) return
    setBusy(true)
    const { error } = await supabase.from('jobs').insert({
      employer_id: profile.id,
      company: profile.company_name || profile.full_name,
      title: f.title.trim(),
      category: f.category,
      district: f.remote ? tr('დისტანციური', 'Remote') : f.district.trim(),
      remote: f.remote,
      description: f.description.trim(),
      pay: f.pay,
      pay_unit: f.unit,
      kind: f.when === 'weekly' ? 'recurring' : f.when === 'date' ? 'gig' : 'flexible',
      shifts,
    })
    setBusy(false)
    if (error) return setError(tr('ვაკანსია ვერ გამოქვეყნდა. სცადე თავიდან.', 'The job could not be posted. Try again.'))
    onCreated()
  }

  return (
    <form onSubmit={publish} className="mx-auto max-w-2xl space-y-3.5">
      <Title eyebrow={profile.company_name} action={<button type="button" onClick={onCancel} aria-label={tr('დახურვა', 'Close')} className={`grid h-11 w-11 place-items-center rounded-full bg-white shadow-[0_1px_2px_rgba(21,24,30,.1)] ${tap}`}><Icon name="x" className="h-5 w-5" strokeWidth={2.5} /></button>}>
        {tr('ახალი ვაკანსია', 'New job post')}
      </Title>

      <section className={`${card} space-y-3.5 p-4`}>
        <input required minLength={2} maxLength={80} className={input} value={f.title} onChange={(e) => set('title')(e.target.value)} placeholder={tr('ვაკანსიის სახელი, მაგ. საღამოს ბარისტა', 'Job title, e.g. Evening barista')} aria-label={tr('ვაკანსიის სახელი', 'Job title')} />
        <div>
          <span className={label}>{tr('სფერო', 'Field')}</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" onClick={() => set('category')(c)} aria-pressed={f.category === c} className={`${chip} ${f.category === c ? 'bg-ink text-white' : 'bg-fill text-ink'}`}>{catName(c)}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="block">
            <span className={label}>{tr('უბანი ან მისამართი', 'Area or address')}</span>
            <input disabled={f.remote} maxLength={80} className={`${input} disabled:bg-bg disabled:text-quiet`} value={f.remote ? '' : f.district} onChange={(e) => set('district')(e.target.value)} placeholder={tr('მაგ. ვაკე', 'e.g. Vake')} />
          </label>
          <button type="button" onClick={() => set('remote')(!f.remote)} aria-pressed={f.remote} className={`${chip} py-3.5 ${f.remote ? 'bg-brand-soft text-brand-deep ring-1 ring-inset ring-brand-deep' : 'bg-fill text-ink'}`}>
            {tr('დისტანციური', 'Remote')}
          </button>
        </div>
      </section>

      <section className={`${card} space-y-3.5 p-4`}>
        <h2 className="font-semibold">{tr('ანაზღაურება', 'Pay')}</h2>
        <Segmented size="sm" value={f.unit} onChange={(u) => setF((x) => ({ ...x, unit: u, pay: u === 'hour' ? 12 : u === 'day' ? 90 : 300 }))} options={[['hour', tr('საათში', 'Per hour')], ['day', tr('დღეში', 'Per day')], ['fixed', tr('ფიქსირებული', 'Fixed')]]} />
        <Stepper label={`₾ ${payUnit(f.unit)}`} value={`${f.pay} ₾`} onDown={() => set('pay')(clamp(f.pay - PAY_STEP[f.unit], 1, 10000))} onUp={() => set('pay')(clamp(f.pay + PAY_STEP[f.unit], 1, 10000))} />
      </section>

      <section className={`${card} space-y-3.5 p-4`}>
        <h2 className="font-semibold">{tr('როდის', 'When')}</h2>
        <Segmented size="sm" value={f.when} onChange={set('when')} options={[['weekly', tr('ყოველ კვირა', 'Every week')], ['date', tr('ერთ დღეს', 'One day')], ['flexible', tr('თავისუფალი', 'Flexible')]]} />
        {f.when === 'weekly' && (
          <div className="grid grid-cols-7 gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <button key={d} type="button" onClick={() => toggleDay(d)} aria-pressed={f.days.includes(d)} className={`rounded-xl py-3 text-[12px] font-semibold ${tap} ${f.days.includes(d) ? 'bg-ink text-white' : 'bg-fill text-ink'}`}>{dayShort(d)}</button>
            ))}
          </div>
        )}
        {f.when === 'date' && <input type="date" min={todayISO()} className={input} value={f.date} onChange={(e) => set('date')(e.target.value)} aria-label={tr('თარიღი', 'Date')} />}
        {f.when !== 'flexible' ? (
          <div className="grid grid-cols-2 gap-2.5">
            <Stepper label={tr('დან', 'From')} value={`${f.start}:00`} onDown={setTime('start', -1)} onUp={setTime('start', 1)} />
            <Stepper label={tr('მდე', 'To')} value={`${f.end}:00`} onDown={setTime('end', -1)} onUp={setTime('end', 1)} />
          </div>
        ) : (
          <p className="text-[13px] text-muted">{tr('ფიქსირებული საათები არ აქვს, მაგ. დისტანციური ან ვადიანი დავალება. ყველა მაძიებელი დაინახავს.', 'No fixed hours, e.g. remote work or a task with a deadline. Every job seeker will see it.')}</p>
        )}
      </section>

      <section className={`${card} p-4`}>
        <label className="block">
          <span className={label}>{tr('აღწერა', 'Description')}</span>
          <textarea rows={4} maxLength={1500} className={`${input} resize-none`} value={f.description} onChange={(e) => set('description')(e.target.value)} placeholder={tr('რას გააკეთებს თანამშრომელი, რა გამოცდილებაა სასურველი', 'What the person will do and what experience helps')} />
        </label>
      </section>

      <p className="flex gap-3 rounded-[20px] bg-brand-soft px-4 py-3.5 text-[13px] text-ink">
        <Icon name="users" className="h-5 w-5 shrink-0 text-brand-deep" />
        {tr('ანაზღაურებაზე თანამშრომელთან პირდაპირ თანხმდები. ShiftMate თანხას არ იღებს და არ ინახავს.', 'You agree pay directly with the worker. ShiftMate does not take or hold any money.')}
      </p>
      {error && <p className="text-[14px] font-medium text-coral">{error}</p>}
      <button disabled={!ready || busy} className={btn}>{busy ? tr('ქვეყნდება…', 'Posting…') : tr('გამოქვეყნება', 'Publish')}</button>
    </form>
  )
}
