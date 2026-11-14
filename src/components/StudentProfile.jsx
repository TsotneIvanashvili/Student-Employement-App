import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import AccountActions from './AccountActions.jsx'
import { IdentityCard } from './Identity.jsx'
import { Badge, Icon, Title, btn, btn2, btnSm2, card, input, label } from './ui.jsx'

// პროფილი: პირადი მონაცემები (მხოლოდ საჩვენებლად) და სივი, რომელიც "რედაქტირების" ღილაკით იხსნება
export default function StudentProfile({ profile, email, onSaved }) {
  const cvDone = Boolean(profile.cv_experience || profile.cv_skills || profile.cv_languages || profile.cv_path)
  const [editing, setEditing] = useState(!cvDone)
  const [note, setNote] = useState(null)

  async function openPdf() {
    const { data } = await supabase.storage.from('cvs').createSignedUrl(profile.cv_path, 600)
    if (data) window.open(data.signedUrl, '_blank', 'noopener')
  }

  return (
    <div>
      <Title eyebrow="სამუშაოს მაძიებელი">პროფილი</Title>
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-5">
          <IdentityCard profile={profile} email={email} onSaved={onSaved} />
          <div className="hidden lg:block"><AccountActions profile={profile} /></div>
        </div>

        <section className={`${card} p-5`} data-cv>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[18px] font-bold">სივი</h2>
              <Badge tone={cvDone ? 'green' : 'amber'}>{cvDone ? <><Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />შევსებულია</> : 'შესავსებია'}</Badge>
            </div>
            {!editing && <button onClick={() => { setEditing(true); setNote(null) }} className={`${btnSm2} flex items-center gap-1.5`}><Icon name="edit" className="h-4 w-4" />რედაქტირება</button>}
          </div>
          {note && <p className={`mb-3 flex items-center gap-1.5 text-[14px] font-medium ${note.ok ? 'text-brand-deep' : 'text-coral'}`}>{note.ok && <Icon name="check" className="h-4 w-4" strokeWidth={3} />}{note.text}</p>}

          {editing ? (
            <CvForm profile={profile} onSaved={onSaved} canCancel={cvDone} setNote={setNote} onClose={() => setEditing(false)} />
          ) : (
            <dl className="space-y-2">
              <Fact name="გამოცდილება" value={profile.cv_experience} />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Fact name="უნარები" value={profile.cv_skills} />
                <Fact name="ენები" value={profile.cv_languages} />
              </div>
              {profile.cv_path && (
                <button onClick={openPdf} className="flex w-full items-center gap-2 rounded-2xl bg-bg px-4 py-3 text-left text-[15px] font-semibold hover:bg-fill">
                  <Icon name="doc" className="h-5 w-5 text-brand-deep" />PDF სივის ნახვა
                </button>
              )}
            </dl>
          )}
        </section>

        <div className="lg:hidden"><AccountActions profile={profile} /></div>
      </div>
    </div>
  )
}

const Fact = ({ name, value }) => (
  <div className="rounded-2xl bg-bg px-4 py-3">
    <dt className="text-[12px] font-medium text-muted">{name}</dt>
    <dd className={`whitespace-pre-wrap break-words text-[15px] ${value ? '' : 'text-quiet'}`}>{value || 'არ არის შევსებული'}</dd>
  </div>
)

function CvForm({ profile, onSaved, canCancel, setNote, onClose }) {
  const [form, setForm] = useState({
    cv_experience: profile.cv_experience ?? '',
    cv_skills: profile.cv_skills ?? '',
    cv_languages: profile.cv_languages ?? '',
  })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function save(e) {
    e.preventDefault()
    const { error } = await supabase.from('profiles').update(form).eq('id', profile.id)
    if (error) return setNote({ text: 'ვერ შეინახა. სცადე თავიდან.' })
    onSaved(form)
    setNote({ ok: true, text: 'შენახულია' })
    onClose()
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
    <form onSubmit={save} className="space-y-4">
      <Field label="გამოცდილება">
        <textarea className={`${input} resize-none`} rows={3} maxLength={1000} value={form.cv_experience} onChange={set('cv_experience')} placeholder="მაგ. 3 თვე ბარისტად, 1 წელი გაყიდვებში" />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="უნარები"><input maxLength={200} className={input} value={form.cv_skills} onChange={set('cv_skills')} placeholder="კომუნიკაცია, Excel" /></Field>
        <Field label="ენები"><input maxLength={200} className={input} value={form.cv_languages} onChange={set('cv_languages')} placeholder="ინგლისური B2" /></Field>
      </div>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-line px-4 py-4 hover:border-brand-deep">
        <span className="flex items-center gap-2 font-medium"><Icon name="doc" className="h-5 w-5 text-brand-deep" />{profile.cv_path ? 'PDF სივი ატვირთულია' : 'PDF სივი (არასავალდებულო)'}</span>
        <span className="font-semibold text-brand-deep">{profile.cv_path ? 'შეცვლა' : 'ატვირთვა'}</span>
        <input type="file" accept="application/pdf" className="hidden" onChange={upload} />
      </label>
      <div className={`grid gap-3 ${canCancel ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {canCancel && <button type="button" onClick={onClose} className={btn2}>გაუქმება</button>}
        <button className={btn}>შენახვა</button>
      </div>
    </form>
  )
}

const Field = ({ label: text, children }) => (
  <label className="block">
    <span className={label}>{text}</span>
    {children}
  </label>
)
