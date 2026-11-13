import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { openJob } from './JobCard.jsx'
import { Badge, Icon, Sheet, btn, btn2, btnDark, card, money } from './ui.jsx'

export const STATUS = { sent: 'ახალი', accepted: 'აყვანილია', rejected: 'უარყოფილია' }
export const STATUS_TONE = { sent: 'violet', accepted: 'green', rejected: 'red' }
export const FEE = 0.1
export const jobHours = (job) => job.shifts.reduce((s, x) => s + (x.end - x.start), 0)
export const one = (x) => (Array.isArray(x) ? x[0] : x) ?? null

// ერთი განაცხადი დამსაქმებლისთვის: სივი, წერილი და ქმედებები (უარყოფა, აყვანა + გადახდა, ჩარიცხვა).
export function ApplicantCard({ app, job, showJob = false, onChanged }) {
  const [hiring, setHiring] = useState(false)
  const [releasing, setReleasing] = useState(false)
  const [open, setOpen] = useState(app.status === 'sent')
  const p = app.profiles
  const pay = one(app.payments)

  async function reject() {
    const { error } = await supabase.from('applications').update({ status: 'rejected' }).eq('id', app.id)
    if (!error) onChanged()
  }
  async function openPdf() {
    const { data } = await supabase.storage.from('cvs').createSignedUrl(p.cv_path, 600)
    if (data) window.open(data.signedUrl, '_blank')
  }

  return (
    <li className={`${card} p-4 sm:p-5`}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 text-left">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sky-soft text-[18px] font-semibold text-sky">{p.full_name.slice(0, 1)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold">{p.full_name}</p>
          <p className="truncate text-[14px] font-semibold text-muted">
            {showJob ? job.title : p.cv_skills || 'კანდიდატი'}
          </p>
        </div>
        <Badge tone={STATUS_TONE[app.status]}>{STATUS[app.status]}</Badge>
        <Icon name="chevron" className={`h-5 w-5 shrink-0 text-quiet transition ${open ? 'rotate-90' : ''}`} strokeWidth={2.5} />
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {showJob && (
            <button onClick={() => openJob(job.id)} className="text-[14px] font-medium text-brand hover:underline">
              ვაკანსიის ნახვა →
            </button>
          )}
          {app.message && <p className="rounded-2xl bg-brand-soft p-3 text-[15px]">„{app.message}“</p>}
          <dl className="grid gap-2 sm:grid-cols-3">
            {[['გამოცდილება', p.cv_experience], ['უნარები', p.cv_skills], ['ენები', p.cv_languages]].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-bg p-3">
                <dt className="text-[12px] font-semibold uppercase text-quiet">{k}</dt>
                <dd className="whitespace-pre-wrap text-[15px] font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          {p.cv_path && (
            <button onClick={openPdf} className="flex items-center gap-1.5 text-[15px] font-semibold text-brand"><Icon name="doc" className="h-5 w-5" />სივის PDF</button>
          )}

          {app.status === 'sent' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button onClick={reject} className={btn2}>უარყოფა</button>
              <button onClick={() => setHiring(true)} className={btn}>აყვანა</button>
            </div>
          )}
          {pay && (
            <div className={`rounded-2xl p-3 ${pay.status === 'held' ? 'bg-amber-soft' : 'bg-mint-soft'}`}>
              <div className="flex items-center justify-between text-[15px] font-medium">
                <span>{pay.status === 'held' ? '🔒 დაბლოკილია' : '✅ ჩარიცხულია თანამშრომელზე'}</span>
                <span className="font-semibold">{money(pay.status === 'held' ? pay.amount : pay.amount - pay.fee)}</span>
              </div>
              {pay.status === 'held' && (
                <button onClick={() => setReleasing(true)} className={`${btnDark} mt-3`}>სამუშაო შესრულდა · ჩარიცხვა</button>
              )}
            </div>
          )}
        </div>
      )}
      {hiring && <PaySheet job={job} app={app} onClose={() => setHiring(false)} onDone={() => { setHiring(false); onChanged() }} />}
      {releasing && <ReleaseSheet pay={pay} onClose={() => setReleasing(false)} onDone={() => { setReleasing(false); onChanged() }} />}
    </li>
  )
}

