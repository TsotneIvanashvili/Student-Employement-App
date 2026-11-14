import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase.js'
import { jobEvents } from './lib/schedule.js'
import { navigate, usePath } from './lib/router.jsx'
import Auth from './components/Auth.jsx'
import { About, Home, How, Logo, NotFound, Privacy, Terms, usePageTitle } from './components/Site.jsx'
import JobList, { filterJobs } from './components/JobList.jsx'
import { EmployerHome, SeekerHome } from './components/Dashboard.jsx'
import { StudentSchedule } from './components/Schedule.jsx'
import JobDetail from './components/JobDetail.jsx'
import Assistant from './components/Assistant.jsx'
import StudentProfile from './components/StudentProfile.jsx'
import { EmployerSchedule, Inbox, MyJobs, NewJob, EmployerProfile } from './components/Employer.jsx'
import Tour, { EMPLOYER_STEPS, STUDENT_STEPS } from './components/Tour.jsx'
import { Icon, btn } from './components/ui.jsx'

// პროფილი მენიუში არ არის: იხსნება სახელის ბარათით (კომპიუტერზე ქვემოთ მარცხნივ, ტელეფონზე ზემოთ მარჯვნივ)
const STUDENT_TABS = [
  { id: 'home', icon: 'home', label: 'მთავარი' },
  { id: 'calendar', icon: 'calendar', label: 'განრიგი' },
  { id: 'jobs', icon: 'jobs', label: 'ვაკანსიები' },
  { id: 'ai', icon: 'ai', label: 'ასისტენტი' },
]
const EMPLOYER_TABS = [
  { id: 'home', icon: 'home', label: 'მთავარი' },
  { id: 'inbox', icon: 'inbox', label: 'განაცხადები' },
  { id: 'calendar', icon: 'calendar', label: 'კალენდარი' },
  { id: 'jobs', icon: 'jobs', label: 'ვაკანსიები' },
  { id: 'plus', icon: 'plus', label: 'დამატება' },
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

const PUBLIC = { '/how': How, '/about': About, '/terms': Terms, '/privacy': Privacy }
const AUTH = { '/login': 'login', '/register': 'register', '/reset': 'reset' }

export default function App() {
  const path = usePath().replace(/\/+$/, '') || '/'
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      // პაროლის აღდგენის ბმულით მოსული მომხმარებელი ახალი პაროლის გვერდზე გადადის
      if (event === 'PASSWORD_RECOVERY') navigate('/new-password', { replace: true })
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const uid = session?.user?.id
  useEffect(() => {
    setProfile(null)
    setFailed(false)
    if (!uid) return
    supabase.from('profiles').select('*').eq('id', uid).single().then(({ data, error }) => (error ? setFailed(true) : setProfile(data)))
  }, [uid])

  // შესული მომხმარებელი შესვლის/რეგისტრაციის გვერდზე აღარ რჩება
  useEffect(() => {
    if (session && AUTH[path]) navigate('/', { replace: true })
  }, [session, path])

  const Public = PUBLIC[path]
  if (Public) return <Public signedIn={Boolean(session)} />
  if (session === undefined) return <Splash />
  if (path === '/new-password') return session ? <Auth mode="new-password" /> : <NotFound />
  if (!session) {
    if (path === '/') return <Home />
    return AUTH[path] ? <Auth key={path} mode={AUTH[path]} /> : <NotFound />
  }
  if (path !== '/') return AUTH[path] ? <Splash /> : <NotFound signedIn />
  if (failed) return <LoadError />
  if (!profile) return <Splash />

  const patch = (changes) => setProfile((p) => ({ ...p, ...changes }))
  const email = session.user.email
  return profile.role === 'employer' ? <EmployerApp profile={profile} email={email} patch={patch} /> : <StudentApp profile={profile} email={email} patch={patch} />
}

const Splash = () => <div className="grid min-h-dvh place-items-center"><Logo className="animate-pulse text-[32px]" /></div>

function LoadError() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <Logo className="text-[28px]" />
        <p className="mt-6 text-[18px] font-semibold">მონაცემები ვერ ჩაიტვირთა</p>
        <p className="mt-1 text-[15px] text-muted">შეამოწმე ინტერნეტი და სცადე თავიდან.</p>
        <div className="mx-auto mt-5 grid max-w-xs gap-2">
          <button onClick={() => window.location.reload()} className={btn}>თავიდან ცდა</button>
          <button onClick={() => supabase.auth.signOut()} className="py-2 text-[14px] font-medium text-muted">გასვლა</button>
        </div>
      </div>
    </div>
  )
}

