import { useState } from 'react'
import { useInstall } from '../lib/pwa.js'
import { Icon, Sheet, btn, btn2 } from './ui.jsx'

// "აპად დაყენება": Android/Chrome-ზე პირდაპირ ფანჯარას ხსნის, iPhone-ზე ინსტრუქციას აჩვენებს.
export default function InstallRow() {
  const { installed, canPrompt, prompt } = useInstall()
  const [help, setHelp] = useState(false)

  if (installed) return <p className="flex items-center gap-2 rounded-2xl bg-mint-soft px-4 py-3 font-medium text-mint-dark"><Icon name="check" className="h-5 w-5" strokeWidth={3} />აპი დაყენებულია</p>
  return (
    <>
      <button onClick={() => (canPrompt ? prompt() : setHelp(true))} className={`${btn2} flex items-center justify-center gap-2`}>
        <Icon name="phone" className="h-5 w-5" />ტელეფონზე აპად დაყენება
      </button>
      {help && (
        <Sheet onClose={() => setHelp(false)}>
          <h2 className="flex items-center gap-2 text-[22px] font-semibold"><Icon name="phone" className="h-6 w-6" />დააყენე ტელეფონზე</h2>
          <p className="mt-1 text-[15px] text-muted">Shiftmate მთავარ ეკრანზე გამოჩნდება და სრულ ეკრანზე გაიხსნება, ჩვეულებრივი აპივით.</p>
          <ol className="mt-4 space-y-3 text-[16px] font-semibold">
            <Step n={1}>iPhone: Safari-ში დააჭირე <b>Share</b> <Icon name="share" className="inline h-5 w-5 align-[-4px] text-sky" /></Step>
            <Step n={2}>აირჩიე <b>Add to Home Screen</b></Step>
            <Step n={3}>Android: Chrome-ის მენიუში (⋮) აირჩიე <b>Install app</b></Step>
          </ol>
          <button onClick={() => setHelp(false)} className={`${btn} mt-6`}>გასაგებია</button>
        </Sheet>
      )}
    </>
  )
}

const Step = ({ n, children }) => (
  <li className="flex gap-3">
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand">{n}</span>
    <span>{children}</span>
  </li>
)
