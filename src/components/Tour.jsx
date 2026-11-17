import { useLayoutEffect, useRef, useState } from 'react'
import { tr, useLang } from '../lib/i18n.js'
import { Icon } from './ui.jsx'

// tab: რომელ გვერდზე უნდა იყოს მომხმარებელი ამ ნაბიჯზე; target: data-tour ატრიბუტი, რომელსაც ნაბიჯი გამოყოფს
export const seekerSteps = () => [
  { tab: 'home', target: null, icon: 'calendar', title: tr('მოგესალმები ShiftMate-ში!', 'Welcome to ShiftMate!'), text: tr('ერთ წუთში გაჩვენებ, როგორ იპოვო სამსახური, რომელიც ლექციებს არ ეჯახება.', "In a minute I'll show you how to find a job that doesn't clash with your lectures.") },
  { tab: 'home', target: 'matches', title: tr('შენი თავისუფალი კვირა', 'Your free week'), text: tr('მწვანე თავისუფალი დროა, ნაცრისფერი დაკავებული. რიცხვი გეუბნება, რამდენი ვაკანსია ერგება იმ დღეს.', 'Green is free time, grey is busy. The number tells you how many jobs fit that day.') },
  { tab: 'calendar', target: 'calendar', title: tr('ჩაწერე, როდის ხარ დაკავებული', "Write down when you're busy"), text: tr('დააჭირე დღეს ან საათს, კომპიუტერზე კი მაუსი გადაატარე საათებზე. ყოველ კვირა თავისით მეორდება.', 'Tap a day or hour, or drag across hours with a mouse. It repeats every week.') },
  { tab: 'calendar', target: 'quickadd', title: tr('ან მიწერე AI-ს', 'Or tell the AI'), text: tr('მაგალითად „ორშაბათიდან პარასკევამდე 10-დან 6-მდე ვმუშაობ“, და კალენდარს თავად შეგივსებს.', 'For example "I work Monday to Friday, 10 to 6", and it fills in your calendar.') },
  { tab: 'calendar', target: 'tab-jobs', title: tr('ვაკანსიები', 'Jobs'), text: tr('თითო ვაკანსიაზე ჩანს, რამდენი ცვლა ერგება შენს დროს. თუ აგიყვანენ, ცვლები კალენდარში ჩნდება.', 'Each job shows how many shifts fit your time. If you are hired, the shifts appear in your calendar.') },
  { tab: 'home', target: 'me', title: tr('პროფილი', 'Profile'), text: tr('აქ შეავსებ სივს, შეცვლი ენას და ნახავ შეფასებებს.', 'Fill in your CV, change the language and see your ratings here.') },
  { tab: 'profile', target: 'help', title: tr('ყოველთვის აქ არის', 'Always here'), text: tr('გზამკვლევის თავიდან ნახვა პროფილიდან შეგიძლია.', 'You can replay this guide from your profile.') },
]

export const employerSteps = () => [
  { tab: 'home', target: null, icon: 'users', title: tr('მოგესალმებით ShiftMate-ში!', 'Welcome to ShiftMate!'), text: tr('ერთ წუთში გაჩვენებთ, როგორ იპოვოთ ხალხი, ვისაც თქვენი ცვლის დროს ნამდვილად სცალია.', "In a minute we'll show you how to find people who are actually free during your shifts.") },
  { tab: 'home', target: 'new', title: tr('დაამატეთ ვაკანსია', 'Post a job'), text: tr('აირჩიეთ დღეები და საათები. სტუდენტები ვაკანსიას მაშინ ნახავენ, როცა ეს დრო მათ ერგებათ.', 'Choose the days and hours. Students see it when that time fits them.') },
  { tab: 'home', target: 'tab-inbox', title: tr('ყველა განაცხადი ერთ ადგილას', 'All applications in one place'), text: tr('აქედან აიყვანთ, დაადასტურებთ დასრულებას და შეაფასებთ თანამშრომელს.', 'Hire, confirm the work is done and rate the worker from here.') },
  { tab: 'home', target: 'tab-calendar', title: tr('ცვლების კალენდარი', 'Shift calendar'), text: tr('რომელ დღეს რომელი ცვლაა და ვინ მუშაობს.', 'Which shift is on which day and who is working.') },
  { tab: 'home', target: 'me', title: tr('პროფილი', 'Profile'), text: tr('კომპანიის მონაცემები, ენა და შეფასებები.', 'Company details, language and ratings.') },
  { tab: 'profile', target: 'help', title: tr('ყოველთვის აქ არის', 'Always here'), text: tr('გზამკვლევის თავიდან ნახვა პროფილიდან შეგიძლიათ.', 'You can replay this guide from your profile.') },
]

const GAP = 14 // მანძილი გამოყოფილ ადგილსა და ბარათს შორის
const PAD = 6

