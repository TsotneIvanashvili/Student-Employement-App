import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { Icon, Segmented, btn, card, chip, input, label } from './ui.jsx'

const DEMO = {
  student: {
    email: 'demo.student@studentshifts.ge',
    meta: { role: 'student', full_name: 'ნინო ბერიძე' },
    profile: { university: 'თსუ', year: 2, hours: 15 },
  },
  employer: {
    email: 'demo.employer@studentshifts.ge',
    meta: { role: 'employer', full_name: 'გიორგი მაისურაძე', company_name: 'Coffee Lab' },
    profile: {},
  },
}
const DEMO_PASSWORD = 'Demo-12345'

async function signUpWithProfile(email, password, meta, profile) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: meta } })
  if (error) throw error
  if (!data.session) throw new Error('ელფოსტის დადასტურებაა ჩართული: Supabase-ში გამორთე „Confirm email“.')
  if (Object.keys(profile).length) await supabase.from('profiles').update(profile).eq('id', data.user.id)
}

const errorText = (e) => (e.message === 'Invalid login credentials' ? 'ელფოსტა ან პაროლი არასწორია.' : e.message)

export function Logo({ light = false, className = 'text-[26px]' }) {
  return (
    <span className={`inline-flex items-center gap-2 font-black tracking-tight ${className} ${light ? 'text-white' : 'text-ink'}`}>
      <span className={`grid h-[1.4em] w-[1.4em] place-items-center rounded-[0.4em] ${light ? 'bg-white text-brand' : 'bg-brand text-white'}`}>
        <Icon name="calendar" className="h-[0.85em] w-[0.85em]" strokeWidth={3} />
      </span>
      <span>shift<span className={light ? 'text-sun' : 'text-brand'}>mate</span></span>
    </span>
  )
}

export default function Auth() {
  const [screen, setScreen] = useState({ name: 'welcome' })
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <Hero compact={screen.name !== 'welcome'} />
      <main className="flex justify-center px-5 py-8 lg:items-center lg:px-10">
        <div className="w-full max-w-md">
          {screen.name === 'welcome' && <Welcome go={setScreen} />}
          {screen.name === 'login' && <Login go={setScreen} />}
          {screen.name === 'register' && <Register initialRole={screen.role} go={setScreen} />}
        </div>
      </main>
    </div>
  )
}

// მარცხენა ფერადი ნაწილი: სათაური და ილუსტრაცია (ტელეფონზე ზემოთაა)
function Hero({ compact }) {
  const free = new Set(['0-2', '0-3', '1-3', '2-2', '2-3', '3-0', '4-0', '4-1', '5-1', '5-2', '6-2'])
  return (
    <div className={`relative overflow-hidden bg-brand px-6 pb-12 pt-[max(env(safe-area-inset-top),1.25rem)] text-white lg:min-h-dvh lg:flex-col lg:p-12 ${compact ? 'hidden lg:flex' : 'lg:flex'}`}>
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-coral/40 blur-3xl" />
      <Logo light />
      <div className="relative mt-8 lg:mt-auto">
        <h1 className="max-w-lg text-[34px] font-black leading-[1.1] lg:text-[52px]">იმუშავე მაშინ, როცა <span className="text-sun">თავისუფალი ხარ</span></h1>
        <p className="mt-3 max-w-md text-[17px] font-semibold text-white/85">მონიშნე ლექციებს შორის ფანჯრები და მხოლოდ იმ ვაკანსიებს ნახავ, რომლებიც შენს დროს ერგება.</p>
      </div>

      <div className="relative mx-auto mt-10 w-full max-w-md lg:mb-auto lg:mt-14">
        <div className="rotate-[-3deg] rounded-3xl bg-white/15 p-4 ring-2 ring-white/25 backdrop-blur">
          <div className="grid grid-cols-7 gap-1.5">
            {['ორ', 'სა', 'ოთ', 'ხუ', 'პა', 'შა', 'კვ'].map((d) => <span key={d} className="text-center text-[11px] font-extrabold text-white/70">{d}</span>)}
            {Array.from({ length: 28 }, (_, i) => {
              const key = `${i % 7}-${Math.floor(i / 7)}`
              return <span key={key} className={`h-6 rounded-lg ${free.has(key) ? 'bg-mint' : 'bg-white/15'}`} />
            })}
          </div>
        </div>
        <div className="animate-float absolute -bottom-8 right-0 w-[210px] rotate-[2deg] rounded-2xl bg-white p-3 text-ink shadow-[0_6px_0_rgba(0,0,0,0.15)]">
          <div className="flex items-center justify-between font-extrabold"><span>☕ ბარისტა</span><span className="text-brand">9 ₾/სთ</span></div>
          <p className="text-[12px] font-semibold text-muted">Coffee Lab · ვაკე</p>
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-mint-soft px-2 py-0.5 text-[12px] font-extrabold text-mint-dark"><Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />3/3 ცვლა ერგება</p>
        </div>
        <div className="absolute -left-2 -top-5 rotate-[-6deg] rounded-full bg-sun px-3 py-1.5 text-[13px] font-black text-ink shadow-[0_3px_0_rgba(0,0,0,0.15)]">+126 ₾ ამ კვირაში 💸</div>
      </div>
    </div>
  )
}

