import { useState } from 'react'
import { useInstall } from '../lib/pwa.js'
import { Icon, Row, Sheet, btn } from './ui.jsx'

// "აპად დაყენება" პროფილში: Android-ზე პირდაპირ ფანჯარას ხსნის, iPhone-ზე ინსტრუქციას აჩვენებს.
export default function InstallRow() {
  const { installed, canPrompt, prompt } = useInstall()
  const [help, setHelp] = useState(false)

  if (installed) return <Row icon="phone" iconBg="bg-ink" label="აპი დაყენებულია" value="✓" />
  return (
    <>
      <Row icon="phone" iconBg="bg-ink" label="აპად დაყენება" onClick={() => (canPrompt ? prompt() : setHelp(true))} />
      {help && (
        <Sheet onClose={() => setHelp(false)}>
          <div className="px-1 pb-2">
            <h2 className="text-[22px] font-bold">დააყენე ტელეფონზე</h2>
            <p className="mt-1 text-[15px] text-muted">აპი მთავარ ეკრანზე გამოჩნდება და სრულ ეკრანზე გაიხსნება, ჩვეულებრივი აპივით.</p>
            <ol className="mt-4 space-y-3 text-[16px]">
              <Step n={1}>Safari-ში დააჭირე <b>Share</b> ღილაკს <Icon name="share" className="inline h-5 w-5 align-[-4px] text-[#2f6bff]" /></Step>
              <Step n={2}>აირჩიე <b>Add to Home Screen</b> („მთავარ ეკრანზე დამატება“)</Step>
              <Step n={3}>დააჭირე <b>Add</b>-ს</Step>
            </ol>
            <p className="mt-4 text-[13px] text-muted">Android-ზე Chrome-ის მენიუში (⋮) აირჩიე „Install app“.</p>
            <button onClick={() => setHelp(false)} className={`${btn} mt-5`}>გასაგებია</button>
          </div>
        </Sheet>
      )}
    </>
  )
}

const Step = ({ n, children }) => (
  <li className="flex gap-3">
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">{n}</span>
    <span>{children}</span>
  </li>
)
