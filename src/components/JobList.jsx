import { formatShift, shiftFits } from '../lib/match.js'

export default function JobList({ jobs, busy, selectedId, onSelect, onlyFit, setOnlyFit, applied, onApply }) {
  const hasSchedule = busy.size > 0
  const rows = jobs
    .map((job) => ({ job, fits: job.shifts.map((s) => shiftFits(s, busy)) }))
    .filter((r) => !onlyFit || !hasSchedule || r.fits.some(Boolean))
    .sort((a, b) => b.fits.filter(Boolean).length - a.fits.filter(Boolean).length)

  return (
    <section data-tour="jobs" className="rounded-3xl border border-line bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">ვაკანსიები</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyFit} onChange={(e) => setOnlyFit(e.target.checked)} />
          მხოლოდ შესაფერისი
        </label>
      </div>

      {!hasSchedule && (
        <p className="mb-4 rounded-xl bg-mist p-3 text-sm text-muted">
          ჯერ კალენდარში ლექციები მონიშნე, მერე აქ მხოლოდ შენთვის შესაფერისი ვაკანსიები დარჩება.
        </p>
      )}
      {hasSchedule && rows.length === 0 && (
        <p className="rounded-xl bg-mist p-3 text-sm text-muted">ამ გრაფიკს არცერთი ცვლა არ ერგება.</p>
      )}

      <ul className="space-y-3">
        {rows.map(({ job, fits }) => {
          const fitCount = fits.filter(Boolean).length
          const active = selectedId === job.id
          return (
            <li key={job.id}>
              <div
                onClick={() => onSelect(active ? null : job.id)}
                className={`cursor-pointer rounded-2xl border p-4 transition ${active ? 'border-accent bg-mist' : 'border-line hover:border-accent/50'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{job.title}</h3>
                    <p className="text-sm text-muted">{job.company} · {job.district}</p>
                  </div>
                  <span className="whitespace-nowrap font-bold text-accent">{job.pay} ₾/სთ</span>
                </div>
                {hasSchedule && (
                  <p className="mt-2 text-sm font-semibold">
                    {fitCount}/{job.shifts.length} ცვლა ერგება
                  </p>
                )}
                <ul className="mt-2 space-y-1 text-sm">
                  {job.shifts.map((s, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{formatShift(s)}</span>
                      {hasSchedule && (
                        <span className={fits[i] ? 'text-accent' : 'text-red-600'}>{fits[i] ? 'ერგება' : 'ეჯახება'}</span>
                      )}
                    </li>
                  ))}
                </ul>
                {active && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onApply(job.id) }}
                    disabled={applied.has(job.id)}
                    className="mt-3 w-full rounded-xl bg-accent py-2 text-sm font-semibold text-white disabled:bg-quiet"
                  >
                    {applied.has(job.id) ? 'განაცხადი გაგზავნილია (დემო)' : 'განაცხადის გაგზავნა'}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
