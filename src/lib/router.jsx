import { useSyncExternalStore } from 'react'

// პატარა როუტერი ნამდვილი მისამართებით (/how, /terms ...). სერვერი ყველა გზაზე index.html-ს აბრუნებს (vercel.json).
const subscribe = (fn) => {
  window.addEventListener('popstate', fn)
  return () => window.removeEventListener('popstate', fn)
}
export const usePath = () => useSyncExternalStore(subscribe, () => window.location.pathname)

export function navigate(to, { replace = false } = {}) {
  history[replace ? 'replaceState' : 'pushState'](null, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

export function Link({ to, className, children, ...rest }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        navigate(to)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