// სატესტო გადახდა: ნამდვილი ბარათი არ გამოიყენება. თანხას სერვერი ითვლის და ბლოკავს.
function PaySheet({ job, app, onClose, onDone }) {
  const [state, setState] = useState('idle') // idle | paying | done
  const [error, setError] = useState('')
  const hours = jobHours(job)
  const amount = hours * job.pay
  const fee = Math.round(amount * FEE * 100) / 100

  async function pay() {
    setState('paying')
    setError('')
    await new Promise((r) => setTimeout(r, 1200))
    const { error } = await supabase.rpc('hire_and_pay', { app_id: app.id })
    if (error) {
      setState('idle')
      return setError(error.message)
    }
    setState('done')
  }

  if (state === 'done') {
    return (
      <Sheet onClose={onDone}>
        <div className="flex flex-col items-center pb-2 pt-4 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-mint text-white animate-pop"><Icon name="check" className="h-11 w-11" strokeWidth={3} /></span>
          <h2 className="mt-4 text-[24px] font-semibold">გადახდილია!</h2>
          <p className="mt-1 text-[15px] text-muted">{money(amount)} დაბლოკილია. {app.profiles.full_name} თანხას სამუშაოს დასრულების შემდეგ მიიღებს.</p>
          <button onClick={onDone} className={`${btn} mt-6`}>მშვენიერია</button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet onClose={state === 'paying' ? undefined : onClose}>
      <h2 className="text-[24px] font-semibold">აყვანა და გადახდა</h2>
      <p className="text-[15px] font-semibold text-muted">{app.profiles.full_name} · {job.title}</p>
      <div className={`${card} mt-4 divide-y divide-line`}>
        <Pair label={`${hours} სთ × ${Number(job.pay)} ₾`} value={money(amount)} strong />
        <Pair label="თანამშრომელი მიიღებს (90%)" value={money(amount - fee)} />
        <Pair label="Shiftmate-ის საკომისიო (10%)" value={money(fee)} muted />
      </div>
      <p className="mt-2 px-1 text-[13px] font-semibold text-muted">
        {job.kind === 'gig' ? 'მთლიანი სამუშაოს ღირებულება.' : '1 კვირის ცვლების ღირებულება.'} თანხა დაბლოკილი რჩება, სანამ სამუშაოს შესრულებას არ დაადასტურებ.
      </p>
      <div className={`${card} mt-4 flex items-center gap-3 p-3`}>
        <span className="grid h-10 w-14 place-items-center rounded-lg bg-ink text-[10px] font-semibold tracking-widest text-white">DEMO</span>
        <div className="flex-1">
          <p className="text-[15px] font-semibold">სატესტო ბარათი •••• 4242</p>
          <p className="text-[12px] font-semibold text-muted">დემო რეჟიმი: ნამდვილი თანხა არ ჩამოიჭრება</p>
        </div>
      </div>
      {error && <p className="mt-2 text-sm font-medium text-coral">{error}</p>}
      <button disabled={state === 'paying'} onClick={pay} className={`${btnDark} mt-5 flex items-center justify-center gap-2`}>
        {state === 'paying' ? <><span className="h-4 w-4 animate-spin rounded-full border border-white/30 border-t-white" />მუშავდება…</> : `გადახდა ${money(amount)}`}
      </button>
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
      <h2 className="text-[24px] font-semibold">სამუშაო შესრულდა?</h2>
      <p className="mt-1 text-[15px] text-muted">დადასტურების შემდეგ დაბლოკილი თანხა თანამშრომელს ჩაერიცხება.</p>
      <div className={`${card} mt-4 divide-y divide-line`}>
        <Pair label="თანამშრომელს ჩაერიცხება" value={money(pay.amount - pay.fee)} strong />
        <Pair label="საკომისიო (10%)" value={money(pay.fee)} muted />
      </div>
      {error && <p className="mt-2 text-sm font-medium text-coral">{error}</p>}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button onClick={onClose} className={btn2}>გაუქმება</button>
        <button disabled={busy} onClick={release} className={btn}>დადასტურება</button>
      </div>
    </Sheet>
  )
}

const Pair = ({ label, value, muted, strong }) => (
  <div className={`flex items-center justify-between gap-3 px-4 py-3 text-[15px] font-medium ${muted ? 'text-muted' : ''}`}>
    <span>{label}</span>
    <span className={strong ? 'text-[17px] font-semibold' : 'font-semibold'}>{value}</span>
  </div>
)
