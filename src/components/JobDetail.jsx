import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatShift, matchJob } from '../lib/match.js'
import { CompanyLogo } from './JobCard.jsx'
import { Badge, Group, Icon, Sheet, btn, btn2, btnDark, card, money } from './ui.jsx'

export const STATUS = { sent: 'გაგზავნილია', accepted: 'აყვანილია', rejected: 'უარყოფილია' }
const STATUS_TONE = { sent: 'gray', accepted: 'green', rejected: 'red' }
export const FEE = 0.1
const jobHours = (job) => job.shifts.reduce((s, x) => s + (x.end - x.start), 0)
const one = (x) => (Array.isArray(x) ? x[0] : x) ?? null

export default function JobDetail({ id, profile, free, onBack, onShowOnCalendar, onGoProfile }) {
  const [job, setJob] = useState(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    supabase.from('jobs').select('*').eq('id', id).maybeSingle().then(({ data }) => (data ? setJob(data) : setMissing(true)))
  }, [id])

  const back = (
    <button onClick={onBack} className="-ml-1 mb-2 flex items-center gap-0.5 py-1 text-[17px] text-brand">
      <Icon name="back" className="h-6 w-6" strokeWidth={2.2} />უკან
    </button>
  )
  if (missing) return <div>{back}<p className="px-1 text-muted">ვაკანსია ვერ მოიძებნა.</p></div>
  if (!job) return <div>{back}<p className="px-1 text-muted">იტვირთება…</p></div>

  const isOwner = job.employer_id === profile.id
  const m = free ? matchJob(job, free) : null

  return (
    <div>
      {back}
      <div className="mb-5 flex flex-col items-center px-2 text-center">
        <CompanyLogo name={job.company} size="h-16 w-16 text-xl" />
        <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-tight">{job.title}</h1>
        <p className="text-[15px] text-muted">{job.company} · {job.district}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          <Badge tone={job.kind === 'gig' ? 'amber' : 'gray'}>{job.kind === 'gig' ? '⚡ 1–2 დღიანი' : 'მუდმივი ცვლები'}</Badge>
          {!job.is_open && <Badge tone="red">დახურულია</Badge>}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2.5">
        <Stat label="ანაზღაურება" value={`${Number(job.pay)} ₾/სთ`} />
        <Stat label={job.kind === 'gig' ? 'სულ საათი' : 'საათი კვირაში'} value={`${jobHours(job)} სთ`} />
      </div>

      <Group title="ცვლები">
        {job.shifts.map((s, i) => {
          const fits = m?.fitting.includes(s)
          return (
            <div key={i} className="flex items-center justify-between gap-3 px-4 py-3 text-[16px]">
              <span>{formatShift(s)}</span>
              {m && (fits ? <Badge tone="green">ერგება</Badge> : <Badge tone="red">არ ჯდება</Badge>)}
            </div>
          )
        })}
        {m && (
          <button onClick={() => onShowOnCalendar(job.id)} className="w-full px-4 py-3 text-left text-[16px] text-brand active:bg-fill">
            კალენდარზე ნახვა
          </button>
        )}
      </Group>

      {job.description && (
        <Group title="აღწერა">
          <p className="whitespace-pre-wrap px-4 py-3 text-[16px] leading-relaxed">{job.description}</p>
        </Group>
      )}

      {profile.role === 'student' && <Apply job={job} profile={profile} onGoProfile={onGoProfile} />}
      {isOwner && <Applicants job={job} />}
    </div>
  )
}

const Stat = ({ label, value }) => (
  <div className={`${card} px-4 py-3`}>
    <p className="text-[13px] text-muted">{label}</p>
    <p className="text-[20px] font-bold">{value}</p>
  </div>
)

function Apply({ job, profile, onGoProfile }) {
  const [application, setApplication] = useState(undefined)
  const [sheet, setSheet] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const hasCv = Boolean(profile.cv_experience || profile.cv_skills || profile.cv_path)

  useEffect(() => {
    supabase
      .from('applications')
      .select('*, payments(*)')
      .eq('job_id', job.id)
      .eq('student_id', profile.id)
      .maybeSingle()
      .then(({ data }) => setApplication(data))
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
      <div className={`${card} mb-6 p-5 text-center`}>
        <p className="text-[13px] text-muted">შენი განაცხადი</p>
        <div className="mt-2"><Badge tone={STATUS_TONE[application.status]}>{STATUS[application.status]}</Badge></div>
        {pay && <PayoutNote pay={pay} />}
      </div>
    )
  }
  if (!job.is_open) return null

  return (
    <>
      <div className="sticky bottom-24 z-10 mb-6">
        <button onClick={() => setSheet(true)} className={`${btn} shadow-lg shadow-brand/30`}>სივის გაგზავნა</button>
      </div>
      {sheet && (
        <Sheet onClose={() => setSheet(false)}>
          {!hasCv ? (
            <div className="px-1 pb-2">
              <h2 className="text-[22px] font-bold">ჯერ სივი შეავსე</h2>
              <p className="mt-1 text-[15px] text-muted">დამსაქმებელს უნდა ჰქონდეს შენი გამოცდილება, უნარები ან PDF ფაილი.</p>
              <button onClick={onGoProfile} className={`${btn} mt-5`}>სივის შევსება</button>
            </div>
          ) : (
            <div className="px-1 pb-2">
              <h2 className="text-[22px] font-bold">{job.title}</h2>
              <p className="text-[15px] text-muted">დამსაქმებელი ნახავს შენს პროფილს და სივს{profile.cv_path ? ' (PDF-იც)' : ''}.</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="მოკლე წერილი (არასავალდებულო)"
                className={`${card} mt-4 w-full px-4 py-3 text-[16px] outline-none`}
              />
              {error && <p className="mt-2 text-sm text-coral">{error}</p>}
              <button onClick={send} className={`${btn} mt-4`}>გაგზავნა</button>
            </div>
          )}
        </Sheet>
      )}
    </>
  )
}

