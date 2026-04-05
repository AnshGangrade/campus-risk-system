import { useEffect } from 'react'

export default function usePushNotifications() {

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      setTimeout(() => {
        Notification.requestPermission()
      }, 5000)
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.log('SW failed:', err))
    }
  }, [])

  const sendNotification = (title, body, url = '/') => {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
        body,
        icon:    '/icons/icon-192.png',
        badge:   '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        data:    { url },
        tag:     `campus-${Date.now()}`,
      })
    }).catch(() => {
      new Notification(title, { body, icon: '/icons/icon-192.png' })
    })
  }

  return { sendNotification }
}