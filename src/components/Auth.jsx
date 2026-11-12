import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

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
const field = 'w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-base outline-none focus:border-brand'

async function signUpWithProfile(email, password, meta, profile) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: meta } })
  if (error) throw error
  if (!data.session) throw new Error('ელფოსტის დადასტურებაა ჩართული: Supabase-ში გამორთე „Confirm email“.')
  if (Object.keys(profile).length) await supabase.from('profiles').update(profile).eq('id', data.user.id)
}

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('student')
  const [form, setForm] = useState({ email: '', password: '', full_name: '', company_name: '', university: '', year: '1', hours: '15' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function run(fn) {
    setError('')
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      setError(e.message === 'Invalid login credentials' ? 'ელფოსტა ან პაროლი არასწორია.' : e.message)
    } finally {
      setBusy(false)
    }
  }

  // სატესტო ანგარიში: შედის, ხოლო თუ ჯერ არ არსებობს, ჯერ ქმნის
  const demo = (kind) =>
    run(async () => {
      const d = DEMO[kind]
      const { error } = await supabase.auth.signInWithPassword({ email: d.email, password: DEMO_PASSWORD })
      if (error?.message === 'Invalid login credentials') return signUpWithProfile(d.email, DEMO_PASSWORD, d.meta, d.profile)
      if (error) throw error
    })

  function submit(e) {
    e.preventDefault()
    run(async () => {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        if (error) throw error
        return
      }
      const meta = role === 'student' ? { role, full_name: form.full_name } : { role, full_name: form.full_name, company_name: form.company_name }
      const profile = role === 'student' ? { university: form.university, year: Number(form.year), hours: Number(form.hours) } : {}
      await signUpWithProfile(form.email, form.password, meta, profile)
    })
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-bg px-5 pb-10 pt-10">
      <div className="mb-6">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-brand text-xl font-bold text-white">ც</div>
        <h1 className="text-3xl font-bold leading-tight">სამსახური, რომელიც შენს თავისუფალ დროს ერგება</h1>
        <p className="mt-2 text-muted">მუდმივი ცვლები და 1–2 დღიანი სამუშაოები სტუდენტებისთვის.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2">
        <button onClick={() => demo('student')} disabled={busy} className="rounded-2xl border-2 border-dashed border-brand/40 bg-brand-soft py-3 text-sm font-semibold text-brand">
          სატესტო სტუდენტი
        </button>
        <button onClick={() => demo('employer')} disabled={busy} className="rounded-2xl border-2 border-dashed border-mint/40 bg-mint-soft py-3 text-sm font-semibold text-mint">
          სატესტო დამსაქმებელი
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 rounded-2xl bg-white p-1 shadow-sm">
        {[['login', 'შესვლა'], ['register', 'რეგისტრაცია']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2.5 font-semibold ${mode === m ? 'bg-ink text-white' : 'text-muted'}`}>
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === 'register' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {[['student', 'სტუდენტი ვარ'], ['employer', 'დამსაქმებელი ვარ']].map(([r, label]) => (
                <button type="button" key={r} onClick={() => setRole(r)} className={`rounded-2xl border-2 py-3 text-sm font-semibold ${role === r ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-white text-muted'}`}>
                  {label}
                </button>
              ))}
            </div>
            <input required className={field} value={form.full_name} onChange={set('full_name')} placeholder="სახელი და გვარი" />
            {role === 'employer' && <input required className={field} value={form.company_name} onChange={set('company_name')} placeholder="კომპანიის სახელი" />}
            {role === 'student' && (
              <>
                <input required className={field} value={form.university} onChange={set('university')} placeholder="უნივერსიტეტი, მაგ. თსუ" />
                <div className="grid grid-cols-2 gap-2">
                  <select className={field} value={form.year} onChange={set('year')}>
                    {[1, 2, 3, 4].map((y) => <option key={y} value={y}>{y} კურსი</option>)}
                  </select>
                  <input required type="number" inputMode="numeric" min="2" max="40" className={field} value={form.hours} onChange={set('hours')} aria-label="საათი კვირაში" />
                </div>
              </>
            )}
          </>
        )}
        <input required type="email" inputMode="email" autoComplete="email" className={field} value={form.email} onChange={set('email')} placeholder="ელფოსტა" />
        <input required type="password" minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className={field} value={form.password} onChange={set('password')} placeholder="პაროლი (მინ. 6 სიმბოლო)" />

        {error && <p className="rounded-2xl bg-coral/10 p-3 text-sm text-coral">{error}</p>}

        <button disabled={busy} className="w-full rounded-2xl bg-brand py-4 font-semibold text-white shadow-lg shadow-brand/25 disabled:opacity-60">
          {busy ? 'იტვირთება…' : mode === 'login' ? 'შესვლა' : 'რეგისტრაცია'}
        </button>
      </form>
    </div>
  )
}
