import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase.js'
import { jobEvents } from './lib/schedule.js'
import { navigate, usePath } from './lib/router.jsx'
import { tr, useLang } from './lib/i18n.js'
import Auth from './components/Auth.jsx'
import { About, Home, How, Logo, NotFound, Privacy, Terms, usePageTitle } from './components/Site.jsx'
import { JobDetail, JobList } from './components/Jobs.jsx'
import { EmployerHome, SeekerHome, weekFreeHours } from './components/Dashboard.jsx'
import { StudentSchedule } from './components/Schedule.jsx'
import Assistant from './components/Assistant.jsx'
import Profile from './components/Profile.jsx'
import SeekerInbox from './components/SeekerInbox.jsx'
import { useUnread } from './components/Chat.jsx'
import { uploadPendingAvatar } from './lib/avatar.js'
import { EmployerSchedule, Inbox, MyJobs, NewJob } from './components/Employer.jsx'
import Tour, { employerSteps, seekerSteps } from './components/Tour.jsx'
import { Avatar, Icon, btn } from './components/ui.jsx'

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
  // Google-ით პირველად შემოსულმა ჯერ როლი უნდა აირჩიოს
  if (profile.onboarded === false) return <Auth mode="onboarding" profile={profile} onDone={patch} />
  return <SignedIn profile={profile} email={email} patch={patch} />
}

// რეგისტრაციისას არჩეული ფოტო პირველ შესვლაზე იტვირთება (ელფოსტის დადასტურებამდე ატვირთვა შეუძლებელია)
function SignedIn({ profile, email, patch }) {
  useEffect(() => {
    uploadPendingAvatar(profile, email).then((url) => url && patch({ avatar_url: url })).catch(() => {})
  }, [profile.id]) // eslint-disable-line react-hooks/exhaustive-deps
  return profile.role === 'employer' ? <EmployerApp profile={profile} email={email} patch={patch} /> : <StudentApp profile={profile} email={email} patch={patch} />
}

const Splash = () => <div className="grid min-h-dvh place-items-center"><Logo className="animate-pulse text-[26px]" /></div>

function LoadError() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <Logo className="text-[24px]" />
        <p className="mt-6 text-[18px] font-semibold">{tr('მონაცემები ვერ ჩაიტვირთა', 'Could not load your data')}</p>
        <p className="mt-1 text-[15px] text-muted">{tr('შეამოწმე ინტერნეტი და სცადე თავიდან.', 'Check your internet and try again.')}</p>
        <div className="mx-auto mt-5 grid max-w-xs gap-2">
          <button onClick={() => window.location.reload()} className={btn}>{tr('თავიდან ცდა', 'Try again')}</button>
          <button onClick={() => supabase.auth.signOut()} className="py-2 text-[14px] font-medium text-muted">{tr('გასვლა', 'Log out')}</button>
        </div>
      </div>
    </div>
  )
}

const ICON = { home: 'home', calendar: 'calendar', jobs: 'briefcase', ai: 'ai', profile: 'profile', inbox: 'inbox' }
const seekerTabs = () => [
  ['home', tr('მთავარი', 'Home')],
  ['calendar', tr('კალენდარი', 'Calendar')],
  ['jobs', tr('ვაკანსიები', 'Jobs')],
  ['ai', 'AI'],
  ['inbox', tr('ინბოქსი', 'Inbox')],
  ['profile', tr('პროფილი', 'Profile')],
]
const employerTabs = () => [
  ['home', tr('მთავარი', 'Home')],
  ['inbox', tr('ინბოქსი', 'Inbox')],
  ['calendar', tr('კალენდარი', 'Calendar')],
  ['jobs', tr('ვაკანსიები', 'Jobs')],
  ['profile', tr('პროფილი', 'Profile')],
]

