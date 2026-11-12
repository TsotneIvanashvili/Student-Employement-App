import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useLightStatusBar } from './Device.jsx'
import { Group, Icon, Segmented, btn, btn2, input } from './ui.jsx'

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

export default function Auth() {
  const [screen, setScreen] = useState({ name: 'welcome' })
  if (screen.name === 'login') return <Login onBack={() => setScreen({ name: 'welcome' })} />
  if (screen.name === 'register') return <Register initialRole={screen.role} onBack={() => setScreen({ name: 'welcome' })} />
  return <Welcome go={setScreen} />
}

function Welcome({ go }) {
  useLightStatusBar()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // სატესტო ანგარიში: შედის, ხოლო თუ ჯერ არ არსებობს, ჯერ ქმნის
  async function demo(kind) {
    setBusy(true)
    setError('')
    try {
      const d = DEMO[kind]
      const { error } = await supabase.auth.signInWithPassword({ email: d.email, password: DEMO_PASSWORD })
      if (error?.message === 'Invalid login credentials') await signUpWithProfile(d.email, DEMO_PASSWORD, d.meta, d.profile)
      else if (error) throw error
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-white md:-mt-[50px]">
      <Hero />
      <div className="relative -mt-6 flex flex-1 flex-col rounded-t-[28px] bg-white px-6 pb-8 pt-7">
        <h1 className="text-[30px] font-bold leading-[1.15] tracking-tight">იმუშავე მაშინ, როცა თავისუფალი ხარ</h1>
        <p className="mt-2 text-[16px] leading-relaxed text-muted">მონიშნე შენი თავისუფალი საათები, ვაკანსიებს კი ჩვენ შეგირჩევთ.</p>

        <ul className="mt-6 space-y-4">
          <Feature icon="calendar" text="კალენდარი, რომელიც ვაკანსიებს შენს დროზე ფილტრავს" />
          <Feature icon="bolt" text="1–2 დღიანი სამუშაოები, როცა ფული ახლავე გჭირდება" />
          <Feature icon="shield" text="დაცული გადახდა: თანხა სამუშაომდე იბლოკება" />
        </ul>

        <div className="mt-auto space-y-3 pt-8">
          <button onClick={() => go({ name: 'register', role: 'student' })} className={btn}>რეგისტრაცია</button>
          <button onClick={() => go({ name: 'login' })} className={btn2}>შესვლა</button>
          <button onClick={() => go({ name: 'register', role: 'employer' })} className="w-full py-2 text-[15px] font-medium text-muted">
            დამსაქმებელი ხარ? <span className="text-brand">დაიწყე აქ</span>
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-bg p-3">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-quiet">სწრაფი დემო</p>
          <div className="grid grid-cols-2 gap-2">
            <button disabled={busy} onClick={() => demo('student')} className="rounded-xl bg-white py-2.5 text-sm font-semibold shadow-sm disabled:opacity-50">🎓 სტუდენტი</button>
            <button disabled={busy} onClick={() => demo('employer')} className="rounded-xl bg-white py-2.5 text-sm font-semibold shadow-sm disabled:opacity-50">🏢 დამსაქმებელი</button>
          </div>
          {error && <p className="mt-2 text-center text-sm text-coral">{error}</p>}
        </div>
      </div>
    </div>
  )
}

const Feature = ({ icon, text }) => (
  <li className="flex items-center gap-3.5">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><Icon name={icon} className="h-5 w-5" strokeWidth={2} /></span>
    <span className="text-[15px] leading-snug">{text}</span>
  </li>
)

export function Logo({ light }) {
  return (
    <span className={`text-[26px] font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`} style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}>
      shift<span className="text-brand">mate</span>
    </span>
  )
}

