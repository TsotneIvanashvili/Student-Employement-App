// ორი ენა: ქართული (ნაგულისხმევი) და ინგლისური. tr('ქართულად', 'In English') აბრუნებს მიმდინარე ენის ტექსტს.
import { useSyncExternalStore } from 'react'

const KEY = 'sm_lang'
let lang = (() => {
  try {
    return localStorage.getItem(KEY) === 'en' ? 'en' : 'ka'
  } catch {
    return 'ka'
  }
})()
const listeners = new Set()

export const getLang = () => lang
export function setLang(next) {
  lang = next === 'en' ? 'en' : 'ka'
  try {
    localStorage.setItem(KEY, lang)
  } catch {}
  document.documentElement.lang = lang
  listeners.forEach((l) => l())
}
const subscribe = (l) => (listeners.add(l), () => listeners.delete(l))

export const tr = (ka, en) => (lang === 'en' ? en : ka)

// კომპონენტი, რომელიც ტექსტს აჩვენებს, ამ hook-ით ხელახლა იხატება ენის შეცვლისას
export function useLang() {
  return useSyncExternalStore(subscribe, getLang, getLang)
}

export const DAYS_SHORT = { ka: ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }
export const DAYS_LONG = {
  ka: ['ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი', 'კვირა'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
}
export const MONTHS_LONG = {
  ka: ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}
export const MONTHS_SHORT = {
  ka: ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}
export const dayShort = (i) => DAYS_SHORT[lang][i]
export const dayLong = (i) => DAYS_LONG[lang][i]
export const monthLong = (i) => MONTHS_LONG[lang][i]
export const monthShort = (i) => MONTHS_SHORT[lang][i]

// ვაკანსიის სფეროები (ბაზაში jobs.category / profiles.field)
export const CATEGORIES = ['service', 'delivery', 'trades', 'design', 'dev', 'events', 'other']
const CAT_NAMES = {
  general: ['ზოგადი', 'General'],
  service: ['მომსახურება', 'Service'],
  delivery: ['მიწოდება და საწყობი', 'Delivery'],
  trades: ['ხელობა', 'Trades'],
  design: ['დიზაინი და მარკეტინგი', 'Design'],
  dev: ['დეველოპმენტი', 'Development'],
  events: ['ღონისძიებები', 'Events'],
  other: ['სხვა', 'Other'],
}
export const catName = (c) => tr(...(CAT_NAMES[c] ?? CAT_NAMES.other))

// ანაზღაურება: საათში, დღეში ან ფიქსირებული თანხა
export const payUnit = (u) => ({ hour: tr('/სთ', '/hr'), day: tr('/დღე', '/day'), fixed: '' })[u] ?? ''
export const money = (n) => `${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })} ₾`
export const payText = (job) => `${money(job.pay)}${payUnit(job.pay_unit)}`
