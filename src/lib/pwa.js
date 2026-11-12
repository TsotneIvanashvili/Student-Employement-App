import { useEffect, useState } from 'react'

// Android/Chrome: ბრაუზერი "beforeinstallprompt"-ს აგზავნის, ვინახავთ და ღილაკზე ვაჩვენებთ.
// iOS Safari ამას არ აკეთებს, იქ ინსტრუქციას ვაჩვენებთ (Share → Add to Home Screen).
let deferred = null
const listeners = new Set()
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e
    listeners.forEach((fn) => fn())
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    listeners.forEach((fn) => fn())
  })
}

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

export function useInstall() {
  const [, rerender] = useState(0)
  useEffect(() => {
    const fn = () => rerender((n) => n + 1)
    listeners.add(fn)
    return () => listeners.delete(fn)
  }, [])
  return {
    installed: isStandalone(),
    canPrompt: Boolean(deferred),
    prompt: async () => {
      if (!deferred) return
      deferred.prompt()
      await deferred.userChoice
      deferred = null
      rerender((n) => n + 1)
    },
  }
}

export function registerServiceWorker() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
  }
}
