import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './lib/supabase.js'
import { dayOf, matchJob, matchJobs, slotKey, todayISO } from './lib/match.js'
import Auth from './components/Auth.jsx'
import Calendar from './components/Calendar.jsx'
import JobList from './components/JobList.jsx'
import JobDetail from './components/JobDetail.jsx'
import Assistant from './components/Assistant.jsx'
import StudentProfile from './components/StudentProfile.jsx'
import { MyJobs, NewJob, EmployerProfile } from './components/Employer.jsx'
import Tour from './components/Tour.jsx'

const ICONS = {
  calendar: 'M7 3v3m10-3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z',
  jobs: 'M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1M4 7h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm-1 6h18',
  ai: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0',
  plus: 'M12 5v14M5 12h14',
}
const STUDENT_TABS = [
  { id: 'calendar', label: 'კალენდარი' },
  { id: 'jobs', label: 'ვაკანსიები' },
  { id: 'ai', label: 'AI', tour: 'assistant' },
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
const closeJob = () => history.replaceState(null, '', window.location.pathname) || window.dispatchEvent(new HashChangeEvent('hashchange'))

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
    return <div className="grid min-h-dvh place-items-center text-muted">იტვირთება…</div>
  }
  if (!session) return <Auth />

  const patch = (changes) => setProfile((p) => ({ ...p, ...changes }))
  return profile.role === 'employer' ? <EmployerApp profile={profile} patch={patch} /> : <StudentApp profile={profile} patch={patch} />
}

function Shell({ title, subtitle, tabs, tab, setTab, onHelp, children }) {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-bg">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-bg/90 px-5 pb-3 pt-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand font-bold text-white">ც</div>
          <div className="min-w-0">
            <p className="truncate font-bold leading-tight">{title}</p>
            <p className="truncate text-xs text-muted">{subtitle}</p>
          </div>
        </div>
        {onHelp && (
          <button data-tour="help" onClick={onHelp} aria-label="გზამკვლევი" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white font-bold text-muted shadow-sm">?</button>
        )}
      </header>
      <main className="px-4 pb-28">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-line bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              data-tour={t.tour ?? t.id}
              onClick={() => { closeJob(); setTab(t.id) }}
              className={`flex flex-col items-center gap-1 rounded-2xl py-1.5 text-xs font-semibold ${tab === t.id ? 'text-brand' : 'text-quiet'}`}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={ICONS[t.id]} />
              </svg>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
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
  const [showTour, setShowTour] = useState(() => !(profile.availability?.length) && !localStorage.getItem('sj_tour_done'))

  useEffect(() => {
    supabase.from('jobs').select('*').eq('is_open', true).order('created_at', { ascending: false }).then(({ data }) => setJobs(data ?? []))
  }, [])

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

  const go = (t) => { closeJob(); setTab(t) }
  const meta = [profile.university, profile.year && `${profile.year} კურსი`, profile.hours && `${profile.hours} სთ/კვირა`].filter(Boolean).join(' · ')

  return (
    <Shell
      title={`გამარჯობა, ${(profile.full_name || '').split(' ')[0]}`}
      subtitle={meta}
      tabs={STUDENT_TABS}
      tab={jobId ? 'jobs' : tab}
      setTab={setTab}
      onHelp={() => { go('calendar'); setShowTour(true) }}
    >
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
              <div className="mb-4 rounded-3xl bg-gradient-to-br from-brand to-[#8b5cf6] p-5 text-white">
                <p className="text-sm opacity-80">შენს თავისუფალ დროს ერგება</p>
                <p className="mt-1 text-3xl font-bold">{free.size ? `${matches.length} ვაკანსია` : 'მონიშნე თავისუფალი საათები'}</p>
                {free.size > 0 && (
                  <button onClick={() => setTab('jobs')} className="mt-3 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold">ვაკანსიების ნახვა →</button>
                )}
              </div>
              <Calendar free={free} setFree={setFree} selectedShifts={selectedShifts} selectedJob={selectedJob} onClearJob={() => setSelectedId(null)} />
            </>
          )}
          {tab === 'jobs' && <JobList jobs={jobs} free={free} onlyFit={onlyFit} setOnlyFit={setOnlyFit} onGoCalendar={() => setTab('calendar')} />}
          {tab === 'ai' && <Assistant profile={profile} jobs={jobs} free={free} matchCount={matches.length} />}
          {tab === 'profile' && <StudentProfile profile={profile} onSaved={patch} />}
        </>
      )}
      {showTour && !jobId && (
        <Tour onClose={() => { setShowTour(false); try { localStorage.setItem('sj_tour_done', '1') } catch {} }} />
      )}
    </Shell>
  )
}

function EmployerApp({ profile, patch }) {
  const hash = useHash()
  const jobId = hash.startsWith('#job/') ? hash.slice(5) : null
  const [tab, setTab] = useState('jobs')
  const [version, setVersion] = useState(0)

  return (
    <Shell title={profile.company_name || profile.full_name} subtitle={`დამსაქმებელი · ${profile.full_name}`} tabs={EMPLOYER_TABS} tab={jobId ? 'jobs' : tab} setTab={setTab}>
      {jobId ? (
        <JobDetail id={jobId} profile={profile} free={null} onBack={() => (history.length > 1 ? history.back() : closeJob())} onShowOnCalendar={() => {}} onGoProfile={() => {}} />
      ) : (
        <>
          {tab === 'jobs' && <MyJobs key={version} profile={profile} onNew={() => setTab('plus')} />}
          {tab === 'plus' && <NewJob profile={profile} onCreated={() => { setVersion((v) => v + 1); setTab('jobs') }} />}
          {tab === 'profile' && <EmployerProfile profile={profile} onSaved={patch} />}
        </>
      )}
    </Shell>
  )
}
