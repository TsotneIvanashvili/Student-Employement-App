import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { openJob } from './JobCard.jsx'
import { STATUS } from './JobDetail.jsx'
import InstallRow from './InstallRow.jsx'
import { Group, Icon, Row, Title, btn, input, money } from './ui.jsx'

export default function StudentProfile({ profile, onSaved }) {
  const [form, setForm] = useState({
    full_name: profile.full_name ?? '',
    university: profile.university ?? '',
    year: profile.year ?? 1,
    hours: profile.hours ?? 15,
    cv_experience: profile.cv_experience ?? '',
    cv_skills: profile.cv_skills ?? '',
    cv_languages: profile.cv_languages ?? '',
  })
  const [note, setNote] = useState('')
  const [applications, setApplications] = useState([])
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  useEffect(() => {
    supabase
      .from('applications')
      .select('id, status, jobs(id, title, company), payments(amount, fee, status)')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setApplications(data ?? []))
  }, [profile.id])

  const pays = applications.map((a) => (Array.isArray(a.payments) ? a.payments[0] : a.payments)).filter(Boolean)
  const earned = pays.filter((p) => p.status === 'released').reduce((s, p) => s + (p.amount - p.fee), 0)
  const pending = pays.filter((p) => p.status === 'held').reduce((s, p) => s + (p.amount - p.fee), 0)
  const fees = pays.reduce((s, p) => s + Number(p.fee), 0)

  async function save(e) {
    e.preventDefault()
    const changes = { ...form, year: Number(form.year), hours: Number(form.hours) }
    const { error } = await supabase.from('profiles').update(changes).eq('id', profile.id)
    setNote(error ? error.message : 'შენახულია ✓')
    if (!error) onSaved(changes)
  }

  async function upload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') return setNote('მხოლოდ PDF ფაილი.')
    if (file.size > 5 * 1024 * 1024) return setNote('ფაილი 5 MB-ზე მეტია.')
    const path = `${profile.id}/cv.pdf`
    const { error } = await supabase.storage.from('cvs').upload(path, file, { upsert: true, contentType: 'application/pdf' })
    if (error) return setNote(error.message)
    await supabase.from('profiles').update({ cv_path: path }).eq('id', profile.id)
    onSaved({ cv_path: path })
    setNote('PDF ატვირთულია ✓')
  }

  return (
    <div>
      <Title>პროფილი</Title>

      <div data-tour="wallet" className="mb-6 overflow-hidden rounded-[22px] bg-[radial-gradient(120%_120%_at_100%_0%,#1d7a4c_0%,#0b0d12_70%)] p-5 text-white">
        <div className="flex items-center gap-2 text-[13px] font-medium text-white/70"><Icon name="wallet" className="h-4 w-4" />საფულე</div>
        <p className="mt-1 text-[34px] font-bold tracking-tight">{money(earned)}</p>
        <p className="text-[13px] text-white/70">მიღებული შემოსავალი</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[13px]">
          <div className="rounded-xl bg-white/10 px-3 py-2"><p className="text-white/60">მოლოდინში</p><p className="text-[16px] font-semibold">{money(pending)}</p></div>
          <div className="rounded-xl bg-white/10 px-3 py-2"><p className="text-white/60">საკომისიო (10%)</p><p className="text-[16px] font-semibold">{money(fees)}</p></div>
        </div>
      </div>

      <Group title="ჩემი განაცხადები">
        {applications.length === 0 && <p className="px-4 py-3 text-[15px] text-muted">ჯერ არცერთი არ გაგიგზავნია.</p>}
        {applications.map((a) => (
          <Row key={a.id} label={<><b className="font-semibold">{a.jobs.title}</b><span className="block text-[13px] text-muted">{a.jobs.company}</span></>} value={STATUS[a.status]} onClick={() => openJob(a.jobs.id)} />
        ))}
      </Group>

      <form onSubmit={save}>
        <Group title="შენ შესახებ">
          <input className={input} value={form.full_name} onChange={set('full_name')} placeholder="სახელი და გვარი" />
          <input className={input} value={form.university} onChange={set('university')} placeholder="უნივერსიტეტი" />
          <label className="flex items-center justify-between pr-4">
            <span className="px-4 py-3.5 text-[17px]">კურსი</span>
            <select className="bg-transparent text-[17px] text-muted outline-none" value={form.year} onChange={set('year')}>
              {[1, 2, 3, 4].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="flex items-center justify-between pr-4">
            <span className="px-4 py-3.5 text-[17px]">საათი კვირაში</span>
            <input type="number" inputMode="numeric" min="2" max="40" className="w-16 bg-transparent text-right text-[17px] text-muted outline-none" value={form.hours} onChange={set('hours')} />
          </label>
        </Group>

        <div data-tour="cv">
          <Group title="სივი" footer="დამსაქმებელი ამას ნახავს, როცა განაცხადს გაუგზავნი.">
            <textarea className={`${input} resize-none`} rows={3} value={form.cv_experience} onChange={set('cv_experience')} placeholder="გამოცდილება (მაგ. 3 თვე ბარისტად)" />
            <input className={input} value={form.cv_skills} onChange={set('cv_skills')} placeholder="უნარები (მაგ. კომუნიკაცია, Excel)" />
            <input className={input} value={form.cv_languages} onChange={set('cv_languages')} placeholder="ენები (მაგ. ინგლისური B2)" />
            <label className="flex cursor-pointer items-center justify-between px-4 py-3.5 text-[17px]">
              <span>{profile.cv_path ? 'PDF სივი ✓' : 'PDF სივი (არასავალდებულო)'}</span>
              <span className="text-brand">{profile.cv_path ? 'შეცვლა' : 'ატვირთვა'}</span>
              <input type="file" accept="application/pdf" className="hidden" onChange={upload} />
            </label>
          </Group>
        </div>
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
