import { useEffect, useState } from 'react'

// კომპიუტერზე აპი iPhone-ის ჩარჩოში ჩანს, ტელეფონზე კი მთელ ეკრანზე.
// transform ჩარჩოს ქმნის "fixed" ელემენტების საზღვრად, ამიტომ ტაბ-ბარი და ფურცლები ჩარჩოს შიგნით რჩება.
// აპის ეკრანი, რომელსაც მუქი ფონი აქვს, სტატუს-ბარს თეთრად აქცევს
export function useLightStatusBar() {
  useEffect(() => {
    const el = document.getElementById('phone')
    el?.setAttribute('data-bar', 'light')
    return () => el?.removeAttribute('data-bar')
  }, [])
}

export default function Device({ children }) {
  return (
    <div className="min-h-dvh bg-[#dfe3ea] md:grid md:place-items-center md:bg-[radial-gradient(circle_at_30%_20%,#ffffff,#d9dee7)] md:py-6">
      <div
        id="phone"
        className="group/phone relative flex h-dvh w-full flex-col overflow-hidden bg-bg md:h-[min(844px,calc(100dvh-48px))] md:w-[390px] md:rounded-[58px] md:shadow-[0_0_0_11px_#0b0d12,0_0_0_13px_#3a3d45,0_40px_80px_-20px_rgba(0,0,0,0.45)]"
        style={{ transform: 'translateZ(0)' }}
      >
        <StatusBar />
        <div id="screen" className="screen relative min-h-0 flex-1 overflow-y-auto md:pt-[50px]">{children}</div>
        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-50 hidden justify-center md:flex">
          <div className="h-[5px] w-32 rounded-full bg-ink/80" />
        </div>
      </div>
    </div>
  )
}

function StatusBar() {
  const [time, setTime] = useState(clock)
  useEffect(() => {
    const t = setInterval(() => setTime(clock()), 15000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="absolute inset-x-0 top-0 z-50 hidden h-[50px] items-center justify-between bg-bg/85 px-8 pt-1 text-[15px] font-semibold backdrop-blur-xl md:flex group-data-[bar=light]/phone:bg-transparent group-data-[bar=light]/phone:text-white group-data-[bar=light]/phone:backdrop-blur-none">
      <span className="w-14 text-center">{time}</span>
      <div className="absolute left-1/2 top-[11px] h-[34px] w-[122px] -translate-x-1/2 rounded-full bg-black" />
      <div className="flex items-center gap-1.5">
        <svg viewBox="0 0 18 12" className="h-3 w-[18px]" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
        <svg viewBox="0 0 16 12" className="h-3 w-4" fill="currentColor" aria-hidden="true"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.1-1.2A10.2 10.2 0 0 0 8 .5C5.3.5 2.8 1.5.9 3.4L2 4.6a8.6 8.6 0 0 1 6-2.4zm0 3.4c1.4 0 2.6.5 3.6 1.4l1.1-1.2A6.9 6.9 0 0 0 8 3.9c-1.8 0-3.5.7-4.7 1.9L4.4 7A5.1 5.1 0 0 1 8 5.6zm0 3.3c.6 0 1.2.2 1.6.6L8 11.3 6.4 9.5c.4-.4 1-.6 1.6-.6z" /></svg>
        <svg viewBox="0 0 27 13" className="h-[13px] w-[27px]" aria-hidden="true"><rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity="0.4" /><rect x="2" y="2" width="20" height="9" rx="2" fill="currentColor" /><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="currentColor" opacity="0.4" /></svg>
      </div>
    </div>
  )
}

function clock() {
  const d = new Date()
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
