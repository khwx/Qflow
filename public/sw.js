/**
 * QFlow Service Worker for Web Push Notifications
 * Handles push events and displays notifications
 */

const _CACHE_NAME = 'qflow-v1'

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// Push event - show notification
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    const title = data.title || 'QFlow - Nova Senha'
    const options = {
      body: data.body || `Sua senha ${data.ticketNumber} foi chamada!`,
      icon: data.icon || '/images/icon-192.png',
      badge: data.badge || '/images/badge-72.png',
      tag: data.tag || 'ticket-called',
      data: {
        ticketId: data.ticketId,
        ticketNumber: data.ticketNumber,
        url: data.url || '/',
      },
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'Ver detalhes' },
        { action: 'dismiss', title: 'Dispensar' },
      ],
      vibrate: [200, 100, 200],
    }

    event.waitUntil(self.registration.showNotification(title, options))
  } catch (error) {
    console.error('Push notification error:', error)
  }
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const data = event.notification.data || {}
  const url = data.url || '/'
  const absoluteUrl = url.startsWith('/') ? self.location.origin + url : url

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      return clients.openWindow(absoluteUrl)
    })
  )
})

// Background sync for offline support (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tickets') {
    event.waitUntil(syncTickets())
  }
})

async function syncTickets() {
  // Could be used for offline queue status updates
  console.log('Background sync for tickets')
}