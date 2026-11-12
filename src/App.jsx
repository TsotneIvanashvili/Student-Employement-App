import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './lib/supabase.js'
import { dayOf, matchJob, matchJobs, slotKey, todayISO } from './lib/match.js'
import Device from './components/Device.jsx'
import Auth, { Logo } from './components/Auth.jsx'
import Calendar from './components/Calendar.jsx'
import JobList from './components/JobList.jsx'
import JobDetail from './components/JobDetail.jsx'
import Assistant from './components/Assistant.jsx'
import StudentProfile from './components/StudentProfile.jsx'
import { MyJobs, NewJob, EmployerProfile } from './components/Employer.jsx'
import Tour, { EMPLOYER_STEPS, STUDENT_STEPS } from './components/Tour.jsx'
import { Icon, Title } from './components/ui.jsx'

const STUDENT_TABS = [
  { id: 'calendar', label: 'კალენდარი' },
  { id: 'jobs', label: 'ვაკანსიები' },
  { id: 'ai', label: 'ასისტენტი' },
  { id: 'profile', label: 'პროფილი' },
]
const EMPLOYER_TABS = [
  { id: 'jobs', label: 'ვაკანსიები' },
  { id: 'plus', label: 'დამატება' },
  { id: 'profile', label: 'პროფილი' },
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
  document.getElementById('screen')?.scrollTo(0, 0)
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
  return (
    <Device>
      <Root />
    </Device>
  )
}

function Root() {
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
    return <div className="grid h-full place-items-center"><Logo /></div>
  }
  if (!session) return <Auth />

  const patch = (changes) => setProfile((p) => ({ ...p, ...changes }))
  return profile.role === 'employer' ? <EmployerApp profile={profile} patch={patch} /> : <StudentApp profile={profile} patch={patch} />
}

function Shell({ tabs, tab, setTab, onHelp, children }) {
  return (
    <>
      <main className="relative px-4 pb-32 pt-[max(env(safe-area-inset-top),12px)] md:pt-2">
        <button data-tour="help" onClick={onHelp} aria-label="გზამკვლევი" className="absolute right-4 top-[max(env(safe-area-inset-top),12px)] z-10 grid h-9 w-9 place-items-center rounded-full bg-white text-[17px] font-bold text-brand shadow-sm md:top-2">?</button>
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/85 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 backdrop-blur-xl md:pb-6">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              data-tour={`tab-${t.id}`}
              onClick={() => { closeJob(); setTab(t.id); toTop() }}
              className={`flex flex-col items-center gap-0.5 py-1 text-[10px] font-semibold transition ${tab === t.id ? 'text-brand' : 'text-quiet'}`}
            >
              <Icon name={t.id} className="h-[26px] w-[26px]" strokeWidth={tab === t.id ? 2.2 : 1.7} />
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </>
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
  const matches = useMemo(() => matchJobs(jobs, free, today), [jobs, free, today])
  const selectedJob = jobs.find((j) => j.id === selectedId)
  const selectedShifts = useMemo(() => {
    const marks = {}
    if (!selectedJob) return marks
    matchJob(selectedJob, free, today).shifts.forEach((s) => {
      const day = s.date ? dayOf(s.date) : s.day
      for (let h = s.start; h < s.end; h++) {
        const key = slotKey(day, h)
        marks[key] = free.has(key) ? 'fit' : 'conflict'
      }
    })
    return marks
  }, [selectedJob, free, today])

  const go = (t) => { closeJob(); setTab(t); toTop() }

  return (
    <Shell tabs={STUDENT_TABS} tab={jobId ? 'jobs' : tab} setTab={setTab} onHelp={() => { go('calendar'); openTour() }}>
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
              <Title eyebrow={`გამარჯობა, ${(profile.full_name || '').split(' ')[0]} 👋`}>კალენდარი</Title>
              <div data-tour="summary" className="mb-4 flex items-center justify-between gap-3 rounded-[22px] bg-[radial-gradient(120%_140%_at_100%_0%,#1d7a4c_0%,#0b0d12_70%)] p-4 text-white">
                <div>
                  <p className="text-[13px] text-white/70">{free.size ? `${free.size} თავისუფალი საათი კვირაში` : 'დაიწყე აქედან'}</p>
                  <p className="text-[22px] font-bold leading-tight">{free.size ? `${matches.length} ვაკანსია გერგება` : 'მონიშნე თავისუფალი დრო'}</p>
                </div>
                {free.size > 0 && (
                  <button onClick={() => go('jobs')} className="shrink-0 rounded-full bg-brand px-4 py-2 text-[15px] font-semibold">ნახვა</button>
                )}
              </div>
              <Calendar free={free} setFree={setFree} selectedShifts={selectedShifts} selectedJob={selectedJob} onClearJob={() => setSelectedId(null)} />
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

function EmployerApp({ profile, patch }) {
  const hash = useHash()
  const jobId = hash.startsWith('#job/') ? hash.slice(5) : null
  const [tab, setTab] = useState('jobs')
  const [version, setVersion] = useState(0)
  const [showTour, openTour, closeTour] = useTour(`sj_tour_employer_${profile.id}`)
  useEffect(toTop, [jobId])

  return (
    <Shell tabs={EMPLOYER_TABS} tab={jobId ? 'jobs' : tab} setTab={setTab} onHelp={() => { closeJob(); setTab('jobs'); openTour() }}>
      {jobId ? (
        <JobDetail id={jobId} profile={profile} free={null} onBack={() => (history.length > 1 ? history.back() : closeJob())} onShowOnCalendar={() => {}} onGoProfile={() => {}} />
      ) : (
        <>
          {tab === 'jobs' && <MyJobs key={version} profile={profile} onNew={() => setTab('plus')} />}
          {tab === 'plus' && <NewJob profile={profile} onCreated={() => { setVersion((v) => v + 1); setTab('jobs'); toTop() }} />}
          {tab === 'profile' && <EmployerProfile profile={profile} onSaved={patch} />}
        </>
      )}
      {showTour && !jobId && <Tour steps={EMPLOYER_STEPS} onClose={closeTour} />}
    </Shell>
  )
}
