import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase.js'
import { jobEvents } from './lib/schedule.js'
import Auth, { Logo } from './components/Auth.jsx'
import JobList, { filterJobs } from './components/JobList.jsx'
import { StudentSchedule } from './components/Schedule.jsx'
import JobDetail from './components/JobDetail.jsx'
import Assistant from './components/Assistant.jsx'
import StudentProfile from './components/StudentProfile.jsx'
import { EmployerSchedule, Inbox, MyJobs, NewJob, EmployerProfile } from './components/Employer.jsx'
import Tour, { EMPLOYER_STEPS, STUDENT_STEPS } from './components/Tour.jsx'
import { Icon, btn } from './components/ui.jsx'

const STUDENT_TABS = [
  { id: 'calendar', icon: 'calendar', label: 'განრიგი' },
  { id: 'jobs', icon: 'jobs', label: 'ვაკანსიები' },
  { id: 'ai', icon: 'ai', label: 'ასისტენტი' },
  { id: 'profile', icon: 'profile', label: 'პროფილი' },
]
const EMPLOYER_TABS = [
  { id: 'inbox', icon: 'inbox', label: 'განაცხადები' },
  { id: 'calendar', icon: 'calendar', label: 'კალენდარი' },
  { id: 'jobs', icon: 'jobs', label: 'ვაკანსიები' },
  { id: 'plus', icon: 'plus', label: 'დამატება' },
  { id: 'profile', icon: 'profile', label: 'პროფილი' },
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
                className={`flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-semibold transition lg:flex-row lg:gap-3 lg:px-4 lg:py-3 lg:text-[16px] ${active ? 'text-brand lg:bg-brand-soft' : 'text-quiet hover:text-ink lg:text-muted lg:hover:bg-fill'}`}
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
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky text-[16px] font-semibold text-white">{(profile.full_name || '?').slice(0, 1)}</span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-semibold">{profile.full_name}</span>
            <span className="block truncate text-[12px] font-medium text-muted">{profile.role === 'employer' ? profile.company_name : profile.university}</span>
          </span>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 pb-32 pt-[max(env(safe-area-inset-top),14px)] sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
        <header className="mb-3 flex items-center justify-between lg:mb-0 lg:h-0 lg:justify-end">
          <span className="lg:hidden"><Logo className="text-[22px]" /></span>
          <button data-tour="help" onClick={onHelp} className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[14px] font-semibold text-muted hover:text-brand lg:relative lg:top-1">
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
  const [lessons, setLessons] = useState([])
  const [work, setWork] = useState([])
  const [onlyFit, setOnlyFit] = useState({ on: true, kind: 'all' })
  const [showTour, openTour, closeTour] = useTour(`sj_tour_student_${profile.id}`)

  useEffect(() => {
    supabase.from('jobs').select('*').eq('is_open', true).order('created_at', { ascending: false }).then(({ data }) => setJobs(data ?? []))
    supabase.from('events').select('*').then(({ data }) => setLessons(data ?? []))
  }, [])
  // მიღებული სამუშაოს ცვლები თავისით ჩნდება განრიგში (ვაკანსიის გვერდიდან დაბრუნებისას ახლდება)
  useEffect(() => {
    if (jobId) return
    supabase
      .from('applications')
      .select('jobs(*)')
      .eq('student_id', profile.id)
      .eq('status', 'accepted')
      .then(({ data }) => setWork((data ?? []).flatMap((a) => jobEvents(a.jobs))))
  }, [jobId, profile.id])
  useEffect(toTop, [jobId])

  const busy = useMemo(() => [...lessons.map((e) => ({ ...e, kind: 'lesson' })), ...work], [lessons, work])
  const matches = useMemo(() => filterJobs(jobs, busy, { on: true, kind: 'all' }), [jobs, busy])

  const go = (t) => { closeJob(); setTab(t); toTop() }

  return (
    <Shell profile={profile} tabs={STUDENT_TABS} tab={jobId ? 'jobs' : tab} onTab={go} onHelp={() => { go('calendar'); openTour() }}>
      {jobId ? (
        <JobDetail
          id={jobId}
          profile={profile}
          busy={busy}
          onBack={() => (history.length > 1 ? history.back() : closeJob())}
          onGoProfile={() => go('profile')}
        />
      ) : (
        <>
          {tab === 'calendar' && <StudentSchedule busy={busy} setLessons={setLessons} matchCount={matches.length} onSeeJobs={() => go('jobs')} />}
          {tab === 'jobs' && <JobList jobs={jobs} busy={busy} onlyFit={onlyFit} setOnlyFit={setOnlyFit} onGoCalendar={() => go('calendar')} />}
          {tab === 'ai' && <Assistant profile={profile} jobs={jobs} busy={busy} matchCount={matches.length} />}
          {tab === 'profile' && <StudentProfile profile={profile} onSaved={patch} />}
        </>
      )}
      {showTour && !jobId && <Tour steps={STUDENT_STEPS} onClose={closeTour} />}
    </Shell>
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
        <JobDetail id={jobId} profile={profile} busy={null} onBack={() => (history.length > 1 ? history.back() : closeJob())} onGoProfile={() => {}} />
      ) : (
        <>
          {tab === 'inbox' && <Inbox key={version} profile={profile} onNew={() => go('plus')} />}
          {tab === 'calendar' && <EmployerSchedule profile={profile} />}
          {tab === 'jobs' && <MyJobs key={version} profile={profile} onNew={() => go('plus')} />}
          {tab === 'plus' && <NewJob profile={profile} onCreated={() => { setVersion((v) => v + 1); go('jobs') }} />}
          {tab === 'profile' && <EmployerProfile profile={profile} onSaved={patch} />}
        </>
      )}
      {showTour && !jobId && <Tour steps={EMPLOYER_STEPS} onClose={closeTour} />}
    </Shell>
  )
}
