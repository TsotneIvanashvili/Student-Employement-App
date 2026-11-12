import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { DAYS, FIRST_HOUR, LAST_HOUR, formatShift, todayISO } from '../lib/match.js'
import { CompanyLogo, openJob } from './JobCard.jsx'
import InstallRow from './InstallRow.jsx'
import { Badge, Group, Icon, Row, Segmented, Title, btn, card, input, money } from './ui.jsx'

const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i)
const select = 'bg-transparent text-[17px] text-muted outline-none'

export function MyJobs({ profile, onNew }) {
  const [jobs, setJobs] = useState(null)

  useEffect(() => {
    supabase
      .from('jobs')
      .select('*, applications(status), payments(amount, status)')
      .eq('employer_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setJobs(data ?? []))
  }, [profile.id])

  if (!jobs) return <Title eyebrow={profile.company_name}>ვაკანსიები</Title>
  const waiting = jobs.reduce((s, j) => s + j.applications.filter((a) => a.status === 'sent').length, 0)
  const held = jobs.reduce((s, j) => s + j.payments.filter((p) => p.status === 'held').reduce((x, p) => x + Number(p.amount), 0), 0)

  return (
    <section>
      <Title eyebrow={profile.company_name}>ვაკანსიები</Title>
      <div className="mb-6 grid grid-cols-3 gap-2">
        <Stat label="აქტიური" value={jobs.filter((j) => j.is_open).length} />
        <Stat label="ახალი განაცხადი" value={waiting} accent={waiting > 0} />
        <Stat label="დაბლოკილი" value={money(held)} />
      </div>

      {jobs.length === 0 && (
        <div className={`${card} p-5 text-center`}>
          <p className="text-[15px] text-muted">ჯერ ვაკანსია არ გამოგიქვეყნებია.</p>
          <button onClick={onNew} className="mt-3 rounded-full bg-brand px-5 py-2.5 text-[15px] font-semibold text-white">ვაკანსიის დამატება</button>
        </div>
      )}
      <ul data-tour="myjobs" className="space-y-2.5">
        {jobs.map((job) => {
          const fresh = job.applications.filter((a) => a.status === 'sent').length
          return (
            <li key={job.id}>
              <button onClick={() => openJob(job.id)} className={`${card} flex w-full items-center gap-3 p-3.5 text-left transition active:scale-[0.98]`}>
                <CompanyLogo name={job.company} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-[16px] font-semibold">{job.title}</h3>
                    {fresh > 0 ? <Badge tone="green">{fresh} ახალი</Badge> : <span className="shrink-0 text-[13px] text-quiet">{job.applications.length} განაცხადი</span>}
                  </div>
                  <p className="truncate text-[13px] text-muted">{job.shifts.map((s) => formatShift(s)).join(' · ')}</p>
                  <div className="mt-1.5 flex gap-1.5">
                    <Badge tone={job.kind === 'gig' ? 'amber' : 'gray'}>{job.kind === 'gig' ? '⚡ 1–2 დღიანი' : 'მუდმივი'}</Badge>
                    <Badge>{Number(job.pay)} ₾/სთ</Badge>
                  </div>
                </div>
                <Icon name="chevron" className="h-4 w-4 shrink-0 text-quiet" strokeWidth={2.5} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const Stat = ({ label, value, accent }) => (
  <div className={`${card} px-3 py-3`}>
    <p className={`text-[20px] font-bold leading-tight ${accent ? 'text-brand' : ''}`}>{value}</p>
    <p className="text-[12px] leading-tight text-muted">{label}</p>
  </div>
)

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
    <form onSubmit={submit}>
      <Title>ახალი ვაკანსია</Title>
      <div className="mb-6">
        <Segmented value={kind} onChange={changeKind} options={[['recurring', 'მუდმივი ცვლები'], ['gig', '⚡ 1–2 დღიანი']]} />
      </div>
      <Group title="ვაკანსია">
        <input required className={input} value={form.title} onChange={set('title')} placeholder="პოზიცია, მაგ. ბარისტა" />
        <input required className={input} value={form.district} onChange={set('district')} placeholder="უბანი, მაგ. ვაკე" />
        <label className="flex items-center justify-between pr-4">
          <span className="px-4 py-3.5 text-[17px]">ანაზღაურება</span>
          <span className="flex items-center gap-1 text-[17px] text-muted">
            <input required type="number" inputMode="decimal" min="1" step="0.5" className="w-16 bg-transparent text-right outline-none" value={form.pay} onChange={set('pay')} placeholder="0" aria-label="ლარი საათში" />
            ₾/სთ
          </span>
        </label>
        <textarea className={`${input} resize-none`} rows={3} value={form.description} onChange={set('description')} placeholder="აღწერა: რას გააკეთებს, რა სჭირდება" />
      </Group>

      <h2 className="mb-1.5 px-4 text-[13px] font-medium uppercase tracking-wide text-muted">{kind === 'gig' ? 'სამუშაო დღეები' : 'ცვლები კვირაში'}</h2>
      {shifts.map((s, i) => (
        <div key={i} className={`${card} mb-2.5 divide-y divide-line`}>
          <label className="flex items-center justify-between pr-4">
            <span className="px-4 py-3.5 text-[17px]">{kind === 'gig' ? 'თარიღი' : 'დღე'}</span>
            {kind === 'gig' ? (
              <input type="date" min={todayISO()} required className={select} value={s.date} onChange={(e) => setShift(i, 'date', e.target.value)} />
            ) : (
              <select className={select} value={s.day} onChange={(e) => setShift(i, 'day', e.target.value)}>
                {DAYS.map((d, n) => <option key={d} value={n}>{d}</option>)}
              </select>
            )}
          </label>
          <div className="flex items-center justify-between pr-4">
            <span className="px-4 py-3.5 text-[17px]">დრო</span>
            <span className="flex items-center gap-2">
              <select className={select} value={s.start} onChange={(e) => setShift(i, 'start', e.target.value)} aria-label="დაწყება">
                {HOURS.slice(0, -1).map((h) => <option key={h} value={h}>{h}:00</option>)}
              </select>
              <span className="text-quiet">–</span>
              <select className={select} value={s.end} onChange={(e) => setShift(i, 'end', e.target.value)} aria-label="დასრულება">
                {HOURS.slice(1).map((h) => <option key={h} value={h}>{h}:00</option>)}
              </select>
            </span>
          </div>
          {shifts.length > 1 && (
            <button type="button" onClick={() => setShifts(shifts.filter((_, j) => j !== i))} className="w-full px-4 py-3 text-left text-[17px] text-coral">წაშლა</button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => setShifts([...shifts, emptyShift(kind)])} className="mb-6 px-4 py-1 text-[17px] text-brand">
        + {kind === 'gig' ? 'დღის დამატება' : 'ცვლის დამატება'}
      </button>

      {error && <p className="mb-3 px-4 text-[15px] text-coral">{error}</p>}
      <button className={`${btn} mb-4`}>გამოქვეყნება</button>
    </form>
  )
}

export function EmployerProfile({ profile, onSaved }) {
  const [form, setForm] = useState({ full_name: profile.full_name ?? '', company_name: profile.company_name ?? '' })
  const [note, setNote] = useState('')
  const [pays, setPays] = useState([])

  useEffect(() => {
    supabase.from('payments').select('amount, fee, status').eq('employer_id', profile.id).then(({ data }) => setPays(data ?? []))
  }, [profile.id])
  const sum = (status) => pays.filter((p) => p.status === status).reduce((s, p) => s + Number(p.amount), 0)

  async function save(e) {
    e.preventDefault()
    const { error } = await supabase.from('profiles').update(form).eq('id', profile.id)
    setNote(error ? error.message : 'შენახულია ✓')
    if (!error) onSaved(form)
  }

  return (
    <div>
      <Title>პროფილი</Title>
      <Group title="გადახდები" footer="დაბლოკილი თანხა სტუდენტს მაშინ ერიცხება, როცა სამუშაოს შესრულებას დაადასტურებ.">
        <Row icon="shield" label="დაბლოკილი" value={money(sum('held'))} />
        <Row icon="check" label="ჩარიცხული" value={money(sum('released'))} />
      </Group>
      <form onSubmit={save}>
        <Group title="კომპანია">
          <input className={input} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="კომპანია" />
          <input className={input} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="საკონტაქტო პირი" />
        </Group>
        {note && <p className="-mt-3 mb-4 px-4 text-[15px] text-brand">{note}</p>}
        <button className={`${btn} mb-6`}>შენახვა</button>
      </form>
      <Group>
        <InstallRow />
        <Row icon="logout" iconBg="bg-coral" label="გასვლა" danger onClick={() => supabase.auth.signOut()} chevron={false} />
      </Group>
    </div>
  )
}
