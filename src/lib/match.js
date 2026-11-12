export const DAYS = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი']
export const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const FIRST_HOUR = 8
export const LAST_HOUR = 22

export const slotKey = (day, hour) => `${day}-${hour}`

export function shiftFits(shift, busy) {
  for (let h = shift.start; h < shift.end; h++) {
    if (busy.has(slotKey(shift.day, h))) return false
  }
  return true
}

export function matchJob(job, busy) {
  const fitting = job.shifts.filter((s) => shiftFits(s, busy))
  return { job, fitting, total: job.shifts.length }
}

// შესაფერისი ვაკანსიები: მინიმუმ ერთი ცვლა მთლიანად თავისუფალ დროშია.
// დალაგება: ჯერ მეტი შესაფერისი ცვლა, მერე მაღალი ანაზღაურება.
export function matchJobs(jobs, busy) {
  return jobs
    .map((job) => matchJob(job, busy))
    .filter((m) => m.fitting.length > 0)
    .sort((a, b) => b.fitting.length - a.fitting.length || b.job.pay - a.job.pay)
}

export function formatShift(shift, lang = 'ka') {
  const days = lang === 'en' ? DAYS_EN : DAYS
  const pad = (n) => String(n).padStart(2, '0')
  return `${days[shift.day]} ${pad(shift.start)}:00–${pad(shift.end)}:00`
}