// ილუსტრაცია: კვირის კალენდარი თავისუფალი საათებით და ბარათი "ერგება"
function Hero() {
  const free = new Set(['0-1', '0-2', '2-1', '2-2', '4-0', '4-1', '5-2', '5-3', '6-2'])
  return (
    <div className="relative h-[360px] shrink-0 overflow-hidden bg-[radial-gradient(120%_90%_at_85%_0%,#1d7a4c_0%,#0f2c1f_45%,#0b0d12_100%)] px-6 pt-[max(env(safe-area-inset-top),1rem)] md:pt-[62px]">
      <Logo light />
      <div className="absolute left-6 right-14 top-[100px] rotate-[-4deg] rounded-[22px] bg-white/10 p-3.5 ring-1 ring-white/15 backdrop-blur-md md:top-[124px]">
        <div className="grid grid-cols-7 gap-1.5">
          {['ორ', 'სა', 'ოთ', 'ხუ', 'პა', 'შა', 'კვ'].map((d) => <span key={d} className="text-center text-[10px] font-semibold text-white/60">{d}</span>)}
          {Array.from({ length: 28 }, (_, i) => {
            const key = `${i % 7}-${Math.floor(i / 7)}`
            return <span key={key} className={`h-5 rounded-md ${free.has(key) ? 'bg-brand' : 'bg-white/10'}`} />
          })}
        </div>
      </div>
      <div className="animate-float absolute bottom-[72px] right-5 w-[200px] rounded-2xl bg-white p-3 shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-ink">ბარისტა</p>
          <p className="text-sm font-bold text-ink">9 ₾/სთ</p>
        </div>
        <p className="text-xs text-muted">Coffee Lab · ვაკე</p>
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand"><Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />3/3 ცვლა ერგება</p>
      </div>
      <div className="absolute bottom-12 left-6 rotate-[3deg] rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-black/30">+ 126 ₾ ამ კვირაში</div>
    </div>
  )
}

function Screen({ title, onBack, children }) {
  return (
    <div className="min-h-full px-4 pb-10 pt-[max(env(safe-area-inset-top),0.5rem)]">
      <button onClick={onBack} className="-ml-1 flex items-center gap-0.5 py-2 text-[17px] text-brand">
        <Icon name="back" className="h-6 w-6" strokeWidth={2.2} />უკან
      </button>
      <h1 className="mb-6 mt-1 px-1 text-[32px] font-bold tracking-tight">{title}</h1>
      {children}
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

function Login({ onBack }) {
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
    <Screen title="შესვლა" onBack={onBack}>
      <form onSubmit={submit}>
        <Group>
          <input required type="email" inputMode="email" autoComplete="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ელფოსტა" />
          <input required type="password" autoComplete="current-password" className={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="პაროლი" />
        </Group>
        {error && <p className="-mt-3 mb-4 px-4 text-sm text-coral">{error}</p>}
        <button disabled={busy} className={btn}>{busy ? 'იტვირთება…' : 'შესვლა'}</button>
      </form>
    </Screen>
  )
}

function Register({ initialRole, onBack }) {
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
    <Screen title="რეგისტრაცია" onBack={onBack}>
      <div className="mb-6">
        <Segmented value={role} onChange={setRole} options={[['student', 'სტუდენტი ვარ'], ['employer', 'დამსაქმებელი ვარ']]} />
      </div>
      <form onSubmit={submit}>
        <Group title={role === 'student' ? 'შენ შესახებ' : 'კომპანია'}>
          {role === 'employer' && <input required className={input} value={form.company_name} onChange={set('company_name')} placeholder="კომპანიის სახელი" />}
          <input required className={input} value={form.full_name} onChange={set('full_name')} placeholder={role === 'student' ? 'სახელი და გვარი' : 'საკონტაქტო პირი'} />
          {role === 'student' && (
            <>
              <input required className={input} value={form.university} onChange={set('university')} placeholder="უნივერსიტეტი, მაგ. თსუ" />
              <label className="flex items-center justify-between pr-4">
                <span className="px-4 py-3.5 text-[17px]">კურსი</span>
                <select className="bg-transparent text-[17px] text-muted outline-none" value={form.year} onChange={set('year')}>
                  {[1, 2, 3, 4].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>
              <label className="flex items-center justify-between pr-4">
                <span className="px-4 py-3.5 text-[17px]">საათი კვირაში</span>
                <input required type="number" inputMode="numeric" min="2" max="40" className="w-16 bg-transparent text-right text-[17px] text-muted outline-none" value={form.hours} onChange={set('hours')} />
              </label>
            </>
          )}
        </Group>
        <Group title="ანგარიში" footer="პაროლი მინიმუმ 6 სიმბოლო.">
          <input required type="email" inputMode="email" autoComplete="email" className={input} value={form.email} onChange={set('email')} placeholder="ელფოსტა" />
          <input required type="password" minLength={6} autoComplete="new-password" className={input} value={form.password} onChange={set('password')} placeholder="პაროლი" />
        </Group>
        {error && <p className="-mt-3 mb-4 px-4 text-sm text-coral">{error}</p>}
        <button disabled={busy} className={btn}>{busy ? 'იტვირთება…' : 'ანგარიშის შექმნა'}</button>
      </form>
    </Screen>
  )
}
