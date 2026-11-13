import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatShift } from '../lib/match.js'
import { matchJob } from '../lib/schedule.js'
import { CompanyLogo } from './JobCard.jsx'
import { ApplicantCard, STATUS, STATUS_TONE, jobHours, one } from './Applicants.jsx'
import { Badge, Icon, Sheet, Switch, btn, btn2, card, input, money } from './ui.jsx'

export { STATUS }
const APP_FIELDS = '*, payments(*), profiles(full_name, university, year, cv_experience, cv_skills, cv_languages, cv_path)'

export default function JobDetail({ id, profile, busy, onBack, onGoProfile }) {
  const [job, setJob] = useState(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    supabase.from('jobs').select('*').eq('id', id).maybeSingle().then(({ data }) => (data ? setJob(data) : setMissing(true)))
  }, [id])

  const back = (
    <button onClick={onBack} className="mb-4 flex items-center gap-1 text-[16px] font-semibold text-brand hover:underline">
      <Icon name="back" className="h-5 w-5" strokeWidth={2.8} />უკან
    </button>
  )
  if (missing) return <div>{back}<p className="font-medium text-muted">ვაკანსია ვერ მოიძებნა.</p></div>
  if (!job) return <div>{back}<p className="font-medium text-muted">იტვირთება…</p></div>

  const isOwner = job.employer_id === profile.id
  const m = busy ? matchJob(job, busy) : null
  const hours = jobHours(job)

  return (
    <div className="mx-auto max-w-5xl">
      {back}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
        <header className={`${card} flex items-start gap-4 p-5 lg:col-start-1`}>
          <CompanyLogo name={job.company} size="h-16 w-16 text-xl" />
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold leading-tight lg:text-[30px]">{job.title}</h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[15px] font-semibold text-muted">
              <span>{job.company}</span>
              <span className="flex items-center gap-1"><Icon name="pin" className="h-4 w-4" />{job.district}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone={job.kind === 'gig' ? 'amber' : 'sky'}>{job.kind === 'gig' ? '⚡ 1–2 დღიანი' : '🔁 მუდმივი ცვლები'}</Badge>
              {!job.is_open && <Badge tone="red">დახურულია</Badge>}
              {m && m.shifts.length > 0 && (
                <Badge tone={m.fitting.length ? 'green' : 'red'}>{m.fitting.length}/{m.shifts.length} ცვლა ერგება შენს დროს</Badge>
              )}
            </div>
          </div>
        </header>

        <aside className={`${card} space-y-4 p-5 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1`}>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="ანაზღაურება" value={`${Number(job.pay)} ₾/სთ`} />
            <Stat label={job.kind === 'gig' ? 'სულ' : 'კვირაში'} value={`${hours} სთ`} />
          </div>
          <div className="rounded-2xl bg-brand-soft px-4 py-3">
            <p className="text-[13px] font-medium text-brand">{job.kind === 'gig' ? 'მთლიანი ანაზღაურება' : 'კვირაში გამოიმუშავებ'}</p>
            <p className="text-[26px] font-semibold text-brand">{money(hours * job.pay)}</p>
          </div>
          {profile.role === 'student' && <Apply job={job} profile={profile} onGoProfile={onGoProfile} />}
          {isOwner && <OwnerControls job={job} setJob={setJob} />}
        </aside>

        <div className="space-y-4 lg:col-start-1">
          <section className={`${card} p-5`}>
            <h2 className="mb-3 text-[18px] font-semibold">ცვლები</h2>
            <ul className="space-y-2">
              {job.shifts.map((s, i) => {
                const fits = m?.fitting.includes(s)
                return (
                  <li key={i} className="flex items-center justify-between gap-3 rounded-2xl bg-bg px-4 py-3 text-[15px] font-medium">
                    <span className="flex items-center gap-2"><Icon name="clock" className="h-5 w-5 text-quiet" />{formatShift(s)}</span>
                    {m && (fits ? <Badge tone="green">ერგება</Badge> : <Badge tone="red">არ ჯდება</Badge>)}
                  </li>
                )
              })}
            </ul>
          </section>
          {job.description && (
            <section className={`${card} p-5`}>
              <h2 className="mb-2 text-[18px] font-semibold">აღწერა</h2>
              <p className="whitespace-pre-wrap text-[16px] leading-relaxed">{job.description}</p>
            </section>
          )}
          {isOwner && <JobApplicants job={job} />}
        </div>
      </div>
    </div>
  )
}

const Stat = ({ label, value }) => (
  <div className="rounded-2xl bg-bg px-3 py-2.5">
    <p className="text-[12px] font-medium text-muted">{label}</p>
    <p className="text-[18px] font-semibold">{value}</p>
  </div>
)