function PayoutNote({ pay }) {
  const payout = pay.amount - pay.fee
  return pay.status === 'released' ? (
    <p className="mt-3 text-[15px]">ჩაგერიცხა <b className="text-brand">{money(payout)}</b><span className="block text-xs text-muted">{money(pay.amount)} − 10% საკომისიო ({money(pay.fee)})</span></p>
  ) : (
    <p className="mt-3 text-[15px]">დამსაქმებელმა გადაიხადა. <b>{money(pay.amount)}</b> დაბლოკილია სამუშაოს დასრულებამდე.<span className="block text-xs text-muted">შენ მიიღებ {money(payout)} (−10% საკომისიო)</span></p>
  )
}

function Applicants({ job }) {
  const [rows, setRows] = useState(null)
  const [hiring, setHiring] = useState(null)
  const [releasing, setReleasing] = useState(null)

  const load = () =>
    supabase
      .from('applications')
      .select('*, payments(*), profiles(full_name, university, year, cv_experience, cv_skills, cv_languages, cv_path)')
      .eq('job_id', job.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setRows(data ?? []))
  useEffect(() => {
    load()
  }, [job.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function reject(id) {
    const { error } = await supabase.from('applications').update({ status: 'rejected' }).eq('id', id)
    if (!error) setRows(rows.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)))
  }

  async function openPdf(path) {
    const { data } = await supabase.storage.from('cvs').createSignedUrl(path, 600)
    if (data) window.open(data.signedUrl, '_blank')
  }

  if (!rows) return null
  return (
    <section className="mb-6">
      <h2 className="mb-2 px-1 text-[22px] font-bold">განაცხადები <span className="font-normal text-quiet">{rows.length}</span></h2>
      {rows.length === 0 && <p className={`${card} p-4 text-[15px] text-muted`}>ჯერ განაცხადი არ შემოსულა.</p>}
      <ul className="space-y-2.5">
        {rows.map((r) => {
          const pay = one(r.payments)
          return (
            <li key={r.id} className={`${card} p-4`}>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-fill text-[15px] font-bold">{r.profiles.full_name.slice(0, 1)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold">{r.profiles.full_name}</p>
                  <p className="truncate text-[13px] text-muted">{r.profiles.university}{r.profiles.year ? `, ${r.profiles.year} კურსი` : ''}</p>
                </div>
                <Badge tone={STATUS_TONE[r.status]}>{STATUS[r.status]}</Badge>
              </div>
              {r.message && <p className="mt-3 rounded-2xl bg-bg p-3 text-[15px]">„{r.message}“</p>}
              <dl className="mt-3 space-y-1 text-[15px]">
                {r.profiles.cv_experience && <Line label="გამოცდილება" value={r.profiles.cv_experience} />}
                {r.profiles.cv_skills && <Line label="უნარები" value={r.profiles.cv_skills} />}
                {r.profiles.cv_languages && <Line label="ენები" value={r.profiles.cv_languages} />}
              </dl>
              {r.profiles.cv_path && (
                <button onClick={() => openPdf(r.profiles.cv_path)} className="mt-2 flex items-center gap-1 text-[15px] font-semibold text-brand"><Icon name="doc" className="h-4 w-4" />სივის PDF</button>
              )}
              {r.status === 'sent' && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={() => reject(r.id)} className="rounded-xl bg-fill py-3 text-[15px] font-semibold">უარყოფა</button>
                  <button onClick={() => setHiring(r)} className="rounded-xl bg-brand py-3 text-[15px] font-semibold text-white">აყვანა და გადახდა</button>
                </div>
              )}
              {pay && (
                <div className="mt-4 rounded-2xl bg-bg p-3">
                  <div className="flex items-center justify-between text-[15px]">
                    <span className="text-muted">{pay.status === 'held' ? 'დაბლოკილია' : 'ჩარიცხულია სტუდენტზე'}</span>
                    <b>{money(pay.status === 'held' ? pay.amount : pay.amount - pay.fee)}</b>
                  </div>
                  {pay.status === 'held' && (
                    <button onClick={() => setReleasing(pay)} className={`${btnDark} mt-3 py-3 text-[15px]`}>სამუშაო შესრულდა · ჩარიცხვა</button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {hiring && <PaySheet job={job} application={hiring} onClose={() => setHiring(null)} onDone={() => { setHiring(null); load() }} />}
      {releasing && <ReleaseSheet pay={releasing} onClose={() => setReleasing(null)} onDone={() => { setReleasing(null); load() }} />}
    </section>
  )
}

// სატესტო გადახდა: ნამდვილი ბარათი არ გამოიყენება. თანხას სერვერი ითვლის და ბლოკავს.
function PaySheet({ job, application, onClose, onDone }) {
  const [state, setState] = useState('idle') // idle | paying | done
  const [error, setError] = useState('')
  const hours = jobHours(job)
  const amount = hours * job.pay
  const fee = Math.round(amount * FEE * 100) / 100

  async function pay() {
    setState('paying')
    setError('')
    await new Promise((r) => setTimeout(r, 1200))
    const { error } = await supabase.rpc('hire_and_pay', { app_id: application.id })
    if (error) {
      setState('idle')
      return setError(error.message)
    }
    setState('done')
    setTimeout(onDone, 1300)
  }

  if (state === 'done') {
    return (
      <Sheet onClose={onDone}>
        <div className="flex flex-col items-center px-4 pb-6 pt-4 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-brand text-white"><Icon name="check" className="h-9 w-9" strokeWidth={3} /></span>
          <h2 className="mt-4 text-[22px] font-bold">გადახდილია</h2>
          <p className="mt-1 text-[15px] text-muted">{money(amount)} დაბლოკილია. სტუდენტი თანხას სამუშაოს დასრულების შემდეგ მიიღებს.</p>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet onClose={state === 'paying' ? undefined : onClose}>
      <div className="px-1 pb-2">
        <h2 className="text-[22px] font-bold">აყვანა და გადახდა</h2>
        <p className="text-[15px] text-muted">{application.profiles.full_name} · {job.title}</p>
        <div className={`${card} mt-4 divide-y divide-line`}>
          <Pair label={`${hours} სთ × ${Number(job.pay)} ₾`} value={money(amount)} />
          <Pair label="სტუდენტი მიიღებს (90%)" value={money(amount - fee)} />
          <Pair label="პლატფორმის საკომისიო (10%)" value={money(fee)} muted />
        </div>
        <p className="mt-2 px-1 text-[13px] text-muted">
          {job.kind === 'gig' ? 'მთლიანი სამუშაოს ღირებულება.' : '1 კვირის ცვლების ღირებულება.'} თანხა დაბლოკილი რჩება, სანამ სამუშაოს შესრულებას არ დაადასტურებ.
        </p>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3">
          <span className="grid h-9 w-14 place-items-center rounded-md bg-gradient-to-br from-ink to-[#2b3240] text-[10px] font-bold tracking-widest text-white">DEMO</span>
          <div className="flex-1">
            <p className="text-[15px] font-semibold">სატესტო ბარათი •••• 4242</p>
            <p className="text-xs text-muted">დემო რეჟიმი: ნამდვილი თანხა არ ჩამოიჭრება</p>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-coral">{error}</p>}
        <button disabled={state === 'paying'} onClick={pay} className={`${btnDark} mt-4 flex items-center justify-center gap-2`}>
          {state === 'paying' ? <><Spinner />მუშავდება…</> : `გადახდა ${money(amount)}`}
        </button>
      </div>
    </Sheet>
  )
}

function ReleaseSheet({ pay, onClose, onDone }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function release() {
    setBusy(true)
    const { error } = await supabase.rpc('release_payment', { pay_id: pay.id })
    setBusy(false)
    if (error) return setError(error.message)
    onDone()
  }
  return (
    <Sheet onClose={onClose}>
      <div className="px-1 pb-2">
        <h2 className="text-[22px] font-bold">სამუშაო შესრულდა?</h2>
        <p className="mt-1 text-[15px] text-muted">დადასტურების შემდეგ დაბლოკილი თანხა სტუდენტს ჩაერიცხება.</p>
        <div className={`${card} mt-4 divide-y divide-line`}>
          <Pair label="სტუდენტს ჩაერიცხება" value={money(pay.amount - pay.fee)} />
          <Pair label="საკომისიო (10%)" value={money(pay.fee)} muted />
        </div>
        {error && <p className="mt-2 text-sm text-coral">{error}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onClose} className={btn2}>გაუქმება</button>
          <button disabled={busy} onClick={release} className={btn}>დადასტურება</button>
        </div>
      </div>
    </Sheet>
  )
}

const Pair = ({ label, value, muted }) => (
  <div className={`flex items-center justify-between gap-3 px-4 py-3 text-[16px] ${muted ? 'text-muted' : ''}`}>
    <span>{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
)

const Spinner = () => <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

const Line = ({ label, value }) => (
  <div>
    <dt className="inline font-semibold">{label}: </dt>
    <dd className="inline whitespace-pre-wrap text-muted">{value}</dd>
  </div>
)
