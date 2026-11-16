import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { dayOf } from '../lib/match.js'
import { clashOf, fitInfo, fmtMin } from '../lib/schedule.js'
import { CATEGORIES, catName, dayShort, money, monthShort, payText, payUnit, tr, useLang } from '../lib/i18n.js'
import { useRatings } from '../lib/ratings.js'
import { ApplicantCard, STATUS_TONE, statusText } from './Applicants.jsx'
import { useUnread } from './Chat.jsx'
import { Avatar, Badge, Empty, Icon, Sheet, Stars, Switch, Title, btn, btn2, card, chip, input, tap } from './ui.jsx'

export const openJob = (id) => (window.location.hash = `#job/${id}`)

const hh = (h) => `${String(h).padStart(2, '0')}:00`
// „შაბ · 10:00–16:00“ ან „22 ნოე, შაბ · 10:00–16:00“
export function fmtShift(s) {
  const time = `${hh(s.start)}–${hh(s.end)}`
  if (!s.date) return `${dayShort(s.day)} · ${time}`
  const [, m, d] = s.date.split('-').map(Number)
  return `${d} ${monthShort(m - 1)}, ${dayShort(dayOf(s))} · ${time}`
}

// ცვლების მორგების ნიშანი: „2/2 ცვლა ერგება“ / „თავისუფალი გრაფიკი“
export function FitBadge({ fit }) {
  if (!fit) return null
  if (fit.flexible) return <Badge tone="sky">{tr('თავისუფალი გრაფიკი', 'Flexible hours')}</Badge>
  const n = fit.fitting.length
  const m = fit.shifts.length
  const tone = fit.full ? 'green' : n ? 'amber' : 'red'
  return <Badge tone={tone}>{n}/{m} {tr('ცვლა ერგება', m === 1 ? 'shift fits' : 'shifts fit')}</Badge>
}

// „3 საათის წინ“ / „2 დღის წინ“
function ago(iso) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso)) / 60000))
  if (m < 60) return tr(`${m} წუთის წინ`, `${m} min ago`)
  const h = Math.round(m / 60)
  if (h < 24) return tr(`${h} საათის წინ`, h === 1 ? '1 hour ago' : `${h} hours ago`)
  const d = Math.round(h / 24)
  return tr(`${d} დღის წინ`, d === 1 ? 'yesterday' : `${d} days ago`)
}

// ვაკანსიის მწკრივი სიაში (Upwork-ის მსგავსად): მშობელი <ul> ხაზებით ყოფს
export function JobCard({ job, busy, rating }) {
  useLang()
  const fit = busy ? fitInfo(job, busy) : null
  const shifts = fit?.shifts ?? job.shifts
  return (
    <button onClick={() => openJob(job.id)} className="group block w-full px-4 py-4 text-left transition-colors hover:bg-bg sm:px-5">
      <span className="block truncate text-[12px] text-muted">{job.company}{job.created_at && ` · ${ago(job.created_at)}`}</span>
      <span className="mt-0.5 block text-[17px] font-bold leading-snug group-hover:underline">{job.title}</span>
      <span className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] text-muted">
        <span className="font-semibold text-ink tabular-nums">{money(job.pay)}{payUnit(job.pay_unit)}</span>
        {rating && <Stars value={rating.avg} count={rating.count} />}
        <span className="flex items-center gap-1"><Icon name={job.remote ? 'globe' : 'pin'} className="h-4 w-4" />{job.remote ? tr('დისტანციური', 'Remote') : job.district}</span>
        {shifts.length > 0 && <span className="flex items-center gap-1"><Icon name="clock" className="h-4 w-4" />{fmtShift(shifts[0])}{shifts.length > 1 && ` +${shifts.length - 1}`}</span>}
      </span>
      <span className="mt-2.5 flex flex-wrap gap-1.5">
        <FitBadge fit={fit} />
        <span className="rounded-full bg-fill px-2.5 py-1 text-[12px] font-medium text-ink">{catName(job.category)}</span>
      </span>
    </button>
  )
}

