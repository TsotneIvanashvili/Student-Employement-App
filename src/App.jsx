import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './lib/supabase.js'
import { dayOf, matchJob, slotKey, todayISO } from './lib/match.js'
import Auth, { Logo } from './components/Auth.jsx'
import Calendar, { ALL_DAYS, WEEKDAYS, WEEKEND, preset } from './components/Calendar.jsx'
import JobList, { filterJobs } from './components/JobList.jsx'
import JobCard from './components/JobCard.jsx'
import JobDetail from './components/JobDetail.jsx'
import Assistant from './components/Assistant.jsx'
import StudentProfile from './components/StudentProfile.jsx'
import { Inbox, MyJobs, NewJob, EmployerProfile } from './components/Employer.jsx'
import Tour, { EMPLOYER_STEPS, STUDENT_STEPS } from './components/Tour.jsx'
import { Badge, Icon, Title, btn, card } from './components/ui.jsx'

const STUDENT_TABS = [
  { id: 'calendar', icon: 'calendar', label: 'კალენდარი' },
  { id: 'jobs', icon: 'jobs', label: 'ვაკანსიები' },
  { id: 'ai', icon: 'ai', label: 'ასისტენტი' },
  { id: 'profile', icon: 'profile', label: 'პროფილი' },
]
const EMPLOYER_TABS = [
  { id: 'inbox', icon: 'inbox', label: 'განაცხადები' },
  { id: 'jobs', icon: 'jobs', label: 'ვაკანსიები' },
  { id: 'plus', icon: 'plus', label: 'დამატება' },
  { id: 'profile', icon: 'profile', label: 'პროფილი' },
]
const STUDENT_PRESETS = [
  preset('🌆 სამუშაო დღეებში საღამოს', WEEKDAYS, 17, 21),
  preset('☀️ სამუშაო დღეებში დილით', WEEKDAYS, 8, 11),
  preset('🎉 შაბათ-კვირა', WEEKEND, 10, 19),
  preset('🔥 მთელი კვირა', ALL_DAYS, 8, 21),
]

function useHash() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const on = () => setHash(window.location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}
const closeJob = () => {
  history.replaceState(null, '', window.location.pathname)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}
const toTop = () => {
  window.scrollTo(0, 0)
}

// გზამკვლევი პირველ შესვლაზე ერთხელ ჩნდება (თითო ანგარიშზე)
function useTour(key) {
  const [show, setShow] = useState(() => {
    try {
      return !localStorage.getItem(key)
    } catch {
      return false
    }
  })
  const close = () => {
    setShow(false)
    try {
      localStorage.setItem(key, '1')
    } catch {}
  }
  return [show, () => setShow(true), close]
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const uid = session?.user?.id
  useEffect(() => {
    setProfile(null)
    if (!uid) return
    supabase.from('profiles').select('*').eq('id', uid).single().then(({ data }) => setProfile(data))
  }, [uid])

  if (session === undefined || (session && !profile)) {
    return <div className="grid min-h-dvh place-items-center"><Logo className="animate-pulse text-[32px]" /></div>
  }
  if (!session) return <Auth />

  const patch = (changes) => setProfile((p) => ({ ...p, ...changes }))
  return profile.role === 'employer' ? <EmployerApp profile={profile} patch={patch} /> : <StudentApp profile={profile} patch={patch} />
}

