self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 🚫 Ignorar métodos que no sean GET (como POST, PUT, DELETE)
  if (event.request.method !== 'GET') return;

  // 🚫 Ignorar llamadas a la API (backend)
  if (url.pathname.startsWith('/api/')) return;

  // ✅ Solo manejar recursos estáticos
  if (
    url.origin === self.location.origin ||
    url.hostname === 'cdnjs.cloudflare.com' ||
    url.hostname === 'cdn.jsdelivr.net'
  ) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
