// მარტივი service worker: აპის გარსი ოფლაინაც იხსნება.
// მონაცემები (Supabase) და AI (/api) ყოველთვის ქსელიდან მოდის და არ ინახება.
const CACHE = 'shiftmate-v8'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.webmanifest', '/icons/icon-192.png'])))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))))
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return

  // გვერდი: ჯერ ქსელი, ოფლაინში შენახული ვერსია
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put('/', res.clone()))
          return res
        })
        .catch(() => caches.match('/')),
    )
    return
  }

  // ფაილები (/assets/* ჰეშიანი სახელით): ჯერ ქეში
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request).then((res) => {
          if (res.ok && url.pathname.startsWith('/assets/')) caches.open(CACHE).then((c) => c.put(e.request, res.clone()))
          return res
        }),
    ),
  )
})
