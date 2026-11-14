import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { openJob } from './JobCard.jsx'
import { Badge, Icon, Sheet, btn, btn2, card } from './ui.jsx'

export const STATUS = { sent: 'ახალი', accepted: 'აყვანილია', rejected: 'უარყოფილია' }
export const STATUS_TONE = { sent: 'violet', accepted: 'green', rejected: 'red' }
export const jobHours = (job) => job.shifts.reduce((s, x) => s + (x.end - x.start), 0)

// ერთი განაცხადი დამსაქმებლისთვის: სივი, წერილი, ტელეფონი და ქმედებები (აყვანა, უარყოფა).
export function ApplicantCard({ app, job, showJob = false, onChanged }) {
  const [confirm, setConfirm] = useState(null) // 'accepted' | 'rejected'
  const [open, setOpen] = useState(app.status === 'sent')
  const [error, setError] = useState('')
  const p = app.profiles

  async function setStatus(status) {
    const { error } = await supabase.from('applications').update({ status }).eq('id', app.id)
    if (error) return setError('ვერ შეინახა. სცადე თავიდან.')
    setConfirm(null)
    onChanged()
  }
  async function openPdf() {
    const { data } = await supabase.storage.from('cvs').createSignedUrl(p.cv_path, 600)
    if (data) window.open(data.signedUrl, '_blank', 'noopener')
  }

  return (
    <li className={`${card} p-4 sm:p-5`}>
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-3 text-left">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sky-soft text-[18px] font-semibold text-sky">{p.full_name.slice(0, 1)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold">{p.full_name}</p>
          <p className="truncate text-[14px] text-muted">{showJob ? job.title : p.cv_skills || 'კანდიდატი'}</p>
        </div>
        <Badge tone={STATUS_TONE[app.status]}>{STATUS[app.status]}</Badge>
        <Icon name="chevron" className={`h-5 w-5 shrink-0 text-quiet transition ${open ? 'rotate-90' : ''}`} strokeWidth={2.5} />
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {showJob && <button onClick={() => openJob(job.id)} className="text-[14px] font-medium underline underline-offset-4">ვაკანსიის ნახვა</button>}
          {app.message && <p className="rounded-2xl bg-fill p-3 text-[15px]">„{app.message}“</p>}
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[['გამოცდილება', p.cv_experience], ['უნარები', p.cv_skills], ['ენები', p.cv_languages]].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-bg p-3">
                <dt className="text-[12px] font-semibold uppercase text-quiet">{k}</dt>
                <dd className="whitespace-pre-wrap break-words text-[15px]">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[15px] font-semibold">
            {app.phone && <a href={`tel:${app.phone}`} className="flex items-center gap-1.5"><Icon name="phone" className="h-5 w-5" />{app.phone}</a>}
            {p.cv_path && <button onClick={openPdf} className="flex items-center gap-1.5"><Icon name="doc" className="h-5 w-5" />სივის PDF</button>}
          </div>
          {app.status === 'sent' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button onClick={() => setConfirm('rejected')} className={btn2}>უარყოფა</button>
              <button onClick={() => setConfirm('accepted')} className={btn}>აყვანა</button>
            </div>
          )}
          {app.status === 'accepted' && (
            <p className="rounded-2xl bg-mint-soft p-3 text-[14px] font-medium text-mint-dark">
              აყვანილია. დეტალებზე შესათანხმებლად დაუკავშირდი{app.phone ? ` ნომერზე ${app.phone}` : ''}. ცვლები მის კალენდარში უკვე ჩანს.
            </p>
          )}
        </div>
      )}
      {confirm && (
        <Sheet onClose={() => setConfirm(null)}>
          <h2 className="text-[22px] font-semibold">{confirm === 'accepted' ? `აიყვან ${p.full_name}-ს?` : `უარს ეტყვი ${p.full_name}-ს?`}</h2>
          <p className="mt-1 text-[15px] text-muted">
            {confirm === 'accepted'
              ? `„${job.title}“-ის ცვლები მის კალენდარში გამოჩნდება და დაინახავს, რომ აყვანილია. ანაზღაურებასა და დეტალებზე პირდაპირ შეთანხმდით.`
              : 'კანდიდატი დაინახავს, რომ განაცხადი უარყოფილია. ამის შეცვლა ვეღარ მოხერხდება.'}
          </p>
          {error && <p className="mt-2 text-[14px] font-medium text-coral">{error}</p>}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={() => setConfirm(null)} className={btn2}>გაუქმება</button>
            <button onClick={() => setStatus(confirm)} className={btn}>{confirm === 'accepted' ? 'აყვანა' : 'უარყოფა'}</button>
          </div>
        </Sheet>
      )}
    </li>
  )
}
