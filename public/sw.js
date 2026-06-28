// Service Worker for CityScope PWA with Enhanced Features
const CACHE_NAME = 'cityscope-v3';
const STATIC_CACHE = 'cityscope-static-v3';
const DYNAMIC_CACHE = 'cityscope-dynamic-v3';
const API_CACHE = 'cityscope-api-v3';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/CityScope.png',
  '/CityScope-bg.png',
  '/placeholder.svg',
  '/robots.txt'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/issues/,
  /\/api\/users/,
  /\/api\/departments/,
  /\/api\/notifications/,
  /\/rest\/v1\//,  // Supabase REST API
  /supabase\.co/   // Supabase requests
];

// Install event - cache static files with enhanced error handling
self.addEventListener('install', (event) => {
  console.log('🔧 CityScope Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Caching static files...');
        return Promise.allSettled(
          STATIC_FILES.map(file => 
            cache.add(file).catch(err => {
              console.warn(`⚠️ Failed to cache ${file}:`, err);
              return null;
            })
          )
        );
      }),
      // Initialize API cache
      caches.open(API_CACHE),
      // Initialize dynamic cache
      caches.open(DYNAMIC_CACHE)
    ])
    .then(() => {
      console.log('✅ CityScope Service Worker installation completed');
      return self.skipWaiting();
    })
    .catch((error) => {
      console.error('❌ Error during service worker installation:', error);
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('🚀 CityScope Service Worker activating...');
  
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ CityScope Service Worker activated');
        // Immediately claim all clients
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients that SW is ready
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'SW_ACTIVATED' });
          });
        });
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-http(s) schemes.
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Avoid handling Vite dev/HMR requests and websocket-adjacent client assets.
  if (
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.includes('hot-update')
  ) {
    return;
  }

  // Don't handle cross-origin requests except explicit API/image paths.
  if (url.origin !== self.location.origin && !isAPIRequest(request) && !isImageRequest(request)) {
    return;
  }

  // Always treat app-route navigations with a robust network-first SPA fallback.
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle different types of requests
  if (isStaticFile(request)) {
    event.respondWith(handleStaticFile(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// Check if request is for a static file
function isStaticFile(request) {
  const url = new URL(request.url);
  return STATIC_FILES.some(file => url.pathname === file) ||
         url.pathname.startsWith('/assets/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.svg');
}

// Handle app route navigation (e.g., /auth, /map) with SPA fallback.
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      const appShell = await fetch('/index.html');
      if (appShell.ok) {
        cache.put('/index.html', appShell.clone());
      }
      return networkResponse;
    }

    const cachedShell = await caches.match('/index.html');
    if (cachedShell) {
      return cachedShell;
    }

    return networkResponse;
  } catch (error) {
    console.warn('Navigation request failed, serving cached shell when available:', error);

    const cachedShell = await caches.match('/index.html');
    if (cachedShell) {
      return cachedShell;
    }

    return new Response('<h1>Offline</h1><p>Please reconnect and try again.</p>', {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

// Check if request is for API
function isAPIRequest(request) {
  const url = new URL(request.url);
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Check if request is for an image
function isImageRequest(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/);
}

// Handle static file requests
async function handleStaticFile(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Error handling static file request:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    
    throw error;
  }
}

// Handle API requests
async function handleAPIRequest(request) {
  try {
    // Try network first for API requests
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Network error for API request:', error);
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'You are offline. Data will sync when connection is restored.' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle image requests
async function handleImageRequest(request) {
  try {
    // Try cache first for images
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful image responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Error handling image request:', error);
    
    // Return placeholder image for failed requests
    return caches.match('/placeholder.svg');
  }
}

// Handle other requests
async function handleOtherRequest(request) {
  try {
    // Try cache first for other requests
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Error handling request:', error);
    
    // For navigation requests, return the main page
    if (request.mode === 'navigate') {
      const cachedResponse = await caches.match('/index.html');
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // For image/document-like requests return generic network error response.
    if (request.destination === 'image') {
      const placeholder = await caches.match('/placeholder.svg');
      if (placeholder) {
        return placeholder;
      }
    }

    // Avoid returning JSON for script/style/font fetches.
    if (['script', 'style', 'font'].includes(request.destination)) {
      return new Response('', { status: 504, statusText: 'Gateway Timeout' });
    }
    
    // For other requests, return a generic offline response
    return new Response(
      JSON.stringify({ 
        error: 'Network Error', 
        message: 'Unable to fetch resource. Please check your connection.' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    console.log('Syncing offline data...');
    
    // Get offline queue from IndexedDB
    const offlineQueue = await getOfflineQueue();
    
    for (const item of offlineQueue) {
      try {
        await syncOfflineItem(item);
        await removeFromOfflineQueue(item.id);
      } catch (error) {
        console.error('Error syncing offline item:', error);
      }
    }
    
    console.log('Offline data sync completed');
  } catch (error) {
    console.error('Error during background sync:', error);
  }
}

// Get offline queue from IndexedDB
async function getOfflineQueue() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CivicTrackDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineQueue'], 'readonly');
      const store = transaction.objectStore('offlineQueue');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

// Sync individual offline item
async function syncOfflineItem(item) {
  const response = await fetch(item.url, {
    method: item.method,
    headers: item.headers,
    body: item.body
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }
  
  return response;
}

// Remove item from offline queue
async function removeFromOfflineQueue(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CivicTrackDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineQueue'], 'readwrite');
      const store = transaction.objectStore('offlineQueue');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Push notification handling with VAPID support
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received:', event);
  
  let notificationData = {
    title: 'CityScope Update',
    body: 'You have a new civic update',
    icon: '/CityScope.png',
    badge: '/CityScope.png',
    data: { url: '/' },
    actions: [
      { action: 'view', title: 'View Update', icon: '/CityScope.png' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    requireInteraction: true,
    tag: 'cityscope-notification',
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      actions: notificationData.actions,
      requireInteraction: notificationData.requireInteraction,
      tag: notificationData.tag,
      vibrate: notificationData.vibrate,
      timestamp: notificationData.timestamp
    })
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Message received in service worker:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_OFFLINE_DATA') {
    cacheOfflineData(event.data.data);
  }
});

// Cache offline data
async function cacheOfflineData(data) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.put(data.url, new Response(JSON.stringify(data.body)));
    console.log('Offline data cached:', data.url);
  } catch (error) {
    console.error('Error caching offline data:', error);
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic sync triggered:', event.tag);
  
  if (event.tag === 'sync-issues') {
    event.waitUntil(syncIssues());
  }
  if (event.tag === 'sync-anomalies') {
    event.waitUntil(syncAnomalies());
  }
});

// Sync issues in background
async function syncIssues() {
  try {
    console.log('Syncing issues in background...');
    
    const response = await fetch('/api/issues');
    if (response.ok) {
      const issues = await response.json();
      
      // Cache issues for offline use
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put('/api/issues', new Response(JSON.stringify(issues)));
      
      console.log('Issues synced successfully');
    }
  } catch (error) {
    console.error('Error syncing issues:', error);
  }
}

// Sync road anomalies in background
async function syncAnomalies() {
  try {
    console.log('Syncing road anomalies in background...');

    // Open IndexedDB to check for queued anomaly submissions
    const dbRequest = indexedDB.open('CityScopeOfflineDB', 1);
    
    dbRequest.onsuccess = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineQueue')) return;

      const tx = db.transaction('offlineQueue', 'readwrite');
      const store = tx.objectStore('offlineQueue');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const items = getAllRequest.result || [];
        const anomalyItems = items.filter(
          item => item.type === 'SUBMIT_ANOMALY' || item.type === 'SUBMIT_ANOMALY_BATCH'
        );

        if (anomalyItems.length > 0) {
          console.log(`Found ${anomalyItems.length} queued anomaly submissions`);
          // These will be processed by the OfflineService when the app comes online
        }
      };
    };

    dbRequest.onerror = () => {
      console.warn('Could not open IndexedDB for anomaly sync');
    };
  } catch (error) {
    console.error('Error syncing anomalies:', error);
  }
}

// Sync road anomalies in background
async function syncAnomalies() {
  try {
    console.log('🛣️ Syncing road anomalies in background...');
    
    // Open IndexedDB and process pending anomaly submissions
    const dbRequest = indexedDB.open('CityScopeOfflineDB', 1);
    
    dbRequest.onsuccess = async (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offlineQueue')) {
        return;
      }
      
      const tx = db.transaction('offlineQueue', 'readonly');
      const store = tx.objectStore('offlineQueue');
      const allItems = store.getAll();
      
      allItems.onsuccess = async () => {
        const anomalyItems = allItems.result.filter(
          item => item.type === 'SUBMIT_ANOMALY' || item.type === 'SUBMIT_ANOMALY_BATCH'
        );
        
        if (anomalyItems.length === 0) {
          console.log('🛣️ No pending anomaly submissions');
          return;
        }
        
        console.log(`🛣️ Found ${anomalyItems.length} pending anomaly submissions`);
        
        // Notify clients to process queue
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'PROCESS_ANOMALY_QUEUE',
            count: anomalyItems.length
          });
        });
      };
    };
  } catch (error) {
    console.error('🛣️ Error syncing anomalies:', error);
  }
}
