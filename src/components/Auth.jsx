import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { Link, navigate } from '../lib/router.jsx'
import { CalendarMock, Logo, usePageTitle } from './Site.jsx'
import { Icon, Segmented, btn, btn2, chip, input, label } from './ui.jsx'

// სადემონსტრაციო ანგარიშები: ღილაკები ჩანს მხოლოდ /login?demo მისამართზე
const DEMO = { student: 'demo.student@studentshifts.ge', employer: 'demo.employer@studentshifts.ge' }
const DEMO_PASSWORD = 'Demo-12345'

const ERRORS = [
  ['Invalid login credentials', 'ელფოსტა ან პაროლი არასწორია.'],
  ['Email not confirmed', 'ელფოსტა ჯერ არ დაგიდასტურებია. შეამოწმე საფოსტო ყუთი.'],
  ['User already registered', 'ამ ელფოსტით ანგარიში უკვე არსებობს. სცადე შესვლა.'],
  ['Password should be', 'პაროლი მინიმუმ 6 სიმბოლო უნდა იყოს.'],
  ['rate limit', 'ძალიან ბევრი მცდელობა. სცადე რამდენიმე წუთში.'],
  ['only request this after', 'ცოტა ხანში სცადე თავიდან.'],
  ['Failed to fetch', 'კავშირი ვერ დამყარდა. შეამოწმე ინტერნეტი.'],
  ['different from the old password', 'ახალი პაროლი ძველისგან უნდა განსხვავდებოდეს.'],
]
const errorText = (e) => ERRORS.find(([key]) => e.message?.includes(key))?.[1] ?? 'რაღაც ვერ შესრულდა. სცადე თავიდან.'

// mode: 'login' | 'register' | 'reset' | 'new-password'
export default function Auth({ mode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside className="hidden border-r border-line bg-white p-12 lg:flex lg:min-h-dvh lg:flex-col">
        <Link to="/"><Logo className="text-[26px]" /></Link>
        <div className="mt-auto">
          <p className="max-w-lg text-[46px] font-semibold leading-[1.15] tracking-tight">იმუშავე მაშინ, როცა თავისუფალი ხარ</p>
          <p className="mt-3 max-w-md text-[16px] text-muted">ჩაწერე, როდის ხარ დაკავებული, და დამატებით სამუშაოს მხოლოდ შენს თავისუფალ დროში ნახავ.</p>
        </div>
        <div className="mb-auto mt-12"><CalendarMock /></div>
      </aside>
      <main className="flex justify-center px-5 pb-10 pt-[max(env(safe-area-inset-top),1.25rem)] lg:items-center lg:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:mb-5">
            <Link to="/" className="lg:hidden"><Logo className="text-[22px]" /></Link>
            {mode !== 'new-password' && (
              <Link to="/" className="flex items-center gap-1 text-[14px] font-semibold text-muted hover:text-ink">
                <Icon name="back" className="h-4 w-4" strokeWidth={2.5} />მთავარი
              </Link>
            )}
          </div>
          {mode === 'login' && <Login />}
          {mode === 'register' && <Register />}
          {mode === 'reset' && <Reset />}
          {mode === 'new-password' && <NewPassword />}
        </div>
      </main>
    </div>
  )
}

function useSubmit() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const run = async (fn) => {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, run }
}

const Field = ({ label: text, children }) => (
  <label className="block">
    <span className={label}>{text}</span>
    {children}
  </label>
)
const ErrorNote = ({ children }) => children ? <p role="alert" className="rounded-xl bg-coral-soft px-3.5 py-2.5 text-[14px] font-medium text-coral">{children}</p> : null

