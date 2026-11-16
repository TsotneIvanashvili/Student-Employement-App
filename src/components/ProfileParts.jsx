import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { catName, monthShort, tr, useLang } from '../lib/i18n.js'
import { saveAvatar, shrinkImage } from '../lib/avatar.js'
import { useRatings } from '../lib/ratings.js'
import { tagText } from './Applicants.jsx'
import { Avatar, Icon, Sheet, Stars, btn, card, input } from './ui.jsx'

// სქილების მინიშნებები სფეროს მიხედვით; მომხმარებელს ნებისმიერის ჩაწერა შეუძლია
const SUGGEST = {
  service: [['ბარისტა', 'Barista'], ['მომხმარებლის მომსახურება', 'Customer service'], ['სალარო', 'Cashier'], ['მიმტანი', 'Waiter']],
  delivery: [['მართვის მოწმობა', "Driver's license"], ['ველოსიპედი', 'Bicycle'], ['ქალაქის ცოდნა', 'Knows the city']],
  trades: [['შეკეთება', 'Repairs'], ['ავეჯის აწყობა', 'Furniture assembly'], ['ელექტროობა', 'Electrical']],
  design: [['Figma', 'Figma'], ['Photoshop', 'Photoshop'], ['Canva', 'Canva'], ['Illustrator', 'Illustrator']],
  dev: [['React', 'React'], ['JavaScript', 'JavaScript'], ['Python', 'Python'], ['HTML/CSS', 'HTML/CSS']],
  events: [['ღონისძიების მოწყობა', 'Event setup'], ['ფოტოგრაფია', 'Photography'], ['ჰოსტესი', 'Host']],
  general: [['Excel', 'Excel'], ['ინგლისური ენა', 'English'], ['კომუნიკაცია', 'Communication'], ['გუნდური მუშაობა', 'Teamwork']],
}
const sectionTitle = 'text-[20px] font-bold tracking-[-0.01em]'
const pencil = 'grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink/80 text-ink transition hover:bg-fill active:scale-95'

// პროფილის თავი: ფოტო (საკუთარზე ფანქრით იცვლება), სახელი, სფერო, შეფასება
export function ProfileHeader({ profile, subtitle, rating, editable, onSaved }) {
  useLang()
  const [state, setState] = useState('')
  const name = profile.role === 'employer' ? profile.company_name || profile.full_name : profile.full_name
  async function pick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setState('saving')
    try {
      const url = await saveAvatar(profile.id, await shrinkImage(file), profile.avatar_url)
      onSaved({ avatar_url: url })
      setState('')
    } catch {
      setState('error')
    }
  }
  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <Avatar name={name} src={profile.avatar_url} size={84} radius={42} className={state === 'saving' ? 'opacity-50' : ''} />
        {editable && (
          <label className="absolute -bottom-1 -right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-line bg-white text-ink shadow-[0_1px_3px_rgba(21,24,30,.15)] hover:bg-fill" aria-label={tr('ფოტოს შეცვლა', 'Change photo')}>
            <Icon name="camera" className="h-[18px] w-[18px]" />
            <input type="file" accept="image/*" className="sr-only" onChange={pick} data-avatar-input />
          </label>
        )}
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 truncate text-[24px] font-bold tracking-[-0.02em]">
          <span className="truncate">{name}</span>
          <span role="img" aria-label={tr('ელფოსტა დადასტურებულია', 'Email verified')} title={tr('ელფოსტა დადასტურებულია', 'Email verified')} className="shrink-0 text-sky"><Icon name="shield" className="h-5 w-5" /></span>
        </p>
        <p className="truncate text-[14px] text-muted">{subtitle}</p>
        {rating && <div className="mt-1"><Stars value={rating.avg} count={rating.count} /></div>}
        {state === 'error' && <p className="mt-1 text-[13px] font-medium text-coral">{tr('ფოტო ვერ აიტვირთა. სცადე სხვა სურათი.', 'The photo could not be uploaded. Try another picture.')}</p>}
      </div>
    </div>
  )
}

