// Service Worker for Push Notifications
const APP_NAME = '고객관리 시스템'
const APP_VERSION = 'v1.5'

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log(`[Service Worker] ${APP_NAME} ${APP_VERSION} 설치됨`)
  self.skipWaiting()
})

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log(`[Service Worker] ${APP_NAME} ${APP_VERSION} 활성화됨`)
  event.waitUntil(self.clients.claim())
})

// Push 알림 수신
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push 알림 수신:', event)
  
  let data = {}
  
  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data = {
        title: 'A/S 작업 완료',
        body: event.data.text()
      }
    }
  }
  
  const title = data.title || 'A/S 작업 완료'
  const options = {
    body: data.body || data.message || '새로운 A/S 작업이 완료되었습니다.',
    icon: '/static/icon-192.png',
    badge: '/static/badge-96.png',
    tag: 'as-notification',
    requireInteraction: false,
    data: {
      url: data.url || '/',
      customer_id: data.customer_id,
      notification_id: data.notification_id
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] 알림 클릭:', event)
  
  event.notification.close()
  
  const urlToOpen = event.notification.data.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열려있는 창이 있으면 포커스
        for (let client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        
        // 없으면 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})