function OwnerControls({ job, setJob }) {
  async function toggle(open) {
    const { data, error } = await supabase.from('jobs').update({ is_open: open }).eq('id', job.id).select().single()
    if (!error) setJob(data)
  }
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl bg-bg px-4 py-3">
      <span>
        <span className="block text-[15px] font-semibold">{job.is_open ? 'ვაკანსია ღიაა' : 'ვაკანსია დახურულია'}</span>
        <span className="text-[13px] font-semibold text-muted">{job.is_open ? 'სტუდენტები ხედავენ და აგზავნიან სივს' : 'ახალი განაცხადები აღარ შემოვა'}</span>
      </span>
      <Switch on={job.is_open} onChange={toggle} label="ვაკანსიის გახსნა/დახურვა" />
    </label>
  )
}

function JobApplicants({ job }) {
  const [rows, setRows] = useState(null)
  const load = () =>
    supabase.from('applications').select(APP_FIELDS).eq('job_id', job.id).order('created_at', { ascending: false }).then(({ data }) => setRows(data ?? []))
  useEffect(() => {
    load()
  }, [job.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!rows) return null
  return (
    <section>
      <h2 className="mb-3 text-[22px] font-semibold">განაცხადები <span className="text-quiet">{rows.length}</span></h2>
      {rows.length === 0 && <p className={`${card} p-5 font-medium text-muted`}>ჯერ განაცხადი არ შემოსულა.</p>}
      <ul className="space-y-3">
        {rows.map((r) => <ApplicantCard key={r.id} app={r} job={job} onChanged={load} />)}
      </ul>
    </section>
  )
}

function Apply({ job, profile, onGoProfile }) {
  const [application, setApplication] = useState(undefined)
  const [sheet, setSheet] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const hasCv = Boolean(profile.cv_experience || profile.cv_skills || profile.cv_path)

  useEffect(() => {
    supabase.from('applications').select('*, payments(*)').eq('job_id', job.id).eq('student_id', profile.id).maybeSingle().then(({ data }) => setApplication(data))
  }, [job.id, profile.id])

  async function send() {
    setError('')
    const { data, error } = await supabase.from('applications').insert({ job_id: job.id, student_id: profile.id, message }).select().single()
    if (error) return setError(error.message)
    setApplication(data)
    setSheet(false)
  }

  if (application === undefined) return null
  if (application) {
    const pay = one(application.payments)
    return (
      <div className="rounded-2xl bg-bg p-4 text-center">
        <p className="text-[13px] font-medium text-muted">შენი განაცხადი</p>
        <div className="mt-1.5"><Badge tone={STATUS_TONE[application.status]}>{application.status === 'sent' ? 'გაგზავნილია' : STATUS[application.status]}</Badge></div>
        {pay && (pay.status === 'released' ? (
          <p className="mt-3 text-[15px] font-medium">🎉 ჩაგერიცხა <span className="text-mint-dark">{money(pay.amount - pay.fee)}</span></p>
        ) : (
          <p className="mt-3 text-[15px] font-semibold">🔒 {money(pay.amount)} დაბლოკილია სამუშაოს დასრულებამდე. შენ მიიღებ {money(pay.amount - pay.fee)} (−10%).</p>
        ))}
      </div>
    )
  }
  if (!job.is_open) return <p className="rounded-2xl bg-bg p-4 text-center font-medium text-muted">ვაკანსია დახურულია</p>

  return (
    <>
      <button onClick={() => setSheet(true)} className={btn}>სივის გაგზავნა</button>
      {sheet && (
        <Sheet onClose={() => setSheet(false)}>
          {!hasCv ? (
            <div className="text-center">
              <p className="text-[40px]">📄</p>
              <h2 className="text-[22px] font-semibold">ჯერ სივი შეავსე</h2>
              <p className="mt-1 text-[15px] text-muted">დამსაქმებელს უნდა ჰქონდეს შენი გამოცდილება, უნარები ან PDF ფაილი. ერთხელ შეავსებ და ყველა ვაკანსიაზე გამოიყენება.</p>
              <button onClick={onGoProfile} className={`${btn} mt-5`}>სივის შევსება</button>
            </div>
          ) : (
            <div>
              <h2 className="text-[22px] font-semibold">{job.title}</h2>
              <p className="text-[15px] font-semibold text-muted">{job.company} ნახავს შენს პროფილს და სივს{profile.cv_path ? ' (PDF-იც)' : ''}.</p>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="მოკლე წერილი (არასავალდებულო)" className={`${input} mt-4 resize-none`} />
              {error && <p className="mt-2 text-sm font-medium text-coral">{error}</p>}
              <div className="mt-4 grid grid-cols-[auto_1fr] gap-3">
                <button onClick={() => setSheet(false)} className={`${btn2} px-5`}>გაუქმება</button>
                <button onClick={send} className={btn}>გაგზავნა</button>
              </div>
            </div>
          )}
        </Sheet>
      )}
    </>
  )
}
