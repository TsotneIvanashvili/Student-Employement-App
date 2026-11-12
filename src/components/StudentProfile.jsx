import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { openJob } from './JobCard.jsx'

const STATUS = { sent: 'გაგზავნილია', accepted: 'მიღებულია', rejected: 'უარყოფილია' }
const field = 'w-full rounded-2xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-brand'

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
      .select('id, status, jobs(id, title, company)')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setApplications(data ?? []))
  }, [profile.id])

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
    <div className="space-y-4">
      <form onSubmit={save} className="space-y-3 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">პროფილი და სივი</h2>
        <input className={field} value={form.full_name} onChange={set('full_name')} placeholder="სახელი და გვარი" />
        <input className={field} value={form.university} onChange={set('university')} placeholder="უნივერსიტეტი" />
        <div className="grid grid-cols-2 gap-2">
          <select className={field} value={form.year} onChange={set('year')}>
            {[1, 2, 3, 4].map((y) => <option key={y} value={y}>{y} კურსი</option>)}
          </select>
          <label className="relative">
            <input type="number" inputMode="numeric" min="2" max="40" className={field} value={form.hours} onChange={set('hours')} aria-label="საათი კვირაში" />
            <span className="pointer-events-none absolute right-4 top-3.5 text-sm text-quiet">სთ/კვირა</span>
          </label>
        </div>
        <textarea className={field} rows={3} value={form.cv_experience} onChange={set('cv_experience')} placeholder="გამოცდილება (მაგ. 3 თვე ბარისტად, მოხალისეობა)" />
        <input className={field} value={form.cv_skills} onChange={set('cv_skills')} placeholder="უნარები (მაგ. კომუნიკაცია, Excel)" />
        <input className={field} value={form.cv_languages} onChange={set('cv_languages')} placeholder="ენები (მაგ. ქართული, ინგლისური B2)" />

        <label className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-dashed border-line px-4 py-3 text-sm">
          <span>{profile.cv_path ? 'PDF სივი ატვირთულია ✓' : 'PDF სივის ატვირთვა (არასავალდებულო)'}</span>
          <span className="font-semibold text-brand">{profile.cv_path ? 'შეცვლა' : 'არჩევა'}</span>
          <input type="file" accept="application/pdf" className="hidden" onChange={upload} />
        </label>

        {note && <p className="text-sm text-mint">{note}</p>}
        <button className="w-full rounded-2xl bg-brand py-3.5 font-semibold text-white">შენახვა</button>
      </form>

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-bold">ჩემი განაცხადები</h2>
        {applications.length === 0 && <p className="text-sm text-muted">ჯერ არცერთი არ გაგიგზავნია.</p>}
        <ul className="space-y-2">
          {applications.map((a) => (
            <li key={a.id}>
              <button onClick={() => openJob(a.jobs.id)} className="flex w-full items-center justify-between rounded-2xl bg-bg px-4 py-3 text-left text-sm">
                <span><b>{a.jobs.title}</b> · {a.jobs.company}</span>
                <span className="text-muted">{STATUS[a.status]}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={() => supabase.auth.signOut()} className="w-full rounded-2xl py-3 text-sm text-quiet">გასვლა</button>
    </div>
  )
}
