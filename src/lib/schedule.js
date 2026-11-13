// სტუდენტის განრიგი: დაკავებული დრო (ლექციები + მიღებული სამუშაოს ცვლები).
// event: { id, title, kind: 'lesson' | 'work', weekday (0 = ორშაბათი) | null, date 'YYYY-MM-DD' | null,
//          start_min, end_min, skip_dates: [], job_id? }
// თავისუფალი დრო = ყველაფერი, რაც დაკავებული არ არის.
import { FIRST_HOUR, LAST_HOUR, slotKey, todayISO } from './match.js'

export const DAY_NAMES = ['ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი', 'კვირა']
export const MONTH_NAMES = ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი']

const pad = (n) => String(n).padStart(2, '0')
export const fmtMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
export const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// თარიღები UTC-ში ითვლება, რომ დროის სარტყელმა დღე არ აურიოს
const parse = (iso) => new Date(`${iso}T00:00:00Z`)
const iso = (d) => d.toISOString().slice(0, 10)
export const addDays = (date, n) => {
  const d = parse(date)
  d.setUTCDate(d.getUTCDate() + n)
  return iso(d)
}
export const weekdayOf = (date) => (parse(date).getUTCDay() + 6) % 7
export const startOfWeek = (date) => addDays(date, -weekdayOf(date))
export const startOfMonth = (date) => `${date.slice(0, 7)}-01`
export const addMonths = (date, n) => {
  const d = parse(startOfMonth(date))
  d.setUTCMonth(d.getUTCMonth() + n)
  return iso(d)
}
export const dayNumber = (date) => Number(date.slice(8, 10))
export const monthIndex = (date) => Number(date.slice(5, 7)) - 1
export const yearOf = (date) => Number(date.slice(0, 4))

// კონკრეტული დღის მოვლენები: ყოველკვირეულები (თუ ეს დღე არ არის გამოტოვებული) + ერთჯერადები
export function eventsOn(events, date) {
  const day = weekdayOf(date)
  return events
    .filter((e) => (e.date ? e.date === date : e.weekday === day && !(e.skip_dates ?? []).includes(date)))
    .map((e) => ({ ...e, on: date }))
    .sort((a, b) => a.start_min - b.start_min)
}

const overlaps = (a, b) => a.start_min < b.end_min && b.start_min < a.end_min

// ცვლა ერგება, თუ არცერთ დაკავებულ დროს არ ეფარება.
// თარიღიანი ცვლა იმ დღის განრიგს ედარება, ყოველკვირეული — ამ დღის ყოველკვირეულ განრიგს.
export function shiftFits(shift, events) {
  const s = { start_min: shift.start * 60, end_min: shift.end * 60 }
  const busy = shift.date ? eventsOn(events, shift.date) : events.filter((e) => e.weekday === shift.day)
  return !busy.some((b) => overlaps(b, s))
}

// ვაკანსიის საკუთარი (უკვე მიღებული) ცვლები მას არ ეჯახება
export function matchJob(job, events, today = todayISO()) {
  const others = events.filter((e) => e.job_id !== job.id)
  const shifts = job.shifts.filter((s) => !s.date || s.date >= today)
  const fitting = shifts.filter((s) => shiftFits(s, others))
  return { job, shifts, fitting }
}

// ვაკანსიის ცვლები კალენდრის მოვლენებად (მიღებული სამუშაო / დამსაქმებლის ცვლები)
export function jobEvents(job, extra = {}) {
  return job.shifts.map((s, i) => ({
    id: `${job.id}-${i}`,
    title: job.title,
    kind: 'work',
    weekday: s.date ? null : s.day,
    date: s.date ?? null,
    start_min: s.start * 60,
    end_min: s.end * 60,
    skip_dates: [],
    job_id: job.id,
    ...extra,
  }))
}

// AI-სთვის: კვირის თავისუფალი საათები ('day-hour'), FIRST_HOUR–LAST_HOUR შუალედში
export function freeSlots(events) {
  const free = new Set()
  for (let day = 0; day < 7; day++) {
    for (let h = FIRST_HOUR; h < LAST_HOUR; h++) {
      const slot = { start_min: h * 60, end_min: (h + 1) * 60 }
      if (!events.some((e) => e.weekday === day && overlaps(e, slot))) free.add(slotKey(day, h))
    }
  }
  return free
}

// ერთ დღეში გადამფარავი მოვლენები გვერდიგვერდ: თითოეულს col და cols
export function layoutDay(list) {
  const out = []
  let group = []
  let groupEnd = -1
  const flush = () => {
    const cols = []
    group.forEach((e) => {
      let c = cols.findIndex((end) => end <= e.start_min)
      if (c === -1) c = cols.push(0) - 1
      cols[c] = e.end_min
      out.push({ ...e, col: c })
    })
    out.slice(out.length - group.length).forEach((e) => (e.cols = cols.length))
    group = []
  }
  ;[...list].sort((a, b) => a.start_min - b.start_min || b.end_min - a.end_min).forEach((e) => {
    if (group.length && e.start_min >= groupEnd) flush()
    group.push(e)
    groupEnd = Math.max(groupEnd, e.end_min)
  })
  if (group.length) flush()
  return out
}
