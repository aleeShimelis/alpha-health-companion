export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    return reg
  } catch {
    return null
  }
}

export async function showLocalTestNotification(title = 'ALPHA Reminder', body = 'This is a test notification') {
  const perm = await ensureNotificationPermission()
  if (perm !== 'granted') throw new Error('Notifications not granted')
  const reg = await registerServiceWorker()
  if (!reg) throw new Error('Service worker not registered')
  return reg.showNotification(title, { body })
}


