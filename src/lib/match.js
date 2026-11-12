export const DAYS = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი']
export const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const FIRST_HOUR = 8
export const LAST_HOUR = 22

export const slotKey = (day, hour) => `${day}-${hour}`

// ცვლა ან მუდმივია ({ day, start, end }, day: 0 = ორშაბათი), ან თარიღიანი ({ date: 'YYYY-MM-DD', start, end }).
// თარიღიანი ცვლა კვირის შესაბამის დღეს ედარება.
export function dayOf(shift) {
  if (!shift.date) return shift.day
  return (new Date(`${shift.date}T00:00:00Z`).getUTCDay() + 6) % 7
}

export function todayISO(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const isUpcoming = (shift, today) => !shift.date || shift.date >= today

// free: სტუდენტის თავისუფალი საათები (Set of 'day-hour'). ცვლა ერგება, თუ მისი ყველა საათი თავისუფალია.
export function shiftFits(shift, free) {
  const day = dayOf(shift)
  for (let h = shift.start; h < shift.end; h++) {
    if (!free.has(slotKey(day, h))) return false
  }
  return true
}

export function matchJob(job, free, today = todayISO()) {
  const shifts = job.shifts.filter((s) => isUpcoming(s, today))
  const fitting = shifts.filter((s) => shiftFits(s, free))
  return { job, shifts, fitting }
}

// შესაფერისი ვაკანსიები: მინიმუმ ერთი მომავალი ცვლა მთლიანად თავისუფალ საათებშია.
// დალაგება: ჯერ მეტი შესაფერისი ცვლა, მერე მაღალი ანაზღაურება.
export function matchJobs(jobs, free, today = todayISO()) {
  return jobs
    .map((job) => matchJob(job, free, today))
    .filter((m) => m.fitting.length > 0)
    .sort((a, b) => b.fitting.length - a.fitting.length || b.job.pay - a.job.pay)
}

export function formatShift(shift, lang = 'ka') {
  const days = lang === 'en' ? DAYS_EN : DAYS
  const pad = (n) => String(n).padStart(2, '0')
  const time = `${pad(shift.start)}:00–${pad(shift.end)}:00`
  if (!shift.date) return `${days[shift.day]} ${time}`
  const [, m, d] = shift.date.split('-').map(Number)
  const month = (lang === 'en' ? MONTHS_EN : MONTHS)[m - 1]
  return `${d} ${month} (${days[dayOf(shift)]}) ${time}`
}