function Welcome({ go }) {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  // სატესტო ანგარიში: შედის, ხოლო თუ ჯერ არ არსებობს, ჯერ ქმნის
  async function demo(kind) {
    setBusy(kind)
    setError('')
    try {
      const d = DEMO[kind]
      const { error } = await supabase.auth.signInWithPassword({ email: d.email, password: DEMO_PASSWORD })
      if (error?.message === 'Invalid login credentials') await signUpWithProfile(d.email, DEMO_PASSWORD, d.meta, d.profile)
      else if (error) throw error
    } catch (e) {
      setError(errorText(e))
      setBusy('')
    }
  }

  return (
    <div>
      <h2 className="text-[26px] font-black">დავიწყოთ 👋</h2>
      <p className="mt-1 font-semibold text-muted">ვინ ხარ?</p>
      <div className="mt-5 space-y-3">
        <RoleCard emoji="🎓" title="სტუდენტი ვარ" text="ვეძებ სამსახურს ლექციებს შორის" onClick={() => go({ name: 'register', role: 'student' })} />
        <RoleCard emoji="🏢" title="დამსაქმებელი ვარ" text="ვეძებ სტუდენტებს ცვლებისთვის" onClick={() => go({ name: 'register', role: 'employer' })} />
      </div>
      <p className="mt-5 text-center font-semibold text-muted">
        უკვე გაქვს ანგარიში? <button onClick={() => go({ name: 'login' })} className="font-extrabold text-brand hover:underline">შესვლა</button>
      </p>

      <div className="mt-8 rounded-3xl border-2 border-dashed border-line p-4">
        <p className="text-center text-[13px] font-extrabold uppercase tracking-wide text-quiet">სწრაფი დემო, რეგისტრაციის გარეშე</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button disabled={!!busy} onClick={() => demo('student')} className={`${chip} whitespace-nowrap px-2 text-[13px]`}>{busy === 'student' ? '…' : '🎓 სტუდენტი'}</button>
          <button disabled={!!busy} onClick={() => demo('employer')} className={`${chip} whitespace-nowrap px-2 text-[13px]`}>{busy === 'employer' ? '…' : '🏢 დამსაქმებელი'}</button>
        </div>
        {error && <p className="mt-2 text-center text-sm font-bold text-coral">{error}</p>}
      </div>
    </div>
  )
}

