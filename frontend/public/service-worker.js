const CACHE_NAME    = 'campus-risk-v2'
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  if (request.method !== 'GET') return
  if (url.pathname.startsWith('/api'))     return
  if (url.pathname.startsWith('/uploads')) return
  if (url.origin !== location.origin)      return

  e.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return res
      }).catch(() => cached)
      return cached || network
    })
  )
})

self.addEventListener('push', e => {
  let data = {}
  try { data = e.data?.json() || {} } catch { data = { title: 'Campus Risk Alert', body: e.data?.text() } }

  const title   = data.title || 'Campus Risk Alert'
  const options = {
    body:    data.body    || 'New update',
    icon:    '/icons/icon-192.png',
    badge:   '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag:     data.tag    || 'campus-push',
    renotify: true,
    data:    { url: data.url || '/' },
    actions: [
      { action: 'view',    title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  e.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  if (e.action === 'dismiss') return

  const url = e.notification.data?.url || '/'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})