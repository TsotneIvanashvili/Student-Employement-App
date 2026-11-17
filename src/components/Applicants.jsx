import { studyLine } from '../lib/student.js'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { tr, useLang } from '../lib/i18n.js'
import { forgetRating, useRatings } from '../lib/ratings.js'
import { lari } from '../lib/money.js'
import { Avatar, Badge, Icon, Sheet, Stars, btn, btn2, btnDark, tap } from './ui.jsx'
import { Chat, ChatButton } from './Chat.jsx'
import { HireSheet, PaySheet, useEscrow } from './Wallet.jsx'
import { PublicProfile } from './ProfileParts.jsx'

export const STATUS_TONE = { sent: 'violet', accepted: 'green', rejected: 'red', done: 'dark' }
export function statusText(status, side = 'employer') {
  if (side === 'seeker') return { sent: tr('გაგზავნილია', 'Sent'), accepted: tr('აგიყვანეს', 'Hired'), rejected: tr('უარი', 'Declined'), done: tr('დასრულდა', 'Completed') }[status]
  return { sent: tr('ახალი', 'New'), accepted: tr('აყვანილია', 'Hired'), rejected: tr('უარყოფილია', 'Declined'), done: tr('დასრულდა', 'Completed') }[status]
}

// ერთი განაცხადი დამსაქმებლისთვის: სივი, წერილი, ტელეფონი; აყვანა/უარყოფა; დასრულება და შეფასება.
export function ApplicantCard({ app, job, showJob = false, onChanged, unread = 0 }) {
  useLang()
  const [confirm, setConfirm] = useState(null) // 'rejected' | 'done'
  const [sheet, setSheet] = useState(null) // 'hire' | 'pay' | 'profile' | 'chat'
  const escrow = useEscrow(['accepted', 'done'].includes(app.status) ? app.id : null)
  const [rate, setRate] = useState(false)
  const [rated, setRated] = useState(0)
  const [open, setOpen] = useState(app.status !== 'rejected')
  const [error, setError] = useState('')
  const rating = useRatings([app.student_id])
  const p = app.profiles
  const r = rating(app.student_id)

  async function setStatus(status) {
    // უარი პირდაპირ იწერება; დასრულება (ფიქსირებული ფასი) სერვერის ფუნქციით, რომელიც დეპოზიტს მუშაკს ურიცხავს
    const { error } = status === 'done' ? await supabase.rpc('finish_job', { app: app.id }) : await supabase.from('applications').update({ status }).eq('id', app.id)
    if (error) return setError(tr('ვერ შეინახა. სცადე თავიდან.', 'Could not save. Try again.'))
    setConfirm(null)
    window.dispatchEvent(new Event('sm-money'))
    onChanged()
  }
  async function openPdf() {
    const { data } = await supabase.storage.from('cvs').createSignedUrl(p.cv_path, 600)
    if (data) window.open(data.signedUrl, '_blank', 'noopener')
  }

  const ask = {
    rejected: [tr(`უარს ეტყვი ${p.full_name}-ს?`, `Decline ${p.full_name}?`), tr('კანდიდატი დაინახავს, რომ განაცხადი უარყოფილია.', 'The candidate will see that the application was declined.'), tr('უარყოფა', 'Decline')],
    done: [
      tr('სამუშაო დასრულდა?', 'Is the work done?'),
      escrow?.held > 0
        ? tr(`დეპოზიტიდან ${lari(escrow.held)} ჩაერიცხება ${p.full_name}-ს, 10%-იანი საკომისიოს გამოკლებით. ამის შემდეგ ერთმანეთს შეაფასებთ.`, `${lari(escrow.held)} from the deposit goes to ${p.full_name}, minus the 10% fee. Then you can rate each other.`)
        : tr('ამის შემდეგ ერთმანეთს შეაფასებთ. დასრულებულ სამუშაოს ვეღარ შეცვლი.', 'After this you can rate each other. Completed work cannot be changed.'),
      tr('დადასტურება', 'Confirm'),
    ],
  }

  return (
    <li className="px-4 py-4 sm:px-5">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-3 text-left">
        <Avatar name={p.full_name} src={p.avatar_url} size={42} radius={21} />
        <span className="block min-w-0 flex-1">
          <span className="block truncate text-[16px] font-bold">{p.full_name}</span>
          <span className="flex min-w-0 items-center gap-2 text-[13px] text-muted">
            <span className="truncate">{showJob ? job.title : p.headline || p.university || tr('სტუდენტი', 'Student')}</span>
            {r && <Stars value={r.avg} />}
          </span>
        </span>
        {unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1.5 text-[11px] font-bold text-white" aria-label={tr('ახალი შეტყობინება', 'New message')}>{unread}</span>}
        <Badge tone={STATUS_TONE[app.status]}>{statusText(app.status)}</Badge>
        <Icon name="chevron" className={`h-5 w-5 shrink-0 text-quiet transition ${open ? 'rotate-90' : ''}`} strokeWidth={2.5} />
      </button>

      {open && (
        <div className="mt-3.5 space-y-3">
          {app.message && <p className="rounded-2xl bg-bg p-3 text-[14px]">„{app.message}“</p>}
          {p.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">{p.skills.map((s) => <span key={s} className="rounded-full bg-fill px-2.5 py-1 text-[12px] font-medium">{s}</span>)}</div>
          )}
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[[tr('სწავლა', 'Studies'), studyLine(p)], [tr('გამოცდილება', 'Experience'), (p.experience ?? []).map((e) => [e.role, e.place].filter(Boolean).join(' · ') || e.text).join('\n') || p.cv_experience], [tr('ენები', 'Languages'), p.languages?.join(', ') || p.cv_languages]].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-bg px-3 py-2.5">
                <dt className="text-[12px] text-muted">{k}</dt>
                <dd className="whitespace-pre-wrap break-words text-[14px]">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-semibold">
            {app.phone && <a href={`tel:${app.phone}`} className="flex items-center gap-1.5 text-ink"><Icon name="phone" className="h-5 w-5" />{app.phone}</a>}
            {p.cv_path && <button onClick={openPdf} className="flex items-center gap-1.5"><Icon name="doc" className="h-5 w-5" />{tr('სივის PDF', 'CV (PDF)')}</button>}
            {r && <Stars value={r.avg} count={r.count} />}
            <button onClick={() => setSheet('profile')} className="flex items-center gap-1.5"><Icon name="profile" className="h-5 w-5" />{tr('პროფილის ნახვა', 'View profile')}</button>
          </div>
          {app.status === 'sent' && (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button onClick={() => setConfirm('rejected')} className={btn2}>{tr('უარყოფა', 'Decline')}</button>
              <button onClick={() => setSheet('hire')} className={btn}>{tr('აყვანა', 'Hire')}</button>
            </div>
          )}
          {app.status === 'accepted' && (
            <>
              <p className="rounded-2xl bg-brand-soft p-3 text-[13px] text-ink">
                {escrow
                  ? tr(`აყვანილია: ცვლები მის კალენდარშია. დეპოზიტში: ${lari(escrow.held)}, ჩარიცხული: ${lari(escrow.paid_total)}.`, `Hired: the shifts are in their calendar. On deposit: ${lari(escrow.held)}, paid so far: ${lari(escrow.paid_total)}.`)
                  : tr('აყვანილია: ცვლები მის კალენდარშია. როცა სამუშაო დასრულდება, დაადასტურე და შეაფასე.', 'Hired: the shifts are in their calendar. When the work is done, confirm it and rate them.')}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <ChatButton unread={unread} onClick={() => setSheet('chat')} />
                {escrow && escrow.unit !== 'fixed' ? (
                  <button onClick={() => setSheet('pay')} className={btn}>{tr('ნამუშევრის გადახდა', 'Pay for work')}</button>
                ) : (
                  <button onClick={() => setConfirm('done')} className={btn}>{tr('სამუშაო დასრულდა', 'The work is done')}</button>
                )}
              </div>
            </>
          )}
          {app.status === 'done' && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <ChatButton unread={unread} onClick={() => setSheet('chat')} />
              <RateButton key={rated} applicationId={app.id} who={p.full_name} onOpen={() => setRate(true)} />
            </div>
          )}
        </div>
      )}

      {confirm && (
        <Sheet onClose={() => setConfirm(null)}>
          <h2 className="text-[20px] font-bold">{ask[confirm][0]}</h2>
          <p className="mt-1 text-[15px] text-muted">{ask[confirm][1]}</p>
          {error && <p className="mt-2 text-[14px] font-medium text-coral">{error}</p>}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button onClick={() => setConfirm(null)} className={btn2}>{tr('გაუქმება', 'Cancel')}</button>
            <button onClick={() => setStatus(confirm)} className={btn}>{ask[confirm][2]}</button>
          </div>
        </Sheet>
      )}
      {rate && <RateSheet applicationId={app.id} who={p.full_name} side="worker" rateeId={app.student_id} onClose={() => setRate(false)} onDone={() => setRated((n) => n + 1)} />}
      {sheet === 'hire' && <HireSheet app={app} job={job} who={p.full_name} onClose={() => setSheet(null)} onDone={() => { setSheet(null); onChanged() }} />}
      {sheet === 'pay' && escrow && <PaySheet app={app} job={job} escrow={escrow} who={p.full_name} onClose={() => setSheet(null)} onDone={() => { setSheet(null); onChanged() }} />}
      {sheet === 'profile' && <PublicProfile person={p} personId={app.student_id} onClose={() => setSheet(null)} />}
      {sheet === 'chat' && <Chat app={app.id} me={job.employer_id} title={p.full_name} subtitle={job.title} avatar={p.avatar_url} onClose={() => setSheet(null)} />}
    </li>
  )
}