// ტელეფონზე: ქვედა ტაბები. კომპიუტერზე: მარცხენა მენიუ.
function Shell({ profile, tabs, tab, onTab, onHelp, cta, children }) {
  const initial = (profile.full_name || '?').slice(0, 1)
  const toggleProfile = () => onTab(tab === 'profile' ? 'home' : 'profile')
  return (
    <div className="min-h-dvh lg:pl-[272px]">
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 backdrop-blur lg:inset-y-0 lg:left-0 lg:right-auto lg:flex lg:w-[272px] lg:flex-col lg:border-r lg:border-t-0 lg:bg-white lg:px-4 lg:py-6">
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
                className={`flex min-w-0 flex-col items-center gap-0.5 rounded-2xl py-1.5 font-medium transition ${tabs.length > 4 ? 'text-[10px] tracking-tight' : 'text-[11px]'} lg:flex-row lg:gap-3 lg:px-4 lg:py-3 lg:text-[16px] lg:tracking-normal ${active ? 'text-brand-deep lg:bg-brand-soft lg:font-semibold' : 'text-quiet hover:text-ink lg:text-muted lg:hover:bg-fill'}`}
              >
                <span className={`grid h-8 w-12 place-items-center rounded-full transition lg:h-auto lg:w-auto ${active ? 'bg-brand-soft lg:bg-transparent' : ''}`}>
                  <Icon name={t.icon} className="h-6 w-6" strokeWidth={active ? 2.4 : 2} />
                </span>
                <span className="max-w-full truncate">{t.label}</span>
              </button>
            )
          })}
        </div>
        <button
          data-tour="me"
          onClick={toggleProfile}
          aria-label="პროფილი"
          aria-pressed={tab === 'profile'}
          className={`mt-auto hidden w-full items-center gap-3 rounded-2xl p-3 text-left transition lg:flex ${tab === 'profile' ? 'bg-brand-soft' : 'bg-bg hover:bg-fill'}`}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-[16px] font-bold text-on-brand">{initial}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold">{profile.full_name}</span>
            <span className="block truncate text-[12px] font-medium text-muted">{profile.role === 'employer' ? profile.company_name : 'სამუშაოს მაძიებელი'}</span>
          </span>
          <Icon name="chevron" className={`h-4 w-4 shrink-0 text-quiet transition ${tab === 'profile' ? 'rotate-90' : ''}`} strokeWidth={2.5} />
        </button>
      </nav>

      <div className="mx-auto max-w-6xl px-4 pb-32 pt-[max(env(safe-area-inset-top),14px)] sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
        <header className="mb-4 flex items-center justify-between gap-2 lg:mb-0 lg:h-0 lg:justify-end">
          <span className="lg:hidden"><Logo className="text-[22px]" /></span>
          <span className="flex items-center gap-2">
            <button data-tour="help" onClick={onHelp} aria-label="გზამკვლევი" className="flex h-10 items-center gap-1.5 rounded-full bg-white px-3 text-[14px] font-semibold text-muted shadow-card hover:text-ink lg:relative lg:top-1">
              <Icon name="help" className="h-5 w-5" /><span className="hidden sm:inline">გზამკვლევი</span>
            </button>
            <button data-tour="me" onClick={toggleProfile} aria-label="პროფილი" aria-pressed={tab === 'profile'} className={`grid h-10 w-10 place-items-center rounded-full bg-brand text-[16px] font-bold text-on-brand lg:hidden ${tab === 'profile' ? 'ring-4 ring-brand-soft' : ''}`}>
              {initial}
            </button>
          </span>
        </header>
        {children}
      </div>
    </div>
  )
}

