import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { todayISO } from '../lib/match.js'
import { addDays, workBetween } from '../lib/schedule.js'
import { monthShort, tr, useLang } from '../lib/i18n.js'
import { FEE, kindText, lari, moneyError, refreshMoney, unitWord, useBalance } from '../lib/money.js'
import { Icon, Sheet, btn, btn2, btnSm2, card, input } from './ui.jsx'

const DemoNote = () => (
  <p className="flex items-start gap-2 rounded-2xl bg-amber-soft px-3.5 py-2.5 text-[13px] font-medium text-amber">
    <Icon name="shield" className="mt-px h-4 w-4 shrink-0" />
    {tr('სადემონსტრაციო რეჟიმი: რეალური ფული არ მოძრაობს.', 'Demo mode: no real money moves.')}
  </p>
)

// დეპოზიტი ერთ განაცხადზე (ორივე მხარე ხედავს)
export function useEscrow(applicationId) {
  const [escrow, setEscrow] = useState(undefined)
  useEffect(() => {
    if (!applicationId) return
    const load = () => supabase.from('escrows').select('*').eq('application_id', applicationId).maybeSingle().then(({ data }) => setEscrow(data))
    load()
    window.addEventListener('sm-money', load)
    return () => window.removeEventListener('sm-money', load)
  }, [applicationId])
  return escrow
}

