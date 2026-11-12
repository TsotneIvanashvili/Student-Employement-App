import { useState } from 'react'
import { formatShift, shiftFits } from '../lib/match.js'

export default function JobList({ jobs, busy, onShow, onlyFit, setOnlyFit, applied, onApply, onGoCalendar }) {
  const [openId, setOpenId] = useState(null)
  const hasSchedule = busy.size > 0
  const rows = jobs
    .map((job) => ({ job, fits: job.shifts.map((s) => shiftFits(s, busy)) }))
    .filter((r) => !onlyFit || !hasSchedule || r.fits.some(Boolean))
    .sort((a, b) => b.fits.filter(Boolean).length - a.fits.filter(Boolean).length)

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">ვაკანსიები <span className="font-normal text-quiet">{rows.length}</span></h2>
        <button
          onClick={() => setOnlyFit(!onlyFit)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${onlyFit ? 'bg-ink text-white' : 'bg-white text-muted'}`}
        >
          მხოლოდ შესაფერისი
        </button>
      </div>

      {!hasSchedule && (
        <div className="mb-3 rounded-3xl bg-brand-soft p-4 text-sm">
          <p>ჯერ ლექციები მონიშნე და აქ მხოლოდ შენთვის შესაფერისი ვაკანსიები დარჩება.</p>
          <button onClick={onGoCalendar} className="mt-3 rounded-xl bg-brand px-4 py-2 font-semibold text-white">
            კალენდარის შევსება
          </button>
        </div>
      )}
      {hasSchedule && rows.length === 0 && (
        <p className="rounded-3xl bg-white p-4 text-sm text-muted">ამ გრაფიკს არცერთი ცვლა არ ერგება.</p>
      )}

      <ul className="space-y-3">
        {rows.map(({ job, fits }) => {
          const fitCount = fits.filter(Boolean).length
          const open = openId === job.id
          return (
            <li key={job.id} className="rounded-3xl bg-white p-4 shadow-sm">
              <button onClick={() => setOpenId(open ? null : job.id)} className="w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold">{job.title}</h3>
                    <p className="truncate text-sm text-muted">{job.company} · {job.district}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-bg px-2.5 py-1 text-sm font-bold">{job.pay} ₾/სთ</span>
                </div>
                {hasSchedule && (
                  <span className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${fitCount ? 'bg-mint-soft text-mint' : 'bg-coral/10 text-coral'}`}>
                    {fitCount}/{job.shifts.length} ცვლა ერგება
                  </span>
                )}
              </button>

              {open && (
                <div className="mt-3 border-t border-line pt-3">
                  <ul className="space-y-1.5 text-sm">
                    {job.shifts.map((s, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{formatShift(s)}</span>
                        {hasSchedule && (
                          <span className={fits[i] ? 'font-medium text-mint' : 'font-medium text-coral'}>{fits[i] ? 'ერგება' : 'ეჯახება'}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => onShow(job.id)} className="rounded-xl bg-bg py-2.5 text-sm font-semibold">
                      კალენდარზე ნახვა
                    </button>
                    <button
                      onClick={() => onApply(job.id)}
                      disabled={applied.has(job.id)}
                      className="rounded-xl bg-brand py-2.5 text-sm font-semibold text-white disabled:bg-quiet"
                    >
                      {applied.has(job.id) ? 'გაგზავნილია' : 'განაცხადი'}
                    </button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