// სქილები: ჩიპები; საკუთარ პროფილზე ფანქრით რედაქტირდება
export function SkillsCard({ profile, editable, onSaved }) {
  useLang()
  const [edit, setEdit] = useState(false)
  const skills = profile.skills ?? []
  return (
    <section className={`${card} p-5`} data-skills>
      <div className="flex items-center gap-3">
        <h2 className={sectionTitle}>{tr('უნარები', 'Skills')}</h2>
        {editable && <button onClick={() => setEdit(true)} className={pencil} aria-label={tr('უნარების რედაქტირება', 'Edit skills')}><Icon name="edit" className="h-4 w-4" /></button>}
      </div>
      {skills.length ? (
        <div className="mt-3.5 flex flex-wrap gap-2">{skills.map((s) => <span key={s} className="rounded-lg bg-fill px-3 py-1.5 text-[14px] font-medium">{s}</span>)}</div>
      ) : (
        <p className="mt-2 text-[15px] text-muted">{editable ? tr('დაამატე, რა იცი: დამსაქმებლები ამას პირველ რიგში ხედავენ.', 'Add what you can do: employers see this first.') : tr('უნარები არ არის მითითებული', 'No skills listed')}</p>
      )}
      {edit && <SkillsSheet profile={profile} onSaved={onSaved} onClose={() => setEdit(false)} />}
    </section>
  )
}

function SkillsSheet({ profile, onSaved, onClose }) {
  const [skills, setSkills] = useState(profile.skills ?? [])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const add = (s) => {
    const v = s.trim().slice(0, 40)
    if (!v || skills.some((x) => x.toLowerCase() === v.toLowerCase())) return setText('')
    if (skills.length >= 20) return setError(tr('მაქსიმუმ 20 უნარი.', 'At most 20 skills.'))
    setSkills([...skills, v])
    setText('')
  }
  const ideas = (SUGGEST[profile.field] ?? SUGGEST.general).concat(profile.field === 'general' ? [] : SUGGEST.general).map(([ka, en]) => tr(ka, en)).filter((s) => !skills.includes(s))
  async function save() {
    setBusy(true)
    const { error } = await supabase.from('profiles').update({ skills }).eq('id', profile.id)
    setBusy(false)
    if (error) return setError(tr('ვერ შეინახა. სცადე თავიდან.', 'Could not save. Try again.'))
    onSaved({ skills })
    onClose()
  }
  return (
    <Sheet onClose={busy ? undefined : onClose}>
      <h2 className="text-[20px] font-bold">{tr('უნარები', 'Skills')}</h2>
      <p className="mt-1 text-[15px] text-muted">{tr('ჩაწერე და დააჭირე Enter-ს, ან აირჩიე ქვემოთ.', 'Type one and press Enter, or pick from below.')}</p>
      <form onSubmit={(e) => { e.preventDefault(); add(text) }} className="mt-4 flex gap-2">
        <input className={input} maxLength={40} value={text} onChange={(e) => setText(e.target.value)} placeholder={tr('მაგ. ბარისტა, Excel', 'e.g. Barista, Excel')} aria-label={tr('ახალი უნარი', 'New skill')} />
        <button className="shrink-0 rounded-2xl bg-ink px-5 font-semibold text-white disabled:opacity-40" disabled={!text.trim()}>{tr('დამატება', 'Add')}</button>
      </form>
      {skills.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-2">
          {skills.map((s) => (
            <button key={s} onClick={() => setSkills(skills.filter((x) => x !== s))} className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[14px] font-medium text-white" aria-label={tr(`წაშლა: ${s}`, `Remove ${s}`)}>
              {s}<Icon name="x" className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          ))}
        </div>
      )}
      {ideas.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[13px] font-medium text-muted">{tr('მინიშნებები', 'Suggestions')}</p>
          <div className="flex flex-wrap gap-2">{ideas.map((s) => <button key={s} onClick={() => add(s)} className="rounded-lg border border-line px-3 py-1.5 text-[14px] hover:bg-fill">+ {s}</button>)}</div>
        </div>
      )}
      {error && <p className="mt-3 text-[14px] font-medium text-coral">{error}</p>}
      <button disabled={busy} onClick={save} className={`${btn} mt-5`}>{tr('შენახვა', 'Save')}</button>
    </Sheet>
  )
}

