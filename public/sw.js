// sw.js - Service Worker para PWA instalable
const CACHE_NAME = 'escologia-v1';
const urlsToCache = [
  '/',
  '/login.html',
  '/home.html',
  '/styles.css',
  '/script.js',
  '/Images/ESCOLOGIA.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'GET' && 
      (url.origin === self.location.origin || 
       url.hostname === 'cdnjs.cloudflare.com' ||
       url.hostname === 'cdn.jsdelivr.net')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
    );
  }
});

// Evento para cuando la app es instalable
self.addEventListener('beforeinstallprompt', (event) => {
  console.log('✅ PWA es instalable');
  // Evita que el navegador muestre el prompt automáticamente
  event.preventDefault();
  // Guarda el evento para usarlo más tarde
  window.deferredPrompt = event;
});

// Evento cuando la app se instala
self.addEventListener('appinstalled', (event) => {
  console.log('🎉 PWA instalada exitosamente');
});