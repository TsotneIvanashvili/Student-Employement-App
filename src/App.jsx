import { useEffect, useMemo, useState } from 'react'
import { JOBS } from './data/jobs.js'
import { matchJobs, slotKey } from './lib/match.js'
import Register from './components/Register.jsx'
import Calendar from './components/Calendar.jsx'
import JobList from './components/JobList.jsx'
import Assistant from './components/Assistant.jsx'
import Tour from './components/Tour.jsx'

const load = (key, fallback) => {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}
const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

const TABS = [
  { id: 'calendar', label: 'კალენდარი', icon: 'M7 3v3m10-3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z' },
  { id: 'jobs', label: 'ვაკანსიები', icon: 'M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1M4 7h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm-1 6h18' },
  { id: 'ai', label: 'AI', tour: 'assistant', icon: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z' },
]

export default function App() {
  const [user, setUser] = useState(() => load('sj_user', null))
  const [busy, setBusy] = useState(() => new Set(load('sj_busy', [])))
  const [tab, setTab] = useState('calendar')
  const [showTour, setShowTour] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [onlyFit, setOnlyFit] = useState(true)
  const [applied, setApplied] = useState(new Set())

  useEffect(() => save('sj_user', user), [user])
  useEffect(() => save('sj_busy', [...busy]), [busy])

  const matches = useMemo(() => matchJobs(JOBS, busy), [busy])
  const selectedJob = JOBS.find((j) => j.id === selectedId)

  const selectedShifts = useMemo(() => {
    const marks = {}
    selectedJob?.shifts.forEach((s) => {
      for (let h = s.start; h < s.end; h++) {
        const key = slotKey(s.day, h)
        marks[key] = busy.has(key) ? 'conflict' : 'fit'
      }
    })
    return marks
  }, [selectedJob, busy])

  if (!user) {
    return (
      <Register
        onDone={(u) => {
          setUser(u)
          setTab('calendar')
          setShowTour(true)
        }}
      />
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-bg">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-bg/90 px-5 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand font-bold text-white">ც</div>
          <div>
            <p className="font-bold leading-tight">გამარჯობა, {user.name.split(' ')[0]}</p>
            <p className="text-xs text-muted">{user.university} · {user.year} კურსი · {user.hours} სთ/კვირა</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            data-tour="help"
            onClick={() => {
              setTab('calendar')
              setShowTour(true)
            }}
            aria-label="გზამკვლევი"
            className="grid h-10 w-10 place-items-center rounded-full bg-white font-bold text-muted shadow-sm"
          >
            ?
          </button>
          <button
            onClick={() => {
              setUser(null)
              setBusy(new Set())
            }}
            className="rounded-full px-3 text-sm text-quiet"
          >
            გასვლა
          </button>
        </div>
      </header>

      <main className="px-4 pb-28">
        {tab === 'calendar' && (
          <>
            <div className="mb-4 rounded-3xl bg-gradient-to-br from-brand to-[#8b5cf6] p-5 text-white">
              <p className="text-sm opacity-80">შენს გრაფიკს ერგება</p>
              <p className="mt-1 text-3xl font-bold">
                {busy.size ? `${matches.length} ვაკანსია` : 'მონიშნე ლექციები'}
              </p>
              {busy.size > 0 && (
                <button onClick={() => setTab('jobs')} className="mt-3 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold">
                  ვაკანსიების ნახვა →
                </button>
              )}
            </div>
            <Calendar
              busy={busy}
              setBusy={setBusy}
              selectedShifts={selectedShifts}
              selectedJob={selectedJob}
              onClearJob={() => setSelectedId(null)}
            />
          </>
        )}
        {tab === 'jobs' && (
          <JobList
            jobs={JOBS}
            busy={busy}
            onShow={(id) => {
              setSelectedId(id)
              setTab('calendar')
            }}
            onlyFit={onlyFit}
            setOnlyFit={setOnlyFit}
            applied={applied}
            onApply={(id) => setApplied(new Set(applied).add(id))}
            onGoCalendar={() => setTab('calendar')}
          />
        )}
        {tab === 'ai' && <Assistant user={user} matches={matches} hasSchedule={busy.size > 0} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-line bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur">
        <div className="grid grid-cols-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              data-tour={t.tour ?? t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl py-1.5 text-xs font-semibold ${tab === t.id ? 'text-brand' : 'text-quiet'}`}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {showTour && <Tour onClose={() => setShowTour(false)} />}
    </div>
  )
}