// ბალანსი, შევსება/გატანა (დემო) და ბოლო ოპერაციები
export function WalletCard({ profile }) {
  useLang()
  const employer = profile.role === 'employer'
  const balance = useBalance()
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const load = () => supabase.from('ledger').select('*').order('created_at', { ascending: false }).limit(12).then(({ data }) => setRows(data ?? []))
    load()
    window.addEventListener('sm-money', load)
    return () => window.removeEventListener('sm-money', load)
  }, [])

  async function run(fn, amount) {
    setBusy(true)
    setError('')
    const { error } = await supabase.rpc(fn, { amount })
    setBusy(false)
    if (error) return setError(moneyError(error))
    refreshMoney()
  }

  return (
    <section className={`${card} space-y-3.5 p-5`} data-wallet>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold">{tr('ბალანსი', 'Balance')}</h2>
          <p className="text-[13px] text-muted">{employer ? tr('აქედან იდება დეპოზიტი, როცა ვინმეს აიყვან.', 'Deposits for new hires come from here.') : tr('აქ ჩაირიცხება ანაზღაურება, საკომისიოს გამოკლებით.', 'Your pay lands here, after the fee.')}</p>
        </div>
        <p className="shrink-0 text-[28px] font-extrabold tabular-nums" data-balance>{balance === null ? '·' : lari(balance)}</p>
      </div>
      <DemoNote />
      {employer ? (
        <div className="grid grid-cols-3 gap-2">
          {[100, 500, 1000].map((n) => (
            <button key={n} disabled={busy} onClick={() => run('demo_topup', n)} className={`${btnSm2} py-3`}>+{lari(n)}</button>
          ))}
        </div>
      ) : (
        <button disabled={busy || !balance} onClick={() => run('demo_withdraw', balance)} className={btn2}>{tr('ბარათზე გატანა', 'Withdraw to card')}</button>
      )}
      {error && <p className="text-[14px] font-medium text-coral">{error}</p>}
      {rows.length > 0 && (
        <ul className="divide-y divide-line border-t border-line">
          {rows.map((r) => {
            const d = new Date(r.created_at)
            return (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold">{kindText(r.kind)}</span>
                  <span className="block truncate text-[12px] text-muted">{[r.note !== 'demo' && r.note, `${d.getDate()} ${monthShort(d.getMonth())}`].filter(Boolean).join(' · ')}</span>
                </span>
                <span className={`shrink-0 text-[15px] font-bold tabular-nums ${r.amount > 0 ? 'text-mint-dark' : 'text-ink'}`}>{r.amount > 0 ? '+' : '−'}{lari(Math.abs(r.amount))}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

// აყვანა: დამსაქმებელი წინასწარ დებს თანხას (ფიქსირებული: მთელი ფასი; საათობრივი/დღიური: ერთი თვე)
export function HireSheet({ app, job, who, onClose, onDone }) {
  useLang()
  const fixed = job.pay_unit === 'fixed'
  const balance = useBalance()
  const [units, setUnits] = useState(() => (fixed ? 0 : workBetween(job, todayISO(), addDays(todayISO(), 29))))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const deposit = Math.round((fixed ? job.pay : units * job.pay) * 100) / 100
  const short = balance !== null && balance < deposit ? Math.ceil((deposit - balance) / 100) * 100 : 0

  async function call(fn, args) {
    setBusy(true)
    setError('')
    const { error } = await supabase.rpc(fn, args)
    setBusy(false)
    if (error) {
      setError(moneyError(error))
      return false
    }
    refreshMoney()
    return true
  }
  async function hire() {
    if (await call('hire', { app: app.id, units: fixed ? null : units })) onDone()
  }

  return (
    <Sheet onClose={busy ? undefined : onClose}>
      <h2 className="text-[20px] font-bold">{tr(`აიყვან ${who}-ს?`, `Hire ${who}?`)}</h2>
      <p className="mt-1 text-[15px] text-muted">
        {fixed
          ? tr('თანხას ახლავე დებ დეპოზიტად. ShiftMate ინახავს და მუშაკს ჩაერიცხება, როცა სამუშაოს დასრულებას დაადასტურებ.', 'You put the money aside now. ShiftMate holds it and pays the worker when you confirm the work is done.')
          : tr('დებ ერთი თვის თანხას. ყოველ თვე ადასტურებ ნამუშევარ საათებს და მუშაკს ერიცხება ჯამი; დეპოზიტი თავიდან ივსება. გამოუყენებელი ნაშთი სამუშაოს ბოლოს გიბრუნდება.', "You put one month's pay aside. Each month you confirm the hours worked and the worker is paid the total; the deposit refills. Whatever is left comes back to you at the end.")}
      </p>
      {!fixed && (
        <label className="mt-4 block">
          <span className="mb-1.5 block text-[13px] font-medium text-muted">{job.pay_unit === 'day' ? tr('სამუშაო დღეები თვეში', 'Work days per month') : tr('საათები თვეში', 'Hours per month')}</span>
          <input type="number" inputMode="decimal" min="0" step={job.pay_unit === 'day' ? 1 : 0.5} className={input} value={units || ''} onChange={(e) => setUnits(Math.max(0, Number(e.target.value)))} aria-label={job.pay_unit === 'day' ? tr('სამუშაო დღეები თვეში', 'Work days per month') : tr('საათები თვეში', 'Hours per month')} />
          {job.shifts.length > 0 && <span className="mt-1 block text-[12px] text-muted">{tr('ცვლების მიხედვით დათვლილია; შეგიძლია შეცვალო.', 'Counted from the shifts; you can change it.')}</span>}
        </label>
      )}
      <dl className="mt-4 space-y-1.5 rounded-2xl bg-bg p-3.5 text-[14px]">
        <div className="flex justify-between"><dt className="text-muted">{fixed ? tr('ფასი', 'Price') : `${units || 0} ${unitWord(job.pay_unit, units)} × ${lari(job.pay)}`}</dt><dd className="font-bold tabular-nums">{lari(deposit)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">{tr('შენი ბალანსი', 'Your balance')}</dt><dd className="tabular-nums">{balance === null ? '·' : lari(balance)}</dd></div>
      </dl>
      <div className="mt-3"><DemoNote /></div>
      {error && <p className="mt-2 text-[14px] font-medium text-coral">{error}</p>}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <button disabled={busy} onClick={onClose} className={btn2}>{tr('გაუქმება', 'Cancel')}</button>
        {short > 0 ? (
          <button disabled={busy} onClick={() => call('demo_topup', { amount: Math.min(short, 5000) })} className={btn}>{tr(`შევსება +${lari(Math.min(short, 5000))}`, `Top up +${lari(Math.min(short, 5000))}`)}</button>
        ) : (
          <button disabled={busy || deposit <= 0} onClick={hire} className={btn}>{tr(`დეპოზიტი და აყვანა`, 'Deposit and hire')}</button>
        )}
      </div>
    </Sheet>
  )
}

const dayOf = (ts) => todayISO(new Date(ts))

// საათობრივი/დღიური სამუშაო: თვის ბოლოს დამსაქმებელი ადასტურებს ნამუშევარს და იხდის
export function PaySheet({ app, job, escrow, who, onClose, onDone }) {
  useLang()
  const from = escrow.last_paid_at ? addDays(dayOf(escrow.last_paid_at), 1) : dayOf(escrow.created_at)
  const to = todayISO()
  const [units, setUnits] = useState(() => workBetween(job, from, to))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const amount = Math.round(units * job.pay * 100) / 100
  const fee = Math.round(amount * FEE * 100) / 100
  const word = job.pay_unit === 'day' ? tr('ნამუშევარი დღეები', 'Days worked') : tr('ნამუშევარი საათები', 'Hours worked')

  async function pay(finish) {
    setBusy(true)
    setError('')
    const { error } = await supabase.rpc('pay_period', { app: app.id, units, finish, period: `${from} – ${to}` })
    setBusy(false)
    if (error) return setError(moneyError(error))
    refreshMoney()
    onDone(finish)
  }

  return (
    <Sheet onClose={busy ? undefined : onClose}>
      <h2 className="text-[20px] font-bold">{tr(`ანაზღაურება: ${who}`, `Pay ${who}`)}</h2>
      <p className="mt-1 text-[15px] text-muted">{tr(`პერიოდი: ${from} – ${to}. შეამოწმე ნამუშევარი და დაადასტურე.`, `Period: ${from} – ${to}. Check the work done and confirm.`)}</p>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-[13px] font-medium text-muted">{word}</span>
        <input type="number" inputMode="decimal" min="0" step={job.pay_unit === 'day' ? 1 : 0.5} className={input} value={units} onChange={(e) => setUnits(Math.max(0, Number(e.target.value)))} aria-label={word} />
      </label>
      <dl className="mt-4 space-y-1.5 rounded-2xl bg-bg p-3.5 text-[14px]">
        <div className="flex justify-between"><dt className="text-muted">{`${units} ${unitWord(job.pay_unit, units)} × ${lari(job.pay)}`}</dt><dd className="font-bold tabular-nums">{lari(amount)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">{tr('ShiftMate-ის საკომისიო 10%', 'ShiftMate fee 10%')}</dt><dd className="tabular-nums">−{lari(fee)}</dd></div>
        <div className="flex justify-between border-t border-line pt-1.5"><dt className="font-semibold">{tr('მუშაკს ჩაერიცხება', 'The worker receives')}</dt><dd className="font-bold tabular-nums text-mint-dark">{lari(amount - fee)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">{tr('დეპოზიტში ახლა', 'In the deposit now')}</dt><dd className="tabular-nums">{lari(escrow.held)}</dd></div>
      </dl>
      {error && <p className="mt-2 text-[14px] font-medium text-coral">{error}</p>}
      <div className="mt-5 space-y-2.5">
        <button disabled={busy} onClick={() => pay(false)} className={btn}>{tr('გადახდა და გაგრძელება', 'Pay and continue')}</button>
        <button disabled={busy} onClick={() => pay(true)} className={btn2}>{tr('გადახდა და სამუშაოს დასრულება', 'Pay and end the job')}</button>
      </div>
    </Sheet>
  )
}

// მაძიებლისთვის: „დეპოზიტი დაცულია“
export function EscrowLine({ applicationId, dark }) {
  useLang()
  const escrow = useEscrow(applicationId)
  if (!escrow) return null
  return (
    <p className={`flex items-center gap-2 text-[13px] ${dark ? 'text-white/80' : 'text-muted'}`}>
      <Icon name="shield" className="h-4 w-4 shrink-0" />
      {escrow.held > 0 ? tr(`დამსაქმებელმა ${lari(escrow.held)} დეპოზიტად დადო`, `The employer has ${lari(escrow.held)} on deposit`) : tr(`ჩარიცხული: ${lari(escrow.paid_total)}`, `Paid so far: ${lari(escrow.paid_total)}`)}
    </p>
  )
}
