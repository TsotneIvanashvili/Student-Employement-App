import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatShift, matchJob } from '../lib/match.js'

const STATUS = { sent: 'გაგზავნილია', accepted: 'მიღებულია', rejected: 'უარყოფილია' }
const STATUS_STYLE = { sent: 'bg-brand-soft text-brand', accepted: 'bg-mint-soft text-mint', rejected: 'bg-coral/10 text-coral' }

export default function JobDetail({ id, profile, free, onBack, onShowOnCalendar, onGoProfile }) {
  const [job, setJob] = useState(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    supabase.from('jobs').select('*').eq('id', id).maybeSingle().then(({ data }) => (data ? setJob(data) : setMissing(true)))
  }, [id])

  if (missing) return <Screen onBack={onBack}><p className="text-muted">ვაკანსია ვერ მოიძებნა.</p></Screen>
  if (!job) return <Screen onBack={onBack}><p className="text-muted">იტვირთება…</p></Screen>

  const isOwner = job.employer_id === profile.id
  const m = free ? matchJob(job, free) : null

  return (
    <Screen onBack={onBack}>
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
          <span className="rounded-full bg-bg px-2.5 py-1">{job.kind === 'gig' ? '1–2 დღიანი სამუშაო' : 'მუდმივი ცვლები'}</span>
          {!job.is_open && <span className="rounded-full bg-coral/10 px-2.5 py-1 text-coral">დახურულია</span>}
        </div>
        <h1 className="mt-3 text-2xl font-bold">{job.title}</h1>
        <p className="text-muted">{job.company} · {job.district}</p>
        <p className="mt-3 text-3xl font-bold text-brand">{Number(job.pay)} ₾<span className="text-base font-medium text-muted">/სთ</span></p>
        {job.description && <p className="mt-4 whitespace-pre-wrap leading-relaxed">{job.description}</p>}
      </div>

      <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold">ცვლები</h2>
        <ul className="space-y-2 text-sm">
          {job.shifts.map((s, i) => {
            const fits = m?.fitting.includes(s)
            return (
              <li key={i} className="flex justify-between gap-3">
                <span>{formatShift(s)}</span>
                {m && <span className={fits ? 'font-semibold text-mint' : 'font-semibold text-coral'}>{fits ? 'ერგება' : 'არ ჯდება'}</span>}
              </li>
            )
          })}
        </ul>
        {m && (
          <button onClick={() => onShowOnCalendar(job.id)} className="mt-4 w-full rounded-2xl bg-bg py-3 text-sm font-semibold">
            კალენდარზე ნახვა
          </button>
        )}
      </div>

      {profile.role === 'student' && <Apply job={job} profile={profile} onGoProfile={onGoProfile} />}
      {isOwner && <Applicants job={job} />}
    </Screen>
  )
}

function Screen({ onBack, children }) {
  return (
    <div className="px-4 pb-28">
      <button onClick={onBack} className="mb-3 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm">← უკან</button>
      {children}
    </div>
  )
}

function Apply({ job, profile, onGoProfile }) {
  const [application, setApplication] = useState(undefined)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const hasCv = Boolean(profile.cv_experience || profile.cv_skills || profile.cv_path)

  useEffect(() => {
    supabase.from('applications').select('*').eq('job_id', job.id).eq('student_id', profile.id).maybeSingle().then(({ data }) => setApplication(data))
  }, [job.id, profile.id])

  async function send() {
    setError('')
    const { data, error } = await supabase.from('applications').insert({ job_id: job.id, student_id: profile.id, message }).select().single()
    if (error) return setError(error.message)
    setApplication(data)
    setOpen(false)
  }

  if (application === undefined) return null
  if (application) {
    return (
      <div className="mt-4 rounded-3xl bg-white p-5 text-center shadow-sm">
        <p className="text-sm text-muted">შენი განაცხადი</p>
        <span className={`mt-2 inline-block rounded-full px-4 py-1.5 font-semibold ${STATUS_STYLE[application.status]}`}>{STATUS[application.status]}</span>
      </div>
    )
  }
  if (!job.is_open) return null

  return (
    <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
      {!open ? (
        <button onClick={() => setOpen(true)} className="w-full rounded-2xl bg-brand py-4 font-semibold text-white shadow-lg shadow-brand/25">
          სივის გაგზავნა
        </button>
      ) : !hasCv ? (
        <div className="text-sm">
          <p>ჯერ პროფილში სივი შეავსე: გამოცდილება, უნარები ან PDF ფაილი.</p>
          <button onClick={onGoProfile} className="mt-3 w-full rounded-2xl bg-brand py-3 font-semibold text-white">სივის შევსება</button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted">დამსაქმებელი ნახავს შენს პროფილს და სივს{profile.cv_path ? ' (PDF-იც)' : ''}.</p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="მოკლე წერილი (არასავალდებულო)"
            className="w-full rounded-2xl border border-line px-4 py-3 text-base outline-none focus:border-brand"
          />
          {error && <p className="text-sm text-coral">{error}</p>}
          <button onClick={send} className="w-full rounded-2xl bg-brand py-4 font-semibold text-white">გაგზავნა</button>
        </div>
      )}
    </div>
  )
}

function Applicants({ job }) {
  const [rows, setRows] = useState(null)

  useEffect(() => {
    supabase
      .from('applications')
      .select('*, profiles(full_name, university, year, cv_experience, cv_skills, cv_languages, cv_path)')
      .eq('job_id', job.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setRows(data ?? []))
  }, [job.id])

  async function setStatus(id, status) {
    const { error } = await supabase.from('applications').update({ status }).eq('id', id)
    if (!error) setRows(rows.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  async function openPdf(path) {
    const { data } = await supabase.storage.from('cvs').createSignedUrl(path, 600)
    if (data) window.open(data.signedUrl, '_blank')
  }

  if (!rows) return null
  return (
    <div className="mt-4">
      <h2 className="mb-3 px-1 text-lg font-bold">განაცხადები <span className="font-normal text-quiet">{rows.length}</span></h2>
      {rows.length === 0 && <p className="rounded-3xl bg-white p-4 text-sm text-muted shadow-sm">ჯერ განაცხადი არ შემოსულა.</p>}
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{r.profiles.full_name}</p>
                <p className="text-sm text-muted">{r.profiles.university}{r.profiles.year ? `, ${r.profiles.year} კურსი` : ''}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>{STATUS[r.status]}</span>
            </div>
            {r.message && <p className="mt-3 rounded-2xl bg-bg p-3 text-sm">„{r.message}“</p>}
            <dl className="mt-3 space-y-1 text-sm">
              {r.profiles.cv_experience && <Line label="გამოცდილება" value={r.profiles.cv_experience} />}
              {r.profiles.cv_skills && <Line label="უნარები" value={r.profiles.cv_skills} />}
              {r.profiles.cv_languages && <Line label="ენები" value={r.profiles.cv_languages} />}
            </dl>
            {r.profiles.cv_path && (
              <button onClick={() => openPdf(r.profiles.cv_path)} className="mt-3 text-sm font-semibold text-brand">სივის PDF ↗</button>
            )}
            {r.status === 'sent' && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => setStatus(r.id, 'rejected')} className="rounded-xl bg-bg py-2.5 text-sm font-semibold">უარყოფა</button>
                <button onClick={() => setStatus(r.id, 'accepted')} className="rounded-xl bg-mint py-2.5 text-sm font-semibold text-white">მიღება</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

const Line = ({ label, value }) => (
  <div>
    <dt className="inline font-semibold">{label}: </dt>
    <dd className="inline whitespace-pre-wrap text-muted">{value}</dd>
  </div>
)
