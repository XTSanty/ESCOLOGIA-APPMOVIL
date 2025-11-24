// sw.js - Service Worker para ESCOLOGIA PWA
const VERSION = 'v1.0.42';
const APP_CACHE_NAME = `escologia-${VERSION}`;

// ✅ Archivos estáticos que SÍ queremos cachear
const appShell = [
    '/',
    '/login.html',
    '/Home.html',
    '/styles.css',
    '/Images/ESCOLOGIA.png',
    '/manifest.json'
    // ❌ NO incluimos script.js para evitar cacheo de lógica
    // ❌ NO incluimos offline.html si no existe
];

// ✅ Rutas que NUNCA deben ser cacheadas (API y autenticación)
const neverCache = [
    '/api/',           // Todas las rutas de API
    '/auth/',          // Rutas de autenticación
    '/logout',         // Logout
    '/session',        // Verificación de sesión
    'chrome-extension://' // Extensiones del navegador
];

// Función helper para verificar si una URL no debe ser cacheada
function shouldNotCache(url) {
    return neverCache.some(path => url.includes(path));
}

// Instalar el Service Worker
self.addEventListener('install', event => {
    console.log('✅ ESCOLOGIA SW: Instalando versión', VERSION);
    
    event.waitUntil(
        caches.open(APP_CACHE_NAME)
            .then(cache => {
                console.log('📦 ESCOLOGIA SW: Cacheando App Shell...');
                // Intentar cachear cada archivo individualmente
                return Promise.allSettled(
                    appShell.map(url => 
                        cache.add(url).catch(err => {
                            console.warn(`⚠️ No se pudo cachear ${url}:`, err);
                        })
                    )
                );
            })
            .then(() => {
                console.log('✅ ESCOLOGIA SW: Instalación completa');
                // ✅ Activar inmediatamente el nuevo SW
                return self.skipWaiting();
            })
    );
});

// Activar el Service Worker
self.addEventListener('activate', event => {
    console.log('🔄 ESCOLOGIA SW: Activando versión', VERSION);
    
    event.waitUntil(
        // Borrar cachés antiguas
        caches.keys()
            .then(keys => {
                return Promise.all(
                    keys.map(key => {
                        if (key !== APP_CACHE_NAME) {
                            console.log('🗑️ ESCOLOGIA SW: Borrando caché antigua:', key);
                            return caches.delete(key);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ ESCOLOGIA SW: Activación completa');
                // ✅ Tomar control inmediato de todas las pestañas
                return self.clients.claim();
            })
    );
});

// ✅ CRÍTICO: Interceptar peticiones de forma inteligente
self.addEventListener('fetch', event => {
    const url = event.request.url;
    const method = event.request.method;
    
    // ❌ NUNCA interceptar peticiones que no sean GET
    if (method !== 'GET') {
        console.log('🔄 SW: Ignorando petición', method, url);
        return; // Dejar pasar sin interceptar
    }
    
    // ❌ NUNCA cachear rutas de API o autenticación
    if (shouldNotCache(url)) {
        console.log('🚫 SW: No cacheando API:', url);
        return; // Dejar pasar sin interceptar
    }
    
    // ❌ Ignorar peticiones a otros dominios
    if (!url.startsWith(self.location.origin)) {
        return; // Dejar pasar sin interceptar
    }
    
    // ✅ Solo cachear recursos estáticos (HTML, CSS, imágenes, fonts)
    const isStaticResource = /\.(html|css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/i.test(url);
    
    if (!isStaticResource) {
        console.log('⏭️ SW: Ignorando recurso dinámico:', url);
        return; // Dejar pasar sin interceptar
    }
    
    // ✅ Estrategia: Network First, luego Cache (para contenido dinámico)
    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                // ✅ Si la red responde, guardar en caché y devolver
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    
                    caches.open(APP_CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                }
                
                return networkResponse;
            })
            .catch(() => {
                // ❌ Si falla la red, buscar en caché
                console.log('🔍 SW: Buscando en caché:', url);
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        
                        // Si no hay en caché, devolver página offline básica
                        return new Response(
                            `<!DOCTYPE html>
                            <html lang="es">
                            <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>Sin conexión</title>
                                <style>
                                    body {
                                        font-family: Arial, sans-serif;
                                        display: flex;
                                        justify-content: center;
                                        align-items: center;
                                        height: 100vh;
                                        margin: 0;
                                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                        color: white;
                                        text-align: center;
                                        padding: 20px;
                                    }
                                    .offline-container {
                                        max-width: 400px;
                                    }
                                    h1 { font-size: 2em; margin-bottom: 20px; }
                                    p { font-size: 1.1em; margin-bottom: 30px; }
                                    button {
                                        background: white;
                                        color: #667eea;
                                        border: none;
                                        padding: 12px 30px;
                                        font-size: 1em;
                                        border-radius: 5px;
                                        cursor: pointer;
                                        font-weight: bold;
                                    }
                                    button:hover { opacity: 0.9; }
                                </style>
                            </head>
                            <body>
                                <div class="offline-container">
                                    <h1>📡 Sin conexión</h1>
                                    <p>No hay conexión a internet. Por favor, verifica tu conexión y vuelve a intentarlo.</p>
                                    <button onclick="window.location.reload()">Reintentar</button>
                                </div>
                            </body>
                            </html>`,
                            {
                                headers: { 'Content-Type': 'text/html' }
                            }
                        );
                    });
            })
    );
});

// ✅ Manejar mensajes del cliente
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(keys => {
                return Promise.all(
                    keys.map(key => caches.delete(key))
                );
            })
        );
    }
});

console.log('🚀 ESCOLOGIA Service Worker cargado - Versión', VERSION);