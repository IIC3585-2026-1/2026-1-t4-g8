const CACHE = 'bangle-v1';

const ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/index.js',
  '/firebase-config.js',
  '/manifest.webmanifest',
  '/vendor/marked.min.js',
  '/js/db.js',
  '/js/fcm.js',
  '/js/firebase.js',
  '/js/markdown.js',
  '/js/notes.js',
  '/js/reminders.js',
  '/js/router.js',
  '/js/ui/editor.js',
  '/js/ui/icons.js',
  '/js/ui/sidebar.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Solo interceptar GET, dejar pasar el resto
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
