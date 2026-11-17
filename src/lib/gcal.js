// Google Calendar-დან მოვლენების შემოტანა (მხოლოდ წაკითხვა, calendar.readonly).
// Google-ის გვერდზე გადავდივართ, ის /google-calendar-ზე აბრუნებს წვდომის ტოკენს (#access_token=…).
// ტოკენი მხოლოდ ამ ჩანართის sessionStorage-ში ინახება და შემოტანის შემდეგ იშლება.
import { GOOGLE_CLIENT_ID } from './config.js'

const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'
const KEY = 'sm_gcal'
const redirectUri = () => `${window.location.origin}/google-calendar`

export function startGoogleImport() {
  const state = crypto.randomUUID()
  sessionStorage.setItem(`${KEY}_state`, state)
  const q = new URLSearchParams({ client_id: GOOGLE_CLIENT_ID, redirect_uri: redirectUri(), response_type: 'token', scope: SCOPE, state, include_granted_scopes: 'true' })
  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${q}`)
}

// supabase-js-ის შექმნამდე უნდა გაეშვას: სხვა შემთხვევაში ის #access_token-ს თავის სესიად მიიჩნევს
export function captureGoogleRedirect() {
  if (typeof window === 'undefined' || window.location.pathname !== '/google-calendar') return
  const p = new URLSearchParams(window.location.hash.slice(1))
  let result = { error: p.get('error') || 'missing' }
  try {
    const state = sessionStorage.getItem(`${KEY}_state`)
    sessionStorage.removeItem(`${KEY}_state`)
    if (p.get('access_token') && state && p.get('state') === state) result = { token: p.get('access_token'), until: Date.now() + Number(p.get('expires_in') || 3000) * 1000 }
    else if (p.get('access_token')) result = { error: 'state' }
    sessionStorage.setItem(KEY, JSON.stringify(result))
  } catch {}
  window.history.replaceState(null, '', '/')
}

// { token } | { error } | null. ერთჯერადია: წაკითხვისას იშლება
export function takeGoogleResult() {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY))
    sessionStorage.removeItem(KEY)
    if (v?.token && v.until < Date.now()) return { error: 'expired' }
    return v
  } catch {
    return null
  }
}

export async function fetchGoogleEvents(token, days = 14, now = new Date()) {
  const q = new URLSearchParams({ timeMin: now.toISOString(), timeMax: new Date(now.getTime() + days * 864e5).toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '250' })
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${q}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(String(res.status))
  return (await res.json()).items ?? []
}

const pad = (n) => String(n).padStart(2, '0')
const localISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Google-ის მოვლენები კალენდრის ჩანაწერებად: განმეორებადი → ყოველკვირეული ლექცია, ერთჯერადი → თარიღიანი პირადი.
// გამოტოვებს მთელი დღის, „თავისუფალად“ მონიშნულ, გაუქმებულ და უკვე არსებულ (იგივე დრო) მოვლენებს.
export function toLessons(items, existing = []) {
  const seen = new Set(existing.map((e) => `${e.weekday ?? e.date}|${e.start_min}|${e.end_min}`))
  const out = []
  for (const it of items) {
    if (!it.start?.dateTime || !it.end?.dateTime || it.status === 'cancelled' || it.transparency === 'transparent') continue
    const s = new Date(it.start.dateTime)
    const e = new Date(it.end.dateTime)
    const sameDay = localISO(s) === localISO(e)
    const start_min = s.getHours() * 60 + s.getMinutes()
    const end_min = sameDay ? e.getHours() * 60 + e.getMinutes() : 1440
    if (!(end_min > start_min)) continue
    const weekly = Boolean(it.recurringEventId)
    const row = { title: (it.summary || 'Google Calendar').trim().slice(0, 80), weekday: weekly ? (s.getDay() + 6) % 7 : null, date: weekly ? null : localISO(s), start_min, end_min, type: weekly ? 'lecture' : 'personal' }
    const key = `${row.weekday ?? row.date}|${start_min}|${end_min}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(row)
  }
  return out
}
