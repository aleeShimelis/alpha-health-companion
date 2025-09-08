self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // ready to receive push or show notifications
})

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'ALPHA', body: 'Reminder' }
  event.waitUntil(self.registration.showNotification(data.title || 'ALPHA', {
    body: data.body || 'You have a reminder',
    icon: '/icons/icon-192.png'
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})