// ტელეფონზე: მცურავი ქვედა მენიუ (პროფილი ერთ-ერთი ჩანართია). კომპიუტერზე: მარცხენა მენიუ,
// პროფილი კი ქვედა მარცხენა სახელის ბარათით იხსნება და იხურება.
function Shell({ profile, tabs, tab, onTab, cta, detail, badges = {}, children }) {
  const visible = tabs.filter(([id]) => id !== 'profile')
  const i = Math.max(0, tabs.findIndex(([id]) => id === tab))
  const name = profile.role === 'employer' ? profile.company_name || profile.full_name : profile.full_name
  return (
    <div className="min-h-dvh lg:pl-[264px]">
      <nav className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line bg-white px-4 py-6 lg:flex">
        <div className="mb-7 px-2"><Logo className="text-[18px]" /></div>
        {cta && <div className="mb-4">{cta}</div>}
        <div className="flex flex-col gap-1">
          {visible.map(([id, text]) => (
            <button key={id} data-tour={`tab-${id}`} onClick={() => onTab(id)} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold transition ${tab === id ? 'bg-brand-soft text-brand-deep' : 'text-muted hover:bg-fill hover:text-ink'}`}>
              <Icon name={ICON[id]} className="h-[22px] w-[22px]" />{text}
              {badges[id] > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1.5 text-[11px] font-bold text-white">{badges[id]}</span>}
            </button>
          ))}
        </div>
        <button
          data-tour="me"
          onClick={() => onTab(tab === 'profile' ? 'home' : 'profile')}
          aria-pressed={tab === 'profile'}
          className={`mt-auto flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${tab === 'profile' ? 'bg-brand-soft' : 'bg-bg hover:bg-fill'}`}
        >
          <Avatar name={name} src={profile.avatar_url} size={40} radius={20} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold">{name}</span>
            <span className="block truncate text-[12px] text-muted">{profile.role === 'employer' ? tr('დამსაქმებელი', 'Employer') : tr('სამუშაოს მაძიებელი', 'Job seeker')}</span>
          </span>
          <Icon name="chevron" className={`h-4 w-4 shrink-0 text-quiet transition ${tab === 'profile' ? 'rotate-90' : ''}`} strokeWidth={2.5} />
        </button>
      </nav>

      <div className="mx-auto max-w-5xl px-4 pb-36 pt-[max(env(safe-area-inset-top),18px)] sm:px-6 lg:px-10 lg:pb-12 lg:pt-9">
        {children}
        {detail}
      </div>

      <nav className={`glass fixed ${tabs.length > 5 ? 'inset-x-2 p-1' : 'inset-x-3 p-1.5'} bottom-[max(env(safe-area-inset-bottom),16px)] z-30 rounded-[32px] shadow-[0_0_0_1px_rgba(21,24,30,.06),0_12px_32px_-12px_rgba(21,24,30,.3)] lg:hidden`}>
        <div className="relative flex">
          <span className="absolute inset-y-0 left-0 rounded-[26px] bg-brand-soft transition-transform duration-[380ms] ease-[cubic-bezier(0.2,0,0,1)]" style={{ width: `${100 / tabs.length}%`, transform: `translateX(${i * 100}%)` }} />
          {tabs.map(([id, text]) => (
            <button
              key={id}
              data-tour={id === 'profile' ? 'me' : `tab-${id}`}
              onClick={() => onTab(id)}
              aria-label={text}
              aria-current={tab === id ? 'page' : undefined}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-[3px] pb-[7px] pt-2 text-[10px] font-semibold tracking-[-0.02em] transition-colors ${tabs.length > 5 ? 'max-[399px]:text-[9.5px] max-[374px]:text-[9px]' : ''} ${tab === id ? 'text-brand-deep' : 'text-muted'}`}
            >
              <span className="relative">
                <Icon name={ICON[id]} className="h-[22px] w-[22px]" />
                {badges[id] > 0 && <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold leading-none text-white">{badges[id]}</span>}
              </span>
              <span className="max-w-full truncate">{text}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

function StudentApp({ profile, email, patch }) {
  useLang()
  usePageTitle('')
  const hash = useHash()
  const jobId = hash.startsWith('#job/') ? hash.slice(5) : null
  const [tab, setTab] = useState('home')
  const [jobs, setJobs] = useState([])
  const [lessons, setLessons] = useState([])
  const [applications, setApplications] = useState([])
  const [version, setVersion] = useState(0)
  const [draft, setDraft] = useState('')
  const [filters, setFilters] = useState({ query: '', cat: profile.field && profile.field !== 'general' ? profile.field : 'all', onlyFit: true })
  const [showTour, openTour, closeTour] = useTour(`sj_tour_student_${profile.id}`)
  const unread = useUnread(profile.id)
  const unreadTotal = Object.values(unread).reduce((a, b) => a + b, 0)

  useEffect(() => {
    supabase.from('jobs').select('*').eq('is_open', true).order('created_at', { ascending: false }).then(({ data }) => setJobs(data ?? []))
    supabase.from('events').select('*').then(({ data }) => setLessons(data ?? []))
  }, [])
  // განაცხადები ახლდება ვაკანსიის გვერდიდან დაბრუნებისას, ჩანართის გადართვისას და ახალ შეტყობინებაზე
  // (ასე „აგიყვანეს“ თავისით ჩნდება); მიღებული სამუშაოს ცვლები თავისით ჩნდება კალენდარში
  useEffect(() => {
    if (jobId) return
    supabase.from('applications').select('id, status, created_at, jobs(*)').eq('student_id', profile.id).order('created_at', { ascending: false }).then(({ data }) => setApplications(data ?? []))
  }, [jobId, profile.id, version, tab, unreadTotal])
  useEffect(toTop, [jobId])

  const busy = useMemo(
    () => [...lessons.map((e) => ({ ...e, kind: 'lesson' })), ...applications.filter((a) => a.status === 'accepted').flatMap((a) => jobEvents(a.jobs))],
    [lessons, applications],
  )
  const go = (t) => { closeJob(); setTab(t); toTop() }
  const askAI = (text) => { setDraft(text); go('ai') }

  return (
    <Shell
      profile={profile}
      tabs={seekerTabs()}
      tab={tab}
      onTab={go}
      badges={{ inbox: unreadTotal }}
      detail={jobId && <JobDetail key={jobId} id={jobId} profile={profile} busy={busy} onBack={() => (history.length > 1 ? history.back() : closeJob())} onGoProfile={() => go('profile')} onChanged={() => setVersion((v) => v + 1)} />}
    >
      <div className={jobId ? 'hidden' : ''}>
        {tab === 'home' && <SeekerHome profile={profile} busy={busy} jobs={jobs} applications={applications} unread={unread} go={go} askAI={askAI} />}
        {tab === 'inbox' && <SeekerInbox profile={profile} applications={applications} unread={unread} onFindJobs={() => go('jobs')} />}
        {tab === 'calendar' && <StudentSchedule busy={busy} setLessons={setLessons} freeHours={weekFreeHours(busy)} onFillWithAI={() => askAI(tr('ორშაბათიდან პარასკევამდე 10-დან 18-მდე ვმუშაობ', 'I work Monday to Friday from 10 to 18'))} />}
        {tab === 'jobs' && <JobList jobs={jobs} busy={busy} filters={filters} setFilters={setFilters} onGoCalendar={() => go('calendar')} />}
        {tab === 'ai' && <Assistant jobs={jobs} busy={busy} setLessons={setLessons} draft={draft} onDraftUsed={() => setDraft('')} />}
        {tab === 'profile' && <Profile profile={profile} email={email} onSaved={patch} applications={applications} onHelp={() => { go('home'); openTour() }} />}
      </div>
      {showTour && !jobId && <Tour steps={seekerSteps()} onClose={closeTour} onTab={go} />}
    </Shell>
  )
}

function EmployerApp({ profile, email, patch }) {
  useLang()
  usePageTitle('')
  const hash = useHash()
  const jobId = hash.startsWith('#job/') ? hash.slice(5) : null
  const [tab, setTab] = useState('home')
  const [version, setVersion] = useState(0)
  const [showTour, openTour, closeTour] = useTour(`sj_tour_employer_${profile.id}`)
  const unread = useUnread(profile.id)
  const unreadTotal = Object.values(unread).reduce((a, b) => a + b, 0)
  useEffect(toTop, [jobId])
  const go = (t) => { closeJob(); setTab(t); toTop() }

  return (
    <Shell
      profile={profile}
      tabs={employerTabs()}
      tab={tab === 'new' ? 'jobs' : tab}
      onTab={go}
      badges={{ inbox: unreadTotal }}
      cta={<button onClick={() => go('new')} className={`${btn} flex items-center justify-center gap-2 py-3.5`}><Icon name="plus" className="h-5 w-5" strokeWidth={2.5} />{tr('ახალი ვაკანსია', 'New job post')}</button>}
      detail={jobId && <JobDetail key={jobId} id={jobId} profile={profile} busy={null} onBack={() => (history.length > 1 ? history.back() : closeJob())} onGoProfile={() => {}} />}
    >
      <div className={jobId ? 'hidden' : ''}>
        {tab === 'home' && <EmployerHome key={version} profile={profile} go={go} />}
        {tab === 'inbox' && <Inbox key={version} profile={profile} unread={unread} onNew={() => go('new')} />}
        {tab === 'calendar' && <EmployerSchedule profile={profile} />}
        {tab === 'jobs' && <MyJobs key={version} profile={profile} onNew={() => go('new')} />}
        {tab === 'new' && <NewJob profile={profile} onCancel={() => go('jobs')} onCreated={() => { setVersion((v) => v + 1); go('jobs') }} />}
        {tab === 'profile' && <Profile profile={profile} email={email} onSaved={patch} onHelp={() => { go('home'); openTour() }} />}
      </div>
      {showTour && !jobId && <Tour steps={employerSteps()} onClose={closeTour} onTab={go} />}
    </Shell>
  )
}
