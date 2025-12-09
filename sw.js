// Service Worker for Offline News Reader
const CACHE_NAME = 'news-cache-v1';
const RUNTIME_CACHE = 'news-runtime-v1';

// Files to cache immediately on install
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/saved.html',
  '/java.js',
  '/style.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome extensions and non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests differently
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Handle image requests - cache them!
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Handle other requests
  event.respondWith(cacheFirst(request));
});

// Cache first strategy - for images and static assets
async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('Service Worker: Serving from cache:', request.url);
    return cached;
  }

  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response && response.status === 200) {
      const responseClone = response.clone();
      cache.put(request, responseClone);
      console.log('Service Worker: Cached new resource:', request.url);
    }
    
    return response;
  } catch (error) {
    console.log('Service Worker: Fetch failed, no cache available:', request.url);
    
    // Return placeholder for images
    if (request.destination === 'image') {
      return new Response(
        '<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="400" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="#999" font-size="20">Image Unavailable</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    throw error;
  }
}

// Network first strategy - for API calls
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    // Cache API responses
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Fallback to cache if network fails
    const cached = await caches.match(request);
    if (cached) {
      console.log('Service Worker: Network failed, serving from cache:', request.url);
      return cached;
    }
    throw error;
  }
}
