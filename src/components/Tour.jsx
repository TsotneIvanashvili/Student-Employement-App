import { useLayoutEffect, useState } from 'react'

export const STUDENT_STEPS = [
  { target: null, emoji: '👋', title: 'მოგესალმები Shiftmate-ში!', text: 'ერთ წუთში გაჩვენებ, როგორ იპოვო სამსახური, რომელიც შენს ლექციებს არ ეჯახება.' },
  { target: 'calendar', title: 'ჩაწერე, როდის არ გცალია', text: 'დააჭირე დღეს ან საათს და ჩაწერე ლექცია, მაგალითად 13:00–16:00. ყოველ კვირა გამეორდება, კონკრეტულ დღეს კი შეგიძლია გამოტოვო. დანარჩენი დრო თავისუფალია.' },
  { target: 'matches', title: 'შესაფერისი ვაკანსიები', text: 'აქ ჩანს, რამდენი ვაკანსია ერგება შენს თავისუფალ დროს.' },
  { target: 'tab-jobs', title: 'ვაკანსიები', text: 'ვაკანსიაზე დაჭერით სივს გაგზავნი. თუ აგიყვანენ, ცვლები თავისით გამოჩნდება შენს განრიგში.' },
  { target: 'tab-ai', title: 'AI ასისტენტი', text: 'შენს განრიგს უყურებს და საუკეთესო ვაკანსიებს გირჩევს.' },
  { target: 'tab-profile', title: 'სივი და საფულე', text: 'შეავსე სივი ერთხელ. აქვე ნახავ შემოსავალს: დამსაქმებელი წინასწარ იხდის, შენ სამუშაოს შემდეგ იღებ 90%-ს.' },
  { target: 'help', title: 'ყოველთვის აქ არის', text: 'გზამკვლევის თავიდან ნახვა ამ ღილაკით შეგიძლია.' },
]

export const EMPLOYER_STEPS = [
  { target: null, emoji: '🏢', title: 'მოგესალმებით Shiftmate-ში!', text: 'ერთ წუთში გაჩვენებთ, როგორ იპოვოთ სტუდენტი, რომელსაც თქვენი ცვლის დროს ნამდვილად სცალია.' },
  { target: 'tab-plus', title: 'დაამატეთ ვაკანსია', text: 'ცვლის საათებს კალენდარზე მონიშნავთ. სტუდენტები ვაკანსიას მხოლოდ მაშინ ნახავენ, თუ მათ დროს ერგება.' },
  { target: 'tab-inbox', title: 'ყველა განაცხადი ერთ ადგილას', text: 'ახალი სივები ყველა ვაკანსიიდან აქ გროვდება. აქედანვე აიყვანთ ან უარს ეტყვით.' },
  { target: 'tab-calendar', title: 'ცვლების კალენდარი', text: 'დღე, კვირა ან თვე: რომელ დღეს რომელი ცვლაა და ვინ მუშაობს.' },
  { target: null, emoji: '🔒', title: 'დაცული გადახდა', text: '„აყვანა“-ზე დაჭერით გადაიხდით და თანხა სამუშაოს დასრულებამდე იბლოკება. დადასტურების შემდეგ სტუდენტი იღებს 90%-ს, Shiftmate 10%-ს.' },
  { target: 'help', title: 'ყოველთვის აქ არის', text: 'გზამკვლევის თავიდან ნახვა ამ ღილაკით შეგიძლიათ.' },
]

// გზამკვლევი: მიზანს გამოყოფს და მის გვერდით ბარათს აჩვენებს.
export default function Tour({ steps, onClose }) {
  const [step, setStep] = useState(0)
  const [box, setBox] = useState(null)
  const current = steps[step]
  const last = step === steps.length - 1

  useLayoutEffect(() => {
    const el = current.target && document.querySelector(`[data-tour="${current.target}"]`)
    if (el) el.scrollIntoView({ block: el.offsetHeight > window.innerHeight * 0.6 ? 'start' : 'center', behavior: 'instant' })
    const measure = () => {
      const r = el?.getBoundingClientRect()
      setBox({ W: window.innerWidth, H: window.innerHeight, rect: r && { top: r.top, left: r.left, width: r.width, height: r.height } })
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [current.target])

  if (!box) return null
  const { W, H, rect } = box
  const pad = 6
  const cardW = Math.min(360, W - 32)
  const cardH = 210
  let left = (W - cardW) / 2
  let top = (H - cardH) / 2
  if (rect) {
    const below = rect.top + rect.height + pad + 14
    const side = rect.left + rect.width + pad + 16
    if (W >= 1024 && side + cardW < W - 16) {
      left = side
      top = Math.min(Math.max(16, rect.top), H - cardH - 16)
    } else {
      left = Math.min(Math.max(16, rect.left + rect.width / 2 - cardW / 2), W - cardW - 16)
      top = below + cardH < H - 16 ? below : Math.max(16, rect.top - pad - 14 - cardH)
    }
  }

  return (
    <div className="fixed inset-0 z-50 animate-fade">
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-[20px] ring-2 ring-white transition-all duration-300"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: '0 0 0 9999px rgba(29,27,46,0.6)' }}
        />
      ) : (
        <div className="absolute inset-0 bg-ink/60" />
      )}
      <div className="absolute rounded-2xl border border-line bg-white p-5 transition-all duration-300" style={{ top, left, width: cardW }}>
        {current.emoji && <p className="mb-1 text-[34px] leading-none">{current.emoji}</p>}
        <h3 className="text-[20px] font-semibold">{current.title}</h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{current.text}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-brand' : 'w-1.5 bg-line'}`} />)}
          </div>
          <div className="flex items-center gap-2">
            {!last && <button onClick={onClose} className="px-2 py-2 text-[15px] font-medium text-quiet">გამოტოვება</button>}
            <button onClick={() => (last ? onClose() : setStep(step + 1))} className="rounded-2xl bg-brand px-5 py-2.5 text-[15px] font-semibold text-white">
              {last ? 'დაწყება' : 'შემდეგი'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
