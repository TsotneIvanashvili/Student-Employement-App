import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { Icon, Segmented, btn, card, chip, input, label } from './ui.jsx'
import { DOTS } from './BigCalendar.jsx'

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
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className} ${light ? 'text-white' : 'text-ink'}`}>
      <span className={`grid h-[1.4em] w-[1.4em] place-items-center rounded-[0.4em] ${light ? 'bg-white text-ink' : 'bg-ink text-white'}`}>
        <Icon name="calendar" className="h-[0.85em] w-[0.85em]" strokeWidth={3} />
      </span>
      <span>shift<span className="text-muted">mate</span></span>
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

// მარცხენა ნაწილი: სათაური და კალენდრის მაგალითი (ტელეფონზე ზემოთაა)
function Hero({ compact }) {
  const days = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი']
  const cells = [
    [['lesson', 'ვებ დეველოპმენტი']], [['lesson', 'მარკეტინგი']], [['lesson', 'ინგლისური']], [['lesson', 'სტატისტიკა'], ['work', 'ბარისტა']], [['lesson', 'სემინარი']], [['work', 'ღონისძიება']], [],
  ]
  return (
    <div className={`border-b border-line bg-white px-6 pb-10 pt-[max(env(safe-area-inset-top),1.25rem)] lg:min-h-dvh lg:flex-col lg:border-b-0 lg:border-r lg:p-12 ${compact ? 'hidden lg:flex' : 'lg:flex'}`}>
      <Logo />
      <div className="mt-8 lg:mt-auto">
        <h1 className="max-w-lg text-[32px] font-semibold leading-[1.15] tracking-tight lg:text-[46px]">იმუშავე მაშინ, როცა თავისუფალი ხარ</h1>
        <p className="mt-3 max-w-md text-[16px] text-muted">ჩაწერე ლექციები და ვაკანსიებს მხოლოდ შენს თავისუფალ დროში ნახავ. აყვანის შემდეგ ცვლები შენს კალენდარში ჩნდება.</p>
      </div>
      <div className="mt-8 max-w-lg overflow-hidden rounded-2xl border border-line lg:mb-auto lg:mt-12">
        <div className="grid grid-cols-7 border-b border-line bg-bg">
          {days.map((d) => <span key={d} className="py-1.5 text-center text-[11px] text-muted">{d}</span>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((list, i) => (
            <div key={i} className="min-h-[86px] space-y-1 border-r border-line p-1 last:border-r-0">
              <span className={`ml-auto grid h-5 w-5 place-items-center rounded-md text-[11px] ${i === 4 ? 'bg-ink text-white' : ''}`}>{16 + i}</span>
              {list.map(([tone, title]) => (
                <span key={title} className="flex items-center gap-1 truncate text-[10px]"><i className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOTS[tone]}`} /><span className="truncate">{title}</span></span>
              ))}
            </div>
          ))}
        </div>
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
      <h2 className="text-[26px] font-semibold">დავიწყოთ 👋</h2>
      <p className="mt-1 font-semibold text-muted">ვინ ხარ?</p>
      <div className="mt-5 space-y-3">
        <RoleCard emoji="🎓" title="სტუდენტი ვარ" text="ვეძებ სამსახურს ლექციებს შორის" onClick={() => go({ name: 'register', role: 'student' })} />
        <RoleCard emoji="🏢" title="დამსაქმებელი ვარ" text="ვეძებ სტუდენტებს ცვლებისთვის" onClick={() => go({ name: 'register', role: 'employer' })} />
      </div>
      <p className="mt-5 text-center font-semibold text-muted">
        უკვე გაქვს ანგარიში? <button onClick={() => go({ name: 'login' })} className="font-semibold text-brand hover:underline">შესვლა</button>
      </p>

      <div className="mt-8 rounded-2xl border border-dashed border-line p-4">
        <p className="text-center text-[13px] font-semibold uppercase tracking-wide text-quiet">სწრაფი დემო, რეგისტრაციის გარეშე</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button disabled={!!busy} onClick={() => demo('student')} className={`${chip} whitespace-nowrap px-2 text-[13px]`}>{busy === 'student' ? '…' : '🎓 სტუდენტი'}</button>
          <button disabled={!!busy} onClick={() => demo('employer')} className={`${chip} whitespace-nowrap px-2 text-[13px]`}>{busy === 'employer' ? '…' : '🏢 დამსაქმებელი'}</button>
        </div>
        {error && <p className="mt-2 text-center text-sm font-medium text-coral">{error}</p>}
      </div>
    </div>
  )
}

const RoleCard = ({ emoji, title, text, onClick }) => (
  <button onClick={onClick} className={`${card} flex w-full items-center gap-4 p-4 text-left transition hover:border-brand`}>
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-fill text-[24px]">{emoji}</span>
    <span className="flex-1">
      <span className="block text-[18px] font-semibold">{title}</span>
      <span className="block text-[14px] font-semibold text-muted">{text}</span>
    </span>
    <Icon name="chevron" className="h-6 w-6 text-quiet" strokeWidth={2.5} />
  </button>
)

function Back({ go }) {
  return (
    <button onClick={() => go({ name: 'welcome' })} className="mb-5 flex items-center gap-1 font-semibold text-brand hover:underline">
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
      <h2 className="mb-6 text-[30px] font-semibold">შესვლა</h2>
      <form onSubmit={submit} className="space-y-4">
        <Field label="ელფოსტა"><input required type="email" inputMode="email" autoComplete="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="პაროლი"><input required type="password" autoComplete="current-password" className={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        {error && <p className="font-medium text-coral">{error}</p>}
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
      <h2 className="mb-4 text-[30px] font-semibold">რეგისტრაცია</h2>
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
        {error && <p className="font-medium text-coral">{error}</p>}
        <button disabled={busy} className={btn}>{busy ? 'იტვირთება…' : 'ანგარიშის შექმნა'}</button>
      </form>
    </div>
  )
}