function StudentApp({ profile, email, patch }) {
  usePageTitle('')
  const hash = useHash()
  const jobId = hash.startsWith('#job/') ? hash.slice(5) : null
  const [tab, setTab] = useState('home')
  const [jobs, setJobs] = useState([])
  const [lessons, setLessons] = useState([])
  const [applications, setApplications] = useState([])
  const [onlyFit, setOnlyFit] = useState({ on: true, kind: 'all' })
  const [showTour, openTour, closeTour] = useTour(`sj_tour_student_${profile.id}`)

  useEffect(() => {
    supabase.from('jobs').select('*').eq('is_open', true).order('created_at', { ascending: false }).then(({ data }) => setJobs(data ?? []))
    supabase.from('events').select('*').then(({ data }) => setLessons(data ?? []))
  }, [])
  // განაცხადები ახლდება ვაკანსიის გვერდიდან დაბრუნებისას; მიღებული სამუშაოს ცვლები თავისით ჩნდება განრიგში
  useEffect(() => {
    if (jobId) return
    supabase
      .from('applications')
      .select('id, status, jobs(*)')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setApplications(data ?? []))
  }, [jobId, profile.id])
  useEffect(toTop, [jobId])

  const busy = useMemo(
    () => [...lessons.map((e) => ({ ...e, kind: 'lesson' })), ...applications.filter((a) => a.status === 'accepted').flatMap((a) => jobEvents(a.jobs))],
    [lessons, applications],
  )
  const matches = useMemo(() => filterJobs(jobs, busy, { on: true, kind: 'all' }), [jobs, busy])

  const go = (t) => { closeJob(); setTab(t); toTop() }

  return (
    <Shell profile={profile} tabs={STUDENT_TABS} tab={jobId ? 'jobs' : tab} onTab={go} onHelp={() => { go('home'); openTour() }}>
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
          {tab === 'home' && <SeekerHome profile={profile} busy={busy} matches={matches} applications={applications} go={go} openProfile={() => go('profile')} />}
          {tab === 'calendar' && <StudentSchedule busy={busy} setLessons={setLessons} matchCount={matches.length} onSeeJobs={() => go('jobs')} />}
          {tab === 'jobs' && <JobList jobs={jobs} busy={busy} onlyFit={onlyFit} setOnlyFit={setOnlyFit} onGoCalendar={() => go('calendar')} />}
          {tab === 'ai' && <Assistant profile={profile} jobs={jobs} busy={busy} setLessons={setLessons} matchCount={matches.length} />}
          {tab === 'profile' && <StudentProfile profile={profile} email={email} onSaved={patch} />}
        </>
      )}
      {showTour && !jobId && <Tour steps={STUDENT_STEPS} onClose={closeTour} onTab={go} />}
    </Shell>
  )
}

function EmployerApp({ profile, email, patch }) {
  usePageTitle('')
  const hash = useHash()
  const jobId = hash.startsWith('#job/') ? hash.slice(5) : null
  const [tab, setTab] = useState('home')
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
      onHelp={() => { go('home'); openTour() }}
      cta={<button onClick={() => go('plus')} className={`${btn} flex items-center justify-center gap-2`}><Icon name="plus" className="h-5 w-5" strokeWidth={3} />ახალი ვაკანსია</button>}
    >
      {jobId ? (
        <JobDetail id={jobId} profile={profile} busy={null} onBack={() => (history.length > 1 ? history.back() : closeJob())} onGoProfile={() => {}} />
      ) : (
        <>
          {tab === 'home' && <EmployerHome key={version} profile={profile} go={go} />}
          {tab === 'inbox' && <Inbox key={version} profile={profile} onNew={() => go('plus')} />}
          {tab === 'calendar' && <EmployerSchedule profile={profile} />}
          {tab === 'jobs' && <MyJobs key={version} profile={profile} onNew={() => go('plus')} />}
          {tab === 'plus' && <NewJob profile={profile} onCreated={() => { setVersion((v) => v + 1); go('jobs') }} />}
          {tab === 'profile' && <EmployerProfile profile={profile} email={email} onSaved={patch} />}
        </>
      )}
      {showTour && !jobId && <Tour steps={EMPLOYER_STEPS} onClose={closeTour} onTab={go} />}
    </Shell>
  )
}