// ვაკანსიების სია ერთ თეთრ ბლოკში, მწკრივებს შორის ხაზით
export const listBox = `${card} divide-y divide-line overflow-hidden`

// სია: ძებნა, სფეროები, „მხოლოდ ჩემს კალენდარს მორგებული“
export function JobList({ jobs, busy, filters, setFilters, onGoCalendar }) {
  useLang()
  const rating = useRatings(jobs.map((j) => j.employer_id))
  const hasSchedule = busy.some((e) => e.kind === 'lesson')
  const q = filters.query.trim().toLowerCase()
  const rows = useMemo(
    () =>
      jobs
        .map((job) => ({ job, fit: fitInfo(job, busy) }))
        .filter(({ fit }) => !fit.expired)
        .filter(({ job }) => filters.cat === 'all' || job.category === filters.cat)
        .filter(({ job }) => !q || `${job.title} ${job.company} ${job.district}`.toLowerCase().includes(q))
        .filter(({ fit }) => !filters.onlyFit || fit.full)
        .sort((a, b) => Number(b.fit.full) - Number(a.fit.full) || b.fit.fitting.length - a.fit.fitting.length),
    [jobs, busy, filters.cat, filters.onlyFit, q],
  )
  const set = (k) => (v) => setFilters({ ...filters, [k]: v })

  return (
    <section>
      <Title>{tr('ვაკანსიები', 'Jobs')}</Title>
      <div className="space-y-3">
        <label className="flex items-center gap-2.5 rounded-2xl bg-white px-3.5 shadow-[inset_0_0_0_1px_var(--color-field)] focus-within:shadow-[inset_0_0_0_1.5px_var(--color-brand-deep)]">
          <Icon name="search" className="h-[18px] w-[18px] shrink-0 text-muted" />
          <input value={filters.query} onChange={(e) => set('query')(e.target.value)} placeholder={tr('ძებნა: ბარისტა, დიზაინი…', 'Search: barista, design…')} className="min-w-0 flex-1 bg-transparent py-3.5 text-[16px] outline-none placeholder:text-quiet" />
        </label>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {['all', ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => set('cat')(c)} className={`${chip} shrink-0 ${filters.cat === c ? 'bg-ink text-white' : 'bg-line text-ink hover:bg-field'}`}>
              {c === 'all' ? tr('ყველა', 'All') : catName(c)}
            </button>
          ))}
        </div>
        <label className={`${card} flex cursor-pointer items-center gap-3 px-3.5 py-3`}>
          <Icon name="calendar" className="h-[22px] w-[22px] shrink-0 text-brand-deep" />
          <span className="flex-1 text-[14px] font-semibold">{tr('მხოლოდ ჩემს კალენდარს მორგებული', 'Only jobs that fit my calendar')}</span>
          <Switch on={filters.onlyFit} onChange={set('onlyFit')} label={tr('მხოლოდ მორგებული', 'Only fitting jobs')} />
        </label>
        <p className="px-1 text-[13px] text-muted">{rows.length} {tr('ვაკანსია', rows.length === 1 ? 'job' : 'jobs')}</p>
      </div>

      {!hasSchedule && filters.onlyFit && (
        <div className="mt-3 flex items-center gap-3 rounded-[20px] bg-brand-soft px-4 py-3.5 text-ink">
          <Icon name="calendar" className="h-5 w-5 shrink-0 text-brand-deep" />
          <p className="flex-1 text-[14px]">{tr('კალენდარი ჯერ ცარიელია, ამიტომ ყველა ვაკანსია გერგება.', 'Your calendar is empty, so every job fits.')}</p>
          <button onClick={onGoCalendar} className="shrink-0 text-[13px] font-semibold text-brand-deep">{tr('შევსება', 'Fill in')}</button>
        </div>
      )}

      <div className="mt-3">
        {rows.length === 0 ? (
          <Empty title={tr('ამ ფილტრით ვაკანსია არ მოიძებნა', 'No jobs match these filters')} text={tr('გამორთე კალენდრის ფილტრი ან შეცვალე სფერო.', 'Turn off the calendar filter or change the field.')} />
        ) : (
          <ul className={listBox}>
            {rows.map(({ job }) => <li key={job.id}><JobCard job={job} busy={busy} rating={rating(job.employer_id)} /></li>)}
          </ul>
        )}
      </div>
    </section>
  )
}

