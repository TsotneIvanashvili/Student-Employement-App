import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { FIRST_HOUR, LAST_HOUR, formatShift, todayISO } from '../lib/match.js'
import Calendar, { WEEKDAYS, WEEKEND, preset } from './Calendar.jsx'
import BigCalendar, { TONES } from './BigCalendar.jsx'
import { jobEvents } from '../lib/schedule.js'
import JobCard, { CompanyLogo, openJob } from './JobCard.jsx'
import { ApplicantCard, jobHours } from './Applicants.jsx'
import InstallRow from './InstallRow.jsx'
import { Badge, Empty, Icon, Segmented, Title, btn, card, input, label, money } from './ui.jsx'

const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i)
const APP_FIELDS = '*, payments(*), profiles(full_name, university, year, cv_experience, cv_skills, cv_languages, cv_path), jobs!inner(*)'

// ყველა განაცხადი ერთ ადგილას, ყველა ვაკანსიიდან
export function Inbox({ profile, onNew }) {
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

  if (!rows) return <Title eyebrow={profile.company_name}>განაცხადები</Title>
  const count = (s) => rows.filter((r) => r.status === s).length
  const held = rows.flatMap((r) => r.payments).filter((p) => p?.status === 'held').reduce((s, p) => s + Number(p.amount), 0)
  const shown = filter === 'all' ? rows : rows.filter((r) => r.status === filter)

  return (
    <section>
      <Title eyebrow={profile.company_name}>განაცხადები</Title>
      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
        <Stat emoji="📬" label="ახალი" value={count('sent')} tone="text-brand" />
        <Stat emoji="🤝" label="აყვანილი" value={count('accepted')} tone="text-mint-dark" />
        <Stat emoji="🔒" label="დაბლოკილი" value={money(held)} tone="text-amber" />
      </div>
      <div className="mb-4">
        <Segmented value={filter} onChange={setFilter} options={[['sent', `ახალი (${count('sent')})`], ['accepted', 'აყვანილი'], ['all', 'ყველა']]} />
      </div>
      {shown.length === 0 && (
        rows.length === 0 ? (
          <Empty emoji="📭" title="ჯერ განაცხადი არ შემოსულა" text="დაამატე ვაკანსია და სტუდენტები, რომლებსაც შენი ცვლის დროს სცალიათ, სივს გამოგიგზავნიან." action={<button onClick={onNew} className={`${btn} px-6`}>ვაკანსიის დამატება</button>} />
        ) : (
          <Empty emoji="✨" title="აქ ცარიელია" text="ამ ფილტრით განაცხადი არ არის." />
        )
      )}
      <ul className="space-y-3">
        {shown.map((r) => <ApplicantCard key={r.id} app={r} job={r.jobs} showJob onChanged={load} />)}
      </ul>
    </section>
  )
}

// დამსაქმებლის კალენდარი: ცვლები თარიღებზე და ვინ მუშაობს თითოეულში
export function EmployerSchedule({ profile }) {
  const [jobs, setJobs] = useState([])
  useEffect(() => {
    supabase
      .from('jobs')
      .select('*, applications(status, profiles(full_name))')
      .eq('employer_id', profile.id)
      .eq('is_open', true)
      .then(({ data }) => setJobs(data ?? []))
  }, [profile.id])

  const events = jobs.flatMap((job) => {
    const hired = job.applications.filter((a) => a.status === 'accepted').map((a) => a.profiles.full_name)
    return jobEvents(job, { tone: hired.length ? 'work' : 'open', subtitle: hired.length ? hired.join(', ') : 'ჯერ არავინ' })
  })

  return (
    <div>
      <Title eyebrow={profile.company_name}>ცვლების კალენდარი</Title>
      <div className="mb-4 flex flex-wrap gap-4 text-[13px] text-muted">
        <span className="flex items-center gap-1.5"><i className={`h-3 w-3 rounded-sm border-l-[3px] ${TONES.work}`} />სტუდენტი აყვანილია</span>
        <span className="flex items-center gap-1.5"><i className={`h-3 w-3 rounded-sm border-l-[3px] ${TONES.open}`} />ჯერ არავინ</span>
      </div>
      <BigCalendar events={events} onEvent={(e) => openJob(e.job_id)} />
    </div>
  )
}

