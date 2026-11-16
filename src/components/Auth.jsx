import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { Link, navigate } from '../lib/router.jsx'
import { catName, setLang, tr, useLang } from '../lib/i18n.js'
import { CalendarMock, Logo, usePageTitle } from './Site.jsx'
import { Icon, Segmented, btn, btn2, chip, input, tap } from './ui.jsx'

// სადემონსტრაციო ანგარიშები. ჯერჯერობით ყველას უჩანს; SHOW_DEMO = false-ის შემდეგ მხოლოდ /login?demo-ზე გამოჩნდება
const SHOW_DEMO = true
const DEMO = { student: 'demo.student@studentshifts.ge', employer: 'demo.employer@studentshifts.ge' }
const DEMO_PASSWORD = 'Demo-12345'

const ERRORS = [
  ['Invalid login credentials', 'ელფოსტა ან პაროლი არასწორია.', 'Wrong email or password.'],
  ['Email not confirmed', 'ელფოსტა ჯერ არ დაგიდასტურებია. შეამოწმე საფოსტო ყუთი.', "You haven't confirmed your email yet. Check your inbox."],
  ['User already registered', 'ამ ელფოსტით ანგარიში უკვე არსებობს. სცადე შესვლა.', 'An account with this email already exists. Try logging in.'],
  ['Password should be', 'პაროლი მინიმუმ 6 სიმბოლო უნდა იყოს.', 'The password must be at least 6 characters.'],
  ['rate limit', 'ძალიან ბევრი მცდელობა. სცადე რამდენიმე წუთში.', 'Too many attempts. Try again in a few minutes.'],
  ['only request this after', 'ცოტა ხანში სცადე თავიდან.', 'Try again in a little while.'],
  ['Failed to fetch', 'კავშირი ვერ დამყარდა. შეამოწმე ინტერნეტი.', 'Could not connect. Check your internet.'],
  ['different from the old password', 'ახალი პაროლი ძველისგან უნდა განსხვავდებოდეს.', 'The new password must be different from the old one.'],
]
const errorText = (e) => {
  const hit = ERRORS.find(([key]) => e.message?.includes(key))
  return hit ? tr(hit[1], hit[2]) : tr('რაღაც ვერ შესრულდა. სცადე თავიდან.', 'Something went wrong. Try again.')
}

// ზედა ზოლი: ლოგო და ენის გადამრთველი
function Top({ back = true }) {
  const lang = useLang()
  return (
    <div className="mb-5 flex items-center justify-between">
      <Link to="/" aria-label={back ? tr('მთავარი', 'Home') : undefined}><Logo className="text-[19px]" /></Link>
      <div className="w-[112px]"><Segmented size="sm" value={lang} onChange={setLang} options={[['ka', 'ქართ'], ['en', 'ENG']]} /></div>
    </div>
  )
}

// mode: 'login' | 'register' | 'reset' | 'new-password'
export default function Auth({ mode }) {
  useLang()
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside className="hidden bg-white p-12 lg:flex lg:min-h-dvh lg:flex-col">
        <Link to="/"><Logo className="text-[24px]" /></Link>
        <div className="mt-auto">
          <p className="max-w-lg text-[44px] font-bold leading-[1.12] tracking-[-0.02em]">{tr('დამატებითი სამუშაო შენს თავისუფალ დროში', 'Extra work that fits your free time')}</p>
          <p className="mt-3 max-w-md text-[16px] text-muted">{tr('შეავსე კალენდარი და ნახე მხოლოდ ის ვაკანსიები, რომლებიც შენს გრაფიკს ერგება.', 'Fill in your calendar and see only the jobs that fit your schedule.')}</p>
        </div>
        <div className="mb-auto mt-12"><CalendarMock /></div>
      </aside>
      <main className="flex justify-center px-5 pb-12 pt-[max(env(safe-area-inset-top),1.25rem)] lg:items-center lg:px-10">
        <div className="w-full max-w-[402px]">
          <Top back={mode !== 'new-password'} />
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
  <label className="flex flex-col gap-1.5 text-[13px] font-medium text-muted">
    {text}
    {children}
  </label>
)
const ErrorNote = ({ children }) => (children ? <p role="alert" className="rounded-2xl bg-coral-soft px-4 py-3 text-[14px] font-medium text-[#b42323]">{children}</p> : null)
const H1 = ({ children, sub }) => (
  <div>
    <h1 className="text-[28px] font-bold leading-[1.15] tracking-[-0.02em] [text-wrap:balance]">{children}</h1>
    {sub && <p className="mt-2.5 text-[15px] text-muted [text-wrap:pretty]">{sub}</p>}
  </div>
)

