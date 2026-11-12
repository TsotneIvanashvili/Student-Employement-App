import { useLayoutEffect, useState } from 'react'

export const STUDENT_STEPS = [
  { target: null, emoji: '👋', title: 'მოგესალმები!', text: 'ერთ წუთში გაჩვენებ, როგორ იპოვო სამსახური, რომელიც შენს ლექციებს არ ეჯახება.' },
  { target: 'calendar', title: 'მონიშნე თავისუფალი დრო', text: 'შეეხე უჯრას ან გადაუსვი თითი საათებს, როცა მუშაობა შეგიძლია. მწვანე = თავისუფალი. ეს ყველაზე მთავარია.' },
  { target: 'summary', title: 'შედეგი მაშინვე ჩანს', text: 'აქ ითვლება, რამდენი ვაკანსია ერგება შენს თავისუფალ საათებს.' },
  { target: 'tab-jobs', title: 'ვაკანსიები', text: 'მუდმივი ცვლები და ⚡ 1–2 დღიანი სამუშაოები. ვაკანსიაზე დაჭერით გაიხსნება მისი გვერდი, სადაც სივს გაგზავნი.' },
  { target: 'tab-ai', title: 'AI ასისტენტი', text: 'შენს გრაფიკს უყურებს და საუკეთესო ვაკანსიებს ბარათებად გთავაზობს.' },
  { target: 'tab-profile', title: 'სივი და საფულე', text: 'შეავსე სივი ერთხელ. აქვე ნახავ განაცხადებს და შემოსავალს: დამსაქმებელი წინასწარ იხდის, შენ სამუშაოს შემდეგ იღებ 90%-ს.' },
  { target: 'help', title: 'ყოველთვის აქ არის', text: 'გზამკვლევის თავიდან ნახვა ამ ღილაკით შეგიძლია.' },
]

export const EMPLOYER_STEPS = [
  { target: null, emoji: '🏢', title: 'მოგესალმებით!', text: 'ერთ წუთში გაჩვენებთ, როგორ იპოვოთ სტუდენტი, რომელსაც თქვენი ცვლის დროს ნამდვილად სცალია.' },
  { target: 'tab-plus', title: 'დაამატეთ ვაკანსია', text: 'მიუთითეთ დღეები და საათები: მუდმივი ცვლები ან ⚡ 1–2 დღიანი სამუშაო. სტუდენტები მხოლოდ მაშინ ნახავენ, თუ მათ დროს ერგება.' },
  { target: 'tab-jobs', title: 'განაცხადები', text: 'ვაკანსიაზე დაჭერით ნახავთ სტუდენტების პროფილს, სივს და წერილს.' },
  { target: null, emoji: '🔒', title: 'დაცული გადახდა', text: '„აყვანა და გადახდა“: თანხა იბლოკება სამუშაოს დასრულებამდე. დადასტურების შემდეგ სტუდენტი იღებს 90%-ს, პლატფორმა 10%-ს.' },
  { target: 'help', title: 'ყოველთვის აქ არის', text: 'გზამკვლევის თავიდან ნახვა ამ ღილაკით შეგიძლიათ.' },
]

// გზამკვლევი ტელეფონის ჩარჩოს შიგნით მუშაობს: კოორდინატები #phone-ის მიმართ ითვლება.
export default function Tour({ steps, onClose }) {
  const [step, setStep] = useState(0)
  const [box, setBox] = useState(null)
  const current = steps[step]
  const last = step === steps.length - 1

  useLayoutEffect(() => {
    const phone = document.getElementById('phone')
    const el = current.target && document.querySelector(`[data-tour="${current.target}"]`)
    if (el) el.scrollIntoView({ block: el.offsetHeight > phone.clientHeight * 0.6 ? 'start' : 'center', behavior: 'instant' })
    const measure = () => {
      const p = phone.getBoundingClientRect()
      const r = el?.getBoundingClientRect()
      setBox({ W: p.width, H: p.height, rect: r && { top: r.top - p.top, left: r.left - p.left, width: r.width, height: r.height } })
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
  const cardW = Math.min(340, W - 32)
  const cardH = 210
  const left = (W - cardW) / 2
  let top = (H - cardH) / 2
  if (rect) {
    const below = rect.top + rect.height + pad + 14
    top = below + cardH < H - 16 ? below : Math.max(16, rect.top - pad - 14 - cardH)
  }

  return (
    <div className="fixed inset-0 z-50 animate-fade">
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-[18px] ring-2 ring-white/80 transition-all duration-300"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: '0 0 0 9999px rgba(11,13,18,0.62)' }}
        />
      ) : (
        <div className="absolute inset-0 bg-[rgba(11,13,18,0.62)] backdrop-blur-[2px]" />
      )}
      <div className="absolute rounded-[24px] bg-white p-5 shadow-2xl transition-all duration-300" style={{ top, left, width: cardW }}>
        {current.emoji && <p className="mb-1 text-[34px] leading-none">{current.emoji}</p>}
        <h3 className="text-[20px] font-bold">{current.title}</h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{current.text}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-brand' : 'w-1.5 bg-line'}`} />)}
          </div>
          <div className="flex items-center gap-2">
            {!last && <button onClick={onClose} className="px-2 py-2 text-[15px] text-quiet">გამოტოვება</button>}
            <button onClick={() => (last ? onClose() : setStep(step + 1))} className="rounded-full bg-brand px-5 py-2.5 text-[15px] font-semibold text-white">
              {last ? 'დაწყება' : 'შემდეგი'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
