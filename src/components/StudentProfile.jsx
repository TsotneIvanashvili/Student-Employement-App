import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { openJob } from './JobCard.jsx'
import { STATUS_TONE } from './Applicants.jsx'
import AccountActions from './AccountActions.jsx'
import { Badge, Icon, Title, btn, card, input, label } from './ui.jsx'

const STATUS_STUDENT = { sent: 'გაგზავნილია', accepted: 'აგიყვანეს', rejected: 'უარი' }

export default function StudentProfile({ profile, onSaved }) {
  const [form, setForm] = useState({
    full_name: profile.full_name ?? '',
    cv_experience: profile.cv_experience ?? '',
    cv_skills: profile.cv_skills ?? '',
    cv_languages: profile.cv_languages ?? '',
  })
  const [note, setNote] = useState(null)
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

  const cvDone = Boolean(profile.cv_experience || profile.cv_skills || profile.cv_path)

  async function save(e) {
    e.preventDefault()
    const changes = { ...form }
    const { error } = await supabase.from('profiles').update(changes).eq('id', profile.id)
    setNote(error ? { text: 'ვერ შეინახა. სცადე თავიდან.' } : { ok: true, text: 'შენახულია' })
    if (!error) onSaved(changes)
  }

  async function upload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') return setNote({ text: 'მხოლოდ PDF ფაილი.' })
    if (file.size > 5 * 1024 * 1024) return setNote({ text: 'ფაილი 5 MB-ზე მეტია.' })
    const path = `${profile.id}/cv.pdf`
    const { error } = await supabase.storage.from('cvs').upload(path, file, { upsert: true, contentType: 'application/pdf' })
    if (error) return setNote({ text: 'ფაილი ვერ აიტვირთა. სცადე თავიდან.' })
    await supabase.from('profiles').update({ cv_path: path }).eq('id', profile.id)
    onSaved({ cv_path: path })
    setNote({ ok: true, text: 'PDF ატვირთულია' })
  }

  return (
    <div>
      <Title eyebrow="სამუშაოს მაძიებელი">{profile.full_name}</Title>
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-5">
          <section className={`${card} p-5`}>
            <h2 className="mb-3 text-[18px] font-semibold">ჩემი განაცხადები</h2>
            {applications.length === 0 && <p className="text-muted">ჯერ არცერთი არ გაგიგზავნია.</p>}
            <ul className="space-y-2">
              {applications.map((a) => (
                <li key={a.id}>
                  <button onClick={() => openJob(a.jobs.id)} className="flex w-full items-center gap-3 rounded-2xl bg-bg px-4 py-3 text-left hover:bg-fill">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{a.jobs.title}</span>
                      <span className="block truncate text-[13px] font-semibold text-muted">{a.jobs.company}</span>
                    </span>
                    <Badge tone={STATUS_TONE[a.status]}>{STATUS_STUDENT[a.status]}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <div className="hidden lg:block"><AccountActions profile={profile} /></div>
        </div>

        <form onSubmit={save} className={`${card} space-y-4 p-5`} data-tour="cv">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-semibold">სივი</h2>
            <Badge tone={cvDone ? 'green' : 'amber'}>{cvDone ? <><Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.5} />შევსებულია</> : 'შესავსებია'}</Badge>
          </div>
          <Field label="სახელი და გვარი"><input required maxLength={80} className={input} value={form.full_name} onChange={set('full_name')} /></Field>
          <Field label="გამოცდილება">
            <textarea className={`${input} resize-none`} rows={3} maxLength={1000} value={form.cv_experience} onChange={set('cv_experience')} placeholder="მაგ. 3 თვე ბარისტად, 1 წელი გაყიდვებში" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="უნარები"><input maxLength={200} className={input} value={form.cv_skills} onChange={set('cv_skills')} placeholder="კომუნიკაცია, Excel" /></Field>
            <Field label="ენები"><input maxLength={200} className={input} value={form.cv_languages} onChange={set('cv_languages')} placeholder="ინგლისური B2" /></Field>
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-line px-4 py-4 hover:border-brand">
            <span className="flex items-center gap-2 font-medium"><Icon name="doc" className="h-5 w-5 text-brand" />{profile.cv_path ? 'PDF სივი ატვირთულია' : 'PDF სივი (არასავალდებულო)'}</span>
            <span className="font-semibold text-brand">{profile.cv_path ? 'შეცვლა' : 'ატვირთვა'}</span>
            <input type="file" accept="application/pdf" className="hidden" onChange={upload} />
          </label>
          {note && <p className={`flex items-center gap-1.5 font-medium ${note.ok ? 'text-mint-dark' : 'text-coral'}`}>{note.ok && <Icon name="check" className="h-4 w-4" strokeWidth={2.5} />}{note.text}</p>}
          <button className={btn}>შენახვა</button>
        </form>

        <div className="lg:hidden"><AccountActions profile={profile} /></div>
      </div>
    </div>
  )
}

const Field = ({ label: text, children }) => (
  <label className="block">
    <span className={label}>{text}</span>
    {children}
  </label>
)
