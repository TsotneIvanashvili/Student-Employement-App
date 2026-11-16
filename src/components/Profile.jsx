import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { navigate } from '../lib/router.jsx'
import { useInstall } from '../lib/pwa.js'
import { catName, setLang, tr, useLang } from '../lib/i18n.js'
import { useRatings } from '../lib/ratings.js'
import { STATUS_TONE, statusText, tagText } from './Applicants.jsx'
import { openJob } from './Jobs.jsx'
import { Avatar, Badge, Icon, Segmented, Sheet, Title, btn, btn2, btnSm2, card, chip, input, label, tap } from './ui.jsx'

const FIELDS = ['general', 'service', 'delivery', 'trades', 'design', 'dev', 'events', 'other']
const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

// პროფილი ორივე როლისთვის: შეფასება, პარამეტრები, სივი (მაძიებელი), განაცხადები, შეფასებები
export default function Profile({ profile, email, onSaved, onHelp, applications = [] }) {
  const lang = useLang()
  const employer = profile.role === 'employer'
  const rating = useRatings([profile.id])(profile.id)
  const [reviews, setReviews] = useState([])
  const [done, setDone] = useState(null)
  const [nameSheet, setNameSheet] = useState(false)

  useEffect(() => {
    supabase.from('reviews').select('*').eq('ratee_id', profile.id).order('created_at', { ascending: false }).limit(20).then(({ data }) => setReviews(data ?? []))
    const q = employer
      ? supabase.from('applications').select('id, jobs!inner(employer_id)', { count: 'exact', head: true }).eq('jobs.employer_id', profile.id).eq('status', 'done')
      : supabase.from('applications').select('id', { count: 'exact', head: true }).eq('student_id', profile.id).eq('status', 'done')
    q.then(({ count }) => setDone(count ?? 0))
  }, [profile.id, employer])

  async function pickField(field) {
    onSaved({ field })
    await supabase.from('profiles').update({ field }).eq('id', profile.id)
  }

  const third = employer ? null : applications.length
  return (
    <div className="mx-auto max-w-3xl space-y-3.5">
      <Title>{tr('პროფილი', 'Profile')}</Title>
      <section className={`${card} space-y-4 p-5`}>
        <div className="flex items-center gap-3.5">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-avatar text-[22px] font-bold text-on-avatar">
            {employer ? (profile.company_name || profile.full_name).slice(0, 2).toUpperCase() : (profile.full_name || '?').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[20px] font-bold tracking-[-0.01em]">{employer ? profile.company_name || profile.full_name : profile.full_name}</p>
            <p className="truncate text-[13px] text-muted">{employer ? `${tr('დამსაქმებელი', 'Employer')} · ${profile.full_name}` : `${tr('სამუშაოს მაძიებელი', 'Job seeker')} · ${catName(profile.field)}`}</p>
          </div>
        </div>
        <div className={`grid gap-2 ${third === null ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <Stat value={rating ? `★ ${rating.avg.toFixed(1)}` : '—'} text={`${rating?.count ?? 0} ${tr('შეფასება', 'reviews')}`} />
          <Stat value={done ?? '·'} text={tr('დასრულებული', 'Completed')} />
          {third !== null && <Stat value={third} text={tr('განაცხადი', 'Applications')} />}
        </div>
      </section>

      <section className={`${card} px-4 py-1.5`}>
        <Row title={tr('ენა', 'Language')}>
          <div className="w-[150px]"><Segmented size="sm" value={lang} onChange={setLang} options={[['ka', 'ქართული'], ['en', 'English']]} /></div>
        </Row>
        {!employer && (
          <div className="border-b border-fill py-3">
            <p className="mb-2.5 font-semibold">{tr('სფერო', 'Field')}</p>
            <div className="flex flex-wrap gap-2">
              {FIELDS.map((f) => (
                <button key={f} onClick={() => pickField(f)} aria-pressed={profile.field === f} className={`${chip} ${profile.field === f ? 'bg-brand-soft text-brand-deep' : 'bg-fill text-ink'}`}>{catName(f)}</button>
              ))}
            </div>
          </div>
        )}
        <Row title={employer ? tr('კომპანია და სახელი', 'Company and name') : tr('სახელი და გვარი', 'Full name')} sub={employer ? `${profile.company_name} · ${profile.full_name}` : profile.full_name}>
          <button onClick={() => setNameSheet(true)} className={`${btnSm2} flex items-center gap-1.5`}><Icon name="lock" className="h-4 w-4" />{tr('შეცვლა', 'Change')}</button>
        </Row>
        <Row title={tr('ელფოსტა', 'Email')} sub={email}><Icon name="lock" className="h-4 w-4 text-quiet" /></Row>
        <InstallRow />
        <button data-tour="help" onClick={onHelp} className="flex w-full items-center justify-between gap-3 border-b border-fill py-3.5 text-left font-semibold">
          <span>{tr('გზამკვლევის ნახვა', 'Show the guide')}</span>
          <Icon name="help" className="h-5 w-5 text-muted" />
        </button>
        <div className="flex flex-wrap gap-x-5 gap-y-1 border-b border-fill py-3.5 text-[14px] font-medium text-muted">
          <a href="/how" target="_blank" rel="noreferrer" className="text-muted hover:text-ink">{tr('დახმარება', 'Help')}</a>
          <a href="/terms" target="_blank" rel="noreferrer" className="text-muted hover:text-ink">{tr('წესები', 'Terms')}</a>
          <a href="/privacy" target="_blank" rel="noreferrer" className="text-muted hover:text-ink">{tr('კონფიდენციალურობა', 'Privacy')}</a>
        </div>
        <SignOut profile={profile} />
      </section>

      {!employer && <Cv profile={profile} onSaved={onSaved} />}

      {!employer && applications.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="px-1 pt-1 text-[18px] font-bold tracking-[-0.01em]">{tr('ჩემი განაცხადები', 'My applications')}</h2>
          <ul className="space-y-2">
            {applications.map((a) => (
              <li key={a.id}>
                <button onClick={() => openJob(a.jobs.id)} className={`${card} flex w-full items-center gap-3 p-3.5 text-left ${tap}`}>
                  <Avatar name={a.jobs.company} size={42} radius={14} />
                  <span className="block min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{a.jobs.title}</span>
                    <span className="block truncate text-[12px] text-muted">{a.jobs.company}</span>
                  </span>
                  <Badge tone={STATUS_TONE[a.status]}>{statusText(a.status, 'seeker')}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2.5">
        <h2 className="px-1 pt-1 text-[18px] font-bold tracking-[-0.01em]">{tr('შეფასებები', 'Reviews')}</h2>
        {reviews.length === 0 ? (
          <p className="rounded-[20px] bg-white p-4 text-[14px] text-muted shadow-[0_1px_2px_rgba(21,24,30,.06)]">
            {employer ? tr('შეფასებები გამოჩნდება, როცა თანამშრომლები სამუშაოს დაასრულებენ.', 'Reviews appear after workers finish a job with you.') : tr('შეფასებები გამოჩნდება პირველი დასრულებული სამუშაოს შემდეგ.', 'Reviews appear after your first completed job.')}
          </p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="rounded-[20px] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(21,24,30,.06)]">
              <div className="flex justify-between gap-2.5"><span className="font-semibold">{r.rater_name}</span><span className="font-semibold tracking-[1px] text-amber">{stars(r.stars)}</span></div>
              {r.tags.length > 0 && <p className="mt-1 text-[14px] text-muted">{r.tags.map(tagText).join(' · ')}</p>}
            </div>
          ))
        )}
      </section>
      {nameSheet && <NameSheet profile={profile} email={email} onSaved={onSaved} onClose={() => setNameSheet(false)} />}
    </div>
  )
}

const Stat = ({ value, text }) => (
  <div className="rounded-2xl bg-bg p-3">
    <p className="text-[18px] font-bold tabular-nums">{value}</p>
    <p className="text-[11px] text-muted">{text}</p>
  </div>
)
const Row = ({ title, sub, children }) => (
  <div className="flex items-center justify-between gap-3 border-b border-fill py-3">
    <span className="min-w-0">
      <span className="block font-semibold">{title}</span>
      {sub && <span className="block truncate text-[13px] text-muted">{sub}</span>}
    </span>
    {children}
  </div>
)

function InstallRow() {
  const { installed, canPrompt, prompt } = useInstall()
  const [help, setHelp] = useState(false)
  if (installed) return null
  return (
    <>
      <button onClick={() => (canPrompt ? prompt() : setHelp(true))} className="flex w-full items-center justify-between gap-3 border-b border-fill py-3.5 text-left font-semibold">
        <span>{tr('ტელეფონზე აპად დაყენება', 'Install as an app')}</span>
        <Icon name="phone" className="h-5 w-5 text-muted" />
      </button>
      {help && (
        <Sheet onClose={() => setHelp(false)}>
          <h2 className="text-[20px] font-bold">{tr('დააყენე ტელეფონზე', 'Install on your phone')}</h2>
          <p className="mt-1 text-[15px] text-muted">{tr('ShiftMate მთავარ ეკრანზე გამოჩნდება და სრულ ეკრანზე გაიხსნება.', 'ShiftMate appears on your home screen and opens full screen.')}</p>
          <ol className="mt-4 space-y-3 text-[15px] font-semibold">
            <li>1. {tr('iPhone: Safari-ში დააჭირე Share და აირჩიე Add to Home Screen', 'iPhone: in Safari tap Share, then Add to Home Screen')}</li>
            <li>2. {tr('Android: Chrome-ის მენიუში (⋮) აირჩიე Install app', 'Android: in the Chrome menu (⋮) choose Install app')}</li>
          </ol>
          <button onClick={() => setHelp(false)} className={`${btn} mt-6`}>{tr('გასაგებია', 'Got it')}</button>
        </Sheet>
      )}
    </>
  )
}

function SignOut({ profile }) {
  const [sheet, setSheet] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function signOut() {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }
  async function remove() {
    setBusy(true)
    setError('')
    if (profile.cv_path) await supabase.storage.from('cvs').remove([profile.cv_path])
    const { error } = await supabase.rpc('delete_my_account')
    if (error) {
      setBusy(false)
      return setError(tr('ვერ წაიშალა. სცადე თავიდან.', 'Could not delete. Try again.'))
    }
    await supabase.auth.signOut({ scope: 'local' })
    navigate('/', { replace: true })
  }
  return (
    <>
      <button onClick={signOut} className="w-full border-b border-fill py-3.5 text-left font-semibold text-[#b42323]">{tr('გასვლა', 'Log out')}</button>
      <button onClick={() => setSheet(true)} className="w-full py-3.5 text-left text-[14px] text-muted">{tr('ანგარიშის წაშლა', 'Delete account')}</button>
      {sheet && (
        <Sheet onClose={busy ? undefined : () => setSheet(false)}>
          <h2 className="text-[20px] font-bold">{tr('წავშალოთ ანგარიში?', 'Delete your account?')}</h2>
          <p className="mt-1 text-[15px] text-muted">
            {profile.role === 'employer'
              ? tr('სამუდამოდ წაიშლება პროფილი, ვაკანსიები და მათზე შემოსული განაცხადები.', 'Your profile, job posts and their applications will be deleted for good.')
              : tr('სამუდამოდ წაიშლება პროფილი, სივი, კალენდარი და განაცხადები.', 'Your profile, CV, calendar and applications will be deleted for good.')}
          </p>
          {error && <p className="mt-2 text-[14px] font-medium text-coral">{error}</p>}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button disabled={busy} onClick={() => setSheet(false)} className={btn2}>{tr('გაუქმება', 'Cancel')}</button>
            <button disabled={busy} onClick={remove} className="w-full rounded-2xl bg-coral py-4 text-[15px] font-semibold text-white disabled:opacity-50">{busy ? tr('იშლება…', 'Deleting…') : tr('წაშლა', 'Delete')}</button>
          </div>
        </Sheet>
      )}
    </>
  )
}

// სახელის შეცვლას პაროლი სჭირდება; ელფოსტა არ იცვლება
function NameSheet({ profile, email, onSaved, onClose }) {
  const employer = profile.role === 'employer'
  const [form, setForm] = useState({ full_name: profile.full_name ?? '', company_name: profile.company_name ?? '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    // პაროლს Supabase ამოწმებს (ცდების ლიმიტით); სწორი პაროლის გარეშე არაფერი იცვლება
    const { error: wrong } = await supabase.auth.signInWithPassword({ email, password: form.password })
    if (wrong) {
      setBusy(false)
      return setError(wrong.status === 400 ? tr('პაროლი არასწორია.', 'Wrong password.') : tr('ვერ შემოწმდა. სცადე ცოტა ხანში.', 'Could not check. Try again soon.'))
    }
    const changes = { full_name: form.full_name.trim(), ...(employer ? { company_name: form.company_name.trim() } : {}) }
    const { error } = await supabase.from('profiles').update(changes).eq('id', profile.id)
    if (error) {
      setBusy(false)
      return setError(tr('ვერ შეინახა. სცადე თავიდან.', 'Could not save. Try again.'))
    }
    // კომპანიის ახალი სახელი უკვე გამოქვეყნებულ ვაკანსიებზეც უნდა გამოჩნდეს
    if (employer && changes.company_name !== profile.company_name) await supabase.from('jobs').update({ company: changes.company_name }).eq('employer_id', profile.id)
    onSaved(changes)
    onClose()
  }

  return (
    <Sheet onClose={busy ? undefined : onClose}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <h2 className="text-[20px] font-bold">{employer ? tr('მონაცემების შეცვლა', 'Change your details') : tr('სახელის შეცვლა', 'Change your name')}</h2>
          <p className="text-[15px] text-muted">{tr('დასადასტურებლად შეიყვანე პაროლი.', 'Enter your password to confirm.')}</p>
        </div>
        {employer && (
          <label className="block">
            <span className={label}>{tr('კომპანიის სახელი', 'Company name')}</span>
            <input required minLength={2} maxLength={80} className={input} value={form.company_name} onChange={set('company_name')} />
          </label>
        )}
        <label className="block">
          <span className={label}>{employer ? tr('საკონტაქტო პირი', 'Contact person') : tr('სახელი და გვარი', 'Full name')}</span>
          <input required minLength={2} maxLength={80} className={input} value={form.full_name} onChange={set('full_name')} />
        </label>
        <label className="block">
          <span className={label}>{tr('პაროლი', 'Password')}</span>
          <input required type="password" autoComplete="current-password" className={input} value={form.password} onChange={set('password')} />
        </label>
        {error && <p className="text-[14px] font-medium text-coral">{error}</p>}
        <button disabled={busy} className={btn}>{busy ? tr('ინახება…', 'Saving…') : tr('შენახვა', 'Save')}</button>
      </form>
    </Sheet>
  )
}

// სივი: საჩვენებლად, „რედაქტირების“ ღილაკით იხსნება
function Cv({ profile, onSaved }) {
  useLang()
  const cvDone = Boolean(profile.cv_experience || profile.cv_skills || profile.cv_languages || profile.cv_path)
  const [editing, setEditing] = useState(!cvDone)
  const [note, setNote] = useState(null)
  async function openPdf() {
    const { data } = await supabase.storage.from('cvs').createSignedUrl(profile.cv_path, 600)
    if (data) window.open(data.signedUrl, '_blank', 'noopener')
  }
  return (
    <section className={`${card} p-4`} data-cv>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[18px] font-bold">{tr('სივი', 'CV')}</h2>
          <Badge tone={cvDone ? 'green' : 'amber'}>{cvDone ? tr('შევსებულია', 'Filled in') : tr('შესავსებია', 'To fill in')}</Badge>
        </div>
        {!editing && <button onClick={() => { setEditing(true); setNote(null) }} className={`${btnSm2} flex items-center gap-1.5`}><Icon name="edit" className="h-4 w-4" />{tr('რედაქტირება', 'Edit')}</button>}
      </div>
      {note && <p className={`mb-3 text-[14px] font-medium ${note.ok ? 'text-mint-dark' : 'text-coral'}`}>{note.text}</p>}
      {editing ? (
        <CvForm profile={profile} onSaved={onSaved} canCancel={cvDone} setNote={setNote} onClose={() => setEditing(false)} />
      ) : (
        <dl className="space-y-2">
          <Fact name={tr('გამოცდილება', 'Experience')} value={profile.cv_experience} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Fact name={tr('უნარები', 'Skills')} value={profile.cv_skills} />
            <Fact name={tr('ენები', 'Languages')} value={profile.cv_languages} />
          </div>
          {profile.cv_path && (
            <button onClick={openPdf} className="flex w-full items-center gap-2 rounded-2xl bg-bg px-4 py-3 text-left text-[15px] font-semibold hover:bg-fill">
              <Icon name="doc" className="h-5 w-5 text-brand-deep" />{tr('PDF სივის ნახვა', 'Open the PDF CV')}
            </button>
          )}
        </dl>
      )}
    </section>
  )
}

const Fact = ({ name, value }) => (
  <div className="rounded-2xl bg-bg px-4 py-3">
    <dt className="text-[12px] text-muted">{name}</dt>
    <dd className={`whitespace-pre-wrap break-words text-[15px] ${value ? '' : 'text-quiet'}`}>{value || tr('არ არის შევსებული', 'Not filled in')}</dd>
  </div>
)

function CvForm({ profile, onSaved, canCancel, setNote, onClose }) {
  const [form, setForm] = useState({ cv_experience: profile.cv_experience ?? '', cv_skills: profile.cv_skills ?? '', cv_languages: profile.cv_languages ?? '' })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function save(e) {
    e.preventDefault()
    const { error } = await supabase.from('profiles').update(form).eq('id', profile.id)
    if (error) return setNote({ text: tr('ვერ შეინახა. სცადე თავიდან.', 'Could not save. Try again.') })
    onSaved(form)
    setNote({ ok: true, text: tr('შენახულია', 'Saved') })
    onClose()
  }
  async function upload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') return setNote({ text: tr('მხოლოდ PDF ფაილი.', 'PDF files only.') })
    if (file.size > 5 * 1024 * 1024) return setNote({ text: tr('ფაილი 5 MB-ზე მეტია.', 'The file is larger than 5 MB.') })
    const path = `${profile.id}/cv.pdf`
    const { error } = await supabase.storage.from('cvs').upload(path, file, { upsert: true, contentType: 'application/pdf' })
    if (error) return setNote({ text: tr('ფაილი ვერ აიტვირთა. სცადე თავიდან.', 'The file could not be uploaded. Try again.') })
    await supabase.from('profiles').update({ cv_path: path }).eq('id', profile.id)
    onSaved({ cv_path: path })
    setNote({ ok: true, text: tr('PDF ატვირთულია', 'PDF uploaded') })
  }
  return (
    <form onSubmit={save} className="space-y-3.5">
      <label className="block">
        <span className={label}>{tr('გამოცდილება', 'Experience')}</span>
        <textarea className={`${input} resize-none`} rows={3} maxLength={1000} value={form.cv_experience} onChange={set('cv_experience')} placeholder={tr('მაგ. 3 თვე ბარისტად, 1 წელი გაყიდვებში', 'e.g. 3 months as a barista, 1 year in sales')} />
      </label>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <label className="block"><span className={label}>{tr('უნარები', 'Skills')}</span><input maxLength={200} className={input} value={form.cv_skills} onChange={set('cv_skills')} placeholder={tr('კომუნიკაცია, Excel', 'Communication, Excel')} /></label>
        <label className="block"><span className={label}>{tr('ენები', 'Languages')}</span><input maxLength={200} className={input} value={form.cv_languages} onChange={set('cv_languages')} placeholder={tr('ინგლისური B2', 'English B2')} /></label>
      </div>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-field px-4 py-4 hover:border-brand-deep">
        <span className="flex items-center gap-2 font-medium"><Icon name="doc" className="h-5 w-5 text-brand-deep" />{profile.cv_path ? tr('PDF სივი ატვირთულია', 'PDF CV uploaded') : tr('PDF სივი (არასავალდებულო)', 'PDF CV (optional)')}</span>
        <span className="font-semibold text-brand-deep">{profile.cv_path ? tr('შეცვლა', 'Replace') : tr('ატვირთვა', 'Upload')}</span>
        <input type="file" accept="application/pdf" className="hidden" onChange={upload} />
      </label>
      <div className={`grid gap-2.5 ${canCancel ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {canCancel && <button type="button" onClick={onClose} className={btn2}>{tr('გაუქმება', 'Cancel')}</button>}
        <button className={btn}>{tr('შენახვა', 'Save')}</button>
      </div>
    </form>
  )
}
