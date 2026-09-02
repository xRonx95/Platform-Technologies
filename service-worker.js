'use strict';

const CACHE_VERSION = 'stackforge-v1-20260902';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const SHELL_FILES = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './assets/css/install-app.css',
  './assets/js/install-app.js',
  './assets/js/offline.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('stackforge-') && !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isSensitive(request, url) {
  if (request.method !== 'GET') return true;
  if (request.headers.has('authorization')) return true;
  if (/(\/api\/|\/auth\/|\/login|\/logout|\/account|\/profile)/i.test(url.pathname)) return true;
  return ['token', 'access_token', 'auth', 'password', 'session'].some((key) => url.searchParams.has(key));
}

async function networkFirst(request, fallbackToOffline) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackToOffline) return caches.match('./offline.html');
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && (response.type === 'basic' || response.type === 'cors')) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (isSensitive(request, url)) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, true));
    return;
  }
  const safeStatic = ['style', 'script', 'image', 'font'].includes(request.destination) || /\.(?:css|js|png|jpg|jpeg|webp|svg|woff2?)$/i.test(url.pathname);
  if (safeStatic) event.respondWith(cacheFirst(request));
  else if (url.origin === self.location.origin) event.respondWith(networkFirst(request, false));
});
