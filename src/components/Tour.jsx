import { useLayoutEffect, useRef, useState } from 'react'
import { Icon } from './ui.jsx'

// tab: რომელ გვერდზე უნდა იყოს მომხმარებელი ამ ნაბიჯზე; target: data-tour ატრიბუტი, რომელსაც ნაბიჯი გამოყოფს
export const STUDENT_STEPS = [
  { tab: 'home', target: null, icon: 'calendar', title: 'მოგესალმები Shiftmate-ში!', text: 'ერთ წუთში გაჩვენებ, როგორ იპოვო დამატებითი სამუშაო, რომელიც შენს სხვა საქმეებს არ ეჯახება.' },
  { tab: 'calendar', target: 'quickadd', title: 'დაწერე, როდის ხარ დაკავებული', text: 'ჩაწერე სიტყვებით, მაგალითად „ორშაბათიდან პარასკევამდე 10-დან 6-მდე ვმუშაობ“, და ასისტენტი განრიგს თავად შეავსებს.' },
  { tab: 'calendar', target: 'calendar', title: 'ან მონიშნე კალენდარზე', text: 'დააჭირე დღეს ან საათს, კომპიუტერზე კი მაუსი გადაატარე საათებზე. ყოველ კვირა თავისით მეორდება. დანარჩენი დრო თავისუფალია.' },
  { tab: 'calendar', target: 'tab-jobs', title: 'ვაკანსიები', text: 'აქ მხოლოდ ის ვაკანსიებია, რომლებიც შენს თავისუფალ დროში ჯდება. თუ აგიყვანენ, ცვლები თავისით გამოჩნდება განრიგში.' },
  { tab: 'calendar', target: 'tab-ai', title: 'AI ასისტენტი', text: 'გირჩევს საუკეთესო ვაკანსიებს და შეუძლია დაკავებული დრო ჩაგიწეროს.' },
  { tab: 'home', target: 'me', title: 'პროფილი და სივი', text: 'შენს სახელზე დაჭერით იხსნება პროფილი. შეავსე სივი ერთხელ და ყველა ვაკანსიაზე გამოიყენება.' },
  { tab: 'home', target: 'help', title: 'ყოველთვის აქ არის', text: 'გზამკვლევის თავიდან ნახვა ამ ღილაკით შეგიძლია.' },
]

export const EMPLOYER_STEPS = [
  { tab: 'home', target: null, icon: 'users', title: 'მოგესალმებით Shiftmate-ში!', text: 'ერთ წუთში გაჩვენებთ, როგორ იპოვოთ ხალხი, ვისაც თქვენი ცვლის დროს ნამდვილად სცალია.' },
  { tab: 'home', target: 'tab-plus', title: 'დაამატეთ ვაკანსია', text: 'ცვლის საათებს კალენდარზე მონიშნავთ. მაძიებლები ვაკანსიას მხოლოდ მაშინ ნახავენ, თუ მათ დროს ერგება.' },
  { tab: 'home', target: 'tab-inbox', title: 'ყველა განაცხადი ერთ ადგილას', text: 'ახალი სივები ყველა ვაკანსიიდან აქ გროვდება. აქედანვე აიყვანთ ან უარს ეტყვით.' },
  { tab: 'home', target: 'tab-calendar', title: 'ცვლების კალენდარი', text: 'დღე, კვირა ან თვე: რომელ დღეს რომელი ცვლაა და ვინ მუშაობს.' },
  { tab: 'home', target: 'me', title: 'პროფილი', text: 'კომპანიის მონაცემები და ანგარიშის პარამეტრები თქვენს სახელზე დაჭერით იხსნება.' },
  { tab: 'home', target: 'help', title: 'ყოველთვის აქ არის', text: 'გზამკვლევის თავიდან ნახვა ამ ღილაკით შეგიძლიათ.' },
]

const GAP = 14 // მანძილი გამოყოფილ ადგილსა და ბარათს შორის
const PAD = 6

// ეკრანზე ხილული ელემენტი (ტელეფონსა და კომპიუტერზე ერთი და იგივე data-tour სხვადასხვა ადგილასაა)
const findTarget = (name) => [...document.querySelectorAll(`[data-tour="${name}"]`)].find((el) => el.getClientRects().length)

// გზამკვლევი: მიზანს გამოყოფს და ბარათს მის გვერდით დებს. ბარათი გამოყოფილ ადგილს არასოდეს ფარავს:
// თუ მიზანი ეკრანს ავსებს (კალენდარი), ბარათი ქვემოთ ჯდება და გამოყოფილი ნაწილი მის ზემოთ მთავრდება.
export default function Tour({ steps, onClose, onTab }) {
  const [step, setStep] = useState(0)
  const [box, setBox] = useState(null)
  const cardRef = useRef(null)
  const current = steps[step]
  const last = step === steps.length - 1

  useLayoutEffect(() => {
    const el = current.target && findTarget(current.target)
    if (el) el.scrollIntoView({ block: el.offsetHeight > window.innerHeight * 0.5 ? 'start' : 'center', behavior: 'instant' })
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
    return () => {
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
      <div ref={cardRef} data-tour-card className="absolute rounded-3xl bg-white p-5 shadow-card transition-all duration-300" style={{ top, left, width: cardW, visibility: box ? 'visible' : 'hidden' }}>
        {current.icon && <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-deep"><Icon name={current.icon} className="h-6 w-6" /></span>}
        <h3 className="text-[19px] font-bold leading-snug">{current.title}</h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{current.text}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {steps.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-brand' : 'w-1.5 bg-line'}`} />)}
          </div>
          <div className="flex items-center gap-1">
            {!last && <button onClick={onClose} className="px-2 py-2 text-[14px] font-medium text-quiet hover:text-ink">გამოტოვება</button>}
            <button onClick={() => (last ? onClose() : go(step + 1))} className="rounded-2xl bg-brand px-5 py-2.5 text-[15px] font-semibold text-on-brand hover:bg-brand-dark">
              {last ? 'დაწყება' : 'შემდეგი'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