function Login() {
  usePageTitle(tr('შესვლა', 'Log in'))
  const [form, setForm] = useState({ email: '', password: '' })
  const { busy, error, run } = useSubmit()
  const signIn = (creds) =>
    run(async () => {
      const { error } = await supabase.auth.signInWithPassword(creds)
      if (error) throw error
      navigate('/', { replace: true })
    })
  const demo = SHOW_DEMO || new URLSearchParams(window.location.search).has('demo')

  return (
    <div className="space-y-4">
      <H1>{tr('შესვლა', 'Log in')}</H1>
      <form onSubmit={(e) => { e.preventDefault(); signIn(form) }} className="space-y-4">
        <Field label={tr('ელფოსტა', 'Email')}><input required type="email" inputMode="email" autoComplete="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label={tr('პაროლი', 'Password')}><input required type="password" autoComplete="current-password" className={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <ErrorNote>{error}</ErrorNote>
        <button disabled={busy} className={btn}>{busy ? tr('იტვირთება…', 'Loading…') : tr('შესვლა', 'Log in')}</button>
      </form>
      <div className="flex flex-wrap justify-between gap-2 text-[14px]">
        <Link to="/reset" className="font-semibold text-muted hover:text-ink">{tr('დაგავიწყდა პაროლი?', 'Forgot your password?')}</Link>
        <span className="text-muted">{tr('არ გაქვს ანგარიში?', 'No account?')} <Link to="/register" className="font-semibold text-ink underline underline-offset-4">{tr('რეგისტრაცია', 'Sign up')}</Link></span>
      </div>
      {demo && (
        <div className="rounded-3xl border border-dashed border-field p-4">
          <p className="text-center text-[12px] font-semibold uppercase tracking-wide text-quiet">{tr('სადემონსტრაციო ანგარიშები', 'Demo accounts')}</p>
          <p className="mt-1 text-center text-[13px] text-muted">{tr('სცადე რეგისტრაციის გარეშე', 'Try it without signing up')}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button disabled={busy} onClick={() => signIn({ email: DEMO.student, password: DEMO_PASSWORD })} className={`${chip} bg-fill`}>{tr('მაძიებელი', 'Job seeker')}</button>
            <button disabled={busy} onClick={() => signIn({ email: DEMO.employer, password: DEMO_PASSWORD })} className={`${chip} bg-fill`}>{tr('დამსაქმებელი', 'Employer')}</button>
          </div>
        </div>
      )}
    </div>
  )
}

const FIELDS = ['general', 'service', 'delivery', 'trades', 'design', 'dev', 'events', 'other']