// „შეაფასე“ ღილაკი ან უკვე დაწერილი შეფასება
export function RateButton({ applicationId, who, onOpen, dark }) {
  const [mine, setMine] = useState(undefined)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) =>
      supabase.from('reviews').select('stars').eq('application_id', applicationId).eq('rater_id', data.session?.user.id).maybeSingle().then(({ data: r }) => setMine(r)),
    )
  }, [applicationId])
  if (mine === undefined) return null
  if (mine) {
    return (
      <div className={`flex items-center justify-between rounded-2xl px-4 py-3 text-[14px] font-semibold ${dark ? 'bg-white/10' : 'bg-bg'}`}>
        <span>{tr('შეფასებულია', 'Rated')}</span>
        <span className="tracking-[1px] text-[#e5a100]">{'★'.repeat(mine.stars)}<span className="opacity-30">{'★'.repeat(5 - mine.stars)}</span></span>
      </div>
    )
  }
  return (
    <button onClick={onOpen} className={dark ? `${btn} py-3.5 text-[14px]` : btnDark}>
      {tr(`შეაფასე: ${who}`, `Rate ${who}`)}
    </button>
  )
}

const TAGS = {
  worker: [['პუნქტუალური', 'Punctual'], ['კომუნიკაბელური', 'Good communication'], ['ხარისხიანი სამუშაო', 'Quality work']],
  employer: [['დროული ანაზღაურება', 'Paid on time'], ['მკაფიო დავალება', 'Clear brief'], ['პატივისცემით მოპყრობა', 'Respectful']],
}

