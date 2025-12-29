// Music Share Web App - Service Worker
// Provides offline functionality and caching

const CACHE_NAME = 'music-share-v2.0.0';
const urlsToCache = [
    './',
    './index.html',
    './music-share-local-files.html',
    './css/styles.css',
    './js/app.js',
    './manifest.json',
    './assets/icon-192x192.png',
    './assets/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching app resources...');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('✅ All resources cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Caching failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker activated');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension requests
    if (event.request.url.startsWith('chrome-extension://')) {
        return;
    }
    
    // Skip data URLs
    if (event.request.url.startsWith('data:')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }
                
                // Otherwise, fetch from network
                return fetch(event.request).then((response) => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    // Cache the fetched response
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                }).catch(() => {
                    // If network fails and no cache, return offline page
                    if (event.request.destination === 'document') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});

// Background sync for file uploads (future feature)
self.addEventListener('sync', (event) => {
    if (event.tag === 'music-upload') {
        console.log('🔄 Background sync: music-upload');
        event.waitUntil(uploadPendingMusic());
    }
});

// Push notifications (future feature)
self.addEventListener('push', (event) => {
    console.log('📬 Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New music available!',
        icon: './assets/icon-192x192.png',
        badge: './assets/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Open App',
                icon: './assets/icon-72x72.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: './assets/icon-72x72.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Music Share', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('./')
        );
    }
});

// Helper function for background sync
async function uploadPendingMusic() {
    try {
        // Get pending uploads from IndexedDB
        const pendingUploads = await getPendingUploads();
        
        for (const upload of pendingUploads) {
            try {
                await uploadMusic(upload);
                await removePendingUpload(upload.id);
                console.log('✅ Background upload completed:', upload.name);
            } catch (error) {
                console.error('❌ Background upload failed:', upload.name, error);
            }
        }
    } catch (error) {
        console.error('❌ Background sync failed:', error);
    }
}

// IndexedDB helpers (placeholder for future implementation)
async function getPendingUploads() {
    // Implementation would use IndexedDB to store pending uploads
    return [];
}

async function uploadMusic(upload) {
    // Implementation would handle the actual upload
    return Promise.resolve();
}

async function removePendingUpload(id) {
    // Implementation would remove from IndexedDB
    return Promise.resolve();
}

// Cache update check
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Performance monitoring
const startTime = Date.now();
self.addEventListener('activate', () => {
    const activationTime = Date.now() - startTime;
    console.log(`⚡ Service Worker activation time: ${activationTime}ms`);
});

console.log('🔧 Service Worker script loaded');
