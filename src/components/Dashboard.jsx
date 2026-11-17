import { profileFilled } from '../lib/student.js'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { todayISO } from '../lib/match.js'
import { addDays, clashOf, dayNumber, eventsOn, fitInfo, fmtMin, jobEvents, startOfWeek, weekdayOf } from '../lib/schedule.js'
import { dayShort, payText, tr, useLang } from '../lib/i18n.js'
import { useRatings } from '../lib/ratings.js'
import { JobCard, listBox, openJob } from './Jobs.jsx'
import { RateButton, RateSheet, STATUS_TONE, statusText } from './Applicants.jsx'
import { Chat, ChatButton } from './Chat.jsx'
import { EscrowLine } from './Wallet.jsx'
import { Avatar, Badge, Empty, Icon, RoundAdd, card, tap } from './ui.jsx'

const DAY_START = 8 * 60
const DAY_END = 22 * 60
const firstName = (name) => (name || '').trim().split(/\s+/)[0]

// დღის დაკავებული მონაკვეთები 8:00–22:00 შუალედში და თავისუფალი წუთები
function dayBusy(events, date) {
  const list = eventsOn(events, date)
    .map((e) => [Math.max(DAY_START, e.start_min), Math.min(DAY_END, e.end_min)])
    .filter(([a, b]) => b > a)
    .sort((x, y) => x[0] - y[0])
  let free = 0
  let cur = DAY_START
  list.forEach(([a, b]) => {
    if (a > cur) free += a - cur
    cur = Math.max(cur, b)
  })
  if (cur < DAY_END) free += DAY_END - cur
  return { list, free }
}
export const weekFreeHours = (events, today = todayISO()) => {
  const mon = startOfWeek(today)
  return Math.round(Array.from({ length: 7 }, (_, i) => dayBusy(events, addDays(mon, i)).free).reduce((a, b) => a + b, 0) / 60)
}

const Hello = ({ name, src, sub, onAvatar, action }) => (
  <div className="mb-3.5 flex items-center justify-between gap-3 px-1">
    <div className="min-w-0">
      <p className="text-[14px] text-muted">{sub ?? `${tr('გამარჯობა', 'Hello')},`}</p>
      <h1 className="truncate text-[26px] font-bold leading-tight tracking-[-0.02em] lg:text-[32px]">{firstName(name)}</h1>
    </div>
    {action ?? (
      <button onClick={onAvatar} aria-label={tr('პროფილი', 'Profile')} className={`shrink-0 rounded-full lg:hidden ${tap}`}>
        <Avatar name={name} src={src} size={44} radius={22} />
      </button>
    )}
  </div>
)