const Stat = ({ emoji, label: text, value, tone }) => (
  <div className={`${card} min-w-0 px-3 py-3 sm:px-4`}>
    <p className="truncate text-[12px] font-medium text-muted sm:text-[13px]">{emoji} {text}</p>
    <p className={`truncate text-[20px] font-semibold leading-tight sm:text-[22px] ${tone}`}>{value}</p>
  </div>
)

export function MyJobs({ profile, onNew }) {
  const [jobs, setJobs] = useState(null)

  useEffect(() => {
    supabase
      .from('jobs')
      .select('*, applications(status)')
      .eq('employer_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setJobs(data ?? []))
  }, [profile.id])

  return (
    <section>
      <Title eyebrow={profile.company_name} action={<button onClick={onNew} className={`${btn} flex !w-auto items-center gap-1.5 px-4`}><Icon name="plus" className="h-5 w-5" strokeWidth={2.5} />ახალი</button>}>
        ვაკანსიები
      </Title>
      {jobs?.length === 0 && <Empty emoji="📝" title="ჯერ ვაკანსია არ გაქვს" text="პირველი ვაკანსიის დამატებას ერთი წუთი სჭირდება." action={<button onClick={onNew} className={`${btn} px-6`}>ვაკანსიის დამატება</button>} />}
      <ul data-tour="myjobs" className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {jobs?.map((job) => {
          const fresh = job.applications.filter((a) => a.status === 'sent').length
          return (
            <li key={job.id}>
              <button onClick={() => openJob(job.id)} className={`${card} flex w-full items-start gap-3 p-4 text-left transition hover:border-brand/40 ${job.is_open ? '' : 'opacity-60'}`}>
                <CompanyLogo name={job.company} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-[16px] font-semibold">{job.title}</h3>
                    {fresh > 0 ? <Badge tone="violet">{fresh} ახალი</Badge> : <span className="shrink-0 text-[13px] font-medium text-quiet">{job.applications.length} განაცხადი</span>}
                  </div>
                  <p className="truncate text-[13px] font-semibold text-muted">{job.shifts.map((s) => formatShift(s)).join(' · ')}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone={job.kind === 'gig' ? 'amber' : 'sky'}>{job.kind === 'gig' ? '⚡ 1–2 დღიანი' : '🔁 მუდმივი'}</Badge>
                    <Badge>{Number(job.pay)} ₾/სთ</Badge>
                    {!job.is_open && <Badge tone="red">დახურული</Badge>}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const EMPLOYER_PRESETS = [
  preset('🌆 სამუშაო დღეებში 18–22', WEEKDAYS, 18, 21),
  preset('☀️ სამუშაო დღეებში 9–13', WEEKDAYS, 9, 12),
  preset('🎉 შაბათ-კვირა 10–18', WEEKEND, 10, 17),
]

// მონიშნული საათები → ცვლები: ყოველ დღეში მიმდევრობითი საათები ერთ ცვლად ერთიანდება
export function slotsToShifts(slots) {
  const shifts = []
  for (let day = 0; day < 7; day++) {
    let start = null
    for (let h = FIRST_HOUR; h <= LAST_HOUR; h++) {
      const on = h < LAST_HOUR && slots.has(`${day}-${h}`)
      if (on && start === null) start = h
      if (!on && start !== null) {
        shifts.push({ day, start, end: h })
        start = null
      }
    }
  }
  return shifts
}

const emptyGigDay = () => ({ date: todayISO(), start: 10, end: 16 })

export function NewJob({ profile, onCreated }) {
  const [form, setForm] = useState({ title: '', district: '', pay: '', description: '' })
  const [kind, setKind] = useState('recurring')
  const [slots, setSlots] = useState(new Set())
  const [gigDays, setGigDays] = useState([emptyGigDay()])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const setGig = (i, key, value) => setGigDays(gigDays.map((s, j) => (j === i ? { ...s, [key]: key === 'date' ? value : Number(value) } : s)))

  const shifts = kind === 'gig' ? gigDays : slotsToShifts(slots)
  const preview = {
    id: 'preview',
    company: profile.company_name || profile.full_name,
    title: form.title || 'პოზიცია',
    district: form.district || 'უბანი',
    pay: Number(form.pay) || 0,
    kind,
    shifts,
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (shifts.length === 0) return setError('მონიშნე ცვლის საათები კალენდარზე.')
    if (shifts.some((s) => s.start >= s.end)) return setError('ცვლის დასასრული დაწყებაზე გვიან უნდა იყოს.')
    if (kind === 'gig' && shifts.some((s) => s.date < todayISO())) return setError('თარიღი წარსულშია.')
    setBusy(true)
    const { error } = await supabase.from('jobs').insert({ employer_id: profile.id, company: preview.company, title: form.title, district: form.district, pay: Number(form.pay), description: form.description, kind, shifts })
    setBusy(false)
    if (error) return setError(error.message)
    onCreated()
  }

  return (
    <form onSubmit={submit}>
      <Title eyebrow="ნაბიჯი ნაბიჯ">ახალი ვაკანსია</Title>
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Step n={1} title="რა ტიპის სამუშაოა?">
            <div className="grid grid-cols-2 gap-3">
              {[['recurring', '🔁', 'მუდმივი ცვლები', 'ყოველ კვირა, იგივე საათებში'], ['gig', '⚡', '1–2 დღიანი', 'ერთჯერადი: ღონისძიება, გადაზიდვა']].map(([k, emoji, title, text]) => (
                <button type="button" key={k} onClick={() => setKind(k)} className={`rounded-2xl border p-4 text-left transition ${kind === k ? 'border-brand bg-brand-soft' : 'border-line bg-white'}`}>
                  <span className="text-[26px]">{emoji}</span>
                  <span className="mt-1 block text-[16px] font-semibold">{title}</span>
                  <span className="block text-[13px] font-semibold text-muted">{text}</span>
                </button>
              ))}
            </div>
          </Step>

          <Step n={2} title="დეტალები">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="პოზიცია"><input required className={input} value={form.title} onChange={set('title')} placeholder="მაგ. ბარისტა" /></Field>
              <Field label="უბანი"><input required className={input} value={form.district} onChange={set('district')} placeholder="მაგ. ვაკე" /></Field>
              <Field label="ანაზღაურება (₾ საათში)"><input required type="number" inputMode="decimal" min="1" step="0.5" className={input} value={form.pay} onChange={set('pay')} placeholder="მაგ. 9" aria-label="ლარი საათში" /></Field>
            </div>
            <Field label="აღწერა" className="mt-4"><textarea className={`${input} resize-none`} rows={3} value={form.description} onChange={set('description')} placeholder="რას გააკეთებს, რა სჭირდება" /></Field>
          </Step>

          <Step n={3} title={kind === 'gig' ? 'როდის?' : 'რომელ საათებში?'}>
            {kind === 'recurring' ? (
              <Calendar value={slots} setValue={setSlots} presets={EMPLOYER_PRESETS} tone="brand" unit="სთ კვირაში" />
            ) : (
              <div className="space-y-3">
                {gigDays.map((s, i) => (
                  <div key={i} className="grid grid-cols-2 gap-3 rounded-2xl bg-bg p-3 sm:grid-cols-[1fr_110px_110px_auto] sm:items-end">
                    <Field label={`დღე ${i + 1}`} className="col-span-2 sm:col-span-1"><input type="date" min={todayISO()} required className={input} value={s.date} onChange={(e) => setGig(i, 'date', e.target.value)} /></Field>
                    <Field label="დან">
                      <select className={input} value={s.start} onChange={(e) => setGig(i, 'start', e.target.value)} aria-label="დაწყება">
                        {HOURS.slice(0, -1).map((h) => <option key={h} value={h}>{h}:00</option>)}
                      </select>
                    </Field>
                    <Field label="მდე">
                      <select className={input} value={s.end} onChange={(e) => setGig(i, 'end', e.target.value)} aria-label="დასრულება">
                        {HOURS.slice(1).map((h) => <option key={h} value={h}>{h}:00</option>)}
                      </select>
                    </Field>
                    {gigDays.length > 1 && (
                      <button type="button" onClick={() => setGigDays(gigDays.filter((_, j) => j !== i))} className="col-span-2 py-2 font-semibold text-coral sm:col-span-1" aria-label="დღის წაშლა">წაშლა</button>
                    )}
                  </div>
                ))}
                {gigDays.length < 2 && (
                  <button type="button" onClick={() => setGigDays([...gigDays, emptyGigDay()])} className="font-semibold text-brand">+ მეორე დღის დამატება</button>
                )}
              </div>
            )}
          </Step>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <p className={label}>ასე დაინახავენ სტუდენტები</p>
          <div className="pointer-events-none"><JobCard job={preview} /></div>
          <div className={`${card} space-y-2 p-4 text-[15px] font-medium`}>
            <p className="flex justify-between"><span className="text-muted">ცვლები</span><span>{shifts.length}</span></p>
            <p className="flex justify-between"><span className="text-muted">{kind === 'gig' ? 'სულ საათი' : 'საათი კვირაში'}</span><span>{jobHours(preview)} სთ</span></p>
            <p className="flex justify-between border-t-2 border-line pt-2 text-[17px]"><span>{kind === 'gig' ? 'ჯამური ხარჯი' : 'ხარჯი კვირაში'}</span><span className="font-semibold text-brand">{money(jobHours(preview) * preview.pay)}</span></p>
          </div>
          {error && <p className="rounded-2xl bg-coral-soft p-3 font-medium text-coral">{error}</p>}
          <button disabled={busy} className={btn}>{busy ? 'ქვეყნდება…' : 'გამოქვეყნება'}</button>
        </aside>
      </div>
    </form>
  )
}

function Step({ n, title, children }) {
  return (
    <section className={`${card} p-5`}>
      <h2 className="mb-4 flex items-center gap-2.5 text-[18px] font-semibold">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-[15px] text-white">{n}</span>{title}
      </h2>
      {children}
    </section>
  )
}

const Field = ({ label: text, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className={label}>{text}</span>
    {children}
  </label>
)

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
      <Title eyebrow="დამსაქმებელი">{profile.company_name}</Title>
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Stat emoji="🔒" label="დაბლოკილი" value={money(sum('held'))} tone="text-amber" />
            <Stat emoji="✅" label="ჩარიცხული" value={money(sum('released'))} tone="text-mint-dark" />
          </div>
          <p className="px-1 text-[14px] font-semibold text-muted">დაბლოკილი თანხა სტუდენტს მაშინ ერიცხება, როცა სამუშაოს შესრულებას დაადასტურებ.</p>
        </div>
        <form onSubmit={save} className={`${card} space-y-4 p-5`}>
          <h2 className="text-[18px] font-semibold">კომპანია</h2>
          <Field label="კომპანიის სახელი"><input className={input} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></Field>
          <Field label="საკონტაქტო პირი"><input className={input} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
          {note && <p className="font-medium text-mint-dark">{note}</p>}
          <button className={btn}>შენახვა</button>
        </form>
        <div className="space-y-3">
          <InstallRow />
          <button onClick={() => supabase.auth.signOut()} className="w-full py-2 font-semibold text-coral">გასვლა</button>
        </div>
      </div>
    </div>
  )
}