// ვარსკვლავები 1–5 და მოკლე ნიშნები. side: ვის აფასებენ (worker | employer)
export function RateSheet({ applicationId, who, side, rateeId, onClose, onDone }) {
  useLang()
  const [stars, setStars] = useState(0)
  const [tags, setTags] = useState([])
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function submit() {
    setSending(true)
    const { error } = await supabase.from('reviews').insert({ application_id: applicationId, ratee_id: rateeId, stars, tags })
    setSending(false)
    if (error) return setError(tr('შეფასება ვერ გაიგზავნა. სცადე თავიდან.', 'The rating could not be sent. Try again.'))
    forgetRating(rateeId)
    onClose()
    onDone?.()
  }

  return (
    <Sheet onClose={onClose}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div>
          <p className="text-[13px] text-muted">{tr('შეაფასე', 'Rate')}</p>
          <h2 className="text-[22px] font-bold tracking-[-0.01em]">{who}</h2>
        </div>
        <div className="flex gap-1" role="radiogroup" aria-label={tr('ვარსკვლავები', 'Stars')}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} role="radio" aria-checked={stars === n} aria-label={`${n}`} onClick={() => setStars(n)} className={`h-[52px] w-[52px] text-[38px] leading-none transition active:scale-90 ${n <= stars ? 'text-[#e5a100]' : 'text-[#d5dad8]'}`}>★</button>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {TAGS[side].map(([ka, en]) => {
            const on = tags.includes(en)
            return (
              <button key={en} onClick={() => setTags(on ? tags.filter((x) => x !== en) : [...tags, en])} className={`rounded-[18px] px-3.5 py-2.5 text-[13px] font-semibold ${tap} ${on ? 'bg-ink text-white' : 'bg-fill text-ink'}`}>
                {tr(ka, en)}
              </button>
            )
          })}
        </div>
        {error && <p className="text-[14px] font-medium text-coral">{error}</p>}
        <button disabled={!stars || sending} onClick={submit} className={btn}>{tr('შეფასების გაგზავნა', 'Submit rating')}</button>
      </div>
    </Sheet>
  )
}

// შეფასების ნიშნები ინგლისურადაა შენახული; ჩვენებისას ითარგმნება
export const tagText = (en) => {
  const all = [...TAGS.worker, ...TAGS.employer]
  const hit = all.find(([, e]) => e === en)
  return hit ? tr(hit[0], hit[1]) : en
}
