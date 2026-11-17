import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { tr, useLang } from '../lib/i18n.js'
import { readCv } from '../lib/cv.js'
import { UNIVERSITIES, YEARS, studyLine, yearText } from '../lib/student.js'
import { Badge, Icon, Sheet, btn, btn2, card, input, label } from './ui.jsx'

const sectionTitle = 'text-[20px] font-bold tracking-[-0.01em]'
const pencil = 'grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink/80 text-ink transition hover:bg-fill active:scale-95'
const LANGS = [['ქართული', 'Georgian'], ['ინგლისური', 'English'], ['რუსული', 'Russian'], ['გერმანული', 'German'], ['ფრანგული', 'French'], ['თურქული', 'Turkish'], ['ესპანური', 'Spanish'], ['იტალიური', 'Italian'], ['სომხური', 'Armenian'], ['აზერბაიჯანული', 'Azerbaijani']]
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native']
const levelText = (l) => (l === 'native' ? tr('მშობლიური', 'native') : l)

// უნივერსიტეტი (სიიდან ან ჩაწერით), ფაკულტეტი, კურსი. რეგისტრაციაშიც გამოიყენება
export function StudyFields({ value, onChange }) {
  useLang()
  const set = (k) => (e) => onChange({ ...value, [k]: k === 'year' ? Number(e.target.value) || null : e.target.value })
  return (
    <div className="space-y-3.5">
      <label className="block">
        <span className={label}>{tr('უნივერსიტეტი', 'University')}</span>
        <input required minLength={2} maxLength={120} list="sm-universities" className={input} value={value.university ?? ''} onChange={set('university')} placeholder={tr('აირჩიე ან ჩაწერე', 'Pick or type')} data-university />
        <datalist id="sm-universities">{UNIVERSITIES.map((u) => <option key={u} value={u} />)}</datalist>
      </label>
      <div className="grid grid-cols-[1fr_auto] gap-2.5">
        <label className="block min-w-0">
          <span className={label}>{tr('ფაკულტეტი', 'Faculty')}</span>
          <input maxLength={120} className={input} value={value.faculty ?? ''} onChange={set('faculty')} placeholder={tr('მაგ. ბიზნესი', 'e.g. Business')} />
        </label>
        <label className="block">
          <span className={label}>{tr('კურსი', 'Year')}</span>
          <select className={`${input} pr-8`} value={value.year ?? ''} onChange={set('year')} data-year>
            <option value="">—</option>
            {YEARS.map((y) => <option key={y} value={y}>{yearText(y)}</option>)}
          </select>
        </label>
      </div>
    </div>
  )
}

function SectionHead({ title, editable, onEdit, children }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className={sectionTitle}>{title}</h2>
      {children}
      {editable && <button onClick={onEdit} className={`${pencil} ml-auto`} aria-label={tr('რედაქტირება', 'Edit')}><Icon name="edit" className="h-4 w-4" /></button>}
    </div>
  )
}