// ეკრანზე ხილული ელემენტი (ტელეფონსა და კომპიუტერზე ერთი და იგივე data-tour სხვადასხვა ადგილასაა)
const findTarget = (name) => [...document.querySelectorAll(`[data-tour="${name}"]`)].find((el) => el.getClientRects().length)

// გზამკვლევი: მიზანს გამოყოფს და ბარათს მის გვერდით დებს. ბარათი გამოყოფილ ადგილს არასოდეს ფარავს:
// თუ მიზანი ეკრანს ავსებს (კალენდარი), ბარათი ქვემოთ ჯდება და გამოყოფილი ნაწილი მის ზემოთ მთავრდება.
export default function Tour({ steps, onClose, onTab }) {
  useLang()
  const [step, setStep] = useState(0)
  const [box, setBox] = useState(null)
  const cardRef = useRef(null)
  const current = steps[step]
  const last = step === steps.length - 1

  useLayoutEffect(() => {
    const el = current.target && findTarget(current.target)
    const scroll = () => el?.scrollIntoView({ block: el.offsetHeight > window.innerHeight * 0.5 ? 'start' : 'center', behavior: 'instant' })
    scroll()
    const measure = () => {
      const r = el?.getBoundingClientRect()
      setBox({
        W: window.innerWidth,
        H: window.innerHeight,
        cardH: cardRef.current?.offsetHeight ?? 220,
        rect: r && { top: Math.max(r.top, 8), left: r.left, width: r.width, height: r.height - (Math.max(r.top, 8) - r.top) },
      })
    }
    measure()
    const frame = requestAnimationFrame(measure) // ბარათის ნამდვილი სიმაღლე პირველი დახატვის შემდეგ
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    // გვერდის შიგთავსი შეიძლება მოგვიანებით ჩაიტვირთოს (პროფილი): მიზანი ისევ ეკრანზე გამოვიტანოთ
    const grown = new ResizeObserver(() => { scroll(); measure() })
    grown.observe(document.body)
    return () => {
      grown.disconnect()
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [current.target, step])

  const go = (i) => {
    onTab?.(steps[i].tab)
    setStep(i)
  }

  const { W, H, cardH, rect } = box ?? { W: window.innerWidth, H: window.innerHeight, cardH: 220 }
  const cardW = Math.min(360, W - 32)
  let left = (W - cardW) / 2
  let top = (H - cardH) / 2
  let spot = rect
  if (rect) {
    const right = rect.left + rect.width + PAD + GAP
    const below = rect.top + rect.height + PAD + GAP
    const above = rect.top - PAD - GAP - cardH
    left = Math.min(Math.max(16, rect.left + rect.width / 2 - cardW / 2), W - cardW - 16)
    if (W >= 1024 && right + cardW <= W - 16) {
      left = right
      top = Math.min(Math.max(16, rect.top), H - cardH - 16)
    } else if (below + cardH <= H - 16) {
      top = below
    } else if (above >= 16) {
      top = above
    } else {
      // მიზანი ეკრანზე დიდია: ბარათი ქვემოთ, გამოყოფილი ნაწილი მის ზემოთ წყდება
      top = H - cardH - 16
      spot = { ...rect, height: Math.max(80, top - GAP - PAD - rect.top) }
    }
  }

  return (
    <div className="fixed inset-0 z-50 animate-fade" data-tour-overlay>
      {spot ? (
        <div
          data-tour-spot
          className="pointer-events-none absolute rounded-[24px] ring-2 ring-white transition-all duration-300"
          style={{ top: spot.top - PAD, left: spot.left - PAD, width: spot.width + PAD * 2, height: spot.height + PAD * 2, boxShadow: '0 0 0 9999px rgba(21,24,30,0.62)' }}
        />
      ) : (
        <div className="absolute inset-0 bg-ink/60" />
      )}
      <div ref={cardRef} data-tour-card className="absolute rounded-[28px] bg-white p-5 shadow-card transition-all duration-300" style={{ top, left, width: cardW, visibility: box ? 'visible' : 'hidden' }}>
        {current.icon && <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-deep"><Icon name={current.icon} className="h-6 w-6" /></span>}
        <h3 className="text-[19px] font-bold leading-snug">{current.title}</h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{current.text}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {steps.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-brand' : 'w-1.5 bg-line'}`} />)}
          </div>
          <div className="flex items-center gap-1">
            {!last && <button onClick={onClose} className="px-2 py-2 text-[14px] font-medium text-quiet hover:text-ink">{tr('გამოტოვება', 'Skip')}</button>}
            <button onClick={() => (last ? onClose() : go(step + 1))} className="rounded-2xl bg-brand px-5 py-2.5 text-[15px] font-semibold text-on-brand hover:bg-brand-dark">
              {last ? tr('დაწყება', 'Start') : tr('შემდეგი', 'Next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
