import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { DAYS, FIRST_HOUR, LAST_HOUR, formatShift, todayISO } from '../lib/match.js'
import { openJob } from './JobCard.jsx'

const field = 'w-full rounded-2xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-brand'
const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i)

export function MyJobs({ profile, onNew }) {
  const [jobs, setJobs] = useState(null)

  useEffect(() => {
    supabase
      .from('jobs')
      .select('*, applications(count)')
      .eq('employer_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setJobs(data ?? []))
  }, [profile.id])

  if (!jobs) return <p className="text-muted">იტვირთება…</p>
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">ჩემი ვაკანსიები <span className="font-normal text-quiet">{jobs.length}</span></h2>
      {jobs.length === 0 && (
        <div className="rounded-3xl bg-white p-5 text-sm shadow-sm">
          <p className="text-muted">ჯერ ვაკანსია არ გამოგიქვეყნებია.</p>
          <button onClick={onNew} className="mt-3 rounded-xl bg-brand px-4 py-2 font-semibold text-white">ვაკანსიის დამატება</button>
        </div>
      )}
      <ul className="space-y-3">
        {jobs.map((job) => (
          <li key={job.id}>
            <button onClick={() => openJob(job.id)} className="w-full rounded-3xl bg-white p-4 text-left shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-sm text-muted">{job.kind === 'gig' ? '1–2 დღიანი' : 'მუდმივი'} · {Number(job.pay)} ₾/სთ</p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">
                  {job.applications[0]?.count ?? 0} განაცხადი
                </span>
              </div>
              <p className="mt-2 text-xs text-quiet">{job.shifts.map((s) => formatShift(s)).join(' · ')}</p>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

const emptyShift = (kind) => (kind === 'gig' ? { date: todayISO(), start: 10, end: 16 } : { day: 0, start: 16, end: 20 })

export function NewJob({ profile, onCreated }) {
  const [form, setForm] = useState({ title: '', district: '', pay: '', description: '' })
  const [kind, setKind] = useState('recurring')
  const [shifts, setShifts] = useState([emptyShift('recurring')])
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  function changeKind(k) {
    setKind(k)
    setShifts([emptyShift(k)])
  }
  const setShift = (i, key, value) => setShifts(shifts.map((s, j) => (j === i ? { ...s, [key]: key === 'date' ? value : Number(value) } : s)))

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (shifts.some((s) => s.start >= s.end)) return setError('ცვლის დასასრული დაწყებაზე გვიან უნდა იყოს.')
    if (kind === 'gig' && shifts.some((s) => s.date < todayISO())) return setError('თარიღი წარსულშია.')
    const { error } = await supabase.from('jobs').insert({
      employer_id: profile.id,
      company: profile.company_name || profile.full_name,
      title: form.title,
      district: form.district,
      pay: Number(form.pay),
      description: form.description,
      kind,
      shifts,
    })
    if (error) return setError(error.message)
    onCreated()
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">ახალი ვაკანსია</h2>
      <div className="grid grid-cols-2 gap-2">
        {[['recurring', 'მუდმივი ცვლები'], ['gig', '1–2 დღიანი']].map(([k, label]) => (
          <button type="button" key={k} onClick={() => changeKind(k)} className={`rounded-2xl border-2 py-3 text-sm font-semibold ${kind === k ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted'}`}>
            {label}
          </button>
        ))}
      </div>
      <input required className={field} value={form.title} onChange={set('title')} placeholder="პოზიცია, მაგ. ბარისტა" />
      <div className="grid grid-cols-2 gap-2">
        <input required className={field} value={form.district} onChange={set('district')} placeholder="უბანი" />
        <input required type="number" inputMode="decimal" min="1" step="0.5" className={field} value={form.pay} onChange={set('pay')} placeholder="₾ საათში" />
      </div>
      <textarea className={field} rows={3} value={form.description} onChange={set('description')} placeholder="აღწერა: რას გააკეთებს, რა სჭირდება" />

      <p className="pt-1 text-sm font-semibold">{kind === 'gig' ? 'სამუშაო დღეები' : 'ცვლები კვირაში'}</p>
      {shifts.map((s, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_2rem] items-center gap-2 rounded-2xl bg-bg p-2">
          {kind === 'gig' ? (
            <input type="date" min={todayISO()} required className={`${field} col-span-2 min-w-0`} value={s.date} onChange={(e) => setShift(i, 'date', e.target.value)} />
          ) : (
            <select className={`${field} col-span-2`} value={s.day} onChange={(e) => setShift(i, 'day', e.target.value)}>
              {DAYS.map((d, n) => <option key={d} value={n}>{d}</option>)}
            </select>
          )}
          {shifts.length > 1 ? (
            <button type="button" onClick={() => setShifts(shifts.filter((_, j) => j !== i))} className="text-xl text-quiet" aria-label="წაშლა">×</button>
          ) : <span />}
          <select className={field} value={s.start} onChange={(e) => setShift(i, 'start', e.target.value)} aria-label="დაწყება">
            {HOURS.slice(0, -1).map((h) => <option key={h} value={h}>{h}:00</option>)}
          </select>
          <select className={field} value={s.end} onChange={(e) => setShift(i, 'end', e.target.value)} aria-label="დასრულება">
            {HOURS.slice(1).map((h) => <option key={h} value={h}>{h}:00</option>)}
          </select>
        </div>
      ))}
      <button type="button" onClick={() => setShifts([...shifts, emptyShift(kind)])} className="text-sm font-semibold text-brand">
        + {kind === 'gig' ? 'დღის დამატება' : 'ცვლის დამატება'}
      </button>

      {error && <p className="rounded-2xl bg-coral/10 p-3 text-sm text-coral">{error}</p>}
      <button className="w-full rounded-2xl bg-brand py-4 font-semibold text-white shadow-lg shadow-brand/25">გამოქვეყნება</button>
    </form>
  )
}

export function EmployerProfile({ profile, onSaved }) {
  const [form, setForm] = useState({ full_name: profile.full_name ?? '', company_name: profile.company_name ?? '' })
  const [note, setNote] = useState('')

  async function save(e) {
    e.preventDefault()
    const { error } = await supabase.from('profiles').update(form).eq('id', profile.id)
    setNote(error ? error.message : 'შენახულია ✓')
    if (!error) onSaved(form)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="space-y-3 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">კომპანიის პროფილი</h2>
        <input className={field} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="კომპანია" />
        <input className={field} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="საკონტაქტო პირი" />
        {note && <p className="text-sm text-mint">{note}</p>}
        <button className="w-full rounded-2xl bg-brand py-3.5 font-semibold text-white">შენახვა</button>
      </form>
      <button onClick={() => supabase.auth.signOut()} className="w-full rounded-2xl py-3 text-sm text-quiet">გასვლა</button>
    </div>
  )
}
