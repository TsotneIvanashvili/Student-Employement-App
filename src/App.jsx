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

export default function App() {
  const [user, setUser] = useState(() => load('sj_user', null))
  const [busy, setBusy] = useState(() => new Set(load('sj_busy', [])))
  const [showTour, setShowTour] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [onlyFit, setOnlyFit] = useState(true)
  const [applied, setApplied] = useState(new Set())

  useEffect(() => save('sj_user', user), [user])
  useEffect(() => save('sj_busy', [...busy]), [busy])

  const matches = useMemo(() => matchJobs(JOBS, busy), [busy])

  const selectedShifts = useMemo(() => {
    const job = JOBS.find((j) => j.id === selectedId)
    const marks = {}
    job?.shifts.forEach((s) => {
      for (let h = s.start; h < s.end; h++) {
        const key = slotKey(s.day, h)
        marks[key] = busy.has(key) ? 'conflict' : 'fit'
      }
    })
    return marks
  }, [selectedId, busy])

  if (!user) {
    return (
      <Register
        onDone={(u) => {
          setUser(u)
          setShowTour(true)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-bold">სტუდენტური ცვლები <span className="text-sm font-normal text-quiet">დემო</span></p>
            <p className="text-sm text-muted">გამარჯობა, {user.name} · {user.university}, {user.year} კურსი · {user.hours} სთ/კვირაში</p>
          </div>
          <div className="flex gap-2">
            <button data-tour="help" onClick={() => setShowTour(true)} className="rounded-xl border border-line px-4 py-2 text-sm hover:bg-mist">
              გზამკვლევი
            </button>
            <button
              onClick={() => {
                setUser(null)
                setBusy(new Set())
              }}
              className="rounded-xl px-4 py-2 text-sm text-quiet hover:text-navy"
            >
              გასვლა
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-6 pb-28 items-start lg:grid-cols-[1fr_400px]">
        <Calendar busy={busy} setBusy={setBusy} selectedShifts={selectedShifts} />
        <JobList
          jobs={JOBS}
          busy={busy}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onlyFit={onlyFit}
          setOnlyFit={setOnlyFit}
          applied={applied}
          onApply={(id) => setApplied(new Set(applied).add(id))}
        />
      </main>

      <Assistant user={user} matches={matches} hasSchedule={busy.size > 0} />
      {showTour && <Tour onClose={() => setShowTour(false)} />}
    </div>
  )
}
