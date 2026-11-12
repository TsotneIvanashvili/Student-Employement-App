import { useLayoutEffect, useState } from 'react'

const STEPS = [
  {
    target: 'calendar',
    title: '1. დაიწყე აქედან',
    text: 'მონიშნე საათები, როცა თავისუფალი ხარ და მუშაობა შეგიძლია: შეეხე უჯრას ან გადაუსვი თითი რამდენიმე საათზე. ეს ყველაზე მთავარია, დანარჩენი ამაზეა დამოკიდებული.',
  },
  {
    target: 'jobs',
    title: '2. ვაკანსიები',
    text: 'აქ ჩანს მუდმივი და 1–2 დღიანი ვაკანსიები და წერია, რამდენი ცვლა ერგება შენს თავისუფალ დროს. ვაკანსიაზე დაჭერით გაიხსნება მისი გვერდი, სადაც სივის გაგზავნი.',
  },
  {
    target: 'assistant',
    title: '3. AI ასისტენტი',
    text: 'ასისტენტი შენს თავისუფალ საათებს ერგება და საუკეთესო ვაკანსიებს ბარათებად შემოგთავაზებს. ბარათზე დაჭერით ვაკანსიის გვერდზე გადახვალ.',
  },
  {
    target: 'help',
    title: '4. დახმარება',
    text: 'გზამკვლევის ხელახლა ნახვა ნებისმიერ დროს შეგიძლია ამ ღილაკით.',
  },
]

export default function Tour({ onClose }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)
  const current = STEPS[step]

  useLayoutEffect(() => {
    const el = document.querySelector(`[data-tour="${current.target}"]`)
    if (!el) return
    el.scrollIntoView({ block: el.offsetHeight > window.innerHeight * 0.8 ? 'start' : 'center', behavior: 'instant' })
    const measure = () => setRect(el.getBoundingClientRect())
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [current.target])

  if (!rect) return null

  const pad = 6
  const W = window.innerWidth
  const H = window.innerHeight
  const boxW = Math.min(340, W - 24)
  const boxH = 220
  const gap = pad + 10
  const clampTop = (t) => Math.min(Math.max(12, t), H - boxH - 12)
  const clampLeft = (l) => Math.min(Math.max(12, l), W - boxW - 12)
  let top, left
  if (rect.bottom + gap + boxH < H) {
    top = rect.bottom + gap
    left = clampLeft(rect.left)
  } else if (rect.top - gap - boxH > 0) {
    top = rect.top - gap - boxH
    left = clampLeft(rect.left)
  } else if (rect.right + gap + boxW < W) {
    top = clampTop(rect.top)
    left = rect.right + gap
  } else if (rect.left - gap - boxW > 0) {
    top = clampTop(rect.top)
    left = rect.left - gap - boxW
  } else {
    top = H - boxH - 12
    left = clampLeft((W - boxW) / 2)
  }
  const last = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="pointer-events-none absolute rounded-2xl transition-all"
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          boxShadow: '0 0 0 9999px rgba(21, 20, 43, 0.6)',
        }}
      />
      <div className="absolute rounded-3xl bg-white p-5 shadow-2xl" style={{ top, left, width: boxW }}>
        <h3 className="text-lg font-bold">{current.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{current.text}</p>
        <div className="mt-4 flex items-center justify-between">
          <button onClick={onClose} className="py-2 text-sm text-quiet">გამოტოვება</button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-quiet">{step + 1}/{STEPS.length}</span>
            <button
              onClick={() => (last ? onClose() : setStep(step + 1))}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white"
            >
              {last ? 'დაწყება' : 'შემდეგი'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