function Login() {
  usePageTitle('შესვლა')
  const [form, setForm] = useState({ email: '', password: '' })
  const { busy, error, run } = useSubmit()
  const signIn = (creds) =>
    run(async () => {
      const { error } = await supabase.auth.signInWithPassword(creds)
      if (error) throw error
      navigate('/', { replace: true })
    })
  const demo = new URLSearchParams(window.location.search).has('demo')

  return (
    <div>
      <h1 className="mb-6 text-[30px] font-semibold tracking-tight">შესვლა</h1>
      <form onSubmit={(e) => { e.preventDefault(); signIn(form) }} className="space-y-4">
        <Field label="ელფოსტა"><input required type="email" inputMode="email" autoComplete="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="პაროლი"><input required type="password" autoComplete="current-password" className={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <ErrorNote>{error}</ErrorNote>
        <button disabled={busy} className={btn}>{busy ? 'იტვირთება…' : 'შესვლა'}</button>
      </form>
      <div className="mt-5 flex flex-wrap justify-between gap-2 text-[14px]">
        <Link to="/reset" className="font-semibold text-muted hover:text-ink">დაგავიწყდა პაროლი?</Link>
        <span className="text-muted">არ გაქვს ანგარიში? <Link to="/register" className="font-semibold text-ink underline underline-offset-4">რეგისტრაცია</Link></span>
      </div>
      {demo && (
        <div className="mt-8 rounded-2xl border border-dashed border-line p-4">
          <p className="text-center text-[13px] font-semibold uppercase tracking-wide text-quiet">სადემონსტრაციო ანგარიშები</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button disabled={busy} onClick={() => signIn({ email: DEMO.student, password: DEMO_PASSWORD })} className={`${chip} flex items-center justify-center gap-1.5 px-2 text-[13px]`}><Icon name="search" className="h-4 w-4" />მაძიებელი</button>
            <button disabled={busy} onClick={() => signIn({ email: DEMO.employer, password: DEMO_PASSWORD })} className={`${chip} flex items-center justify-center gap-1.5 px-2 text-[13px]`}><Icon name="users" className="h-4 w-4" />დამსაქმებელი</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Register() {
  usePageTitle('რეგისტრაცია')
  const [role, setRole] = useState(() => (new URLSearchParams(window.location.search).get('role') === 'employer' ? 'employer' : 'student'))
  const [form, setForm] = useState({ email: '', password: '', full_name: '', company_name: '' })
  const [sentTo, setSentTo] = useState('')
  const { busy, error, run } = useSubmit()
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    run(async () => {
      const meta = role === 'student' ? { role, full_name: form.full_name.trim() } : { role, full_name: form.full_name.trim(), company_name: form.company_name.trim() }
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: meta, emailRedirectTo: window.location.origin },
      })
      if (error) throw error
      // არსებული ელფოსტისას Supabase ცარიელ identities-ს აბრუნებს (ელფოსტას არ ამჟღავნებს)
      if (data.user?.identities?.length === 0) throw new Error('User already registered')
      if (data.session) navigate('/', { replace: true })
      else setSentTo(form.email) // ელფოსტის დადასტურება ჩართულია
    })
  }

  if (sentTo) return <CheckEmail email={sentTo} />
  return (
    <div>
      <h1 className="mb-4 text-[30px] font-semibold tracking-tight">რეგისტრაცია</h1>
      <div className="mb-5">
        <Segmented value={role} onChange={setRole} options={[['student', <><Icon name="search" className="h-4 w-4 shrink-0" /><span className="truncate">ვეძებ სამსახურს</span></>], ['employer', <><Icon name="users" className="h-4 w-4 shrink-0" /><span className="truncate">ვასაქმებ</span></>]]} />
      </div>
      <form onSubmit={submit} className="space-y-4">
        {role === 'employer' && <Field label="კომპანია"><input required maxLength={80} className={input} value={form.company_name} onChange={set('company_name')} placeholder="მაგ. Coffee Lab" /></Field>}
        <Field label={role === 'student' ? 'სახელი და გვარი' : 'საკონტაქტო პირი'}><input required maxLength={80} autoComplete="name" className={input} value={form.full_name} onChange={set('full_name')} /></Field>
        <Field label="ელფოსტა"><input required type="email" inputMode="email" autoComplete="email" className={input} value={form.email} onChange={set('email')} /></Field>
        <Field label="პაროლი (მინ. 6 სიმბოლო)"><input required type="password" minLength={6} autoComplete="new-password" className={input} value={form.password} onChange={set('password')} /></Field>
        <label className="flex items-start gap-2.5 text-[14px] text-muted">
          <input required type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-ink" />
          <span>
            ვეთანხმები <a href="/terms" target="_blank" rel="noreferrer" className="font-semibold text-ink underline underline-offset-4">წესებსა და პირობებს</a> და{' '}
            <a href="/privacy" target="_blank" rel="noreferrer" className="font-semibold text-ink underline underline-offset-4">კონფიდენციალურობის პოლიტიკას</a>
          </span>
        </label>
        <ErrorNote>{error}</ErrorNote>
        <button disabled={busy} className={btn}>{busy ? 'იტვირთება…' : 'ანგარიშის შექმნა'}</button>
      </form>
      <p className="mt-5 text-center text-[14px] text-muted">უკვე გაქვს ანგარიში? <Link to="/login" className="font-semibold text-ink underline underline-offset-4">შესვლა</Link></p>
    </div>
  )
}

