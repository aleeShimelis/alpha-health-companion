import { api } from './client'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export async function registerPushOnServer(token: string, sub: PushSubscription) {
  const data = sub.toJSON() as any
  return api<{ status: string }>('/reminders/subscriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ endpoint: data.endpoint, keys: data.keys }),
  })
}

export async function ensurePushSubscription(vapidPublicKey?: string) {
  if (!('serviceWorker' in navigator)) throw new Error('Service workers not supported')
  const reg = await navigator.serviceWorker.register('/sw.js')
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    if (!vapidPublicKey) throw new Error('Push VAPID key not configured')
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) })
  }
  return sub
}

