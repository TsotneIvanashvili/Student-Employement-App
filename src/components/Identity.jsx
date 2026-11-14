import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { Icon, Sheet, btn, btn2, card, input, label } from './ui.jsx'

// პირადი მონაცემები: მხოლოდ საჩვენებლად. სახელის შეცვლას პაროლი სჭირდება, ელფოსტა არ იცვლება.
export function IdentityCard({ profile, email, onSaved }) {
  const [sheet, setSheet] = useState(false)
  const employer = profile.role === 'employer'
  return (
    <section className={`${card} p-5`} data-identity>
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand text-[26px] font-bold text-on-brand">{(profile.full_name || '?').slice(0, 1)}</span>
        <div className="min-w-0">
          <p className="truncate text-[20px] font-bold leading-tight">{profile.full_name}</p>
          <p className="truncate text-[14px] text-muted">{employer ? 'დამსაქმებელი' : 'სამუშაოს მაძიებელი'}</p>
        </div>
      </div>
      <dl className="mt-5 space-y-2">
        {employer && <Row icon="jobs" name="კომპანია" value={profile.company_name || '—'} />}
        <Row icon="profile" name={employer ? 'საკონტაქტო პირი' : 'სახელი და გვარი'} value={profile.full_name} />
        <Row icon="mail" name="ელფოსტა" value={email} locked />
      </dl>
      <button onClick={() => setSheet(true)} className={`${btn2} mt-4 flex items-center justify-center gap-2`}>
        <Icon name="lock" className="h-4 w-4" />{employer ? 'სახელის ან კომპანიის შეცვლა' : 'სახელის შეცვლა'}
      </button>
      <p className="mt-2 text-center text-[13px] text-quiet">შესაცვლელად პაროლი დაგჭირდება. ელფოსტა არ იცვლება.</p>
      {sheet && <NameSheet profile={profile} email={email} onSaved={onSaved} onClose={() => setSheet(false)} />}
    </section>
  )
}

const Row = ({ icon, name, value, locked }) => (
  <div className="flex items-center gap-3 rounded-2xl bg-bg px-4 py-3">
    <Icon name={icon} className="h-5 w-5 shrink-0 text-muted" />
    <div className="min-w-0 flex-1">
      <dt className="text-[12px] font-medium text-muted">{name}</dt>
      <dd className="truncate text-[15px] font-semibold">{value}</dd>
    </div>
    {locked && <Icon name="lock" className="h-4 w-4 shrink-0 text-quiet" />}
  </div>
)

function NameSheet({ profile, email, onSaved, onClose }) {
  const employer = profile.role === 'employer'
  const [form, setForm] = useState({ full_name: profile.full_name ?? '', company_name: profile.company_name ?? '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    // პაროლს Supabase ამოწმებს (ცდების ლიმიტით); სწორი პაროლის გარეშე არაფერი იცვლება
    const { error: wrong } = await supabase.auth.signInWithPassword({ email, password: form.password })
    if (wrong) {
      setBusy(false)
      return setError(wrong.status === 400 ? 'პაროლი არასწორია.' : 'ვერ შემოწმდა. სცადე ცოტა ხანში.')
    }
    const changes = { full_name: form.full_name.trim(), ...(employer ? { company_name: form.company_name.trim() } : {}) }
    const { error } = await supabase.from('profiles').update(changes).eq('id', profile.id)
    if (error) {
      setBusy(false)
      return setError('ვერ შეინახა. სცადე თავიდან.')
    }
    // კომპანიის ახალი სახელი უკვე გამოქვეყნებულ ვაკანსიებზეც უნდა გამოჩნდეს
    if (employer && changes.company_name !== profile.company_name) await supabase.from('jobs').update({ company: changes.company_name }).eq('employer_id', profile.id)
    onSaved(changes)
    onClose()
  }

  return (
    <Sheet onClose={busy ? undefined : onClose}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <h2 className="text-[22px] font-bold">{employer ? 'მონაცემების შეცვლა' : 'სახელის შეცვლა'}</h2>
          <p className="text-[15px] text-muted">დასადასტურებლად შეიყვანე პაროლი.</p>
        </div>
        {employer && (
          <label className="block">
            <span className={label}>კომპანიის სახელი</span>
            <input required minLength={2} maxLength={80} className={input} value={form.company_name} onChange={set('company_name')} />
          </label>
        )}
        <label className="block">
          <span className={label}>{employer ? 'საკონტაქტო პირი' : 'სახელი და გვარი'}</span>
          <input required minLength={2} maxLength={80} className={input} value={form.full_name} onChange={set('full_name')} />
        </label>
        <label className="block">
          <span className={label}>პაროლი</span>
          <input required type="password" autoComplete="current-password" className={input} value={form.password} onChange={set('password')} />
        </label>
        {error && <p className="text-[14px] font-medium text-coral">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" disabled={busy} onClick={onClose} className={btn2}>გაუქმება</button>
          <button disabled={busy} className={btn}>{busy ? 'ინახება…' : 'შენახვა'}</button>
        </div>
      </form>
    </Sheet>
  )
}