// მაძიებლის მთავარი (დიზაინის ვარიანტი B): კვირის თავისუფალი საათები დღეების მიხედვით
export function SeekerHome({ profile, busy, jobs, applications, unread = {}, go, askAI }) {
  const [chat, setChat] = useState(null)
  useLang()
  const today = todayISO()
  const mon = startOfWeek(today)
  const week = Array.from({ length: 7 }, (_, i) => addDays(mon, i))
  const [sel, setSel] = useState(today)
  const [rate, setRate] = useState(null)
  const [rated, setRated] = useState(0)
  const rating = useRatings(jobs.map((j) => j.employer_id))
  const hasSchedule = busy.some((e) => e.kind === 'lesson')

  // რომელი ვაკანსიის ცვლა ჯდება კონკრეტული დღის თავისუფალ დროში
  const fitsOn = useMemo(() => {
    const live = jobs.filter((j) => !fitInfo(j, busy).expired)
    return (date) =>
      live.filter((job) => {
        const others = busy.filter((e) => e.job_id !== job.id)
        return job.shifts.some((s) => (s.date ? s.date === date : s.day === weekdayOf(date)) && (!s.date || s.date >= today) && !clashOf(s, others))
      })
  }, [jobs, busy, today])

  const days = week.map((d) => ({ date: d, ...dayBusy(busy, d), n: fitsOn(d).length }))
  const freeHours = Math.round(days.reduce((a, d) => a + d.free, 0) / 60)
  const list = fitsOn(sel).slice(0, 4)
  const current = applications.find((a) => a.status === 'accepted' || a.status === 'done')
  const pending = applications.filter((a) => a.status === 'sent').length
  const cvDone = profileFilled(profile)

  return (
    <div className="mx-auto max-w-3xl space-y-3.5">
      <Hello name={profile.full_name} src={profile.avatar_url} onAvatar={() => go('profile')} />

      {!hasSchedule && (
        <section className="space-y-2.5">
          <div className="px-1">
            <h2 className="text-[20px] font-bold tracking-[-0.01em]">{tr('როდის ხარ დაკავებული?', 'When are you busy?')}</h2>
            <p className="text-[14px] text-muted">{tr('მონიშნე ლექციები და სხვა საქმეები. დანარჩენი დრო თავისუფლად ჩაითვლება.', 'Mark lectures and other commitments. Everything else counts as free time.')}</p>
          </div>
          <button onClick={() => go('calendar')} className={`${card} flex w-full items-center gap-3.5 p-[18px] text-left ${tap}`}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-soft text-sky"><Icon name="calendar" /></span>
            <span className="block"><span className="block text-[16px] font-semibold">{tr('თავად შევავსებ', "I'll fill it in myself")}</span><span className="block text-[13px] text-muted">{tr('შეეხე კალენდარს და დაამატე დაკავებული დრო', 'Tap the calendar to add busy time')}</span></span>
          </button>
          <button onClick={() => askAI(tr('ლექციები მაქვს ორშაბათს, ოთხშაბათს და პარასკევს 10-დან 14-მდე', 'I have lectures on Mon, Wed and Fri from 10 to 14'))} className={`${card} flex w-full items-center gap-3.5 p-[18px] text-left ${tap}`}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-deep"><Icon name="ai" /></span>
            <span className="block"><span className="block text-[16px] font-semibold">{tr('AI ასისტენტი დამეხმაროს', 'Let the AI assistant help')}</span><span className="block text-[13px] text-muted">{tr('მიწერე განრიგი სიტყვებით', 'Describe your timetable in words')}</span></span>
          </button>
        </section>
      )}

      <section className={`${card} p-[18px]`} data-tour="matches">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[13px] text-muted">{tr('თავისუფალი საათები ამ კვირაში', 'Free hours this week')}</p>
            <p className="text-[30px] font-bold leading-[1.1] tracking-[-0.02em] tabular-nums">{freeHours} <span className="text-[15px] font-semibold text-muted">{tr('სთ', 'h')}</span></p>
          </div>
          <button onClick={() => go('calendar')} className="py-1.5 text-[13px] font-semibold text-brand-deep">{tr('კალენდარი', 'Calendar')}</button>
        </div>
        <div className="mt-3.5 grid grid-cols-7 gap-1.5">
          {days.map((d) => (
            <button
              key={d.date}
              onClick={() => setSel(d.date)}
              aria-pressed={sel === d.date}
              aria-label={`${dayShort(weekdayOf(d.date))} ${dayNumber(d.date)}: ${d.n}`}
              className={`flex flex-col items-center gap-1.5 rounded-2xl pb-1.5 pt-2 transition-colors ${tap} ${sel === d.date ? 'bg-brand-soft' : ''}`}
            >
              <span className={`text-[11px] font-semibold ${d.date === today ? 'text-brand-deep' : ''}`}>{dayShort(weekdayOf(d.date))}</span>
              <span className="relative block h-[84px] w-3.5 overflow-hidden rounded-[7px] bg-brand">
                {d.list.map(([a, b], i) => (
                  <span key={i} className="absolute inset-x-0 bg-field" style={{ top: `${((a - DAY_START) / (DAY_END - DAY_START)) * 100}%`, height: `${((b - a) / (DAY_END - DAY_START)) * 100}%` }} />
                ))}
              </span>
              <span className="text-[12px] font-bold tabular-nums text-brand-deep">{d.n}</span>
            </button>
          ))}
        </div>
        <div className="mt-2.5 flex gap-3.5 text-[11px] text-muted">
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-[3px] bg-brand" />{tr('თავისუფალი', 'Free')}</span>
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-[3px] bg-field" />{tr('დაკავებული', 'Busy')}</span>
          <span className="ml-auto">{tr('რიცხვი: მორგებული ვაკანსიები', 'Number: jobs that fit')}</span>
        </div>
      </section>

      {current && (
        <section className="space-y-3 rounded-3xl bg-ink p-[18px] text-white">
          <button onClick={() => openJob(current.jobs.id)} className="flex w-full items-center justify-between gap-2.5 text-left">
            <span className="min-w-0">
              <span className="block text-[12px] text-[#b9c1c9]">{tr('მიმდინარე სამუშაო', 'Current job')}</span>
              <span className="block truncate text-[16px] font-semibold">{current.jobs.title} · {current.jobs.company}</span>
            </span>
            <span className="shrink-0 text-[16px] font-bold tabular-nums">{payText(current.jobs)}</span>
          </button>
          <p className="flex items-center gap-2 text-[13px] text-[#5fe3a1]">
            <i className="h-2 w-2 shrink-0 rounded-full bg-[#5fe3a1]" />
            {current.status === 'accepted' ? tr('აგიყვანეს: ცვლები შენს კალენდარშია', "You're hired: the shifts are in your calendar") : tr('სამუშაო დასრულდა', 'The work is done')}
          </p>
          <EscrowLine applicationId={current.id} dark />
          <div className={`grid gap-2.5 ${current.status === 'done' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            <ChatButton dark unread={unread[current.id]} onClick={() => setChat(current)} />
            {current.status === 'done' && <RateButton key={rated} dark applicationId={current.id} who={current.jobs.company} onOpen={() => setRate(current)} />}
          </div>
        </section>
      )}
      {chat && <Chat app={chat.id} me={profile.id} title={chat.jobs.company} subtitle={chat.jobs.title} onClose={() => setChat(null)} />}
      {rate && <RateSheet applicationId={rate.id} who={rate.jobs.company} side="employer" rateeId={rate.jobs.employer_id} onClose={() => setRate(null)} onDone={() => setRated((n) => n + 1)} />}

      <button onClick={() => askAI(tr('მიპოვე სამუშაო შაბათ-კვირისთვის', 'Find me work for Saturday and Sunday'))} className={`flex w-full items-center gap-3 rounded-[20px] bg-brand-soft px-4 py-3.5 text-left text-ink ${tap}`}>
        <Icon name="ai" className="h-[22px] w-[22px] shrink-0 text-brand-deep" />
        <span className="block flex-1">
          <span className="block text-[12px] font-semibold text-brand-deep">{tr('ჰკითხე AI-ს', 'Ask AI')}</span>
          <span className="block text-[14px] font-semibold">{tr('მიპოვე სამუშაო შაბათ-კვირისთვის', 'Find me work for Sat and Sun')}</span>
        </span>
        <Icon name="chevron" className="h-[18px] w-[18px] text-brand-deep" strokeWidth={2.5} />
      </button>

      {(!cvDone || pending > 0) && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {!cvDone && (
            <button onClick={() => go('profile')} className={`${card} flex items-center gap-3 p-4 text-left ${tap}`}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-soft text-amber"><Icon name="doc" className="h-5 w-5" /></span>
              <span className="block flex-1 text-[14px] font-semibold">{tr('შეავსე პროფილი (ან ატვირთე სივი), რომ განაცხადი გააგზავნო', 'Fill in your profile (or upload a CV) so you can apply')}</span>
            </button>
          )}
          {pending > 0 && (
            <button onClick={() => go('inbox')} className={`${card} flex items-center gap-3 p-4 text-left ${tap}`}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-soft text-violet"><Icon name="inbox" className="h-5 w-5" /></span>
              <span className="block flex-1 text-[14px] font-semibold">{tr(`${pending} განაცხადი პასუხს ელოდება`, `${pending} application${pending > 1 ? 's' : ''} waiting for a reply`)}</span>
            </button>
          )}
        </div>
      )}

      <div className="flex items-baseline justify-between px-1 pt-1">
        <h2 className="text-[18px] font-bold tracking-[-0.01em]">{tr('ვაკანსიები', 'Jobs')} · {dayShort(weekdayOf(sel))}</h2>
        <button onClick={() => go('jobs')} className="py-1.5 text-[13px] font-semibold text-brand-deep">{tr('ყველა', 'See all')}</button>
      </div>
      {list.length === 0 ? (
        <p className="rounded-3xl bg-white p-5 text-center text-[14px] text-muted">{tr('ამ დღეს შენს თავისუფალ დროში ვაკანსია არ არის', 'No jobs fit your free time on this day')}</p>
      ) : (
        <ul className={listBox}>{list.map((job) => <li key={job.id}><JobCard job={job} busy={busy} rating={rating(job.employer_id)} /></li>)}</ul>
      )}
    </div>
  )
}

const Tile = ({ icon, label, value }) => (
  <div className={`${card} flex min-w-0 items-center gap-3 p-3.5`}>
    <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-deep sm:grid"><Icon name={icon} className="h-5 w-5" /></span>
    <span className="min-w-0">
      <span className="block text-[22px] font-bold leading-none tabular-nums">{value}</span>
      <span className="mt-1 block text-[12px] leading-tight text-muted">{label}</span>
    </span>
  </div>
)

const Row = ({ onClick, left, title, sub, right }) => (
  <li>
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-[18px] bg-bg px-3.5 py-3 text-left hover:bg-fill ${tap}`}>
      {left}
      <span className="block min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold">{title}</span>
        {sub && <span className="block truncate text-[12px] text-muted">{sub}</span>}
      </span>
      {right}
    </button>
  </li>
)

// დამსაქმებლის მთავარი: ახალი განაცხადები, დღევანდელი ცვლები, ბოლო განაცხადები
export function EmployerHome({ profile, go }) {
  useLang()
  const today = todayISO()
  const [jobs, setJobs] = useState(null)
  useEffect(() => {
    supabase.from('jobs').select('*, applications(id, status, created_at, student_id, profiles(full_name))').eq('employer_id', profile.id).then(({ data }) => setJobs(data ?? []))
  }, [profile.id])

  const hello = <Hello name={profile.full_name} sub={profile.company_name || tr('დამსაქმებელი', 'Employer')} action={<RoundAdd tour="new" label={tr('ახალი ვაკანსია', 'New job post')} onClick={() => go('new')} />} />
  if (!jobs) return <div className="mx-auto max-w-3xl">{hello}</div>

  const open = jobs.filter((j) => j.is_open)
  const apps = jobs.flatMap((j) => j.applications.map((a) => ({ ...a, job: j }))).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  const fresh = apps.filter((a) => a.status === 'sent')
  const hired = apps.filter((a) => a.status === 'accepted' || a.status === 'done')
  const shifts = eventsOn(
    open.flatMap((job) => {
      const names = job.applications.filter((a) => a.status === 'accepted').map((a) => a.profiles.full_name)
      return jobEvents(job, { tone: names.length ? 'job' : 'open', subtitle: names.length ? names.join(', ') : tr('ჯერ არავინ', 'Nobody yet') })
    }),
    today,
  )

  return (
    <div className="mx-auto max-w-3xl space-y-3.5">
      {hello}
      {jobs.length === 0 ? (
        <Empty icon="briefcase" title={tr('დაამატე პირველი ვაკანსია', 'Post your first job')} text={tr('მონიშნე ცვლის საათები და მას დაინახავენ მხოლოდ ისინი, ვისაც ამ დროს სცალია.', 'Set the shift hours and only people who are free then will see it.')} action={<button onClick={() => go('new')} className="rounded-2xl bg-brand px-6 py-3.5 text-[15px] font-semibold text-on-brand">{tr('ვაკანსიის დამატება', 'Post a job')}</button>} />
      ) : (
        <button onClick={() => go('inbox')} className={`flex w-full items-center justify-between gap-3 rounded-3xl bg-ink p-[18px] text-left text-white ${tap}`}>
          <span>
            <span className="block text-[12px] text-[#b9c1c9]">{tr('ახალი განაცხადები', 'New applications')}</span>
            <span className="block text-[30px] font-bold leading-[1.1] tabular-nums">{fresh.length}</span>
            <span className="block text-[13px] text-white/75">{fresh.length ? tr('ნახე სივი და ტელეფონი, აიყვანე ან უთხარი უარი', 'See the CV and phone, hire or decline') : tr('ახალი განაცხადი ჯერ არ არის', 'No new applications yet')}</span>
          </span>
          <Icon name="chevron" className="h-5 w-5 shrink-0" strokeWidth={2.5} />
        </button>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        <Tile icon="briefcase" label={tr('ღია ვაკანსია', 'Open jobs')} value={open.length} />
        <Tile icon="users" label={tr('აყვანილი', 'Hired')} value={hired.length} />
        <Tile icon="inbox" label={tr('სულ განაცხადი', 'Applications')} value={apps.length} />
      </div>

      <section className={`${card} p-4`}>
        <div className="mb-2.5 flex items-baseline justify-between">
          <h2 className="text-[17px] font-bold">{tr('დღევანდელი ცვლები', "Today's shifts")}</h2>
          <button onClick={() => go('calendar')} className="text-[13px] font-semibold text-brand-deep">{tr('კალენდარი', 'Calendar')}</button>
        </div>
        {shifts.length === 0 ? (
          <p className="rounded-[18px] bg-bg px-4 py-3.5 text-[14px] text-muted">{tr('დღეს ცვლა არ არის დაგეგმილი.', 'No shifts planned for today.')}</p>
        ) : (
          <ul className="space-y-2">
            {shifts.map((e) => (
              <Row key={e.id} onClick={() => openJob(e.job_id)} left={<span className="w-[92px] shrink-0 text-[13px] font-semibold tabular-nums">{fmtMin(e.start_min)}–{fmtMin(e.end_min)}</span>} title={e.title} sub={e.subtitle} />
            ))}
          </ul>
        )}
      </section>

      <section className={`${card} p-4`}>
        <div className="mb-2.5 flex items-baseline justify-between">
          <h2 className="text-[17px] font-bold">{tr('ბოლო განაცხადები', 'Latest applications')}</h2>
          {apps.length > 0 && <button onClick={() => go('inbox')} className="text-[13px] font-semibold text-brand-deep">{tr('ყველა', 'See all')}</button>}
        </div>
        {apps.length === 0 ? (
          <p className="rounded-[18px] bg-bg px-4 py-3.5 text-[14px] text-muted">{tr('განაცხადები აქ გამოჩნდება.', 'Applications will show up here.')}</p>
        ) : (
          <ul className="space-y-2">
            {apps.slice(0, 5).map((a) => (
              <Row key={a.id} onClick={() => go('inbox')} left={<Avatar name={a.profiles.full_name} size={40} radius={13} />} title={a.profiles.full_name} sub={a.job.title} right={<Badge tone={STATUS_TONE[a.status]}>{statusText(a.status)}</Badge>} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