// ტელეფონზე: ქვედა ტაბები. კომპიუტერზე: მარცხენა მენიუ.
function Shell({ profile, tabs, tab, onTab, onHelp, cta, children }) {
  return (
    <div className="min-h-dvh lg:pl-64">
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 backdrop-blur lg:inset-y-0 lg:left-0 lg:right-auto lg:flex lg:w-64 lg:flex-col lg:border-r-2 lg:border-t-0 lg:bg-white lg:px-4 lg:py-6">
        <div className="mb-8 hidden px-2 lg:block"><Logo /></div>
        {cta && <div className="mb-4 hidden lg:block">{cta}</div>}
        <div className="grid lg:flex lg:flex-col lg:gap-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                data-tour={`tab-${t.id}`}
                onClick={() => onTab(t.id)}
                className={`flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-extrabold transition lg:flex-row lg:gap-3 lg:px-4 lg:py-3 lg:text-[16px] ${active ? 'text-brand lg:bg-brand-soft' : 'text-quiet hover:text-ink lg:text-muted lg:hover:bg-fill'}`}
              >
                <span className={`grid h-8 w-12 place-items-center rounded-full transition lg:h-auto lg:w-auto ${active ? 'bg-brand-soft lg:bg-transparent' : ''}`}>
                  <Icon name={t.icon} className="h-6 w-6" strokeWidth={active ? 2.6 : 2} />
                </span>
                {t.label}
              </button>
            )
          })}
        </div>
        <div className="mt-auto hidden items-center gap-3 rounded-2xl bg-bg p-3 lg:flex">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky text-[16px] font-black text-white">{(profile.full_name || '?').slice(0, 1)}</span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-extrabold">{profile.full_name}</span>
            <span className="block truncate text-[12px] font-bold text-muted">{profile.role === 'employer' ? profile.company_name : profile.university}</span>
          </span>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 pb-32 pt-[max(env(safe-area-inset-top),14px)] sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
        <header className="mb-3 flex items-center justify-between lg:mb-0 lg:h-0 lg:justify-end">
          <span className="lg:hidden"><Logo className="text-[22px]" /></span>
          <button data-tour="help" onClick={onHelp} className="flex items-center gap-1.5 rounded-full border-2 border-line bg-white px-3 py-1.5 text-[14px] font-extrabold text-muted shadow-[0_2px_0_var(--color-line)] hover:text-brand lg:relative lg:top-1">
            <Icon name="help" className="h-5 w-5" />გზამკვლევი
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

