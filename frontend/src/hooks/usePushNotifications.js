import { useEffect } from 'react'
import API from '../api'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export default function usePushNotifications() {

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    const setup = async () => {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const reg = await navigator.serviceWorker.ready

        const existing = await reg.pushManager.getSubscription()
        if (existing) {
          await API.post('/push/subscribe', existing.toJSON()).catch(() => {})
          return
        }

        const { data } = await API.get('/push/vapid-key')
        const appServerKey = urlBase64ToUint8Array(data.publicKey)

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey,
        })

        await API.post('/push/subscribe', subscription.toJSON())
        console.log('Push subscription registered')
      } catch (err) {
        console.log('Push setup failed:', err.message)
      }
    }

    setTimeout(setup, 3000)
  }, [])

  const sendLocalNotification = (title, body, url = '/') => {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
        body,
        icon:    '/icons/icon-192.png',
        badge:   '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        data:    { url },
        tag:     `local-${Date.now()}`,
      })
    }).catch(() => {
      try { new Notification(title, { body, icon: '/icons/icon-192.png' }) } catch {}
    })
  }

  return { sendNotification: sendLocalNotification }
}