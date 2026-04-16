// Service Worker Version - Auto-generated at build time
// To force cache update, run a new build/deployment
const SW_VERSION = '8fb0d36-1765115566006'; // Will be replaced by build script
const CACHE_NAME = `buysel-v${SW_VERSION}`;
const urlsToCache = [
  '/',
  '/offline.html',
];

// Log version on install
console.log(`Service Worker v${SW_VERSION} installing...`);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log(`Caching files for ${CACHE_NAME}`);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log(`Service Worker v${SW_VERSION} installed successfully`);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log(`Service Worker v${SW_VERSION} activating...`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete all old caches
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log(`Service Worker v${SW_VERSION} activated successfully`);
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests in the cache strategy.
  // Non-GET requests (POST/PUT/DELETE/etc.) should always hit the network.
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  const requestUrl = new URL(event.request.url);

  // Do not apply custom fallback behavior for cross-origin requests.
  // This avoids masking upstream errors from external services with synthetic 504s.
  if (requestUrl.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Never cache NextAuth API routes - they need real-time responses
  if (event.request.url.includes('/api/auth/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Never cache other API routes
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Network unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then((cache) => {
              return cache.match('/offline.html');
            });
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request).catch(() => Response.error());
        })
    );
  }
});

// Push notification handlers for chat
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push notification received', event);

  if (!event.data) {
    console.log('[Service Worker] Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Push data:', data);

    const title = data.title || 'New Message';
    const options = {
      body: data.body || 'You have a new message',
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      tag: data.conversationId || 'notification', // Prevents duplicate notifications
      requireInteraction: false, // Auto-dismiss after some time
      data: {
        url: data.url || '/buyer/messages',
        conversationId: data.conversationId,
        propertyId: data.propertyId
      },
      actions: [
        {
          action: 'open',
          title: 'Open Chat'
        },
        {
          action: 'close',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
        .then(() => console.log('[Service Worker] Notification shown successfully'))
        .catch(err => console.error('[Service Worker] Error showing notification:', err))
    );
  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error);
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click:', event.action);
  event.notification.close();

  if (event.action === 'close') {
    // User dismissed the notification
    return;
  }

  // 'open' action or default click
  if (event.action === 'open' || !event.action) {
    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;
    console.log('[Service Worker] Opening URL:', urlToOpen);

    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(function(windowClients) {
        // Check if there's already a window open
        for (let client of windowClients) {
          if (client.url.includes(event.notification.data.url) && 'focus' in client) {
            console.log('[Service Worker] Focusing existing window');
            return client.focus();
          }
        }
        // No window found, open a new one
        if (clients.openWindow) {
          console.log('[Service Worker] Opening new window');
          return clients.openWindow(urlToOpen);
        }
      }).catch(err => console.error('[Service Worker] Error handling notification click:', err))
    );
  }
});