function CheckEmail({ email }) {
  const [state, setState] = useState('idle') // idle | sending | sent | error
  async function resend() {
    setState('sending')
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: window.location.origin } })
    setState(error ? 'error' : 'sent')
  }
  return (
    <div className="text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-fill"><Icon name="inbox" className="h-7 w-7" /></span>
      <h1 className="mt-4 text-[26px] font-semibold tracking-tight">შეამოწმე ელფოსტა</h1>
      <p className="mt-2 text-[15px] text-muted">დადასტურების ბმული გამოგიგზავნეთ მისამართზე <b className="text-ink">{email}</b>. დააჭირე ბმულს და ანგარიში გააქტიურდება.</p>
      <p className="mt-2 text-[14px] text-quiet">თუ წერილი არ ჩანს, ნახე „სპამის“ საქაღალდე.</p>
      <button disabled={state === 'sending' || state === 'sent'} onClick={resend} className={`${btn2} mt-6`}>
        {state === 'sent' ? 'თავიდან გაიგზავნა' : state === 'sending' ? 'იგზავნება…' : 'თავიდან გაგზავნა'}
      </button>
      {state === 'error' && <p className="mt-2 text-[14px] font-medium text-coral">ვერ გაიგზავნა. სცადე რამდენიმე წუთში.</p>}
      <Link to="/login" className="mt-5 inline-block text-[14px] font-semibold underline underline-offset-4">შესვლის გვერდზე</Link>
    </div>
  )
}

function Reset() {
  usePageTitle('პაროლის აღდგენა')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const { busy, error, run } = useSubmit()
  const submit = (e) => {
    e.preventDefault()
    run(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/new-password` })
      if (error) throw error
      setSent(true)
    })
  }
  if (sent) {
    return (
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-fill"><Icon name="inbox" className="h-7 w-7" /></span>
        <h1 className="mt-4 text-[26px] font-semibold tracking-tight">შეამოწმე ელფოსტა</h1>
        <p className="mt-2 text-[15px] text-muted">თუ <b className="text-ink">{email}</b> დარეგისტრირებულია, პაროლის აღდგენის ბმული უკვე გამოგზავნილია.</p>
        <Link to="/login" className="mt-5 inline-block text-[14px] font-semibold underline underline-offset-4">შესვლის გვერდზე</Link>
      </div>
    )
  }
  return (
    <div>
      <h1 className="text-[30px] font-semibold tracking-tight">პაროლის აღდგენა</h1>
      <p className="mb-6 mt-1 text-[15px] text-muted">მიუთითე ელფოსტა და აღდგენის ბმულს გამოგიგზავნით.</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="ელფოსტა"><input required type="email" inputMode="email" autoComplete="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <ErrorNote>{error}</ErrorNote>
        <button disabled={busy} className={btn}>{busy ? 'იგზავნება…' : 'ბმულის გაგზავნა'}</button>
      </form>
      <Link to="/login" className="mt-5 inline-block text-[14px] font-semibold text-muted hover:text-ink">შესვლაზე დაბრუნება</Link>
    </div>
  )
}

// აღდგენის ბმულით მოსული მომხმარებელი ახალ პაროლს ირჩევს (ამ დროს უკვე შესულია)
function NewPassword() {
  usePageTitle('ახალი პაროლი')
  const [password, setPassword] = useState('')
  const { busy, error, run } = useSubmit()
  const submit = (e) => {
    e.preventDefault()
    run(async () => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      navigate('/', { replace: true })
    })
  }
  return (
    <div>
      <h1 className="mb-6 text-[30px] font-semibold tracking-tight">ახალი პაროლი</h1>
      <form onSubmit={submit} className="space-y-4">
        <Field label="ახალი პაროლი (მინ. 6 სიმბოლო)"><input required type="password" minLength={6} autoComplete="new-password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <ErrorNote>{error}</ErrorNote>
        <button disabled={busy} className={btn}>{busy ? 'ინახება…' : 'პაროლის შენახვა'}</button>
      </form>
    </div>
  )
}
