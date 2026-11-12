import { useLayoutEffect, useState } from 'react'

const STEPS = [
  {
    target: 'calendar',
    title: '1. დაიწყე აქედან',
    text: 'მონიშნე საათები, როცა ლექციები გაქვს. დააჭირე უჯრას ან გადაათრიე რამდენიმე საათზე. ეს ყველაზე მთავარია: დანარჩენი ამაზეა დამოკიდებული.',
  },
  {
    target: 'jobs',
    title: '2. ვაკანსიები',
    text: 'აქ ჩანს ვაკანსიები და თითო ცვლის გასწვრივ წერია, ერგება თუ ეჯახება შენს ლექციებს. ვაკანსიაზე დაჭერისას მისი ცვლები კალენდარზე გამოჩნდება.',
  },
  {
    target: 'assistant',
    title: '3. AI ასისტენტი',
    text: 'როცა გრაფიკს შეავსებ, ასისტენტი მხოლოდ შესაფერის ვაკანსიებიდან შეგირჩევს საუკეთესოს და კითხვებს გიპასუხებს.',
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

  const pad = 8
  const boxW = 340
  const boxH = 210
  const gap = pad + 12
  const W = window.innerWidth
  const H = window.innerHeight
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
    left = W - boxW - 12
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
          boxShadow: '0 0 0 9999px rgba(20, 33, 61, 0.6)',
        }}
      />
      <div className="absolute rounded-2xl bg-white p-5 shadow-xl" style={{ top, left, width: boxW }}>
        <h3 className="text-lg font-bold">{current.title}</h3>
        <p className="mt-2 text-sm text-muted">{current.text}</p>
        <div className="mt-4 flex items-center justify-between">
          <button onClick={onClose} className="text-sm text-quiet hover:text-navy">გამოტოვება</button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-quiet">{step + 1}/{STEPS.length}</span>
            <button
              onClick={() => (last ? onClose() : setStep(step + 1))}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              {last ? 'დაწყება' : 'შემდეგი'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