// რეგისტრაცია ორ ნაბიჯად: 1) როლი, სახელი, ელფოსტა, პაროლი 2) მაძიებელი: სფერო; დამსაქმებელი: კომპანია
function Register() {
  usePageTitle(tr('რეგისტრაცია', 'Sign up'))
  const [role, setRole] = useState(() => (new URLSearchParams(window.location.search).get('role') === 'employer' ? 'employer' : 'student'))
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', company_name: '', field: 'general' })
  const [sentTo, setSentTo] = useState('')
  const { busy, error, run } = useSubmit()
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    if (step === 0) return setStep(1)
    run(async () => {
      const meta = role === 'student' ? { role, full_name: form.full_name.trim(), field: form.field } : { role, full_name: form.full_name.trim(), company_name: form.company_name.trim() }
      const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: meta, emailRedirectTo: window.location.origin } })
      if (error) throw error
      // არსებული ელფოსტისას Supabase ცარიელ identities-ს აბრუნებს (ელფოსტას არ ამჟღავნებს)
      if (data.user?.identities?.length === 0) throw new Error('User already registered')
      if (data.session) navigate('/', { replace: true })
      else setSentTo(form.email) // ელფოსტის დადასტურება ჩართულია
    })
  }

  if (sentTo) return <CheckEmail email={sentTo} />
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1].map((i) => <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-brand' : 'bg-line'}`} />)}
      </div>
      {step === 0 ? (
        <>
          <H1 sub={tr('შეავსე კალენდარი და ნახე მხოლოდ ის ვაკანსიები, რომლებიც შენს გრაფიკს ერგება.', 'Fill in your calendar and see only the jobs that fit your schedule.')}>
            {tr('დამატებითი სამუშაო შენს თავისუფალ დროში', 'Extra work that fits your free time')}
          </H1>
          <Segmented value={role} onChange={setRole} options={[['student', tr('ვეძებ სამუშაოს', 'I want work')], ['employer', tr('ვქირაობ', "I'm hiring")]]} />
          <Field label={role === 'student' ? tr('სახელი და გვარი', 'Full name') : tr('საკონტაქტო პირი', 'Contact person')}>
            <input required minLength={2} maxLength={80} autoComplete="name" className={input} value={form.full_name} onChange={set('full_name')} placeholder={tr('ნინო ბერიძე', 'Nino Beridze')} />
          </Field>
          <Field label={tr('ელფოსტა', 'Email')}><input required type="email" inputMode="email" autoComplete="email" className={input} value={form.email} onChange={set('email')} /></Field>
          <Field label={tr('პაროლი (მინ. 6 სიმბოლო)', 'Password (min. 6 characters)')}><input required type="password" minLength={6} autoComplete="new-password" className={input} value={form.password} onChange={set('password')} /></Field>
          <button className={btn}>{tr('გაგრძელება', 'Continue')}</button>
          <p className="text-center text-[14px] text-muted">{tr('უკვე გაქვს ანგარიში?', 'Already have an account?')} <Link to="/login" className="font-semibold text-ink underline underline-offset-4">{tr('შესვლა', 'Log in')}</Link></p>
        </>
      ) : (
        <>
          {role === 'student' ? (
            <>
              <H1 sub={tr('თუ ჯერ არ იცი, აირჩიე „ზოგადი“ და ყველა ვაკანსიას გაჩვენებთ.', "Not sure yet? Pick General and we'll show you everything.")}>{tr('რომელ სფეროში გინდა მუშაობა?', 'Which field do you want to work in?')}</H1>
              <div className="grid grid-cols-2 gap-2.5" role="radiogroup">
                {FIELDS.map((f) => {
                  const on = form.field === f
                  return (
                    <button key={f} type="button" role="radio" aria-checked={on} onClick={() => setForm({ ...form, field: f })} className={`flex items-center justify-between gap-2 rounded-[18px] px-3.5 py-4 text-left text-[14px] font-semibold ${tap} ${on ? 'bg-brand-soft text-brand-deep ring-[1.5px] ring-inset ring-brand-deep' : 'bg-white shadow-[0_1px_2px_rgba(21,24,30,.08)]'}`}>
                      {catName(f)}<Icon name="check" className={`h-4 w-4 shrink-0 transition-opacity ${on ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <H1 sub={tr('ეს სახელი გამოჩნდება შენს ვაკანსიებზე.', 'This name appears on your job posts.')}>{tr('რა ჰქვია კომპანიას?', "What's your company called?")}</H1>
              <Field label={tr('კომპანია', 'Company')}><input required minLength={2} maxLength={80} className={input} value={form.company_name} onChange={set('company_name')} placeholder="Coffee Lab" /></Field>
            </>
          )}
          <label className="flex items-start gap-3 rounded-[18px] bg-white p-4 text-[14px] text-muted shadow-[0_1px_2px_rgba(21,24,30,.06)]">
            <input required type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#15181e]" />
            <span>
              {tr('ვეთანხმები ', 'I agree to the ')}<a href="/terms" target="_blank" rel="noreferrer" className="font-semibold text-ink underline underline-offset-4">{tr('წესებსა და პირობებს', 'Terms')}</a>{tr(' და ', ' and the ')}
              <a href="/privacy" target="_blank" rel="noreferrer" className="font-semibold text-ink underline underline-offset-4">{tr('კონფიდენციალურობის პოლიტიკას', 'Privacy Policy')}</a>
            </span>
          </label>
          <ErrorNote>{error}</ErrorNote>
          <div className="grid grid-cols-[auto_1fr] gap-2.5">
            <button type="button" onClick={() => setStep(0)} className={`${btn2} px-5`}>{tr('უკან', 'Back')}</button>
            <button disabled={busy} className={btn}>{busy ? tr('იტვირთება…', 'Loading…') : tr('ანგარიშის შექმნა', 'Create account')}</button>
          </div>
        </>
      )}
    </form>
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
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-brand-soft text-brand-deep"><Icon name="mail" className="h-7 w-7" /></span>
      <h1 className="mt-4 text-[26px] font-bold tracking-[-0.02em]">{tr('შეამოწმე ელფოსტა', 'Check your email')}</h1>
      <p className="mt-2 text-[15px] text-muted">{tr('დადასტურების ბმული გამოგიგზავნეთ მისამართზე', 'We sent a confirmation link to')} <b className="text-ink">{email}</b>. {tr('დააჭირე ბმულს და ანგარიში გააქტიურდება.', 'Open the link to activate your account.')}</p>
      <p className="mt-2 text-[14px] text-quiet">{tr('თუ წერილი არ ჩანს, ნახე „სპამის“ საქაღალდე.', "If you can't see it, check your spam folder.")}</p>
      <button disabled={state === 'sending' || state === 'sent'} onClick={resend} className={`${btn2} mt-6`}>
        {state === 'sent' ? tr('თავიდან გაიგზავნა', 'Sent again') : state === 'sending' ? tr('იგზავნება…', 'Sending…') : tr('თავიდან გაგზავნა', 'Send again')}
      </button>
      {state === 'error' && <p className="mt-2 text-[14px] font-medium text-coral">{tr('ვერ გაიგზავნა. სცადე რამდენიმე წუთში.', 'Could not send. Try again in a few minutes.')}</p>}
      <Link to="/login" className="mt-5 inline-block text-[14px] font-semibold underline underline-offset-4">{tr('შესვლის გვერდზე', 'Go to log in')}</Link>
    </div>
  )
}

function Reset() {
  usePageTitle(tr('პაროლის აღდგენა', 'Reset password'))
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
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-brand-soft text-brand-deep"><Icon name="mail" className="h-7 w-7" /></span>
        <h1 className="mt-4 text-[26px] font-bold tracking-[-0.02em]">{tr('შეამოწმე ელფოსტა', 'Check your email')}</h1>
        <p className="mt-2 text-[15px] text-muted">{tr(`თუ ${email} დარეგისტრირებულია, პაროლის აღდგენის ბმული უკვე გამოგზავნილია.`, `If ${email} is registered, a reset link is on its way.`)}</p>
        <Link to="/login" className="mt-5 inline-block text-[14px] font-semibold underline underline-offset-4">{tr('შესვლის გვერდზე', 'Go to log in')}</Link>
      </div>
    )
  }
  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-[-0.02em]">{tr('პაროლის აღდგენა', 'Reset your password')}</h1>
      <p className="mb-5 mt-1 text-[15px] text-muted">{tr('მიუთითე ელფოსტა და აღდგენის ბმულს გამოგიგზავნით.', "Enter your email and we'll send you a reset link.")}</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label={tr('ელფოსტა', 'Email')}><input required type="email" inputMode="email" autoComplete="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <ErrorNote>{error}</ErrorNote>
        <button disabled={busy} className={btn}>{busy ? tr('იგზავნება…', 'Sending…') : tr('ბმულის გაგზავნა', 'Send the link')}</button>
      </form>
      <Link to="/login" className="mt-5 inline-block text-[14px] font-semibold text-muted hover:text-ink">{tr('შესვლაზე დაბრუნება', 'Back to log in')}</Link>
    </div>
  )
}

// აღდგენის ბმულით მოსული მომხმარებელი ახალ პაროლს ირჩევს (ამ დროს უკვე შესულია)
function NewPassword() {
  usePageTitle(tr('ახალი პაროლი', 'New password'))
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
      <h1 className="mb-5 text-[28px] font-bold tracking-[-0.02em]">{tr('ახალი პაროლი', 'New password')}</h1>
      <form onSubmit={submit} className="space-y-4">
        <Field label={tr('ახალი პაროლი (მინ. 6 სიმბოლო)', 'New password (min. 6 characters)')}><input required type="password" minLength={6} autoComplete="new-password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <ErrorNote>{error}</ErrorNote>
        <button disabled={busy} className={btn}>{busy ? tr('ინახება…', 'Saving…') : tr('პაროლის შენახვა', 'Save password')}</button>
      </form>
    </div>
  )
}