const APP_FIELDS = '*, profiles(full_name, cv_experience, cv_skills, cv_languages, cv_path, avatar_url, skills, field)'

// ვაკანსიის გვერდი. ტელეფონზე მარჯვნიდან შემოსრიალდება და ქვედა მენიუს ფარავს.
export function JobDetail({ id, profile, busy, onBack, onGoProfile, onChanged }) {
  useLang()
  const [job, setJob] = useState(null)
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    supabase.from('jobs').select('*').eq('id', id).maybeSingle().then(({ data }) => (data ? setJob(data) : setMissing(true)))
  }, [id])
  const rating = useRatings([job?.employer_id])

  const back = (
    <button onClick={onBack} aria-label={tr('უკან', 'Back')} className={`grid h-11 w-11 place-items-center rounded-full bg-white shadow-[0_1px_2px_rgba(21,24,30,.1)] ${tap}`}>
      <Icon name="back" className="h-5 w-5" strokeWidth={2.5} />
    </button>
  )
  const isSeeker = profile.role === 'student'
  const isOwner = job && job.employer_id === profile.id
  const fit = job && isSeeker ? fitInfo(job, busy) : null
  const others = busy?.filter((e) => e.job_id !== id) ?? []

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-bg animate-push lg:static lg:z-auto lg:overflow-visible lg:animate-none">
      <div className="mx-auto max-w-3xl space-y-3.5 px-4 pb-36 pt-[max(env(safe-area-inset-top),14px)] lg:px-0 lg:pb-10 lg:pt-0">
        {back}
        {missing && <p className="px-1 text-muted">{tr('ვაკანსია ვერ მოიძებნა.', 'This job could not be found.')}</p>}
        {!job && !missing && <p className="px-1 text-muted">{tr('იტვირთება…', 'Loading…')}</p>}
        {job && (
          <>
            <div className="flex items-center gap-3.5 px-1">
              <Avatar name={job.company} size={56} radius={18} />
              <div className="min-w-0">
                <h1 className="text-[22px] font-bold leading-tight tracking-[-0.02em] [text-wrap:balance]">{job.title}</h1>
                <p className="mt-0.5 text-[13px] text-muted">
                  {job.company} · {job.remote ? tr('დისტანციური', 'Remote') : job.district}
                  {rating(job.employer_id) && <> · ★ {rating(job.employer_id).avg.toFixed(1)}</>}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 px-1">
              <span className="rounded-full bg-ink px-3 py-1.5 text-[14px] font-bold tabular-nums text-white">{payText(job)}</span>
              <Badge tone="gray">{catName(job.category)}</Badge>
              {fit && <FitBadge fit={fit} />}
              {!job.is_open && <Badge tone="red">{tr('დახურულია', 'Closed')}</Badge>}
            </div>

            {job.shifts.length > 0 && (
              <section className={`${card} px-4 py-1.5`}>
                <h2 className="pb-1 pt-3 font-semibold">{tr('ცვლები', 'Shifts')}</h2>
                {job.shifts.map((s, i) => {
                  const c = isSeeker ? clashOf(s, others) : null
                  const past = s.date && fit && !fit.shifts.includes(s)
                  return (
                    <div key={i} className="flex items-center gap-3 border-t border-fill py-3">
                      {isSeeker && !past && (
                        <span className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full text-[13px] font-bold ${c ? 'bg-coral-soft text-[#b42323]' : 'bg-mint-soft text-mint-dark'}`}>
                          <Icon name={c ? 'x' : 'check'} className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`text-[14px] font-semibold tabular-nums ${past ? 'text-quiet line-through' : ''}`}>{fmtShift(s)}</p>
                        {isSeeker && !past && (
                          <p className={`text-[12px] ${c ? 'text-[#b42323]' : 'text-mint-dark'}`}>
                            {c ? `${tr('ემთხვევა:', 'Clashes with:')} ${c.title} ${fmtMin(c.start_min)}–${fmtMin(c.end_min)}` : tr('ამ დროს თავისუფალი ხარ', "You're free at this time")}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </section>
            )}

            {job.description && (
              <section className={`${card} p-4`}>
                <h2 className="mb-1.5 font-semibold">{tr('აღწერა', 'About the job')}</h2>
                <p className="whitespace-pre-wrap text-[14px] text-muted [text-wrap:pretty]">{job.description}</p>
              </section>
            )}

            <p className="flex gap-3 rounded-[20px] bg-brand-soft px-4 py-3.5 text-[13px] text-ink">
              <Icon name="users" className="h-5 w-5 shrink-0 text-brand-deep" />
              <span className="[text-wrap:pretty]">
                {tr('დამსაქმებელი აყვანისას თანხას დეპოზიტად დებს, ასე რომ, ანაზღაურება დაცულია. გეხდება ნამუშევრის დადასტურების შემდეგ (საათობრივზე ყოველთვიურად), 10%-იანი საკომისიოს გამოკლებით. ჯერ სადემონსტრაციო რეჟიმია.', 'The employer puts the pay on deposit when hiring, so your pay is secured. You are paid once the work is confirmed (hourly: every month), minus a 10% fee. Demo mode for now.')}
              </span>
            </p>

            {isOwner && <OwnerControls job={job} setJob={setJob} />}
            {isOwner && <JobApplicants job={job} />}
          </>
        )}
      </div>
      {job && isSeeker && (
        <div className="glass fixed inset-x-0 bottom-0 z-10 px-4 pb-[max(env(safe-area-inset-bottom),22px)] pt-3.5 lg:static lg:mx-auto lg:max-w-3xl lg:bg-transparent lg:p-0 lg:[backdrop-filter:none]">
          <Apply job={job} profile={profile} onGoProfile={onGoProfile} onChanged={onChanged} />
        </div>
      )}
    </div>
  )
}

function OwnerControls({ job, setJob }) {
  async function toggle(open) {
    const { data, error } = await supabase.from('jobs').update({ is_open: open }).eq('id', job.id).select().single()
    if (!error) setJob(data)
  }
  return (
    <label className={`${card} flex items-center justify-between gap-3 px-4 py-3.5`}>
      <span>
        <span className="block text-[15px] font-semibold">{job.is_open ? tr('ვაკანსია ღიაა', 'Job is open') : tr('ვაკანსია დახურულია', 'Job is closed')}</span>
        <span className="text-[13px] text-muted">{job.is_open ? tr('მაძიებლები ხედავენ და აგზავნიან განაცხადს', 'Job seekers can see it and apply') : tr('ახალი განაცხადები აღარ შემოვა', 'No new applications will come in')}</span>
      </span>
      <Switch on={job.is_open} onChange={toggle} label={tr('ვაკანსიის გახსნა ან დახურვა', 'Open or close the job')} />
    </label>
  )
}

function JobApplicants({ job }) {
  const unread = useUnread(job.employer_id)
  const [rows, setRows] = useState(null)
  const load = () => supabase.from('applications').select(APP_FIELDS).eq('job_id', job.id).order('created_at', { ascending: false }).then(({ data }) => setRows(data ?? []))
  useEffect(() => {
    load()
  }, [job.id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!rows) return null
  return (
    <section className="pt-2">
      <h2 className="mb-2.5 px-1 text-[18px] font-bold">{tr('განმცხადებლები', 'Applicants')} <span className="text-quiet">{rows.length}</span></h2>
      {rows.length === 0 ? (
        <p className={`${card} p-5 text-center text-[14px] text-muted`}>{tr('განმცხადებლები ჯერ არ არის', 'No applicants yet')}</p>
      ) : (
        <ul className={listBox}>{rows.map((r) => <ApplicantCard key={r.id} app={r} job={job} onChanged={load} unread={unread[r.id]} />)}</ul>
      )}
    </section>
  )
}

function Apply({ job, profile, onGoProfile, onChanged }) {
  const [application, setApplication] = useState(undefined)
  const [sheet, setSheet] = useState(false)
  const [message, setMessage] = useState('')
  const [phone, setPhone] = useState(() => {
    try {
      return localStorage.getItem('sj_phone') ?? ''
    } catch {
      return ''
    }
  })
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const hasCv = Boolean(profile.cv_experience || profile.cv_skills || profile.cv_path)

  useEffect(() => {
    supabase.from('applications').select('*').eq('job_id', job.id).eq('student_id', profile.id).maybeSingle().then(({ data }) => setApplication(data))
  }, [job.id, profile.id])

  async function send(e) {
    e.preventDefault()
    setError('')
    setSending(true)
    const { data, error } = await supabase.from('applications').insert({ job_id: job.id, student_id: profile.id, message: message.trim(), phone: phone.trim() }).select().single()
    setSending(false)
    if (error) return setError(tr('განაცხადი ვერ გაიგზავნა. სცადე თავიდან.', 'The application could not be sent. Try again.'))
    try {
      localStorage.setItem('sj_phone', phone.trim())
    } catch {}
    setApplication(data)
    setSheet(false)
    onChanged?.()
  }

  if (application === undefined) return <div className="h-[54px]" />
  if (application) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-card">
        <span className="text-[14px] text-muted">
          {application.status === 'accepted' ? tr('აგიყვანეს. ცვლები შენს კალენდარშია.', "You're hired. The shifts are in your calendar.") : tr('შენი განაცხადი', 'Your application')}
        </span>
        <Badge tone={STATUS_TONE[application.status]}>{statusText(application.status, 'seeker')}</Badge>
      </div>
    )
  }
  if (!job.is_open) return <p className={`${btn2} text-center text-muted`}>{tr('ვაკანსია დახურულია', 'This job is closed')}</p>
  return (
    <>
      <button onClick={() => setSheet(true)} className={btn}>{tr('განაცხადის გაგზავნა', 'Apply')}</button>
      {sheet && (
        <Sheet onClose={() => setSheet(false)}>
          {!hasCv ? (
            <div className="text-center">
              <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-[18px] bg-brand-soft text-brand-deep"><Icon name="doc" className="h-7 w-7" /></span>
              <h2 className="text-[20px] font-bold">{tr('ჯერ სივი შეავსე', 'Fill in your CV first')}</h2>
              <p className="mt-1 text-[15px] text-muted">{tr('ერთხელ შეავსებ და ყველა ვაკანსიაზე გამოიყენება.', 'You fill it in once and it is used for every job.')}</p>
              <button onClick={onGoProfile} className={`${btn} mt-5`}>{tr('სივის შევსება', 'Fill in my CV')}</button>
            </div>
          ) : (
            <form onSubmit={send} className="space-y-3.5">
              <div>
                <h2 className="text-[20px] font-bold">{job.title}</h2>
                <p className="text-[14px] text-muted">{tr(`${job.company} ნახავს შენს სახელს, სივს და ტელეფონს.`, `${job.company} will see your name, CV and phone number.`)}</p>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-muted">{tr('ტელეფონი, რომ დამსაქმებელი დაგიკავშირდეს', 'Phone, so the employer can reach you')}</span>
                <input required type="tel" inputMode="tel" autoComplete="tel" pattern="[0-9+ \(\)\-]{6,20}" title="555 12 34 56" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="555 12 34 56" className={input} />
              </label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={1000} placeholder={tr('მოკლე წერილი (არასავალდებულო)', 'Short note (optional)')} className={`${input} resize-none`} />
              {error && <p className="text-[14px] font-medium text-coral">{error}</p>}
              <button disabled={sending} className={btn}>{sending ? tr('იგზავნება…', 'Sending…') : tr('გაგზავნა', 'Send')}</button>
            </form>
          )}
        </Sheet>
      )}
    </>
  )
}