// ჩემ შესახებ + სწავლა, გამოცდილება, ენები. editable-ზე ფანქარი ერთ რედაქტორს ხსნის
export function StudentSections({ profile, editable, onSaved }) {
  useLang()
  const [editor, setEditor] = useState(null) // null | {} | cv-ის მონაცემები
  const study = studyLine(profile)
  const exp = profile.experience ?? []
  const langs = profile.languages ?? []
  const open = () => setEditor({})
  const muted = 'mt-2 text-[15px] text-muted'
  return (
    <>
      <section className={`${card} p-5`} data-about>
        <SectionHead title={tr('ჩემ შესახებ', 'About me')} editable={editable} onEdit={open} />
        {study && <p className="mt-2 flex items-start gap-2 text-[15px] font-medium"><Icon name="cap" className="mt-0.5 h-[18px] w-[18px] shrink-0" />{study}</p>}
        {profile.about ? <p className="mt-2 whitespace-pre-wrap text-[15px]">{profile.about}</p> : <p className={muted}>{editable ? tr('2–3 წინადადება: რას სწავლობ, რა გაინტერესებს, როდის ხარ თავისუფალი.', 'Two or three sentences: what you study, what interests you, when you are free.') : tr('არ არის შევსებული', 'Not filled in')}</p>}
      </section>
      <section className={`${card} p-5`} data-experience>
        <SectionHead title={tr('გამოცდილება', 'Experience')} editable={editable} onEdit={open} />
        {exp.length ? (
          <ul className="mt-3 divide-y divide-line">
            {exp.map((e, i) => (
              <li key={i} className="py-3 first:pt-0 last:pb-0">
                {(e.role || e.place) && <p className="text-[16px] font-semibold">{[e.role, e.place].filter(Boolean).join(' · ')}</p>}
                {e.period && <p className="text-[13px] text-muted">{e.period}</p>}
                {e.text && <p className="mt-1 whitespace-pre-wrap text-[15px]">{e.text}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className={muted}>{editable ? tr('პირველი სამსახური? ჩაწერე მოხალისეობა, სტაჟირება ან პროექტი.', 'First job? Add volunteering, an internship or a project.') : tr('არ არის შევსებული', 'Not filled in')}</p>
        )}
      </section>
      <section className={`${card} p-5`} data-languages>
        <SectionHead title={tr('ენები', 'Languages')} editable={editable} onEdit={open} />
        {langs.length ? (
          <div className="mt-3 flex flex-wrap gap-2">{langs.map((l) => <span key={l} className="rounded-lg bg-fill px-3 py-1.5 text-[14px] font-medium">{l}</span>)}</div>
        ) : (
          <p className={muted}>{tr('არ არის შევსებული', 'Not filled in')}</p>
        )}
      </section>
      {editable && <CvCard profile={profile} onSaved={onSaved} onDraft={setEditor} />}
      {editor && <ProfileEditor profile={profile} draft={editor} onSaved={onSaved} onClose={() => setEditor(null)} />}
    </>
  )
}

// სივი: PDF-ის ატვირთვა და „შევსება სივიდან“ (AI ავსებს, მომხმარებელი ამოწმებს)
function CvCard({ profile, onSaved, onDraft }) {
  const [state, setState] = useState(null) // null | 'reading' | {error}
  async function fill(source) {
    setState('reading')
    try {
      onDraft({ ...(await readCv(source)), fromCv: true })
      setState(null)
    } catch (e) {
      const msg = e.message === 'empty'
        ? tr('ამ PDF-ში ტექსტი ვერ ვიპოვეთ (შეიძლება სკანირებული სურათია). შეავსე ხელით.', 'No text found in this PDF (it may be a scanned image). Fill it in by hand.')
        : e.message === '429' ? tr('ძალიან ბევრი მოთხოვნა. სცადე ცოტა ხანში.', 'Too many requests. Try again in a little while.')
        : tr('სივი ვერ წავიკითხეთ. სცადე თავიდან.', 'We could not read the CV. Try again.')
      setState({ error: msg })
    }
  }
  async function upload(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.type !== 'application/pdf') return setState({ error: tr('მხოლოდ PDF ფაილი.', 'PDF files only.') })
    if (file.size > 5 * 1024 * 1024) return setState({ error: tr('ფაილი 5 MB-ზე მეტია.', 'The file is larger than 5 MB.') })
    setState('reading')
    const path = `${profile.id}/cv.pdf`
    const { error } = await supabase.storage.from('cvs').upload(path, file, { upsert: true, contentType: 'application/pdf' })
    if (!error) {
      await supabase.from('profiles').update({ cv_path: path }).eq('id', profile.id)
      onSaved({ cv_path: path })
    }
    fill({ file })
  }
  async function openPdf() {
    const { data } = await supabase.storage.from('cvs').createSignedUrl(profile.cv_path, 600)
    if (data) window.open(data.signedUrl, '_blank', 'noopener')
  }
  const reading = state === 'reading'
  return (
    <section className={`${card} space-y-3 p-5`} data-cv>
      <div className="flex items-center gap-2.5">
        <h2 className={sectionTitle}>{tr('სივი', 'CV')}</h2>
        <Badge tone={profile.cv_path ? 'green' : 'amber'}>{profile.cv_path ? tr('ატვირთულია', 'Uploaded') : tr('არასავალდებულო', 'Optional')}</Badge>
      </div>
      <p className="text-[15px] text-muted">{tr('ატვირთე PDF სივი და პროფილს ავტომატურად შეგივსებთ. შენახვამდე ყველაფერს ნახავ და შეასწორებ.', 'Upload a PDF CV and we fill in your profile from it. You review everything before it is saved.')}</p>
      <label className={`flex cursor-pointer items-center justify-center gap-2 ${btn} ${reading ? 'pointer-events-none opacity-60' : ''}`}>
        <Icon name="doc" className="h-5 w-5" />{reading ? tr('ვკითხულობთ სივს…', 'Reading your CV…') : profile.cv_path ? tr('ახალი სივის ატვირთვა', 'Upload a new CV') : tr('სივის ატვირთვა და შევსება', 'Upload CV and fill in')}
        <input type="file" accept="application/pdf" className="sr-only" onChange={upload} disabled={reading} data-cv-input />
      </label>
      {profile.cv_path && !reading && (
        <div className="grid grid-cols-2 gap-2.5">
          <button onClick={() => fill({ path: profile.cv_path })} className={`${btn2} py-3`} data-cv-fill>{tr('შევსება სივიდან', 'Fill from CV')}</button>
          <button onClick={openPdf} className={`${btn2} py-3`}>{tr('PDF-ის ნახვა', 'Open PDF')}</button>
        </div>
      )}
      {state?.error && <p className="text-[14px] font-medium text-coral">{state.error}</p>}
    </section>
  )
}

const blankExp = () => ({ role: '', place: '', period: '', text: '' })
const pick = (cv, own) => (cv === undefined || cv === null || cv === '' ? own : cv)
const union = (a, b, n) => [...new Map([...a, ...b].map((s) => [s.toLowerCase(), s])).values()].slice(0, n)

// ერთი რედაქტორი: პროფესია, სწავლა, ჩემ შესახებ, გამოცდილება, ენები (+ სივიდან მოსული უნარები)
function ProfileEditor({ profile, draft, onSaved, onClose }) {
  useLang()
  const cv = draft.fromCv ? draft : {}
  const [f, setF] = useState(() => ({
    headline: pick(cv.headline, profile.headline ?? ''),
    university: pick(cv.university, profile.university ?? ''),
    faculty: pick(cv.faculty, profile.faculty ?? ''),
    year: pick(cv.year, profile.year ?? null),
    about: pick(cv.about, profile.about ?? ''),
    experience: cv.experience?.length ? cv.experience : profile.experience ?? [],
    languages: union(profile.languages ?? [], cv.languages ?? [], 10),
    skills: union(profile.skills ?? [], cv.skills ?? [], 20),
  }))
  const [lang, setLang] = useState({ name: LANGS[1][0], level: 'B2' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const setExp = (i, k, v) => setF({ ...f, experience: f.experience.map((e, j) => (j === i ? { ...e, [k]: v } : e)) })
  const addLang = () => {
    const name = LANGS.find(([ka, en]) => ka === lang.name || en === lang.name)
    const v = `${name ? tr(name[0], name[1]) : lang.name} ${levelText(lang.level)}`.trim()
    if (f.languages.length < 10 && !f.languages.some((l) => l.startsWith(v.split(' ')[0]))) setF({ ...f, languages: [...f.languages, v] })
  }

  async function save(e) {
    e.preventDefault()
    const experience = f.experience.map((x) => ({ role: x.role.trim(), place: x.place.trim(), period: x.period.trim(), text: x.text.trim() })).filter((x) => x.role || x.place || x.text)
    const row = { headline: f.headline.trim() || null, university: f.university.trim() || null, faculty: f.faculty.trim() || null, year: f.year || null, about: f.about.trim() || null, experience, languages: f.languages, skills: f.skills }
    if (!row.university) return setError(tr('უნივერსიტეტი სავალდებულოა.', 'University is required.'))
    setBusy(true)
    const { error } = await supabase.from('profiles').update(row).eq('id', profile.id)
    setBusy(false)
    if (error) return setError(tr('ვერ შეინახა. სცადე თავიდან.', 'Could not save. Try again.'))
    onSaved(row)
    onClose()
  }

  const x = (onClick, name) => <button type="button" onClick={onClick} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-fill" aria-label={tr(`წაშლა: ${name}`, `Remove ${name}`)}><Icon name="x" className="h-4 w-4" /></button>
  return (
    <Sheet onClose={busy ? undefined : onClose}>
      <form onSubmit={save} className="space-y-4" data-profile-editor>
        <div>
          <h2 className="text-[20px] font-bold">{tr('პროფილის რედაქტირება', 'Edit profile')}</h2>
          {draft.fromCv && <p className="mt-1 text-[14px] font-medium text-mint-dark" data-from-cv>{tr('სივიდან შევავსეთ. შეამოწმე და შეინახე.', 'Filled in from your CV. Check it and save.')}</p>}
        </div>
        <label className="block">
          <span className={label}>{tr('პროფესია / სპეციალობა', 'Profession / specialty')}</span>
          <input maxLength={80} className={input} value={f.headline} onChange={set('headline')} placeholder={tr('მაგ. ბარისტა, Front-end დეველოპერი', 'e.g. Barista, Front-end developer')} data-headline />
        </label>
        <StudyFields value={f} onChange={(v) => setF({ ...f, ...v })} />
        <label className="block">
          <span className={label}>{tr('ჩემ შესახებ', 'About me')}</span>
          <textarea rows={4} maxLength={600} className={`${input} resize-none`} value={f.about} onChange={set('about')} data-about-input />
        </label>

        <div className="space-y-2.5">
          <p className="text-[15px] font-semibold">{tr('გამოცდილება', 'Experience')}</p>
          {f.experience.map((e, i) => (
            <div key={i} className="space-y-2 rounded-2xl bg-bg p-3">
              <div className="flex gap-2">
                <input maxLength={80} className={input} value={e.role} onChange={(ev) => setExp(i, 'role', ev.target.value)} placeholder={tr('პოზიცია', 'Position')} aria-label={tr('პოზიცია', 'Position')} />
                {x(() => setF({ ...f, experience: f.experience.filter((_, j) => j !== i) }), e.role || tr('ჩანაწერი', 'entry'))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input maxLength={80} className={input} value={e.place} onChange={(ev) => setExp(i, 'place', ev.target.value)} placeholder={tr('სად', 'Where')} aria-label={tr('სად', 'Where')} />
                <input maxLength={40} className={input} value={e.period} onChange={(ev) => setExp(i, 'period', ev.target.value)} placeholder={tr('2024–2025', '2024–2025')} aria-label={tr('პერიოდი', 'Period')} />
              </div>
              <textarea rows={2} maxLength={200} className={`${input} resize-none`} value={e.text} onChange={(ev) => setExp(i, 'text', ev.target.value)} placeholder={tr('რას აკეთებდი (არასავალდებულო)', 'What you did (optional)')} aria-label={tr('აღწერა', 'Description')} />
            </div>
          ))}
          {f.experience.length < 10 && <button type="button" onClick={() => setF({ ...f, experience: [...f.experience, blankExp()] })} className={`${btn2} py-3`} data-add-experience>+ {tr('გამოცდილების დამატება', 'Add experience')}</button>}
        </div>

        <div className="space-y-2.5">
          <p className="text-[15px] font-semibold">{tr('ენები', 'Languages')}</p>
          {f.languages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {f.languages.map((l) => (
                <button type="button" key={l} onClick={() => setF({ ...f, languages: f.languages.filter((y) => y !== l) })} className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[14px] font-medium text-white" aria-label={tr(`წაშლა: ${l}`, `Remove ${l}`)}>
                  {l}<Icon name="x" className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-[1fr_auto_auto] gap-2">
            <select className={input} value={lang.name} onChange={(e) => setLang({ ...lang, name: e.target.value })} aria-label={tr('ენა', 'Language')} data-lang-name>
              {LANGS.map(([ka, en]) => <option key={ka} value={ka}>{tr(ka, en)}</option>)}
            </select>
            <select className={input} value={lang.level} onChange={(e) => setLang({ ...lang, level: e.target.value })} aria-label={tr('დონე', 'Level')}>
              {LEVELS.map((l) => <option key={l} value={l}>{levelText(l)}</option>)}
            </select>
            <button type="button" onClick={addLang} className="rounded-2xl bg-ink px-4 font-semibold text-white" data-add-lang>{tr('დამატება', 'Add')}</button>
          </div>
        </div>

        {draft.fromCv && f.skills.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-[15px] font-semibold">{tr('უნარები', 'Skills')}</p>
            <div className="flex flex-wrap gap-2">
              {f.skills.map((s) => (
                <button type="button" key={s} onClick={() => setF({ ...f, skills: f.skills.filter((y) => y !== s) })} className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[14px] font-medium text-white" aria-label={tr(`წაშლა: ${s}`, `Remove ${s}`)}>
                  {s}<Icon name="x" className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-[14px] font-medium text-coral">{error}</p>}
        <button disabled={busy} className={btn} data-save-profile>{busy ? tr('ინახება…', 'Saving…') : tr('შენახვა', 'Save')}</button>
      </form>
    </Sheet>
  )
}