const when = (ts) => {
  const d = new Date(ts)
  return `${monthShort(d.getMonth())} ${d.getFullYear()}`
}

// სამუშაო ისტორია: მიმდინარე და დასრულებული სამუშაოები, დამსაქმებლის შეფასებით
export function WorkHistory({ personId, bare }) {
  useLang()
  const [items, setItems] = useState(null)
  useEffect(() => {
    supabase.rpc('work_history', { person: personId }).then(({ data }) => setItems(data ?? []))
  }, [personId])
  const body = (
    <>
      <h2 className={sectionTitle}>{tr('სამუშაო ისტორია', 'Work history')}</h2>
      {items?.length === 0 && <p className="mt-2 text-[15px] text-muted">{tr('ჯერ არცერთი სამუშაო', 'No jobs yet')}</p>}
      {items?.length > 0 && (
        <ul className="mt-2 divide-y divide-line">
          {items.map((w) => (
            <li key={w.application_id} className="py-3.5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[16px] font-bold leading-snug">{w.title}</p>
                {w.status === 'accepted' && <span className="shrink-0 rounded-full bg-mint-soft px-2.5 py-1 text-[12px] font-semibold text-mint-dark">{tr('მიმდინარე', 'In progress')}</span>}
              </div>
              <p className="text-[13px] text-muted">{w.company} · {catName(w.category)} · {when(w.started_at)} – {w.ended_at ? when(w.ended_at) : tr('ახლა', 'Now')}</p>
              {w.stars && (
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px]">
                  <Stars value={w.stars} />
                  {w.tags?.length > 0 && <span className="text-muted">{w.tags.map(tagText).join(' · ')}</span>}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
  return bare ? <div>{body}</div> : <section className={`${card} p-5`} data-history>{body}</section>
}

// სხვისი პროფილი (დამსაქმებელი ხედავს კანდიდატს): ფოტო, უნარები, ისტორია, სივი
export function PublicProfile({ person, personId, onClose }) {
  useLang()
  const rating = useRatings([personId])(personId)
  async function openPdf() {
    const { data } = await supabase.storage.from('cvs').createSignedUrl(person.cv_path, 600)
    if (data) window.open(data.signedUrl, '_blank', 'noopener')
  }
  return (
    <Sheet onClose={onClose}>
      <div className="space-y-5">
        <ProfileHeader profile={{ ...person, id: personId, role: 'student' }} subtitle={`${tr('სამუშაოს მაძიებელი', 'Job seeker')}${person.field ? ` · ${catName(person.field)}` : ''}`} rating={rating} />
        <div>
          <h2 className={sectionTitle}>{tr('უნარები', 'Skills')}</h2>
          {person.skills?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">{person.skills.map((s) => <span key={s} className="rounded-lg bg-fill px-3 py-1.5 text-[14px] font-medium">{s}</span>)}</div>
          ) : (
            <p className="mt-2 text-[15px] text-muted">{person.cv_skills || tr('უნარები არ არის მითითებული', 'No skills listed')}</p>
          )}
        </div>
        <WorkHistory personId={personId} bare />
        {(person.cv_experience || person.cv_languages || person.cv_path) && (
          <div className="space-y-2">
            <h2 className={sectionTitle}>{tr('სივი', 'CV')}</h2>
            {person.cv_experience && <p className="whitespace-pre-wrap text-[15px]">{person.cv_experience}</p>}
            {person.cv_languages && <p className="text-[14px] text-muted">{tr('ენები', 'Languages')}: {person.cv_languages}</p>}
            {person.cv_path && <button onClick={openPdf} className="flex items-center gap-2 text-[15px] font-semibold"><Icon name="doc" className="h-5 w-5" />{tr('PDF სივის ნახვა', 'Open the PDF CV')}</button>}
          </div>
        )}
      </div>
    </Sheet>
  )
}