function StudentApp({ profile, patch }) {
  const hash = useHash()
  const jobId = hash.startsWith('#job/') ? hash.slice(5) : null
  const [tab, setTab] = useState('calendar')
  const [jobs, setJobs] = useState([])
  const [free, setFree] = useState(() => new Set(profile.availability ?? []))
  const [selectedId, setSelectedId] = useState(null)
  const [onlyFit, setOnlyFit] = useState({ on: true, kind: 'all' })
  const [showTour, openTour, closeTour] = useTour(`sj_tour_student_${profile.id}`)

  useEffect(() => {
    supabase.from('jobs').select('*').eq('is_open', true).order('created_at', { ascending: false }).then(({ data }) => setJobs(data ?? []))
  }, [])
  useEffect(toTop, [jobId])

  // თავისუფალი საათები პროფილში ინახება (ცოტა დაყოვნებით, რომ ყოველ შეხებაზე არ გაიგზავნოს)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) return void (first.current = false)
    const t = setTimeout(() => {
      supabase.from('profiles').update({ availability: [...free] }).eq('id', profile.id).then(() => {})
    }, 600)
    return () => clearTimeout(t)
  }, [free, profile.id])

  const today = todayISO()
  const matches = useMemo(() => filterJobs(jobs, free, { on: true, kind: 'all' }), [jobs, free])
  const selectedJob = jobs.find((j) => j.id === selectedId)
  const marks = useMemo(() => {
    const out = {}
    if (!selectedJob) return out
    matchJob(selectedJob, free, today).shifts.forEach((s) => {
      for (let h = s.start; h < s.end; h++) {
        const key = slotKey(dayOf(s), h)
        out[key] = free.has(key) ? 'fit' : 'conflict'
      }
    })
    return out
  }, [selectedJob, free, today])

  const go = (t) => { closeJob(); setTab(t); toTop() }
  const first_name = (profile.full_name || '').split(' ')[0]

  return (
    <Shell profile={profile} tabs={STUDENT_TABS} tab={jobId ? 'jobs' : tab} onTab={go} onHelp={() => { go('calendar'); openTour() }}>
      {jobId ? (
        <JobDetail
          id={jobId}
          profile={profile}
          free={free}
          onBack={() => (history.length > 1 ? history.back() : closeJob())}
          onShowOnCalendar={(id) => { setSelectedId(id); go('calendar') }}
          onGoProfile={() => go('profile')}
        />
      ) : (
        <>
          {tab === 'calendar' && (
            <>
              <Title eyebrow={`გამარჯობა, ${first_name} 👋`}>როდის ხარ თავისუფალი?</Title>
              <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                <Calendar
                  value={free}
                  setValue={setFree}
                  presets={STUDENT_PRESETS}
                  marks={marks}
                  banner={selectedJob && (
                    <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl bg-brand-soft px-4 py-2.5 text-[14px] font-bold text-brand">
                      <span>ნაჩვენებია: {selectedJob.title}</span>
                      <button onClick={() => setSelectedId(null)} aria-label="დახურვა"><Icon name="x" className="h-5 w-5" strokeWidth={2.8} /></button>
                    </div>
                  )}
                />
                <Matches matches={matches} free={free} onAll={() => go('jobs')} />
              </div>
              {free.size > 0 && (
                <button
                  onClick={() => document.querySelector('[data-tour=matches]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="fixed inset-x-4 bottom-[84px] z-20 flex items-center justify-between rounded-2xl bg-ink px-5 py-3.5 text-white shadow-[0_4px_0_#000] xl:hidden"
                >
                  <span className="font-extrabold"><span className="text-sun">{matches.length}</span> ვაკანსია გერგება</span>
                  <span className="font-extrabold text-sun">ნახვა ↓</span>
                </button>
              )}
            </>
          )}
          {tab === 'jobs' && <JobList jobs={jobs} free={free} onlyFit={onlyFit} setOnlyFit={setOnlyFit} onGoCalendar={() => go('calendar')} />}
          {tab === 'ai' && <Assistant profile={profile} jobs={jobs} free={free} matchCount={matches.length} />}
          {tab === 'profile' && <StudentProfile profile={profile} onSaved={patch} />}
        </>
      )}
      {showTour && !jobId && <Tour steps={STUDENT_STEPS} onClose={closeTour} />}
    </Shell>
  )
}

// კალენდრის გვერდით: ცოცხლად განახლებადი შესაფერისი ვაკანსიები
function Matches({ matches, free, onAll }) {
  const top = matches.slice(0, 4)
  return (
    <aside data-tour="matches" className="space-y-3 xl:sticky xl:top-8">
      <div className="rounded-3xl bg-gradient-to-br from-brand to-sky p-5 text-white shadow-[0_5px_0_var(--color-brand-dark)]">
        <p className="text-[14px] font-extrabold text-white/80">შენს დროს ერგება</p>
        <p className="text-[34px] font-black leading-tight">{free.size ? `${matches.length} ვაკანსია` : '—'}</p>
        <p className="text-[14px] font-bold text-white/80">{free.size ? `${free.size} თავისუფალი საათი კვირაში` : 'მონიშნე თავისუფალი დრო და აქ გამოჩნდება'}</p>
      </div>
      {free.size > 0 && top.length === 0 && (
        <p className={`${card} p-4 text-[15px] font-semibold text-muted`}>ჯერ არცერთი ცვლა არ ჯდება. სცადე მეტი საათის მონიშვნა.</p>
      )}
      {free.size > 0 && top.map(({ job }) => <JobCard key={job.id} job={job} free={free} compact />)}
      {matches.length > top.length && (
        <button onClick={onAll} className={btn}>ყველას ნახვა ({matches.length})</button>
      )}
      {free.size === 0 && (
        <div className={`${card} p-4 text-[15px] font-semibold text-muted`}>
          💡 დაიწყე შაბლონით, მაგალითად <Badge tone="violet">🌆 სამუშაო დღეებში საღამოს</Badge>
        </div>
      )}
    </aside>
  )
}

function EmployerApp({ profile, patch }) {
  const hash = useHash()
  const jobId = hash.startsWith('#job/') ? hash.slice(5) : null
  const [tab, setTab] = useState('inbox')
  const [version, setVersion] = useState(0)
  const [showTour, openTour, closeTour] = useTour(`sj_tour_employer_${profile.id}`)
  useEffect(toTop, [jobId])
  const go = (t) => { closeJob(); setTab(t); toTop() }

  return (
    <Shell
      profile={profile}
      tabs={EMPLOYER_TABS}
      tab={jobId ? 'jobs' : tab}
      onTab={go}
      onHelp={() => { go('inbox'); openTour() }}
      cta={<button onClick={() => go('plus')} className={`${btn} flex items-center justify-center gap-2`}><Icon name="plus" className="h-5 w-5" strokeWidth={3} />ახალი ვაკანსია</button>}
    >
      {jobId ? (
        <JobDetail id={jobId} profile={profile} free={null} onBack={() => (history.length > 1 ? history.back() : closeJob())} onShowOnCalendar={() => {}} onGoProfile={() => {}} />
      ) : (
        <>
          {tab === 'inbox' && <Inbox key={version} profile={profile} onNew={() => go('plus')} />}
          {tab === 'jobs' && <MyJobs key={version} profile={profile} onNew={() => go('plus')} />}
          {tab === 'plus' && <NewJob profile={profile} onCreated={() => { setVersion((v) => v + 1); go('jobs') }} />}
          {tab === 'profile' && <EmployerProfile profile={profile} onSaved={patch} />}
        </>
      )}
      {showTour && !jobId && <Tour steps={EMPLOYER_STEPS} onClose={closeTour} />}
    </Shell>
  )
}