const RoleCard = ({ emoji, title, text, onClick }) => (
  <button onClick={onClick} className={`${card} flex w-full items-center gap-4 p-4 text-left shadow-[0_4px_0_var(--color-line)] transition hover:border-brand active:translate-y-[4px] active:shadow-none`}>
    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-soft text-[28px]">{emoji}</span>
    <span className="flex-1">
      <span className="block text-[18px] font-black">{title}</span>
      <span className="block text-[14px] font-semibold text-muted">{text}</span>
    </span>
    <Icon name="chevron" className="h-6 w-6 text-quiet" strokeWidth={2.5} />
  </button>
)

function Back({ go }) {
  return (
    <button onClick={() => go({ name: 'welcome' })} className="mb-5 flex items-center gap-1 font-extrabold text-brand hover:underline">
      <Icon name="back" className="h-5 w-5" strokeWidth={2.8} />უკან
    </button>
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

function Login({ go }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const { busy, error, run } = useSubmit()
  const submit = (e) => {
    e.preventDefault()
    run(async () => {
      const { error } = await supabase.auth.signInWithPassword(form)
      if (error) throw error
    })
  }
  return (
    <div>
      <Back go={go} />
      <h2 className="mb-6 text-[30px] font-black">შესვლა</h2>
      <form onSubmit={submit} className="space-y-4">
        <Field label="ელფოსტა"><input required type="email" inputMode="email" autoComplete="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="პაროლი"><input required type="password" autoComplete="current-password" className={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        {error && <p className="font-bold text-coral">{error}</p>}
        <button disabled={busy} className={btn}>{busy ? 'იტვირთება…' : 'შესვლა'}</button>
      </form>
    </div>
  )
}

function Register({ initialRole, go }) {
  const [role, setRole] = useState(initialRole)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', company_name: '', university: '', year: '1', hours: '15' })
  const { busy, error, run } = useSubmit()
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    run(() => {
      const meta = role === 'student' ? { role, full_name: form.full_name } : { role, full_name: form.full_name, company_name: form.company_name }
      const profile = role === 'student' ? { university: form.university, year: Number(form.year), hours: Number(form.hours) } : {}
      return signUpWithProfile(form.email, form.password, meta, profile)
    })
  }

  return (
    <div>
      <Back go={go} />
      <h2 className="mb-4 text-[30px] font-black">რეგისტრაცია</h2>
      <div className="mb-5">
        <Segmented value={role} onChange={setRole} options={[['student', '🎓 სტუდენტი'], ['employer', '🏢 დამსაქმებელი']]} />
      </div>
      <form onSubmit={submit} className="space-y-4">
        {role === 'employer' && <Field label="კომპანია"><input required className={input} value={form.company_name} onChange={set('company_name')} placeholder="მაგ. Coffee Lab" /></Field>}
        <Field label={role === 'student' ? 'სახელი და გვარი' : 'საკონტაქტო პირი'}><input required className={input} value={form.full_name} onChange={set('full_name')} /></Field>
        {role === 'student' && (
          <>
            <Field label="უნივერსიტეტი"><input required className={input} value={form.university} onChange={set('university')} placeholder="მაგ. თსუ" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="კურსი">
                <select className={input} value={form.year} onChange={set('year')}>
                  {[1, 2, 3, 4].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </Field>
              <Field label="საათი კვირაში"><input required type="number" inputMode="numeric" min="2" max="40" className={input} value={form.hours} onChange={set('hours')} /></Field>
            </div>
          </>
        )}
        <Field label="ელფოსტა"><input required type="email" inputMode="email" autoComplete="email" className={input} value={form.email} onChange={set('email')} /></Field>
        <Field label="პაროლი (მინ. 6 სიმბოლო)"><input required type="password" minLength={6} autoComplete="new-password" className={input} value={form.password} onChange={set('password')} /></Field>
        {error && <p className="font-bold text-coral">{error}</p>}
        <button disabled={busy} className={btn}>{busy ? 'იტვირთება…' : 'ანგარიშის შექმნა'}</button>
      </form>
    </div>
  )
}
