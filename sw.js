// Service Worker for the Live Preview Sandbox

const PREVIEW_SCOPE = '/live-preview-sandbox/';
let fileMap = new Map();

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data.type === 'SET_FILES') {
    fileMap = new Map(event.data.files);
    // Let the client know we are ready
    if (event.source) {
       event.source.postMessage({ type: 'READY' });
    }
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith(PREVIEW_SCOPE)) {
    const path = url.pathname.substring(PREVIEW_SCOPE.length) || 'index.html';
    
    event.respondWith((async () => {
        if (fileMap.has(path)) {
            const file = fileMap.get(path);
            const headers = {
                'Content-Type': file.mimeType || 'application/octet-stream',
                'Access-Control-Allow-Origin': '*', // CORS for fonts, etc.
            };
            return new Response(file.content, { headers });
        } else {
            console.warn(`[SW] File not found in virtual server: ${path}`);
            return new Response(`File not found: ${path}`, { status: 404 });
        }
    })());
  }
});
